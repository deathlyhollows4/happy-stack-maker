import { supabaseAdmin } from "@/integrations/supabase/client.server";

const PLAN_CONFIG_KEYS = {
  pro_monthly: "plan_price_pro_monthly",
  pro_yearly: "plan_price_pro_yearly",
} as const;

export type ProBillingPlanCode = keyof typeof PLAN_CONFIG_KEYS;

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
