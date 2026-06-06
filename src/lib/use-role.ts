import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "super_admin" | "admin" | "business_owner" | "user";

export function useRole() {
  const [state, setState] = useState<{
    loading: boolean;
    userId: string | null;
    email: string | null;
    roles: AppRole[];
    isAdmin: boolean;
    isBusinessOwner: boolean;
  }>({ loading: true, userId: null, email: null, roles: [], isAdmin: false, isBusinessOwner: false });

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        if (mounted) setState({ loading: false, userId: null, email: null, roles: [], isAdmin: false, isBusinessOwner: false });
        return;
      }
      const { data: rows } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id);
      const roles = (rows ?? []).map((r) => r.role as AppRole);
      if (mounted) setState({
        loading: false,
        userId: data.user.id,
        email: data.user.email ?? null,
        roles,
        isAdmin: roles.includes("admin") || roles.includes("super_admin"),
        isBusinessOwner: roles.includes("business_owner") || roles.includes("admin") || roles.includes("super_admin"),
      });
    })();
    return () => { mounted = false; };
  }, []);

  return state;
}
