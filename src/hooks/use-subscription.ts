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
  external_status_updated_at?: string | null;
  created_at?: string | null;
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

function isEntitledSubscription(row: SubscriptionRow, now = Date.now()): boolean {
  const periodEndMs = row.current_period_end ? new Date(row.current_period_end).getTime() : null;
  const stillInPeriod = periodEndMs === null || periodEndMs > now;
  return (
    (["active", "trialing", "past_due"].includes(row.status) && stillInPeriod) ||
    (row.status === "canceled" && periodEndMs !== null && periodEndMs > now)
  );
}

function chooseSubscriptionRow(rows: SubscriptionRow[]): SubscriptionRow | null {
  const now = Date.now();
  return (
    [...rows].sort((left, right) => {
      const leftEntitled = isEntitledSubscription(left, now);
      const rightEntitled = isEntitledSubscription(right, now);
      if (leftEntitled !== rightEntitled) return leftEntitled ? -1 : 1;

      const leftTs = firstString(left.external_status_updated_at, left.created_at) ?? "";
      const rightTs = firstString(right.external_status_updated_at, right.created_at) ?? "";
      return rightTs.localeCompare(leftTs);
    })[0] ?? null
  );
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
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    const fetchSub = async () => {
      const { data } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .eq("environment", env)
        .order("external_status_updated_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false })
        .limit(25);
      if (!active) return;
      const row = chooseSubscriptionRow(((data as SubscriptionRow[] | null) ?? []));
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
        if (status === "SUBSCRIBED") {
          channelRef.current = channel;
          return;
        }

        if (["CHANNEL_ERROR", "TIMED_OUT", "CLOSED"].includes(status)) {
          fetchSub();
          if (retryTimer) clearTimeout(retryTimer);
          retryTimer = setTimeout(() => {
            if (active) fetchSub();
          }, 5000);
          supabase.removeChannel(channel);
          channelRef.current = null;
        }
      });

    channelRef.current = channel;

    return () => {
      active = false;
      if (retryTimer) clearTimeout(retryTimer);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user, env]);

  const now = Date.now();
  const isActive = !!subscription && isEntitledSubscription(subscription, now);

  return {
    subscription,
    isActive,
    loading,
    environment: env,
    provider: subscription?.provider ?? getBillingProviderLabel().toLowerCase(),
  };
}
