import { useEffect, useRef, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const currentUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    const applySession = (s: Session | null) => {
      const nextUser = s?.user ?? null;
      currentUserIdRef.current = nextUser?.id ?? null;
      setSession(s);
      setUser(nextUser);
      setLoading(false);
      setIsAdmin(false);
      setAvatarUrl(null);
      setDisplayName(null);

      if (nextUser) {
        fetchAdminRole(nextUser.id);
        fetchProfile(nextUser.id);
      }
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      applySession(s);
    });
    supabase.auth.getSession().then(({ data }) => {
      applySession(data.session);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function fetchAdminRole(uid: string) {
    try {
      const { data } = await supabase.rpc("has_role", {
        p_user_id: uid,
        p_role: "admin",
      });
      if (currentUserIdRef.current !== uid) return;
      setIsAdmin(!!data);
    } catch {
      if (currentUserIdRef.current !== uid) return;
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
      if (currentUserIdRef.current !== uid) return;
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
