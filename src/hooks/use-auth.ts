import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      setLoading(false);
      if (s?.user) {
        fetchAdminRole(s.user.id);
        fetchProfile(s.user.id);
      } else {
        setIsAdmin(false);
        setAvatarUrl(null);
        setDisplayName(null);
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
      if (data.session?.user) {
        fetchAdminRole(data.session.user.id);
        fetchProfile(data.session.user.id);
      }
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

  async function fetchProfile(uid: string) {
    try {
      const { data } = await (supabase as any)
        .from("profiles")
        .select("display_name, avatar_url")
        .eq("id", uid)
        .maybeSingle();
      if (data) {
        setDisplayName(data.display_name ?? null);
        setAvatarUrl(data.avatar_url ?? null);
      }
    } catch {
      // best-effort; profile fetch is non-critical
    }
  }

  const refreshProfile = (uid: string) => fetchProfile(uid);

  return { user, session, loading, isAdmin, avatarUrl, displayName, refreshProfile };
}
