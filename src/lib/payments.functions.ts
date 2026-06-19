import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  captureRazorpayPayment,
  createRazorpayOrder,
  fetchRazorpayPayment,
  getRazorpayKeyId,
  verifyRazorpayOrderSignature,
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
  razorpaySubscriptionId: z.string().trim().min(1).max(200).optional(),
  razorpayOrderId: z.string().trim().min(1).max(200).optional(),
  razorpaySignature: z.string().trim().min(1).max(300),
  billingPlanCode: z.string().trim().min(1).max(100).optional(),
  currencyCode: z.string().trim().length(3).toUpperCase().optional(),
});

const PLAN_CONFIG_KEYS = {
  pro_monthly: "plan_price_pro_monthly",
  pro_yearly: "plan_price_pro_yearly",
} as const;

type ProBillingPlanCode = keyof typeof PLAN_CONFIG_KEYS;

function isProBillingPlanCode(value: string): value is ProBillingPlanCode {
  return value === "pro_monthly" || value === "pro_yearly";
}

function addBillingPeriod(start: Date, billingPlanCode: ProBillingPlanCode): Date {
  const end = new Date(start);
  if (billingPlanCode === "pro_yearly") {
    end.setFullYear(end.getFullYear() + 1);
  } else {
    end.setMonth(end.getMonth() + 1);
  }
  return end;
}

async function getPlanAmountInPaise(billingPlanCode: string): Promise<number | null> {
  if (!isProBillingPlanCode(billingPlanCode)) return null;

  const { data } = await supabaseAdmin
    .from("app_config")
    .select("value")
    .eq("key", PLAN_CONFIG_KEYS[billingPlanCode])
    .maybeSingle();
  const amountInr = Number.parseInt(data?.value ?? "", 10);
  if (!Number.isFinite(amountInr) || amountInr <= 0) return null;
  return amountInr * 100;
}

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
    const amount = await getPlanAmountInPaise(data.billingPlanCode);
    if (!amount) {
      return {
        ok: false as const,
        error: `No valid Razorpay amount configured for ${data.billingPlanCode}.`,
      };
    }

    const order = await createRazorpayOrder(data.environment, {
      amount,
      currency: "INR",
      receipt: `cw_${context.userId.slice(0, 8)}_${Date.now()}`,
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
        provider_subscription_id: order.id,
        provider_customer_id: null,
        provider_plan_id: data.billingPlanCode,
        billing_plan_code: data.billingPlanCode,
        price_id: data.billingPlanCode,
        product_id: "pro",
        status: "created",
        current_period_start: null,
        current_period_end: null,
        cancel_at_period_end: false,
        currency_code: data.currencyCode,
        environment: data.environment,
        external_status_updated_at: new Date().toISOString(),
        metadata: {
          source: "createSubscriptionCheckout",
          checkout_mode: "order",
          razorpay_order_id: order.id,
          razorpay_order_amount: order.amount,
        },
        updated_at: new Date().toISOString(),
      },
      { onConflict: "provider,environment,provider_subscription_id" },
    );

    return {
      ok: true as const,
      keyId: getRazorpayKeyId(data.environment),
      orderId: order.id,
      amount: order.amount,
      status: order.status,
      billingPlanCode: data.billingPlanCode,
      currencyCode: data.currencyCode,
    };
  });

export const verifyRazorpaySubscriptionPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => verifySubscriptionPaymentInput.parse(input))
  .handler(async ({ data, context }) => {
    const orderId = data.razorpayOrderId;
    const subscriptionId = data.razorpaySubscriptionId;
    const valid = orderId
      ? verifyRazorpayOrderSignature({
          env: data.environment,
          orderId,
          paymentId: data.razorpayPaymentId,
          signature: data.razorpaySignature,
        })
      : subscriptionId
        ? verifyRazorpayPaymentSignatureValue({
            env: data.environment,
            paymentId: data.razorpayPaymentId,
            subscriptionId,
            signature: data.razorpaySignature,
          })
        : false;

    if (!valid) {
      return { ok: false as const, error: "Invalid Razorpay payment signature." };
    }

    const expectedAmount = data.billingPlanCode
      ? await getPlanAmountInPaise(data.billingPlanCode)
      : null;
    let payment = await fetchRazorpayPayment(data.environment, data.razorpayPaymentId);
    let paidAmount = Number.isFinite(payment.amount) ? payment.amount : 0;
    let amountMatches = expectedAmount !== null && paidAmount === expectedAmount;

    if (payment.status === "authorized" && amountMatches) {
      payment = await captureRazorpayPayment(data.environment, data.razorpayPaymentId, {
        amount: paidAmount,
        currency: "INR",
      });
      paidAmount = Number.isFinite(payment.amount) ? payment.amount : 0;
      amountMatches = expectedAmount !== null && paidAmount === expectedAmount;
    }

    const paymentCaptured = payment.captured === true && payment.status === "captured";
    const hasPaidCharge = paymentCaptured && paidAmount > 0;
    const lookupId = orderId ?? subscriptionId;
    if (!lookupId) {
      return { ok: false as const, error: "Razorpay checkout reference is missing." };
    }
    const nowIso = new Date().toISOString();
    const { data: existing } = await supabaseAdmin
      .from("subscriptions")
      .select(
        "user_id, billing_plan_code, price_id, product_id, provider_plan_id, currency_code, status, current_period_start, current_period_end",
      )
      .eq("provider", "razorpay")
      .eq("environment", data.environment)
      .eq("provider_subscription_id", lookupId)
      .maybeSingle();

    if (!existing) {
      return {
        ok: false as const,
        error: "Razorpay checkout was not found for this account.",
      };
    }

    if (existing.user_id !== context.userId) {
      return {
        ok: false as const,
        error: "Razorpay subscription does not belong to this account.",
      };
    }

    const existingActive =
      !!existing &&
      ["active", "trialing", "past_due"].includes(existing.status) &&
      (!existing.current_period_end || new Date(existing.current_period_end).getTime() > Date.now());
    const canActivate = hasPaidCharge && amountMatches;
    const periodStart = new Date();
    const billingPlanCode = data.billingPlanCode ?? existing?.billing_plan_code ?? "pro_monthly";
    const periodEnd = isProBillingPlanCode(billingPlanCode)
      ? addBillingPeriod(periodStart, billingPlanCode).toISOString()
      : null;
    const currentPeriodStart = existingActive
      ? existing.current_period_start
      : canActivate
        ? periodStart.toISOString()
        : null;
    const currentPeriodEnd = existingActive
      ? existing.current_period_end
      : canActivate
        ? periodEnd
        : null;

    await supabaseAdmin.from("subscriptions").upsert(
      {
        user_id: context.userId,
        provider: "razorpay",
        provider_subscription_id: lookupId,
        provider_plan_id: existing?.provider_plan_id ?? null,
        billing_plan_code: billingPlanCode,
        price_id: billingPlanCode,
        product_id: existing?.product_id ?? "pro",
        status: existingActive || canActivate ? "active" : "authenticated",
        current_period_start: currentPeriodStart,
        current_period_end: currentPeriodEnd,
        cancel_at_period_end: false,
        currency_code: data.currencyCode ?? payment.currency ?? existing?.currency_code ?? null,
        environment: data.environment,
        external_status_updated_at: nowIso,
        metadata: {
          source: "verifyRazorpaySubscriptionPayment",
          checkout_mode: orderId ? "order" : "subscription",
          razorpay_order_id: orderId ?? null,
          razorpay_payment_id: data.razorpayPaymentId,
          razorpay_payment_status: payment.status,
          razorpay_payment_amount: paidAmount,
          razorpay_payment_captured: paymentCaptured,
          expected_amount: expectedAmount,
          amount_matches: amountMatches,
          razorpay_payment_method: payment.method ?? null,
          razorpay_invoice_id: payment.invoice_id ?? null,
        },
        updated_at: nowIso,
      },
      { onConflict: "provider,environment,provider_subscription_id" },
    );

    return {
      ok: true as const,
      active: existingActive || canActivate,
      paymentCaptured,
      paidAmount,
      paymentStatus: payment.status,
      message: canActivate
        ? "Payment captured. Pro access is ready."
        : "Payment authorization received, but the expected plan charge was not captured yet.",
    };
  });
