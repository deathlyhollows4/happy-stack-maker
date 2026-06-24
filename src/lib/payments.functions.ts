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
import {
  buildCreatedOrderSubscriptionRow,
  buildVerifiedPaymentSubscriptionRow,
  getPlanAmountInPaise,
  resolveRazorpayPaymentCaptureState,
  resolvePaidPeriod,
} from "@/lib/razorpay-lifecycle.server";
import { subscriptionHasAccess } from "@/lib/entitlement-policy";

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

    const nowIso = new Date().toISOString();
    await supabaseAdmin.from("subscriptions").upsert(
      buildCreatedOrderSubscriptionRow({
        userId: context.userId,
        environment: data.environment,
        billingPlanCode: data.billingPlanCode,
        currencyCode: data.currencyCode,
        order,
        nowIso,
      }),
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
    let paymentState = resolveRazorpayPaymentCaptureState({
      payment,
      expectedAmount,
    });

    if (payment.status === "authorized" && paymentState.amountMatches) {
      payment = await captureRazorpayPayment(data.environment, data.razorpayPaymentId, {
        amount: paymentState.paidAmount,
        currency: "INR",
      });
      paymentState = resolveRazorpayPaymentCaptureState({
        payment,
        expectedAmount,
      });
    }

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

    const existingActive = !!existing && subscriptionHasAccess(existing);
    const canActivate = paymentState.hasPaidCharge && paymentState.amountMatches;
    const periodStart = new Date();
    const billingPlanCode = data.billingPlanCode ?? existing?.billing_plan_code ?? "pro_monthly";
    const { currentPeriodStart, currentPeriodEnd } = resolvePaidPeriod({
      existingActive,
      existingStart: existing.current_period_start,
      existingEnd: existing.current_period_end,
      canActivate,
      billingPlanCode,
      start: periodStart,
    });

    await supabaseAdmin.from("subscriptions").upsert(
      buildVerifiedPaymentSubscriptionRow({
        userId: context.userId,
        lookupId,
        environment: data.environment,
        orderId,
        razorpayPaymentId: data.razorpayPaymentId,
        billingPlanCode,
        currencyCode: data.currencyCode,
        existing,
        payment,
        paidAmount: paymentState.paidAmount,
        expectedAmount,
        amountMatches: paymentState.amountMatches,
        paymentCaptured: paymentState.paymentCaptured,
        active: existingActive || canActivate,
        currentPeriodStart,
        currentPeriodEnd,
        nowIso,
      }),
      { onConflict: "provider,environment,provider_subscription_id" },
    );

    return {
      ok: true as const,
      active: existingActive || canActivate,
      paymentCaptured: paymentState.paymentCaptured,
      paidAmount: paymentState.paidAmount,
      paymentStatus: payment.status,
      message: canActivate
        ? "Payment captured. Pro access is ready."
        : "Payment authorization received, but the expected plan charge was not captured yet.",
    };
  });
