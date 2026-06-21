import { describe, expect, it } from "vitest";
import {
  chooseEntitlementSubscription,
  deriveEntitlement,
  firstPresentString,
  subscriptionHasAccess,
} from "@/lib/entitlement-policy";

const now = new Date("2026-06-21T00:00:00Z").getTime();

describe("entitlement policy", () => {
  it("treats active, trialing, and past due subscriptions in period as entitled", () => {
    for (const status of ["active", "trialing", "past_due"]) {
      expect(
        subscriptionHasAccess({ status, current_period_end: "2026-06-22T00:00:00Z" }, now),
      ).toBe(true);
    }
  });

  it("keeps canceled subscriptions entitled until the current period ends", () => {
    expect(
      subscriptionHasAccess(
        { status: "canceled", current_period_end: "2026-06-22T00:00:00Z" },
        now,
      ),
    ).toBe(true);

    expect(
      subscriptionHasAccess(
        { status: "canceled", current_period_end: "2026-06-20T00:00:00Z" },
        now,
      ),
    ).toBe(false);
  });

  it("chooses an entitled row before a newer expired row", () => {
    const row = chooseEntitlementSubscription(
      [
        {
          status: "completed",
          current_period_end: "2026-06-20T00:00:00Z",
          external_status_updated_at: "2026-06-21T01:00:00Z",
        },
        {
          status: "active",
          current_period_end: "2026-06-22T00:00:00Z",
          external_status_updated_at: "2026-06-20T01:00:00Z",
        },
      ],
      now,
    );

    expect(row?.status).toBe("active");
  });

  it("derives plan, status, and past due from the chosen row", () => {
    expect(
      deriveEntitlement({ status: "past_due", current_period_end: "2026-06-22T00:00:00Z" }, now),
    ).toEqual({
      plan: "pro",
      status: "past_due",
      pastDue: true,
      entitled: true,
    });
  });

  it("normalizes the first non-empty string", () => {
    expect(firstPresentString(null, " ", " razorpay ")).toBe("razorpay");
  });
});
