import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      setLoading(false);
      if (s?.user) fetchAdminRole(s.user.id);
      else setIsAdmin(false);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
      if (data.session?.user) fetchAdminRole(data.session.user.id);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function fetchAdminRole(uid: string) {
    try {
      const { data } = await supabase.rpc("has_role", {
        p_user_id: uid,
        p_role: "admin",
      });
      setIsAdmin(!!data);
    } catch {
      setIsAdmin(false);
    }
  }

  return { user, session, loading, isAdmin };
}
