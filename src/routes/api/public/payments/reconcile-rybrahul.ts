import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { fetchRazorpayPayment } from "@/lib/payments.server";

const TARGET = {
  paymentId: "pay_T3f5DlCVRmyDM1",
  orderId: "order_T3f0eXCfBSR4oA",
  userId: "c2788145-ac3a-4b58-a3c2-a11c21a9f191",
  billingPlanCode: "pro_monthly",
  amount: 89900,
  currency: "INR",
  environment: "live" as const,
  createdAtSeconds: 1781909612,
};

function describeError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object") {
    const record = error as Record<string, unknown>;
    return (
      [record.message, record.details, record.hint, record.code]
        .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
        .join(" | ") || "Unknown object error"
    );
  }
  return typeof error === "string" && error.trim() ? error : "Unknown reconciliation error";
}

async function reconcileCapturedPayment() {
  const payment = await fetchRazorpayPayment(TARGET.environment, TARGET.paymentId);
  const notes = payment.notes ?? {};
  const matches =
    payment.id === TARGET.paymentId &&
    payment.order_id === TARGET.orderId &&
    payment.status === "captured" &&
    payment.captured === true &&
    payment.amount === TARGET.amount &&
    payment.currency === TARGET.currency &&
    notes.userId === TARGET.userId &&
    notes.billingPlanCode === TARGET.billingPlanCode &&
    notes.environment === TARGET.environment;

  if (!matches) {
    return {
      ok: false as const,
      reason: "Razorpay payment did not match the expected captured subscription charge.",
    };
  }

  const periodStart = new Date(TARGET.createdAtSeconds * 1000);
  const periodEnd = new Date(periodStart);
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  const { error } = await supabaseAdmin.from("subscriptions").upsert(
    {
      user_id: TARGET.userId,
      provider: "razorpay",
      provider_subscription_id: TARGET.orderId,
      provider_customer_id: null,
      provider_plan_id: TARGET.billingPlanCode,
      billing_plan_code: TARGET.billingPlanCode,
      price_id: TARGET.billingPlanCode,
      product_id: "pro",
      status: "active",
      current_period_start: periodStart.toISOString(),
      current_period_end: periodEnd.toISOString(),
      cancel_at_period_end: false,
      currency_code: TARGET.currency,
      environment: TARGET.environment,
      external_status_updated_at: periodStart.toISOString(),
      metadata: {
        source: "razorpay_server_reconciliation",
        checkout_mode: "order",
        razorpay_order_id: TARGET.orderId,
        razorpay_payment_id: TARGET.paymentId,
        razorpay_payment_status: payment.status,
        razorpay_payment_amount: payment.amount,
        razorpay_payment_captured: payment.captured,
        expected_amount: TARGET.amount,
        amount_matches: true,
        currency_matches: true,
      },
      updated_at: new Date().toISOString(),
    },
    { onConflict: "provider,environment,provider_subscription_id" },
  );

  if (error) throw error;
  return {
    ok: true as const,
    userId: TARGET.userId,
    orderId: TARGET.orderId,
    status: "active",
    currentPeriodEnd: periodEnd.toISOString(),
  };
}

export const Route = createFileRoute("/api/public/payments/reconcile-rybrahul")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const result = await reconcileCapturedPayment();
          return Response.json(result, { status: result.ok ? 200 : 409 });
        } catch (error) {
          console.error("Razorpay reconciliation failed:", error);
          return Response.json(
            {
              ok: false,
              reason: describeError(error),
            },
            { status: 500 },
          );
        }
      },
    },
  },
});
