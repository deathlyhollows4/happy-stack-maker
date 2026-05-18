import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { getPaddleClient, type PaddleEnv } from "@/lib/paddle.server";

const envInput = z.enum(["sandbox", "live"]) as z.ZodType<PaddleEnv>;

const GRACE_DAYS = 7;

async function isAdmin(userId: string): Promise<boolean> {
  const { data } = await supabaseAdmin.rpc("has_role", {
    p_user_id: userId,
    p_role: "admin",
  });
  return !!data;
}

/**
 * Cancels the user's active subscription in Paddle (effective at next billing
 * period end) AND immediately sets current_period_end = now + 7 days so the
 * app's access window matches the user's "1 more week" promise from the
 * moment they click Cancel.
 */
export const cancelSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ environment: envInput }).parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const env = data.environment;

    const { data: sub } = await supabaseAdmin
      .from("subscriptions")
      .select("paddle_subscription_id, status, current_period_end")
      .eq("user_id", userId)
      .eq("environment", env)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!sub) {
      return { ok: false as const, error: "No active subscription found." };
    }
    if (sub.status === "canceled") {
      return { ok: false as const, error: "Subscription is already canceled." };
    }

    try {
      const paddle = getPaddleClient(env);
      await paddle.subscriptions.cancel(sub.paddle_subscription_id as string, {
        effectiveFrom: "next_billing_period",
      });
    } catch (e: any) {
      console.error("Paddle cancel failed:", e);
      return {
        ok: false as const,
        error: "Could not cancel subscription with the payment provider. Try again.",
      };
    }

    const graceEnd = new Date(Date.now() + GRACE_DAYS * 24 * 60 * 60 * 1000);
    await supabaseAdmin
      .from("subscriptions")
      .update({
        status: "canceled",
        cancel_at_period_end: true,
        current_period_end: graceEnd.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("paddle_subscription_id", sub.paddle_subscription_id as string)
      .eq("environment", env);

    return { ok: true as const, accessUntil: graceEnd.toISOString() };
  });

/** Returns a Paddle customer-portal URL for updating payment methods / invoices. */
export const getCustomerPortalUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ environment: envInput }).parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const env = data.environment;

    const { data: sub } = await supabaseAdmin
      .from("subscriptions")
      .select("paddle_subscription_id, paddle_customer_id")
      .eq("user_id", userId)
      .eq("environment", env)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!sub) return { ok: false as const, error: "No subscription found." };

    try {
      const paddle = getPaddleClient(env);
      const session = await paddle.customerPortalSessions.create(sub.paddle_customer_id as string, [
        sub.paddle_subscription_id as string,
      ]);
      return {
        ok: true as const,
        overviewUrl: session.urls.general.overview,
      };
    } catch (e) {
      console.error("portal session failed:", e);
      return { ok: false as const, error: "Could not open billing portal." };
    }
  });

/** Admin: update pro_yearly Paddle price to $199/yr */
export const updateProYearlyPrice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ environment: envInput }).parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const env = data.environment;

    if (!(await isAdmin(userId))) {
      return { ok: false as const, error: "Admin access required." };
    }

    try {
      const paddle = getPaddleClient(env);

      // Find the pro_yearly price
      let targetPriceId: string | null = null;
      const products = await paddle.products.list();
      for await (const product of products) {
        const prices = await paddle.prices.list({ productId: [product.id] });
        for await (const price of prices) {
          const custom = (price as any).customData;
          if (custom?.external_id === "pro_yearly") {
            targetPriceId = price.id;
            break;
          }
        }
        if (targetPriceId) break;
      }

      if (!targetPriceId) {
        return {
          ok: false as const,
          error: 'Could not find Paddle price with external_id "pro_yearly".',
        };
      }

      await paddle.prices.update(targetPriceId, {
        unitPrice: { amount: "19900", currencyCode: "USD" },
      });

      return { ok: true as const, message: "Pro Yearly updated to $199/yr." };
    } catch (e: any) {
      console.error("updateProYearlyPrice failed:", e);
      return {
        ok: false as const,
        error: "Failed to update Paddle price. Check server logs.",
      };
    }
  });
