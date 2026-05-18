import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getAdminDashboard } from "@/lib/codewise.functions";
import { supabase } from "@/integrations/supabase/client";
import {
  Shield,
  Users,
  Star,
  Activity,
  Loader2,
  Settings,
  FileText,
  UserCog,
  GraduationCap,
  Download,
  RefreshCw,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/dashboard")({
  head: () => ({ meta: [{ title: "Admin Dashboard | CodeWise" }] }),
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
  component: AdminDashboard,
});

function AdminDashboard() {
  const fn = useServerFn(getAdminDashboard);
  const { data, isLoading, error } = useQuery({
    queryKey: ["adminDashboard"],
    queryFn: () => fn(),
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="p-8 max-w-7xl mx-auto flex items-center justify-center min-h-[60vh]">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !data?.ok) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <Shield className="mx-auto size-8 text-muted-foreground" />
          <h2 className="mt-4 font-display text-2xl">Access denied</h2>
          <p className="mt-2 text-muted-foreground">
            You do not have admin privileges. Contact your system administrator.
          </p>
          <Link
            to="/dashboard"
            className="mt-6 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  const { users, totals } = data;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-10">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
            <Shield className="size-3" /> Admin
          </p>
          <h1 className="mt-2 font-display text-5xl tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            All users, subscriptions, and usage overview.
          </p>
        </div>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition"
        >
          Back to dashboard
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-10">
        <StatCard icon={<Users className="size-4" />} label="Total users" value={totals.users} />
        <StatCard icon={<Star className="size-4" />} label="Pro users" value={totals.pro_users} />
        <StatCard
          icon={<Activity className="size-4" />}
          label="Reviews (this month)"
          value={totals.reviews_this_month}
        />
        <StatCard
          icon={<Users className="size-4" />}
          label="Free users"
          value={totals.free_users}
        />
      </div>

      {/* Admin quick links */}
      <div className="mb-10">
        <h3 className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-4">
          Admin tools
        </h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <QuickLink
            to="/admin/settings"
            icon={<Settings className="size-4" />}
            label="Site Settings"
            desc="Plan quotas, pricing display"
          />
          <QuickLink
            to="/admin/blog"
            icon={<FileText className="size-4" />}
            label="Blog Posts"
            desc="Create & manage explore articles"
          />
          <QuickLink
            to="/admin/seats"
            icon={<UserCog className="size-4" />}
            label="Seats"
            desc="Grant & revoke admin roles"
          />
          <QuickLink
            to="/admin/curriculum"
            icon={<GraduationCap className="size-4" />}
            label="Curriculum"
            desc="SPPU/NPTEL topic mapping"
          />
          <QuickLink
            to="/admin/export"
            icon={<Download className="size-4" />}
            label="Export Data"
            desc="Download all user data"
          />
          <QuickLink
            to="/admin/update-price"
            icon={<RefreshCw className="size-4" />}
            label="Update Price"
            desc="Sync Paddle yearly price"
          />
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="px-5 py-3 border-b border-border flex items-center justify-between">
          <h3 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            All users ({users.length})
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-5 py-2 text-left font-mono text-[11px] text-muted-foreground font-normal">
                  Display name
                </th>
                <th className="px-5 py-2 text-left font-mono text-[11px] text-muted-foreground font-normal">
                  User ID
                </th>
                <th className="px-5 py-2 text-left font-mono text-[11px] text-muted-foreground font-normal">
                  Plan
                </th>
                <th className="px-5 py-2 text-left font-mono text-[11px] text-muted-foreground font-normal">
                  Subscription
                </th>
                <th className="px-5 py-2 text-right font-mono text-[11px] text-muted-foreground font-normal">
                  Reviews (mo)
                </th>
                <th className="px-5 py-2 text-right font-mono text-[11px] text-muted-foreground font-normal">
                  Roadmaps (day)
                </th>
                <th className="px-5 py-2 text-right font-mono text-[11px] text-muted-foreground font-normal">
                  Joined
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((u: any) => (
                <tr
                  key={u.id}
                  className="border-b border-border/60 last:border-0 hover:bg-muted/30 transition-colors"
                >
                  <td className="px-5 py-2.5 font-medium">{u.display_name}</td>
                  <td className="px-5 py-2.5 font-mono text-xs text-muted-foreground max-w-[180px] truncate">
                    {u.id}
                  </td>
                  <td className="px-5 py-2.5">
                    <span
                      className={`px-1.5 py-0.5 rounded-sm text-[11px] font-mono ${u.plan === "pro" ? "bg-accent/15 text-accent" : "bg-muted text-muted-foreground"}`}
                    >
                      {u.plan}
                    </span>
                  </td>
                  <td className="px-5 py-2.5 font-mono text-xs">
                    <span
                      className={
                        u.subscription === "active"
                          ? "text-success"
                          : u.subscription === "past_due"
                            ? "text-warning"
                            : u.subscription === "canceled"
                              ? "text-muted-foreground"
                              : "text-muted-foreground"
                      }
                    >
                      {u.subscription ?? ""}
                    </span>
                  </td>
                  <td className="px-5 py-2.5 font-mono text-xs text-right">
                    {u.reviews_this_month}
                  </td>
                  <td className="px-5 py-2.5 font-mono text-xs text-right">{u.roadmaps_today}</td>
                  <td className="px-5 py-2.5 font-mono text-xs text-muted-foreground text-right">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {users.length === 0 && (
          <div className="px-5 py-8 text-center text-sm text-muted-foreground">No users found.</div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">{icon}</span>
        <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
          {label}
        </p>
      </div>
      <p className="mt-1 font-display text-3xl">{value}</p>
    </div>
  );
}

function QuickLink({
  to,
  icon,
  label,
  desc,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
  desc: string;
}) {
  return (
    <Link
      to={to}
      className="flex items-start gap-3 rounded-lg border border-border bg-card p-4 hover:bg-accent/5 hover:border-accent/30 transition-colors"
    >
      <span className="mt-0.5 text-accent">{icon}</span>
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
    </Link>
  );
}
