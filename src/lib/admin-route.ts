import { redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export async function requireAdminRoute() {
  if (typeof window === "undefined") return;

  const { data } = await supabase.auth.getSession();
  if (!data.session) throw redirect({ to: "/login" });

  const { data: isAdmin } = await supabase.rpc("has_role", {
    p_user_id: data.session.user.id,
    p_role: "admin",
  });

  if (!isAdmin) throw redirect({ to: "/dashboard" });
}
