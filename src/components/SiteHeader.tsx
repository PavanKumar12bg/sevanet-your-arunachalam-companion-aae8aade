import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import { LogOut, Menu, X } from "lucide-react";
import { toast } from "sonner";
import { logClientError, withTimeout } from "@/lib/safe-query";
import { useTranslation } from "react-i18next";
import { LanguageSelector } from "@/components/LanguageSelector";

export function SiteHeader() {
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const nav = useNavigate();
  const { t } = useTranslation();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => { setOpen(false); }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

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
    setOpen(false);
    nav({ to: "/" });
  };

  const navLinks = (
    <>
      <Link to="/listings" className="hover:text-accent transition-colors">{t("nav.listings")}</Link>
      <Link to="/safety" className="hover:text-accent transition-colors">{t("nav.safety")}</Link>
      <Link to="/girivalam-tracker" className="hover:text-accent transition-colors">{t("nav.tracker")}</Link>
      <Link to="/about" className="hover:text-accent transition-colors">{t("nav.about")}</Link>
    </>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-xl pt-[env(safe-area-inset-top)]">
      <div className="container mx-auto flex h-16 items-center justify-between gap-2 px-3 sm:px-4">
        <Link to="/" className="flex min-w-0 items-center gap-2">
          <div className="h-8 w-8 sm:h-9 sm:w-9 shrink-0 rounded-full bg-gradient-gold flex items-center justify-center font-display text-gold-foreground font-bold text-sm">ఓం</div>
          <div className="leading-tight min-w-0">
            <div className="font-display text-lg sm:text-xl text-gradient-gold truncate">{t("brand.name")}</div>
            <div className="hidden sm:block text-[10px] uppercase tracking-widest text-muted-foreground">SevaNet</div>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-6 text-sm">{navLinks}</nav>

        <div className="flex items-center gap-1.5 sm:gap-2 text-sm">
          <LanguageSelector />
          {isAdmin && <Link to="/admin" className="hidden lg:inline rounded-full border border-accent/40 px-3 py-1.5 text-xs hover:bg-accent/10">{t("nav.admin")}</Link>}
          {isBiz && <Link to="/business/dashboard" className="hidden lg:inline rounded-full border border-accent/40 px-3 py-1.5 text-xs hover:bg-accent/10">{t("nav.business")}</Link>}
          {user ? (
            <>
              <Link to="/account" className="hidden lg:inline rounded-full border border-accent/40 px-4 py-1.5 hover:bg-accent/10">{t("nav.account")}</Link>
              <button onClick={signOut} title={t("nav.logout")} aria-label={t("nav.logout")} className="hidden lg:inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-muted-foreground hover:border-destructive hover:text-destructive">
                <LogOut className="h-4 w-4" />
                <span>{t("nav.logout")}</span>
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="hidden lg:inline text-muted-foreground hover:text-foreground">{t("nav.login")}</Link>
              <Link to="/register" className="hidden lg:inline rounded-full bg-gradient-gold px-4 py-1.5 text-gold-foreground font-medium">{t("nav.register")}</Link>
            </>
          )}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
            aria-expanded={open}
            className="lg:hidden inline-flex h-11 w-11 items-center justify-center rounded-full border border-border hover:border-accent"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <>
          <div className="lg:hidden fixed inset-0 top-16 z-30 bg-background/70 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="lg:hidden fixed inset-x-0 top-16 z-40 max-h-[calc(100vh-4rem)] overflow-y-auto border-b border-border bg-background shadow-elegant animate-fade-in">
            <nav className="container mx-auto flex flex-col px-4 py-4 text-base">
              <Link to="/listings" className="rounded-lg px-3 py-3 hover:bg-accent/10">{t("nav.listings")}</Link>
              <Link to="/safety" className="rounded-lg px-3 py-3 hover:bg-accent/10">{t("nav.safety")}</Link>
              <Link to="/girivalam-tracker" className="rounded-lg px-3 py-3 hover:bg-accent/10">{t("nav.tracker")}</Link>
              <Link to="/about" className="rounded-lg px-3 py-3 hover:bg-accent/10">{t("nav.about")}</Link>
              {isAdmin && <Link to="/admin" className="rounded-lg px-3 py-3 hover:bg-accent/10 text-accent">{t("nav.admin")}</Link>}
              {isBiz && <Link to="/business/dashboard" className="rounded-lg px-3 py-3 hover:bg-accent/10 text-accent">{t("nav.business")}</Link>}
              <div className="my-2 border-t border-border" />
              {user ? (
                <>
                  <Link to="/account" className="rounded-lg px-3 py-3 hover:bg-accent/10">{t("nav.account")}</Link>
                  <button onClick={signOut} className="flex items-center gap-2 rounded-lg px-3 py-3 text-left text-destructive hover:bg-destructive/10">
                    <LogOut className="h-4 w-4" /> {t("nav.logout")}
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="rounded-lg px-3 py-3 hover:bg-accent/10">{t("nav.login")}</Link>
                  <Link to="/register" className="mt-2 rounded-full bg-gradient-gold px-4 py-3 text-center text-gold-foreground font-medium">{t("nav.register")}</Link>
                </>
              )}
            </nav>
          </div>
        </>
      )}
    </header>
  );
}
