import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "super_admin" | "admin" | "business_owner" | "user";

type State = {
  loading: boolean;
  userId: string | null;
  email: string | null;
  roles: AppRole[];
  isAdmin: boolean;
  isBusinessOwner: boolean;
};

const empty: State = { loading: true, userId: null, email: null, roles: [], isAdmin: false, isBusinessOwner: false };

export function useRole() {
  const [state, setState] = useState<State>(empty);

  useEffect(() => {
    let mounted = true;
    let settled = false;
    const finish = (next: State) => { if (mounted) { settled = true; setState(next); } };

    const loadRoles = async (userId: string, email: string | null) => {
      try {
        const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
        const roles = (data ?? []).map((r) => r.role as AppRole);
        finish({
          loading: false, userId, email, roles,
          isAdmin: roles.includes("admin") || roles.includes("super_admin"),
          isBusinessOwner: roles.includes("business_owner") || roles.includes("admin") || roles.includes("super_admin"),
        });
      } catch {
        finish({ loading: false, userId, email, roles: [], isAdmin: false, isBusinessOwner: false });
      }
    };

    supabase.auth.getSession().then(({ data }) => {
      const s = data.session;
      if (!s) return finish({ ...empty, loading: false });
      loadRoles(s.user.id, s.user.email ?? null);
    }).catch(() => finish({ ...empty, loading: false }));

    // Safety: never stay loading forever
    const timer = setTimeout(() => {
      if (!settled && mounted) setState((p) => ({ ...p, loading: false }));
    }, 4000);

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) finish({ ...empty, loading: false });
      else loadRoles(session.user.id, session.user.email ?? null);
    });

    return () => { mounted = false; clearTimeout(timer); sub.subscription.unsubscribe(); };
  }, []);

  return state;
}
