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

    const sync = async (userId: string | null, email: string | null) => {
      if (!userId) {
        if (mounted) setState({ ...empty, loading: false });
        return;
      }
      const { data: rows } = await supabase.from("user_roles").select("role").eq("user_id", userId);
      const roles = (rows ?? []).map((r) => r.role as AppRole);
      if (mounted) setState({
        loading: false,
        userId,
        email,
        roles,
        isAdmin: roles.includes("admin") || roles.includes("super_admin"),
        isBusinessOwner: roles.includes("business_owner") || roles.includes("admin") || roles.includes("super_admin"),
      });
    };

    // Initial — getSession hydrates from storage synchronously after load
    supabase.auth.getSession().then(({ data }) => {
      sync(data.session?.user.id ?? null, data.session?.user.email ?? null);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      sync(session?.user.id ?? null, session?.user.email ?? null);
    });

    return () => { mounted = false; sub.subscription.unsubscribe(); };
  }, []);

  return state;
}
