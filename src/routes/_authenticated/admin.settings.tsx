import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { getAppConfig, setAppConfig } from "@/lib/codewise.functions";
import { supabase } from "@/integrations/supabase/client";
import { Shield, Settings, Loader2, Save } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  head: () => ({ meta: [{ title: "Site Settings | CodeWise" }] }),
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/login" });
    const { data: isAdmin } = await supabase.rpc("has_role", {
      p_user_id: data.session.user.id,
      p_role: "admin",
    });
    if (!isAdmin) throw redirect({ to: "/dashboard" });
  },
  component: AdminSettingsPage,
});

const CONFIG_FIELDS = [
  {
    label: "Free Tier Limits",
    fields: [
      { key: "plan_quota_free_reviews", label: "Reviews per month" },
      { key: "plan_quota_free_problems", label: "Problems per day" },
      { key: "plan_quota_free_code_runs", label: "Code runs per day" },
    ],
  },
  {
    label: "Pro Tier Limits",
    fields: [
      { key: "plan_quota_pro_reviews", label: "Reviews per month" },
      { key: "plan_quota_pro_problems", label: "Problems per day" },
      { key: "plan_quota_pro_code_runs", label: "Code runs per day" },
    ],
  },
  {
    label: "Plan Price Display",
    fields: [
      { key: "plan_price_pro_monthly", label: "Pro Monthly ($/mo)" },
      { key: "plan_price_pro_yearly", label: "Pro Yearly ($/yr)" },
    ],
  },
];

function AdminSettingsPage() {
  const qc = useQueryClient();
  const getConfigFn = useServerFn(getAppConfig);
  const saveConfigFn = useServerFn(setAppConfig);
  const [saving, setSaving] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["appConfig"],
    queryFn: () => getConfigFn(),
    staleTime: 30 * 1000,
  });

  if (isLoading) {
    return (
      <div className="p-8 max-w-4xl mx-auto flex items-center justify-center min-h-[60vh]">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !data?.ok) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <Shield className="mx-auto size-8 text-muted-foreground" />
          <h2 className="mt-4 font-display text-2xl">Access denied</h2>
          <p className="mt-2 text-muted-foreground">You do not have admin privileges.</p>
          <Link
            to="/dashboard"
            className="mt-6 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  const config = data.config;

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const entries: { key: string; value: string }[] = [];
    for (const group of CONFIG_FIELDS) {
      for (const field of group.fields) {
        const value = (formData.get(field.key) as string) || "";
        entries.push({ key: field.key, value });
      }
    }
    const r = await saveConfigFn({ data: { entries } });
    if (r.ok) {
      toast.success("Settings saved. Cache cleared.");
      qc.invalidateQueries({ queryKey: ["appConfig"] });
    } else {
      toast.error(r.error || "Failed to save settings.");
    }
    setSaving(false);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-10">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
            <Settings className="size-3" /> Admin
          </p>
          <h1 className="mt-2 font-display text-5xl tracking-tight">Site Settings</h1>
          <p className="text-muted-foreground mt-2">
            Manage plan quotas, pricing display, and feature limits.
          </p>
        </div>
        <Link
          to="/admin/dashboard"
          className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted"
        >
          Back to admin
        </Link>
      </div>

      <form onSubmit={handleSave}>
        {CONFIG_FIELDS.map((group) => (
          <div key={group.label} className="mb-8">
            <h3 className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-4">
              {group.label}
            </h3>
            <div className="space-y-3">
              {group.fields.map((field) => (
                <div key={field.key} className="flex items-center gap-4">
                  <label className="w-52 text-sm text-muted-foreground">{field.label}</label>
                  <input
                    name={field.key}
                    type="number"
                    min="0"
                    step="1"
                    defaultValue={config[field.key] ?? ""}
                    className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="flex items-center gap-3 pt-4 border-t border-border">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent/90 disabled:opacity-50"
          >
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            {saving ? "Saving…" : "Save settings"}
          </button>
        </div>

        <p className="mt-6 text-xs text-muted-foreground">
          Changes take effect immediately. Limits apply on the next quota check. Pricing display
          values are shown on the /pricing page; actual Paddle prices must be updated via the Paddle
          dashboard or the Update Price tool.
        </p>
      </form>
    </div>
  );
}
