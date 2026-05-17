// Server-only entitlement helpers. Determines a user's plan + consumes quota.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { PaddleEnv } from "@/lib/paddle.server";

let _admin: SupabaseClient | null = null;
function admin(): SupabaseClient {
  if (!_admin) {
    _admin = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
  }
  return _admin;
}

export type Plan = "free" | "pro";

export type Quotas = {
  reviewsPerMonth: number;
  problemsPerDay: number;
  codeRunsPerDay: number;
};

export const PLAN_QUOTAS: Record<Plan, Quotas> = {
  free: { reviewsPerMonth: 50, problemsPerDay: 25, codeRunsPerDay: 100 },
  pro: { reviewsPerMonth: 1500, problemsPerDay: 15, codeRunsPerDay: 100 },
};

export type QuotaKind = "review" | "roadmap" | "code_run";

/** Determines plan from the subscriptions table, env-scoped. */
export async function getUserPlan(
  userId: string,
  env: PaddleEnv,
): Promise<{ plan: Plan; status: string | null; pastDue: boolean }> {
  const { data } = await admin()
    .from("subscriptions")
    .select("status, current_period_end")
    .eq("user_id", userId)
    .eq("environment", env)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return { plan: "free", status: null, pastDue: false };

  const now = Date.now();
  const endMs = data.current_period_end
    ? new Date(data.current_period_end as string).getTime()
    : null;
  const inPeriod = endMs === null || endMs > now;

  const status = data.status as string;
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
  const { data, error } = await admin().rpc("consume_quota", {
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
  const { data } = await admin().rpc("get_usage", {
    p_user_id: userId,
    p_kind: kind,
    p_period_key: periodKey,
  });
  return (data as number) ?? 0;
}
