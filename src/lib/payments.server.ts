import { createHmac, timingSafeEqual } from "node:crypto";

export type PaymentsEnv = "sandbox" | "live";
export type PaymentProvider = "paddle" | "razorpay";

type RazorpaySubscriptionRequest = {
  plan_id: string;
  customer_notify?: 0 | 1;
  quantity?: number;
  total_count?: number;
  notes?: Record<string, string>;
};

type RazorpayOrderRequest = {
  amount: number;
  currency: "INR";
  receipt: string;
  notes?: Record<string, string>;
};

export type RazorpayOrder = {
  id: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt?: string | null;
  status: string;
  notes?: Record<string, string>;
};

export type RazorpaySubscription = {
  id: string;
  status: string;
  plan_id?: string;
  short_url?: string;
  customer_id?: string;
  notes?: Record<string, string>;
  current_start?: number | null;
  current_end?: number | null;
  start_at?: number | null;
  ended_at?: number | null;
};

export type RazorpayPayment = {
  id: string;
  status: string;
  amount: number;
  currency: string;
  captured: boolean;
  invoice_id?: string | null;
  order_id?: string | null;
  method?: string | null;
  email?: string | null;
  notes?: Record<string, string>;
};

export type RazorpayWebhookPayload = {
  event: string;
  created_at?: number;
  payload?: {
    payment?: {
      entity?: {
        id?: string;
        currency?: string;
        notes?: Record<string, string>;
      };
    };
    subscription?: {
      entity?: RazorpaySubscription;
    };
  };
};

const RAZORPAY_API_BASE_URL = "https://api.razorpay.com/v1";

function getEnvValue(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`${key} is not configured`);
  return value;
}

export function getRazorpayCredentials(env: PaymentsEnv): { keyId: string; keySecret: string } {
  return env === "sandbox"
    ? {
        keyId: getEnvValue("RAZORPAY_SANDBOX_KEY_ID"),
        keySecret: getEnvValue("RAZORPAY_SANDBOX_KEY_SECRET"),
      }
    : {
        keyId: getEnvValue("RAZORPAY_LIVE_KEY_ID"),
        keySecret: getEnvValue("RAZORPAY_LIVE_KEY_SECRET"),
      };
}

export function getRazorpayKeyId(env: PaymentsEnv): string {
  return getRazorpayCredentials(env).keyId;
}

export function getRazorpayWebhookSecret(env: PaymentsEnv): string {
  return env === "sandbox"
    ? getEnvValue("RAZORPAY_SANDBOX_WEBHOOK_SECRET")
    : getEnvValue("RAZORPAY_LIVE_WEBHOOK_SECRET");
}

function getRazorpayAuthHeader(env: PaymentsEnv): string {
  const { keyId, keySecret } = getRazorpayCredentials(env);
  return `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`;
}

async function requestRazorpay<T>(
  env: PaymentsEnv,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${RAZORPAY_API_BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: getRazorpayAuthHeader(env),
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  const text = await response.text();
  const payload = text ? (JSON.parse(text) as T | { error?: { description?: string } }) : null;

  if (!response.ok) {
    const message =
      typeof payload === "object" && payload && "error" in payload
        ? payload.error?.description
        : undefined;
    throw new Error(message || `Razorpay request failed with ${response.status}`);
  }

  return payload as T;
}

function compareSignatures(expectedHex: string, actualHex: string): boolean {
  const expected = Buffer.from(expectedHex.toLowerCase(), "utf8");
  const actual = Buffer.from(actualHex.toLowerCase(), "utf8");
  if (expected.length !== actual.length) return false;
  return timingSafeEqual(expected, actual);
}

export function verifyRazorpayWebhookSignature(
  payload: string,
  signature: string,
  env: PaymentsEnv,
): boolean {
  const digest = createHmac("sha256", getRazorpayWebhookSecret(env)).update(payload).digest("hex");
  return compareSignatures(digest, signature);
}

export function verifyRazorpayPaymentSignature(input: {
  env: PaymentsEnv;
  paymentId: string;
  subscriptionId: string;
  signature: string;
}): boolean {
  const { keySecret } = getRazorpayCredentials(input.env);
  const digest = createHmac("sha256", keySecret)
    .update(`${input.paymentId}|${input.subscriptionId}`)
    .digest("hex");
  return compareSignatures(digest, input.signature);
}

export function verifyRazorpayOrderSignature(input: {
  env: PaymentsEnv;
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  const { keySecret } = getRazorpayCredentials(input.env);
  const digest = createHmac("sha256", keySecret)
    .update(`${input.orderId}|${input.paymentId}`)
    .digest("hex");
  return compareSignatures(digest, input.signature);
}

export async function createRazorpayOrder(
  env: PaymentsEnv,
  payload: RazorpayOrderRequest,
): Promise<RazorpayOrder> {
  return requestRazorpay<RazorpayOrder>(env, "/orders", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function createRazorpaySubscription(
  env: PaymentsEnv,
  payload: RazorpaySubscriptionRequest,
): Promise<RazorpaySubscription> {
  return requestRazorpay<RazorpaySubscription>(env, "/subscriptions", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function fetchRazorpayPayment(
  env: PaymentsEnv,
  paymentId: string,
): Promise<RazorpayPayment> {
  return requestRazorpay<RazorpayPayment>(env, `/payments/${paymentId}`);
}

export async function captureRazorpayPayment(
  env: PaymentsEnv,
  paymentId: string,
  payload: { amount: number; currency: "INR" },
): Promise<RazorpayPayment> {
  return requestRazorpay<RazorpayPayment>(env, `/payments/${paymentId}/capture`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function cancelRazorpaySubscription(
  env: PaymentsEnv,
  subscriptionId: string,
): Promise<RazorpaySubscription> {
  return requestRazorpay<RazorpaySubscription>(env, `/subscriptions/${subscriptionId}/cancel`, {
    method: "POST",
    body: JSON.stringify({ cancel_at_cycle_end: 1 }),
  });
}

export function unixSecondsToIso(value?: number | null): string | null {
  if (!value) return null;
  return new Date(value * 1000).toISOString();
}
