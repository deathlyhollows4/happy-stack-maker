import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  type PaymentsEnv,
  type RazorpayOrder,
  type RazorpayPayment,
  type RazorpayWebhookPayload,
  unixSecondsToIso,
  verifyRazorpayWebhookSignature,
} from "@/lib/payments.server";
import {
  asRecord,
  firstString,
  getPlanAmountInPaise,
  isStillEntitled,
  normalizeCurrencyCode,
  normalizeSubscriptionStatus,
  resolvePaidPeriod,
  toPositiveNumber,
} from "@/lib/razorpay-lifecycle.server";

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
      "id, user_id, status, provider_customer_id, provider_plan_id, billing_plan_code, currency_code, external_status_updated_at",
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

  await supabaseAdmin.from("subscriptions").upsert(updatePayload as never, {
    onConflict: "provider,environment,provider_subscription_id",
  });
}

async function handleOrderPaymentCaptured(
  payload: RazorpayWebhookPayload,
  env: PaymentsEnv,
  eventId: string,
) {
  const payment = payload.payload?.payment?.entity as Partial<RazorpayPayment> | undefined;
  const order = payload.payload?.order?.entity as Partial<RazorpayOrder> | undefined;
  const orderId = firstString(payment?.order_id, order?.id);

  if (!orderId) {
    console.warn("Skipping Razorpay payment webhook without an order id", payload.event);
    return;
  }

  const { data: existing } = await supabaseAdmin
    .from("subscriptions")
    .select(
      "id, user_id, status, provider_customer_id, provider_plan_id, billing_plan_code, price_id, product_id, currency_code, current_period_start, current_period_end, metadata",
    )
    .eq("provider", "razorpay")
    .eq("environment", env)
    .eq("provider_subscription_id", orderId)
    .maybeSingle();

  const existingMetadata = asRecord(existing?.metadata);
  const billingPlanCode = firstString(
    payment?.notes?.billingPlanCode,
    order?.notes?.billingPlanCode,
    existing?.billing_plan_code,
    existing?.price_id,
  );
  const userId = firstString(payment?.notes?.userId, order?.notes?.userId, existing?.user_id);

  if (!userId || !billingPlanCode) {
    console.error("No user or plan found for Razorpay order payment webhook", {
      eventId,
      orderId,
      hasExistingSubscription: !!existing,
    });
    return;
  }

  const paidAmount =
    toPositiveNumber(payment?.amount) ??
    toPositiveNumber(order?.amount_paid) ??
    toPositiveNumber(order?.amount);
  const expectedAmount = await getPlanAmountInPaise(billingPlanCode);
  const recordedOrderAmount = toPositiveNumber(existingMetadata.razorpay_order_amount);
  const currencyCode =
    normalizeCurrencyCode(payment?.currency) ??
    normalizeCurrencyCode(order?.currency) ??
    normalizeCurrencyCode(existing?.currency_code);
  const currencyMatches = !currencyCode || currencyCode === "INR";
  const amountMatches =
    paidAmount !== null &&
    currencyMatches &&
    (paidAmount === expectedAmount || paidAmount === recordedOrderAmount);
  const paymentCaptured =
    payment?.captured === true || payment?.status === "captured" || payload.event === "order.paid";

  if (!paymentCaptured || !amountMatches || paidAmount === null) {
    await supabaseAdmin.from("subscriptions").upsert(
      {
        user_id: userId,
        provider: "razorpay",
        provider_subscription_id: orderId,
        provider_plan_id: existing?.provider_plan_id ?? billingPlanCode,
        billing_plan_code: billingPlanCode,
        price_id: billingPlanCode,
        product_id: existing?.product_id ?? "pro",
        status: existing?.status ?? "authenticated",
        current_period_start: existing?.current_period_start ?? null,
        current_period_end: existing?.current_period_end ?? null,
        cancel_at_period_end: false,
        currency_code: currencyCode ?? existing?.currency_code ?? null,
        environment: env,
        external_status_updated_at:
          unixSecondsToIso(payload.created_at) ?? new Date().toISOString(),
        metadata: {
          ...existingMetadata,
          source: "razorpay_webhook",
          last_razorpay_event: payload.event,
          last_razorpay_event_id: eventId,
          razorpay_order_id: orderId,
          razorpay_payment_id: payment?.id ?? existingMetadata.razorpay_payment_id ?? null,
          razorpay_payment_status: payment?.status ?? null,
          razorpay_payment_amount: paidAmount,
          razorpay_payment_captured: paymentCaptured,
          expected_amount: expectedAmount,
          amount_matches: amountMatches,
          currency_matches: currencyMatches,
        },
        updated_at: new Date().toISOString(),
      },
      { onConflict: "provider,environment,provider_subscription_id" },
    );
    return;
  }

  const existingActive = existing ? isStillEntitled(existing) : false;
  const occurredAtIso = unixSecondsToIso(payload.created_at) ?? new Date().toISOString();
  const period = resolvePaidPeriod({
    existingActive,
    existingStart: existing?.current_period_start ?? occurredAtIso,
    existingEnd: existing?.current_period_end ?? null,
    canActivate: true,
    billingPlanCode,
    start: new Date(occurredAtIso),
  });

  await supabaseAdmin.from("subscriptions").upsert(
    {
      user_id: userId,
      provider: "razorpay",
      provider_subscription_id: orderId,
      provider_customer_id: existing?.provider_customer_id ?? null,
      provider_plan_id: existing?.provider_plan_id ?? billingPlanCode,
      billing_plan_code: billingPlanCode,
      price_id: billingPlanCode,
      product_id: existing?.product_id ?? "pro",
      status: "active",
      current_period_start: period.currentPeriodStart,
      current_period_end: period.currentPeriodEnd,
      cancel_at_period_end: false,
      currency_code: currencyCode ?? existing?.currency_code ?? null,
      environment: env,
      external_status_updated_at: occurredAtIso,
      metadata: {
        ...existingMetadata,
        source: "razorpay_webhook",
        checkout_mode: "order",
        last_razorpay_event: payload.event,
        last_razorpay_event_id: eventId,
        razorpay_order_id: orderId,
        razorpay_payment_id: payment?.id ?? existingMetadata.razorpay_payment_id ?? null,
        razorpay_payment_status: payment?.status ?? null,
        razorpay_payment_amount: paidAmount,
        razorpay_payment_captured: paymentCaptured,
        expected_amount: expectedAmount,
        amount_matches: amountMatches,
        currency_matches: currencyMatches,
      },
      updated_at: new Date().toISOString(),
    },
    { onConflict: "provider,environment,provider_subscription_id" },
  );
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
      case "payment.captured":
      case "order.paid":
        await handleOrderPaymentCaptured(payload as RazorpayWebhookPayload, env, eventId);
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
        if (
          payload?.payload?.payment?.entity &&
          (payload.payload.payment.entity.captured === true ||
            payload.payload.payment.entity.status === "captured")
        ) {
          await handleOrderPaymentCaptured(payload, env, eventId);
        } else if (payload?.payload?.subscription?.entity?.id) {
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
