import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import { logClientError, withTimeout } from "@/lib/safe-query";
import { useTranslation } from "react-i18next";
import { LanguageSelector } from "@/components/LanguageSelector";

export function SiteHeader() {
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const nav = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    const sync = async (u: User | null) => {
      setUser(u);
      if (!u) { setRoles([]); return; }
      try {
        const { data, error } = await withTimeout(supabase.from("user_roles").select("role").eq("user_id", u.id), "header roles");
        if (error) throw error;
        setRoles((data ?? []).map((r: any) => r.role));
      } catch (error) {
        logClientError("header roles", error);
        setRoles([]);
      }
    };
    supabase.auth.getSession().then(({ data }) => sync(data.session?.user ?? null)).catch((error) => logClientError("header session", error));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setTimeout(() => sync(s?.user ?? null), 0));
    return () => sub.subscription.unsubscribe();
  }, []);

  const isAdmin = roles.includes("admin") || roles.includes("super_admin");
  const isBiz = isAdmin || roles.includes("business_owner");

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) return toast.error(error.message);
    toast.success(t("nav.logout"));
    nav({ to: "/" });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-full bg-gradient-gold flex items-center justify-center font-display text-gold-foreground font-bold">ఓం</div>
          <div className="leading-tight">
            <div className="font-display text-xl text-gradient-gold">{t("brand.name")}</div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">SevaNet</div>
          </div>
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm">
          <Link to="/listings" className="hover:text-accent transition-colors">{t("nav.listings")}</Link>
          <Link to="/safety" className="hover:text-accent transition-colors">{t("nav.safety")}</Link>
          <Link to="/girivalam-tracker" className="hover:text-accent transition-colors">{t("nav.tracker")}</Link>
          <Link to="/about" className="hover:text-accent transition-colors">{t("nav.about")}</Link>
        </nav>
        <div className="flex items-center gap-2 text-sm">
          <LanguageSelector />
          {isAdmin && <Link to="/admin" className="hidden md:inline rounded-full border border-accent/40 px-3 py-1.5 text-xs hover:bg-accent/10">{t("nav.admin")}</Link>}
          {isBiz && <Link to="/business/dashboard" className="hidden md:inline rounded-full border border-accent/40 px-3 py-1.5 text-xs hover:bg-accent/10">{t("nav.business")}</Link>}
          {user ? (
            <>
              <Link to="/account" className="rounded-full border border-accent/40 px-4 py-1.5 hover:bg-accent/10">{t("nav.account")}</Link>
              <button onClick={signOut} title={t("nav.logout")} className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-muted-foreground hover:border-destructive hover:text-destructive">
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">{t("nav.logout")}</span>
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-muted-foreground hover:text-foreground">{t("nav.login")}</Link>
              <Link to="/register" className="rounded-full bg-gradient-gold px-4 py-1.5 text-gold-foreground font-medium">{t("nav.register")}</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
