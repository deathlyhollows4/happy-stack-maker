export type EntitlementPlan = "free" | "pro";

export type SubscriptionEntitlementRow = {
  status?: string | null;
  current_period_end?: string | null;
  external_status_updated_at?: string | null;
  created_at?: string | null;
};

export function firstPresentString(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return null;
}

export function subscriptionHasAccess(row: SubscriptionEntitlementRow, now = Date.now()): boolean {
  const periodEndMs = row.current_period_end ? new Date(row.current_period_end).getTime() : null;
  const stillInPeriod = periodEndMs === null || periodEndMs > now;

  return (
    (!!row.status && ["active", "trialing", "past_due"].includes(row.status) && stillInPeriod) ||
    (row.status === "canceled" && periodEndMs !== null && periodEndMs > now)
  );
}

export function chooseEntitlementSubscription<T extends SubscriptionEntitlementRow>(
  rows: T[],
  now = Date.now(),
): T | null {
  return (
    [...rows].sort((left, right) => {
      const leftEntitled = subscriptionHasAccess(left, now);
      const rightEntitled = subscriptionHasAccess(right, now);
      if (leftEntitled !== rightEntitled) return leftEntitled ? -1 : 1;

      const leftTs = firstPresentString(left.external_status_updated_at, left.created_at) ?? "";
      const rightTs = firstPresentString(right.external_status_updated_at, right.created_at) ?? "";
      return rightTs.localeCompare(leftTs);
    })[0] ?? null
  );
}

export function deriveEntitlement(row: SubscriptionEntitlementRow | null, now = Date.now()) {
  const status = row?.status ?? null;
  const entitled = row ? subscriptionHasAccess(row, now) : false;

  return {
    plan: (entitled ? "pro" : "free") as EntitlementPlan,
    status,
    pastDue: status === "past_due",
    entitled,
  };
}
