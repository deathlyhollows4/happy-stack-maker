import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getAdminSeats, grantAdminRole, revokeAdminRole } from "@/lib/codewise.functions";
import { supabase } from "@/integrations/supabase/client";
import { Shield, Loader2, ShieldOff, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/seats")({
  head: () => ({ meta: [{ title: "Seat Management | CodeWise" }] }),
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
  component: SeatManagement,
});

function SeatManagement() {
  const qc = useQueryClient();
  const seatsFn = useServerFn(getAdminSeats);
  const grantFn = useServerFn(grantAdminRole);
  const revokeFn = useServerFn(revokeAdminRole);

  const { data, isLoading, error } = useQuery({
    queryKey: ["adminSeats"],
    queryFn: () => seatsFn(),
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
          <p className="mt-2 text-muted-foreground">Admin privileges required.</p>
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

  const { users } = data;
  const adminCount = users.filter((u: any) => u.roles.includes("admin")).length;

  const handleGrant = async (targetUserId: string) => {
    await grantFn({ data: { targetUserId } });
    qc.invalidateQueries({ queryKey: ["adminSeats"] });
  };

  const handleRevoke = async (targetUserId: string) => {
    await revokeFn({ data: { targetUserId } });
    qc.invalidateQueries({ queryKey: ["adminSeats"] });
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-10">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
            <Shield className="size-3" /> Admin
          </p>
          <h1 className="mt-2 font-display text-5xl tracking-tight">Seat Management</h1>
          <p className="text-muted-foreground mt-2">
            {users.length} users · {adminCount} admins
          </p>
        </div>
        <Link
          to="/admin/dashboard"
          className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition"
        >
          Back to admin dashboard
        </Link>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="px-5 py-3 border-b border-border flex items-center justify-between">
          <h3 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            All users
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
                  Role
                </th>
                <th className="px-5 py-2 text-right font-mono text-[11px] text-muted-foreground font-normal">
                  Joined
                </th>
                <th className="px-5 py-2 text-right font-mono text-[11px] text-muted-foreground font-normal">
                  Actions
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
                  <td className="px-5 py-2.5 font-mono text-xs text-muted-foreground max-w-[160px] truncate">
                    {u.id}
                  </td>
                  <td className="px-5 py-2.5">
                    <div className="flex flex-wrap gap-1">
                      {u.roles.length > 0 ? (
                        u.roles.map((r: string) => (
                          <span
                            key={r}
                            className="px-1.5 py-0.5 rounded-sm bg-accent/15 text-accent text-[11px] font-mono"
                          >
                            {r}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground">&mdash;</span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-2.5 font-mono text-xs text-muted-foreground text-right">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-2.5 text-right">
                    {u.roles.includes("admin") ? (
                      <button
                        onClick={() => handleRevoke(u.id)}
                        className="inline-flex items-center gap-1.5 rounded-sm border border-destructive/30 px-2.5 py-1 text-[11px] font-mono text-destructive hover:bg-destructive/10 transition"
                      >
                        <ShieldOff className="size-3" /> Remove admin
                      </button>
                    ) : (
                      <button
                        onClick={() => handleGrant(u.id)}
                        className="inline-flex items-center gap-1.5 rounded-sm border border-border px-2.5 py-1 text-[11px] font-mono text-muted-foreground hover:text-foreground hover:bg-muted transition"
                      >
                        <ShieldCheck className="size-3" /> Make admin
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {users.length === 0 && (
          <div className="px-5 py-8 text-center text-sm text-muted-foreground">
            No users found.
          </div>
        )}
      </div>
    </div>
  );
}
