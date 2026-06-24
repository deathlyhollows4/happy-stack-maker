import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { PaymentsEnv, RazorpayPayment } from "@/lib/payments.server";
import { subscriptionHasAccess } from "@/lib/entitlement-policy";

const PLAN_CONFIG_KEYS = {
  pro_monthly: "plan_price_pro_monthly",
  pro_yearly: "plan_price_pro_yearly",
} as const;

export type ProBillingPlanCode = keyof typeof PLAN_CONFIG_KEYS;

export function firstString(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

export function normalizeCurrencyCode(value: unknown): string | null {
  return typeof value === "string" && value.trim().length === 3 ? value.trim().toUpperCase() : null;
}

export function toPositiveNumber(value: unknown): number | null {
  const amount = typeof value === "number" ? value : Number(value);
  return Number.isFinite(amount) && amount > 0 ? amount : null;
}

export function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export function isStillEntitled(row: {
  status?: string | null;
  current_period_end?: string | null;
}): boolean {
  return subscriptionHasAccess(row);
}

export function normalizeSubscriptionStatus(eventType: string, fallback: string): string {
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

export function isProBillingPlanCode(
  value: string | null | undefined,
): value is ProBillingPlanCode {
  return value === "pro_monthly" || value === "pro_yearly";
}

export function addBillingPeriod(start: Date, billingPlanCode: ProBillingPlanCode): Date {
  const end = new Date(start);
  if (billingPlanCode === "pro_yearly") {
    end.setFullYear(end.getFullYear() + 1);
  } else {
    end.setMonth(end.getMonth() + 1);
  }
  return end;
}

export async function getPlanAmountInPaise(billingPlanCode: string): Promise<number | null> {
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

export function resolvePaidPeriod(input: {
  existingActive: boolean;
  existingStart?: string | null;
  existingEnd?: string | null;
  canActivate: boolean;
  billingPlanCode: string;
  start: Date;
}) {
  if (input.existingActive) {
    return {
      currentPeriodStart: input.existingStart ?? null,
      currentPeriodEnd: input.existingEnd ?? null,
    };
  }

  if (!input.canActivate || !isProBillingPlanCode(input.billingPlanCode)) {
    return {
      currentPeriodStart: null,
      currentPeriodEnd: null,
    };
  }

  return {
    currentPeriodStart: input.start.toISOString(),
    currentPeriodEnd: addBillingPeriod(input.start, input.billingPlanCode).toISOString(),
  };
}

export function resolveRazorpayPaymentCaptureState(input: {
  payment: Pick<RazorpayPayment, "amount" | "captured" | "status">;
  expectedAmount: number | null;
}) {
  const paidAmount = Number.isFinite(input.payment.amount) ? input.payment.amount : 0;
  const amountMatches = input.expectedAmount !== null && paidAmount === input.expectedAmount;
  const paymentCaptured = input.payment.captured === true && input.payment.status === "captured";

  return {
    paidAmount,
    amountMatches,
    paymentCaptured,
    hasPaidCharge: paymentCaptured && paidAmount > 0,
  };
}

export function buildCreatedOrderSubscriptionRow(input: {
  userId: string;
  environment: PaymentsEnv;
  billingPlanCode: string;
  currencyCode: string;
  order: { id: string; amount: number; status: string };
  nowIso: string;
}) {
  return {
    user_id: input.userId,
    provider: "razorpay",
    provider_subscription_id: input.order.id,
    provider_customer_id: null,
    provider_plan_id: input.billingPlanCode,
    billing_plan_code: input.billingPlanCode,
    price_id: input.billingPlanCode,
    product_id: "pro",
    status: "created",
    current_period_start: null,
    current_period_end: null,
    cancel_at_period_end: false,
    currency_code: input.currencyCode,
    environment: input.environment,
    external_status_updated_at: input.nowIso,
    metadata: {
      source: "createSubscriptionCheckout",
      checkout_mode: "order",
      razorpay_order_id: input.order.id,
      razorpay_order_amount: input.order.amount,
    },
    updated_at: input.nowIso,
  };
}

export function buildVerifiedPaymentSubscriptionRow(input: {
  userId: string;
  lookupId: string;
  environment: PaymentsEnv;
  orderId?: string;
  razorpayPaymentId: string;
  billingPlanCode: string;
  currencyCode?: string | null;
  existing: {
    provider_plan_id?: string | null;
    product_id?: string | null;
    currency_code?: string | null;
    current_period_start?: string | null;
    current_period_end?: string | null;
  };
  payment: Pick<RazorpayPayment, "status" | "currency" | "method" | "invoice_id">;
  paidAmount: number;
  expectedAmount: number | null;
  amountMatches: boolean;
  paymentCaptured: boolean;
  active: boolean;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  nowIso: string;
}) {
  return {
    user_id: input.userId,
    provider: "razorpay",
    provider_subscription_id: input.lookupId,
    provider_plan_id: input.existing.provider_plan_id ?? null,
    billing_plan_code: input.billingPlanCode,
    price_id: input.billingPlanCode,
    product_id: input.existing.product_id ?? "pro",
    status: input.active ? "active" : "authenticated",
    current_period_start: input.currentPeriodStart,
    current_period_end: input.currentPeriodEnd,
    cancel_at_period_end: false,
    currency_code:
      input.currencyCode ?? input.payment.currency ?? input.existing.currency_code ?? null,
    environment: input.environment,
    external_status_updated_at: input.nowIso,
    metadata: {
      source: "verifyRazorpaySubscriptionPayment",
      checkout_mode: input.orderId ? "order" : "subscription",
      razorpay_order_id: input.orderId ?? null,
      razorpay_payment_id: input.razorpayPaymentId,
      razorpay_payment_status: input.payment.status,
      razorpay_payment_amount: input.paidAmount,
      razorpay_payment_captured: input.paymentCaptured,
      expected_amount: input.expectedAmount,
      amount_matches: input.amountMatches,
      razorpay_payment_method: input.payment.method ?? null,
      razorpay_invoice_id: input.payment.invoice_id ?? null,
    },
    updated_at: input.nowIso,
  };
}
