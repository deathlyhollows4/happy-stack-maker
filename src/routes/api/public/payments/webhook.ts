import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  type PaymentsEnv,
  type RazorpayWebhookPayload,
  unixSecondsToIso,
  verifyRazorpayWebhookSignature,
} from "@/lib/payments.server";

function normalizeSubscriptionStatus(eventType: string, fallback: string): string {
  switch (eventType) {
    case "subscription.activated":
    case "subscription.charged":
    case "subscription.resumed":
      return "active";
    case "subscription.authenticated":
      return "authenticated";
    case "subscription.paused":
    case "subscription.halted":
      return "paused";
    case "subscription.cancelled":
      return "canceled";
    case "subscription.completed":
      return "completed";
    default:
      return fallback;
  }
}

async function resolveBillingPlanCode(input: {
  env: PaymentsEnv;
  providerPlanId?: string;
  currencyCode?: string | null;
}) {
  if (!input.providerPlanId) return null;

  let query = supabaseAdmin
    .from("billing_plan_mappings")
    .select("billing_plan_code, provider_plan_id")
    .eq("provider", "razorpay")
    .eq("environment", input.env)
    .eq("provider_plan_id", input.providerPlanId);

  if (input.currencyCode) {
    query = query.eq("currency_code", input.currencyCode);
  }

  const { data } = await query.maybeSingle();
  return data;
}

async function claimWebhookEvent(input: {
  eventId: string;
  eventType: string;
  environment: PaymentsEnv;
  rawPayload: string;
}): Promise<boolean> {
  const { error } = await supabaseAdmin.from("webhook_events").insert({
    provider: "razorpay",
    event_id: input.eventId,
    event_type: input.eventType,
    environment: input.environment,
    raw_payload: input.rawPayload,
  });

  if (!error) return true;
  if ((error as { code?: string }).code === "23505") return false;
  throw error;
}

async function markWebhookProcessed(eventId: string) {
  await supabaseAdmin
    .from("webhook_events")
    .update({
      processed_at: new Date().toISOString(),
      processing_error: null,
    })
    .eq("provider", "razorpay")
    .eq("event_id", eventId);
}

async function markWebhookFailed(eventId: string, message: string) {
  await supabaseAdmin
    .from("webhook_events")
    .update({
      processing_error: message,
      processed_at: new Date().toISOString(),
    })
    .eq("provider", "razorpay")
    .eq("event_id", eventId);
}

async function upsertSubscriptionFromWebhook(
  payload: RazorpayWebhookPayload,
  env: PaymentsEnv,
  eventId: string,
) {
  const subscription = payload.payload?.subscription?.entity;
  if (!subscription?.id) {
    console.warn("Skipping Razorpay webhook without a subscription entity", payload.event);
    return;
  }

  const payment = payload.payload?.payment?.entity;
  const currencyCode =
    payment?.currency?.toUpperCase() ?? subscription.notes?.currencyCode?.toUpperCase() ?? null;
  const mapping = await resolveBillingPlanCode({
    env,
    providerPlanId: subscription.plan_id,
    currencyCode,
  });

  const { data: existing } = await supabaseAdmin
    .from("subscriptions")
    .select(
      [
        "id",
        "user_id",
        "status",
        "provider_customer_id",
        "provider_plan_id",
        "billing_plan_code",
        "currency_code",
        "external_status_updated_at",
      ].join(", "),
    )
    .eq("provider", "razorpay")
    .eq("environment", env)
    .eq("provider_subscription_id", subscription.id)
    .maybeSingle();

  const userId =
    subscription.notes?.userId || payment?.notes?.userId || existing?.user_id || undefined;
  if (!userId) {
    console.error("No userId found for Razorpay subscription webhook", {
      eventId,
      subscriptionId: subscription.id,
    });
    return;
  }

  const occurredAt = unixSecondsToIso(payload.created_at) ?? new Date().toISOString();
  const shouldApplyStatus =
    !existing?.external_status_updated_at || occurredAt >= existing.external_status_updated_at;

  const billingPlanCode =
    mapping?.billing_plan_code ||
    subscription.notes?.billingPlanCode ||
    existing?.billing_plan_code ||
    subscription.plan_id ||
    "pro";

  const updatePayload: Record<string, unknown> = {
    user_id: userId,
    provider: "razorpay",
    provider_subscription_id: subscription.id,
    provider_customer_id: subscription.customer_id ?? existing?.provider_customer_id ?? null,
    provider_plan_id: subscription.plan_id ?? existing?.provider_plan_id ?? null,
    billing_plan_code: billingPlanCode,
    price_id: billingPlanCode,
    product_id: "pro",
    currency_code: currencyCode ?? existing?.currency_code ?? null,
    environment: env,
    metadata: {
      source: "razorpay_webhook",
      last_razorpay_event: payload.event,
      last_razorpay_event_id: eventId,
      short_url: subscription.short_url ?? null,
    },
    updated_at: new Date().toISOString(),
  };

  if (shouldApplyStatus) {
    updatePayload.status = normalizeSubscriptionStatus(payload.event, subscription.status);
    updatePayload.current_period_start =
      unixSecondsToIso(subscription.current_start) ?? unixSecondsToIso(subscription.start_at);
    updatePayload.current_period_end =
      unixSecondsToIso(subscription.current_end) ?? unixSecondsToIso(subscription.ended_at);
    updatePayload.cancel_at_period_end = payload.event === "subscription.cancelled";
    updatePayload.external_status_updated_at = occurredAt;
  }

  await supabaseAdmin.from("subscriptions").upsert(updatePayload, {
    onConflict: "provider,environment,provider_subscription_id",
  });
}

async function handleSubscriptionCreated(
  payload: RazorpayWebhookPayload,
  env: PaymentsEnv,
  eventId: string,
) {
  await upsertSubscriptionFromWebhook(payload, env, eventId);
}

async function handleSubscriptionUpdated(
  payload: RazorpayWebhookPayload,
  env: PaymentsEnv,
  eventId: string,
) {
  await upsertSubscriptionFromWebhook(payload, env, eventId);
}

async function handleSubscriptionCanceled(
  payload: RazorpayWebhookPayload,
  env: PaymentsEnv,
  eventId: string,
) {
  await upsertSubscriptionFromWebhook(payload, env, eventId);
}

async function handleWebhook(req: Request, env: PaymentsEnv) {
  const eventId = req.headers.get("x-razorpay-event-id");
  const signature = req.headers.get("x-razorpay-signature");
  const rawPayload = await req.text();

  if (!eventId) {
    throw new Error("Missing x-razorpay-event-id header");
  }

  let payload: RazorpayWebhookPayload | null = null;
  let eventType = "unknown";
  try {
    payload = JSON.parse(rawPayload) as RazorpayWebhookPayload;
    eventType = payload.event || "unknown";
  } catch {
    eventType = "invalid_json";
  }

  try {
    if (!signature) {
      throw new Error("Missing x-razorpay-signature header");
    }

    if (!verifyRazorpayWebhookSignature(rawPayload, signature, env)) {
      throw new Error("Invalid Razorpay webhook signature");
    }

    const claimed = await claimWebhookEvent({
      eventId,
      eventType,
      environment: env,
      rawPayload,
    });

    if (!claimed) {
      console.log("Duplicate Razorpay webhook, already processed:", eventId);
      return;
    }

    switch (eventType) {
      case "subscription.created":
        await handleSubscriptionCreated(payload as RazorpayWebhookPayload, env, eventId);
        break;
      case "subscription.cancelled":
        await handleSubscriptionCanceled(payload as RazorpayWebhookPayload, env, eventId);
        break;
      case "subscription.activated":
      case "subscription.authenticated":
      case "subscription.charged":
      case "subscription.completed":
      case "subscription.halted":
      case "subscription.paused":
      case "subscription.pending":
      case "subscription.resumed":
        await handleSubscriptionUpdated(payload as RazorpayWebhookPayload, env, eventId);
        break;
      default:
        if (payload?.payload?.subscription?.entity?.id) {
          await handleSubscriptionUpdated(payload, env, eventId);
        } else {
          console.log("Unhandled Razorpay event:", eventType);
        }
    }

    await markWebhookProcessed(eventId);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown webhook error";
    await markWebhookFailed(eventId, message);
    throw error;
  }
}

export const Route = createFileRoute("/api/public/payments/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const url = new URL(request.url);
        const env = (url.searchParams.get("env") || "sandbox") as PaymentsEnv;

        try {
          await handleWebhook(request, env);
          return Response.json({ received: true });
        } catch (error) {
          console.error("Webhook error:", error);
          return new Response("Webhook error", { status: 400 });
        }
      },
    },
  },
});
