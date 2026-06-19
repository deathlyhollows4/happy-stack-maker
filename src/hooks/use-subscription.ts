import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { getBillingEnvironment, getBillingProviderLabel } from "@/lib/payments";

export type SubscriptionRow = {
  id: string;
  user_id: string;
  product_id?: string | null;
  price_id?: string | null;
  status: string;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean | null;
  environment: string;
  provider?: string | null;
  payment_provider?: string | null;
  billing_provider?: string | null;
  provider_subscription_id?: string | null;
  provider_customer_id?: string | null;
  paddle_subscription_id?: string | null;
  paddle_customer_id?: string | null;
  razorpay_subscription_id?: string | null;
  razorpay_customer_id?: string | null;
  [key: string]: string | boolean | null | undefined;
};

function firstString(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return null;
}

export function useSubscription() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionRow | null>(null);
  const [loading, setLoading] = useState(true);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const env = getBillingEnvironment();

  useEffect(() => {
    if (!user) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    let active = true;

    const fetchSub = async () => {
      const { data } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .eq("environment", env)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!active) return;
      const row = (data as SubscriptionRow | null) ?? null;
      setSubscription(
        row
          ? {
              ...row,
              provider:
                firstString(row.provider, row.payment_provider, row.billing_provider) ??
                getBillingProviderLabel().toLowerCase(),
              provider_subscription_id: firstString(
                row.provider_subscription_id,
                row.razorpay_subscription_id,
                row.paddle_subscription_id,
              ),
              provider_customer_id: firstString(
                row.provider_customer_id,
                row.razorpay_customer_id,
                row.paddle_customer_id,
              ),
              price_id: firstString(row.price_id) ?? "pro_monthly",
            }
          : null,
      );
      setLoading(false);
    };

    fetchSub();

    const channel = supabase
      .channel(`subscriptions:${user.id}:${Date.now()}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "subscriptions",
          filter: `user_id=eq.${user.id}`,
        },
        () => fetchSub(),
      )
      .subscribe((status) => {
        if (status !== "SUBSCRIBED") {
          channelRef.current = null;
        }
      });

    channelRef.current = channel;

    return () => {
      active = false;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user, env]);

  const now = Date.now();
  const periodEndMs = subscription?.current_period_end
    ? new Date(subscription.current_period_end).getTime()
    : null;
  const stillInPeriod = periodEndMs === null || periodEndMs > now;

  const isActive =
    !!subscription &&
    ((["active", "trialing", "past_due"].includes(subscription.status) && stillInPeriod) ||
      (subscription.status === "canceled" && periodEndMs !== null && periodEndMs > now));

  return {
    subscription,
    isActive,
    loading,
    environment: env,
    provider: subscription?.provider ?? getBillingProviderLabel().toLowerCase(),
  };
}
