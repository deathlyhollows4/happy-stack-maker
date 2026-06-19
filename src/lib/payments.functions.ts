import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  createRazorpaySubscription,
  getRazorpayKeyId,
  verifyRazorpayPaymentSignature as verifyRazorpayPaymentSignatureValue,
} from "@/lib/payments.server";
import { envInput } from "@/lib/codewise.utils";

const resolvePaddlePriceInput = z.object({
  priceId: z.string().min(1).max(200),
  environment: envInput,
  currencyCode: z.string().trim().length(3).toUpperCase().default("INR"),
});

const createSubscriptionInput = z.object({
  billingPlanCode: z.string().trim().min(1).max(100),
  environment: envInput,
  currencyCode: z.string().trim().length(3).toUpperCase().default("INR"),
  quantity: z.number().int().positive().max(20).default(1),
  totalCount: z.number().int().positive().max(120).default(120),
});

const verifySubscriptionPaymentInput = z.object({
  environment: envInput,
  razorpayPaymentId: z.string().trim().min(1).max(200),
  razorpaySubscriptionId: z.string().trim().min(1).max(200),
  razorpaySignature: z.string().trim().min(1).max(300),
  billingPlanCode: z.string().trim().min(1).max(100).optional(),
  currencyCode: z.string().trim().length(3).toUpperCase().optional(),
});

async function getBillingPlanMapping(input: {
  provider: "paddle" | "razorpay";
  environment: "sandbox" | "live";
  billingPlanCode: string;
  currencyCode: string;
}) {
  const { data } = await supabaseAdmin
    .from("billing_plan_mappings")
    .select("provider_plan_id")
    .eq("provider", input.provider)
    .eq("environment", input.environment)
    .eq("billing_plan_code", input.billingPlanCode)
    .eq("currency_code", input.currencyCode)
    .maybeSingle();

  return data;
}

export const resolvePaddlePrice = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => resolvePaddlePriceInput.parse(input))
  .handler(async ({ data }) => {
    const mapping = await getBillingPlanMapping({
      provider: "paddle",
      environment: data.environment,
      billingPlanCode: data.priceId,
      currencyCode: data.currencyCode,
    });

    if (!mapping) {
      throw new Error("Legacy Paddle mapping not found");
    }

    return mapping.provider_plan_id;
  });

export const createSubscriptionCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => createSubscriptionInput.parse(input))
  .handler(async ({ data, context }) => {
    const mapping = await getBillingPlanMapping({
      provider: "razorpay",
      environment: data.environment,
      billingPlanCode: data.billingPlanCode,
      currencyCode: data.currencyCode,
    });

    if (!mapping) {
      return {
        ok: false as const,
        error: `No Razorpay plan mapping for ${data.billingPlanCode} in ${data.environment}/${data.currencyCode}.`,
      };
    }

    const subscription = await createRazorpaySubscription(data.environment, {
      plan_id: mapping.provider_plan_id,
      customer_notify: 1,
      quantity: data.quantity,
      total_count: data.totalCount,
      notes: {
        userId: context.userId,
        billingPlanCode: data.billingPlanCode,
        environment: data.environment,
        currencyCode: data.currencyCode,
      },
    });

    await supabaseAdmin.from("subscriptions").upsert(
      {
        user_id: context.userId,
        provider: "razorpay",
        provider_subscription_id: subscription.id,
        provider_customer_id: subscription.customer_id ?? null,
        provider_plan_id: subscription.plan_id ?? mapping.provider_plan_id,
        billing_plan_code: data.billingPlanCode,
        price_id: data.billingPlanCode,
        product_id: "pro",
        status: subscription.status,
        current_period_start: null,
        current_period_end: null,
        cancel_at_period_end: false,
        currency_code: data.currencyCode,
        environment: data.environment,
        external_status_updated_at: new Date().toISOString(),
        metadata: {
          source: "createSubscriptionCheckout",
          shortUrl: subscription.short_url ?? null,
        },
        updated_at: new Date().toISOString(),
      },
      { onConflict: "provider,environment,provider_subscription_id" },
    );

    return {
      ok: true as const,
      keyId: getRazorpayKeyId(data.environment),
      subscriptionId: subscription.id,
      checkoutUrl: subscription.short_url ?? null,
      status: subscription.status,
      billingPlanCode: data.billingPlanCode,
      currencyCode: data.currencyCode,
    };
  });

export const verifyRazorpaySubscriptionPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => verifySubscriptionPaymentInput.parse(input))
  .handler(async ({ data, context }) => {
    const valid = verifyRazorpayPaymentSignatureValue({
      env: data.environment,
      paymentId: data.razorpayPaymentId,
      subscriptionId: data.razorpaySubscriptionId,
      signature: data.razorpaySignature,
    });

    if (!valid) {
      return { ok: false as const, error: "Invalid Razorpay payment signature." };
    }

    const nowIso = new Date().toISOString();
    const { data: existing } = await supabaseAdmin
      .from("subscriptions")
      .select("billing_plan_code, price_id, product_id, provider_plan_id, currency_code")
      .eq("provider", "razorpay")
      .eq("environment", data.environment)
      .eq("provider_subscription_id", data.razorpaySubscriptionId)
      .maybeSingle();

    await supabaseAdmin.from("subscriptions").upsert(
      {
        user_id: context.userId,
        provider: "razorpay",
        provider_subscription_id: data.razorpaySubscriptionId,
        provider_plan_id: existing?.provider_plan_id ?? null,
        billing_plan_code: data.billingPlanCode ?? existing?.billing_plan_code ?? "pro",
        price_id: data.billingPlanCode ?? existing?.price_id ?? "pro",
        product_id: existing?.product_id ?? "pro",
        status: "authenticated",
        currency_code: data.currencyCode ?? existing?.currency_code ?? null,
        environment: data.environment,
        external_status_updated_at: nowIso,
        metadata: {
          source: "verifyRazorpaySubscriptionPayment",
          razorpay_payment_id: data.razorpayPaymentId,
        },
        updated_at: nowIso,
      },
      { onConflict: "provider,environment,provider_subscription_id" },
    );

    return { ok: true as const };
  });
