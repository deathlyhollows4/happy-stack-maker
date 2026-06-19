import { createServerFn } from "@tanstack/react-start";

export type BillingEnvironment = "sandbox" | "live";
export type BillingProvider = "razorpay";

export type PricingConfig = {
  freeReviews: number;
  freeProblems: number;
  freeCodeRuns: number;
  proReviews: number;
  proProblems: number;
  proCodeRuns: number;
  proMonthlyInr: number;
  proYearlyInr: number;
  compareAtYearlyInr: number;
  yearlySavingsPercent: number;
  currency: "INR";
};

export type RazorpayCheckoutRequest = {
  priceId: string;
  customerEmail?: string;
  customerName?: string;
  customerContact?: string;
  userId?: string;
  successUrl?: string;
  cancelUrl?: string;
  metadata?: Record<string, string>;
};

export type RazorpayCheckoutSession = {
  key: string;
  amount?: number;
  currency: string;
  name: string;
  description: string;
  image?: string;
  orderId?: string;
  subscriptionId?: string;
  redirectUrl?: string;
  callbackUrl?: string;
  redirect?: boolean;
  successUrl?: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  theme?: {
    color?: string;
  };
};

const PUBLIC_PRICING_KEYS = [
  "plan_quota_free_reviews",
  "plan_quota_free_problems",
  "plan_quota_free_code_runs",
  "plan_quota_pro_reviews",
  "plan_quota_pro_problems",
  "plan_quota_pro_code_runs",
  "plan_price_pro_monthly",
  "plan_price_pro_yearly",
] as const;

const RAZORPAY_CHECKOUT_ENDPOINTS = [
  "/api/public/payments/checkout",
  "/api/public/payments/razorpay/checkout",
  "/api/public/payments/create-order",
] as const;

export const DEFAULT_PRICING_CONFIG: PricingConfig = {
  freeReviews: 50,
  freeProblems: 25,
  freeCodeRuns: 100,
  proReviews: 1500,
  proProblems: 150,
  proCodeRuns: 100,
  proMonthlyInr: 899,
  proYearlyInr: 8954,
  compareAtYearlyInr: 899 * 12,
  yearlySavingsPercent: 17,
  currency: "INR",
};

function toPositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function getFirstString(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return undefined;
}

function getFirstNumber(...values: unknown[]): number | undefined {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }
  return undefined;
}

function getNestedObject(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

export function normalizePricingConfig(rawConfig?: Record<string, string>): PricingConfig {
  const monthly = toPositiveInt(rawConfig?.plan_price_pro_monthly, DEFAULT_PRICING_CONFIG.proMonthlyInr);
  const yearly = toPositiveInt(rawConfig?.plan_price_pro_yearly, DEFAULT_PRICING_CONFIG.proYearlyInr);
  const compareAtYearly = monthly * 12;
  const yearlySavingsPercent =
    compareAtYearly > yearly ? Math.round(((compareAtYearly - yearly) / compareAtYearly) * 100) : 0;

  return {
    freeReviews: toPositiveInt(rawConfig?.plan_quota_free_reviews, DEFAULT_PRICING_CONFIG.freeReviews),
    freeProblems: toPositiveInt(rawConfig?.plan_quota_free_problems, DEFAULT_PRICING_CONFIG.freeProblems),
    freeCodeRuns: toPositiveInt(rawConfig?.plan_quota_free_code_runs, DEFAULT_PRICING_CONFIG.freeCodeRuns),
    proReviews: toPositiveInt(rawConfig?.plan_quota_pro_reviews, DEFAULT_PRICING_CONFIG.proReviews),
    proProblems: toPositiveInt(rawConfig?.plan_quota_pro_problems, DEFAULT_PRICING_CONFIG.proProblems),
    proCodeRuns: toPositiveInt(rawConfig?.plan_quota_pro_code_runs, DEFAULT_PRICING_CONFIG.proCodeRuns),
    proMonthlyInr: monthly,
    proYearlyInr: yearly,
    compareAtYearlyInr: compareAtYearly,
    yearlySavingsPercent,
    currency: "INR",
  };
}

export const getPublicPricingConfig = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("app_config")
    .select("key, value")
    .in("key", [...PUBLIC_PRICING_KEYS]);

  if (error) {
    console.error("getPublicPricingConfig failed:", error);
    return {
      ok: false as const,
      error: "Pricing is not available right now.",
      config: DEFAULT_PRICING_CONFIG,
    };
  }

  const rawConfig: Record<string, string> = {};
  for (const row of data ?? []) {
    rawConfig[row.key] = row.value as string;
  }

  return {
    ok: true as const,
    config: normalizePricingConfig(rawConfig),
  };
});

export function getBillingEnvironment(): BillingEnvironment {
  const razorpayKeyId = import.meta.env.VITE_RAZORPAY_KEY_ID as string | undefined;
  if (razorpayKeyId?.startsWith("rzp_test_")) return "sandbox";
  if (razorpayKeyId) return "live";

  const legacyToken = import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN as string | undefined;
  if (legacyToken?.startsWith("test_")) return "sandbox";
  if (legacyToken) return "live";

  return "sandbox";
}

export function isBillingTestMode(): boolean {
  return getBillingEnvironment() === "sandbox";
}

export function getBillingProviderLabel(): string {
  return "Razorpay";
}

export function getRazorpayKeyId(): string | undefined {
  const keyId = import.meta.env.VITE_RAZORPAY_KEY_ID as string | undefined;
  return keyId?.trim() || undefined;
}

export function formatInr(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getFreePlanFeatures(config: PricingConfig): string[] {
  return [
    `${config.freeReviews} code reviews / month`,
    "Mastery tracking across DSA topics",
    `${config.freeProblems} practice problems / day`,
    `${config.freeCodeRuns} code runs / day`,
  ];
}

export function getProPlanFeatures(config: PricingConfig): string[] {
  return [
    `${config.proReviews} code reviews / month`,
    `${config.proProblems} practice problems / day`,
    `${config.proCodeRuns} code runs / day`,
    "Priority support",
  ];
}

export function getPlanInterval(priceId: string | null | undefined): "monthly" | "yearly" {
  return String(priceId ?? "").includes("year") ? "yearly" : "monthly";
}

export function getProPlanLabel(priceId: string | null | undefined): string {
  return getPlanInterval(priceId) === "yearly" ? "Pro Yearly" : "Pro Monthly";
}

export function getPlanPrice(config: PricingConfig, priceId: string | null | undefined): number {
  return getPlanInterval(priceId) === "yearly" ? config.proYearlyInr : config.proMonthlyInr;
}

function normalizeCheckoutResponse(
  payload: unknown,
  fallbackRequest: RazorpayCheckoutRequest,
): RazorpayCheckoutSession {
  const topLevel = getNestedObject(payload);
  const root =
    "data" in topLevel && topLevel.data && typeof topLevel.data === "object"
      ? getNestedObject(topLevel.data)
      : topLevel;
  const order = getNestedObject(root.order);
  const prefill = getNestedObject(root.prefill);
  const customer = getNestedObject(root.customer);
  const subscription = getNestedObject(root.subscription);
  const theme = getNestedObject(root.theme);
  const notes = getNestedObject(root.notes);

  const redirectUrl = getFirstString(
    root.redirectUrl,
    root.redirect_url,
    root.checkoutUrl,
    root.checkout_url,
    root.url,
  );
  const orderId = getFirstString(root.orderId, root.order_id, order.id, order.orderId, order.order_id);
  const subscriptionId = getFirstString(
    root.subscriptionId,
    root.subscription_id,
    subscription.id,
    subscription.subscriptionId,
    subscription.subscription_id,
  );
  const key = getFirstString(
    root.key,
    root.keyId,
    root.key_id,
    root.razorpayKeyId,
    root.razorpay_key_id,
    order.key,
    getRazorpayKeyId(),
  );

  if (!redirectUrl && !orderId && !subscriptionId) {
    throw new Error("Checkout setup is incomplete. Expected an order or subscription ID.");
  }
  if (!redirectUrl && !key) {
    throw new Error("Checkout setup is incomplete. Expected a Razorpay key ID.");
  }

  const successUrl =
    getFirstString(root.successUrl, root.success_url) ??
    fallbackRequest.successUrl ??
    `${window.location.origin}/dashboard?checkout=pending`;

  return {
    key: key ?? "",
    amount: getFirstNumber(root.amount, order.amount),
    currency: getFirstString(root.currency, order.currency, "INR") ?? "INR",
    name: getFirstString(root.name, "CodeWise") ?? "CodeWise",
    description:
      getFirstString(root.description, "CodeWise Pro subscription") ?? "CodeWise Pro subscription",
    image: getFirstString(root.image),
    orderId,
    subscriptionId,
    redirectUrl,
    callbackUrl: getFirstString(root.callbackUrl, root.callback_url),
    redirect: root.redirect === true,
    successUrl,
    prefill: {
      name: getFirstString(prefill.name, customer.name, fallbackRequest.customerName),
      email: getFirstString(prefill.email, customer.email, fallbackRequest.customerEmail),
      contact: getFirstString(prefill.contact, customer.contact, fallbackRequest.customerContact),
    },
    notes: {
      ...notes,
      ...(fallbackRequest.userId ? { userId: fallbackRequest.userId } : {}),
    },
    theme: {
      color: getFirstString(theme.color, "#1f7a8c"),
    },
  };
}

async function parseCheckoutError(response: Response): Promise<string> {
  try {
    const payload = await response.json();
    const root = getNestedObject(payload);
    return (
      getFirstString(
        root.error,
        getNestedObject(root.error).description,
        getNestedObject(root.error).message,
        root.message,
      ) ?? `Request failed with status ${response.status}.`
    );
  } catch {
    return `Request failed with status ${response.status}.`;
  }
}

export async function createRazorpayCheckoutSession(
  request: RazorpayCheckoutRequest,
): Promise<RazorpayCheckoutSession> {
  const errors: string[] = [];

  for (const endpoint of RAZORPAY_CHECKOUT_ENDPOINTS) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          provider: "razorpay",
          priceId: request.priceId,
          planId: request.priceId,
          customerEmail: request.customerEmail,
          customerName: request.customerName,
          customerContact: request.customerContact,
          userId: request.userId,
          successUrl: request.successUrl,
          cancelUrl: request.cancelUrl,
          metadata: request.metadata,
        }),
      });

      if (!response.ok) {
        errors.push(`${endpoint}: ${await parseCheckoutError(response)}`);
        continue;
      }

      const payload = await response.json();
      return normalizeCheckoutResponse(payload, request);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      errors.push(`${endpoint}: ${message}`);
    }
  }

  throw new Error(
    errors[0] ??
      "Razorpay checkout is not available yet. Add a checkout endpoint that returns an order or subscription ID.",
  );
}
