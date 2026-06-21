import { describe, expect, it } from "vitest";
import {
  addBillingPeriod,
  isProBillingPlanCode,
  resolvePaidPeriod,
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
});
