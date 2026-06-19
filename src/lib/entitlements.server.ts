// Server-only entitlement helpers. Determines a user's plan + consumes quota.
import type { PaymentsEnv } from "@/lib/payments.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type Plan = "free" | "pro";

export type Quotas = {
  reviewsPerMonth: number;
  problemsPerDay: number;
  codeRunsPerDay: number;
};

let _quotaCache: { data: Record<Plan, Quotas>; ts: number } | null = null;

export async function getPlanQuotas(): Promise<Record<Plan, Quotas>> {
  if (_quotaCache && Date.now() - _quotaCache.ts < 60_000) return _quotaCache.data;

  const { data } = await supabaseAdmin.from("app_config").select("key, value");
  const map = new Map<string, string>();
  for (const row of data ?? []) {
    map.set(row.key, row.value as string);
  }

  _quotaCache = {
    data: {
      free: {
        reviewsPerMonth: parseInt(map.get("plan_quota_free_reviews") ?? "50"),
        problemsPerDay: parseInt(map.get("plan_quota_free_problems") ?? "25"),
        codeRunsPerDay: parseInt(map.get("plan_quota_free_code_runs") ?? "100"),
      },
      pro: {
        reviewsPerMonth: parseInt(map.get("plan_quota_pro_reviews") ?? "1500"),
        problemsPerDay: parseInt(map.get("plan_quota_pro_problems") ?? "150"),
        codeRunsPerDay: parseInt(map.get("plan_quota_pro_code_runs") ?? "100"),
      },
    },
    ts: Date.now(),
  };
  return _quotaCache.data;
}

export function refreshPlanQuotas(): void {
  _quotaCache = null;
}

export type QuotaKind = "review" | "roadmap" | "code_run";

/** Determines plan from the subscriptions table, env-scoped. */
export async function getUserPlan(
  userId: string,
  env: PaymentsEnv,
): Promise<{ plan: Plan; status: string | null; pastDue: boolean }> {
  const { data } = await supabaseAdmin
    .from("subscriptions")
    .select("status, current_period_end, external_status_updated_at, created_at")
    .eq("user_id", userId)
    .eq("environment", env);

  const rows = data ?? [];
  if (!rows.length) return { plan: "free", status: null, pastDue: false };

  const sortedRows = [...rows].sort((left, right) => {
    const leftTs = left.external_status_updated_at || left.created_at || "";
    const rightTs = right.external_status_updated_at || right.created_at || "";
    return rightTs.localeCompare(leftTs);
  });

  const now = Date.now();
  const activeRow =
    sortedRows.find((row) => {
      const endMs = row.current_period_end ? new Date(row.current_period_end).getTime() : null;
      const inPeriod = endMs === null || endMs > now;
      return (
        (["active", "trialing", "past_due"].includes(row.status) && inPeriod) ||
        (row.status === "canceled" && endMs !== null && endMs > now)
      );
    }) || sortedRows[0];

  const endMs = activeRow.current_period_end
    ? new Date(activeRow.current_period_end as string).getTime()
    : null;
  const inPeriod = endMs === null || endMs > now;
  const status = activeRow.status as string;
  const isPro =
    (["active", "trialing", "past_due"].includes(status) && inPeriod) ||
    (status === "canceled" && endMs !== null && endMs > now);

  return { plan: isPro ? "pro" : "free", status, pastDue: status === "past_due" };
}

export function monthKey(d = new Date()): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function dayKey(d = new Date()): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(
    d.getUTCDate(),
  ).padStart(2, "0")}`;
}

/** Returns true if quota was successfully consumed, false if user is at the cap. */
export async function consumeQuota(
  userId: string,
  kind: QuotaKind,
  limit: number,
  periodKey: string,
): Promise<boolean> {
  const { data, error } = await supabaseAdmin.rpc("consume_quota", {
    p_user_id: userId,
    p_kind: kind,
    p_limit: limit,
    p_period_key: periodKey,
  });
  if (error) {
    console.error("consume_quota failed:", error);
    return false;
  }
  return data === true;
}

export async function readUsage(
  userId: string,
  kind: QuotaKind,
  periodKey: string,
): Promise<number> {
  const { data } = await supabaseAdmin.rpc("get_usage", {
    p_user_id: userId,
    p_kind: kind,
    p_period_key: periodKey,
  });
  return (data as number) ?? 0;
}
