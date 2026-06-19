import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { cancelRazorpaySubscription } from "@/lib/payments.server";
import { envInput, isAdmin } from "@/lib/codewise.utils";

const GRACE_DAYS = 7;

async function getLatestSubscription(userId: string, environment: "sandbox" | "live") {
  const { data } = await supabaseAdmin
    .from("subscriptions")
    .select(
      [
        "id",
        "provider",
        "provider_subscription_id",
        "status",
        "current_period_end",
        "external_status_updated_at",
      ].join(", "),
    )
    .eq("user_id", userId)
    .eq("environment", environment)
    .order("external_status_updated_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data;
}

export const cancelSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ environment: envInput }).parse(input))
  .handler(async ({ data, context }) => {
    const sub = await getLatestSubscription(context.userId, data.environment);

    if (!sub) {
      return { ok: false as const, error: "No active subscription found." };
    }

    if (sub.status === "canceled") {
      return { ok: false as const, error: "Subscription is already canceled." };
    }

    if (sub.provider !== "razorpay" || !sub.provider_subscription_id) {
      return {
        ok: false as const,
        error: "This subscription cannot be canceled from the current billing flow.",
      };
    }

    try {
      await cancelRazorpaySubscription(data.environment, sub.provider_subscription_id);
    } catch (error) {
      console.error("Razorpay cancel failed:", error);
      return {
        ok: false as const,
        error: "Could not cancel subscription with the payment provider. Try again.",
      };
    }

    const graceEnd = new Date(Date.now() + GRACE_DAYS * 24 * 60 * 60 * 1000).toISOString();

    await supabaseAdmin
      .from("subscriptions")
      .update({
        status: "canceled",
        cancel_at_period_end: true,
        current_period_end: graceEnd,
        external_status_updated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", sub.id);

    return { ok: true as const, accessUntil: graceEnd };
  });

export const getCustomerPortalUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ environment: envInput }).parse(input))
  .handler(async () => {
    return {
      ok: false as const,
      error: "Self-service billing portal is not available for Razorpay subscriptions yet.",
    };
  });

export const updateProYearlyPrice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ environment: envInput }).parse(input))
  .handler(async ({ context }) => {
    if (!(await isAdmin(context.userId))) {
      return { ok: false as const, error: "Admin access required." };
    }

    const { error } = await supabaseAdmin.from("app_config").upsert(
      {
        key: "plan_price_pro_yearly",
        value: "16990",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "key" },
    );

    if (error) {
      console.error("updateProYearlyPrice failed:", error);
      return {
        ok: false as const,
        error: "Failed to update the Pro yearly price config.",
      };
    }

    return {
      ok: true as const,
      message: "Pro yearly price config is set to INR 16990/year.",
    };
  });
