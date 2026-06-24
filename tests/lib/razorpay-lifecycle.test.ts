import { describe, expect, it } from "vitest";
import {
  addBillingPeriod,
  buildCreatedOrderSubscriptionRow,
  buildVerifiedPaymentSubscriptionRow,
  firstString,
  isProBillingPlanCode,
  normalizeCurrencyCode,
  normalizeSubscriptionStatus,
  resolvePaidPeriod,
  resolveRazorpayPaymentCaptureState,
  toPositiveNumber,
} from "@/lib/razorpay-lifecycle.server";

describe("razorpay lifecycle policy", () => {
  it("recognizes supported Pro billing plan codes", () => {
    expect(isProBillingPlanCode("pro_monthly")).toBe(true);
    expect(isProBillingPlanCode("pro_yearly")).toBe(true);
    expect(isProBillingPlanCode("free")).toBe(false);
  });

  it("adds monthly and yearly billing periods", () => {
    expect(addBillingPeriod(new Date("2026-06-21T00:00:00Z"), "pro_monthly").toISOString()).toBe(
      "2026-07-21T00:00:00.000Z",
    );
    expect(addBillingPeriod(new Date("2026-06-21T00:00:00Z"), "pro_yearly").toISOString()).toBe(
      "2027-06-21T00:00:00.000Z",
    );
  });

  it("preserves an existing active period", () => {
    expect(
      resolvePaidPeriod({
        existingActive: true,
        existingStart: "2026-06-01T00:00:00Z",
        existingEnd: "2026-07-01T00:00:00Z",
        canActivate: true,
        billingPlanCode: "pro_monthly",
        start: new Date("2026-06-21T00:00:00Z"),
      }),
    ).toEqual({
      currentPeriodStart: "2026-06-01T00:00:00Z",
      currentPeriodEnd: "2026-07-01T00:00:00Z",
    });
  });

  it("does not create a period when activation is not allowed", () => {
    expect(
      resolvePaidPeriod({
        existingActive: false,
        canActivate: false,
        billingPlanCode: "pro_monthly",
        start: new Date("2026-06-21T00:00:00Z"),
      }),
    ).toEqual({
      currentPeriodStart: null,
      currentPeriodEnd: null,
    });
  });

  it("normalizes webhook and payment evidence primitives", () => {
    expect(firstString(null, "  ", " pay_1 ")).toBe("pay_1");
    expect(normalizeCurrencyCode("inr")).toBe("INR");
    expect(normalizeCurrencyCode("rupees")).toBeNull();
    expect(toPositiveNumber("500")).toBe(500);
    expect(toPositiveNumber(0)).toBeNull();
    expect(normalizeSubscriptionStatus("subscription.charged", "pending")).toBe("active");
    expect(normalizeSubscriptionStatus("unknown.event", "pending")).toBe("pending");
  });

  it("resolves conservative payment capture state", () => {
    expect(
      resolveRazorpayPaymentCaptureState({
        payment: { amount: 99900, captured: true, status: "captured" },
        expectedAmount: 99900,
      }),
    ).toEqual({
      paidAmount: 99900,
      amountMatches: true,
      paymentCaptured: true,
      hasPaidCharge: true,
    });

    expect(
      resolveRazorpayPaymentCaptureState({
        payment: { amount: 49900, captured: true, status: "captured" },
        expectedAmount: 99900,
      }),
    ).toMatchObject({
      amountMatches: false,
      hasPaidCharge: true,
    });
  });

  it("builds checkout and verified subscription rows from shared lifecycle policy", () => {
    const created = buildCreatedOrderSubscriptionRow({
      userId: "user-1",
      environment: "sandbox",
      billingPlanCode: "pro_monthly",
      currencyCode: "INR",
      order: { id: "order-1", amount: 99900, status: "created" },
      nowIso: "2026-06-25T00:00:00.000Z",
    });

    expect(created).toMatchObject({
      user_id: "user-1",
      provider_subscription_id: "order-1",
      status: "created",
      metadata: {
        source: "createSubscriptionCheckout",
        checkout_mode: "order",
      },
    });

    const verified = buildVerifiedPaymentSubscriptionRow({
      userId: "user-1",
      lookupId: "order-1",
      environment: "sandbox",
      orderId: "order-1",
      razorpayPaymentId: "pay-1",
      billingPlanCode: "pro_monthly",
      currencyCode: "INR",
      existing: {
        provider_plan_id: "pro_monthly",
        product_id: "pro",
        currency_code: "INR",
      },
      payment: {
        status: "captured",
        currency: "INR",
        method: "card",
        invoice_id: null,
      },
      paidAmount: 99900,
      expectedAmount: 99900,
      amountMatches: true,
      paymentCaptured: true,
      active: true,
      currentPeriodStart: "2026-06-25T00:00:00.000Z",
      currentPeriodEnd: "2026-07-25T00:00:00.000Z",
      nowIso: "2026-06-25T00:00:00.000Z",
    });

    expect(verified).toMatchObject({
      status: "active",
      metadata: {
        source: "verifyRazorpaySubscriptionPayment",
        razorpay_payment_id: "pay-1",
        amount_matches: true,
      },
    });
  });
});
