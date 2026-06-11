import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useRole } from "@/lib/use-role";
import { useEffect, useState } from "react";
import { LayoutDashboard, List, FolderTree, Star, Users, Briefcase, Settings, Hotel, UtensilsCrossed, Bath, ShieldAlert, Megaphone, Menu, X } from "lucide-react";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — సేవనెట్" }, { name: "robots", content: "noindex" }] }),
  ssr: false,
  component: AdminLayout,
});

type NavItem = { key: string; to: string; label: string; icon: any; exact?: boolean; search?: Record<string, string> };
const nav: NavItem[] = [
  { key: "dash", to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { key: "all", to: "/admin/listings", label: "All Listings", icon: List },
  { key: "hotels", to: "/listings", label: "Hotels", icon: Hotel, search: { category: "hotels" } },
  { key: "restaurants", to: "/listings", label: "Restaurants", icon: UtensilsCrossed, search: { category: "restaurants" } },
  { key: "toilets", to: "/listings", label: "Toilets", icon: Bath, search: { category: "toilets" } },
  { key: "cats", to: "/admin/categories", label: "Categories", icon: FolderTree },
  { key: "reviews", to: "/admin/reviews", label: "Reviews", icon: Star },
  { key: "users", to: "/admin/users", label: "Users", icon: Users },
  { key: "biz", to: "/admin/businesses", label: "Businesses", icon: Briefcase },
  { key: "safety", to: "/admin/safety", label: "Safety", icon: ShieldAlert },
  { key: "announce", to: "/admin/announcements", label: "Announcements", icon: Megaphone },
  { key: "settings", to: "/admin/settings", label: "Settings", icon: Settings },
];

function AdminLayout() {
  const { loading, userId, isAdmin } = useRole();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [drawer, setDrawer] = useState(false);

  useEffect(() => { setDrawer(false); }, [pathname]);
  useEffect(() => {
    if (!loading && !userId) navigate({ to: "/login" });
  }, [loading, userId, navigate]);

  if (loading) return <div className="py-20 text-center text-muted-foreground">లోడ్ అవుతోంది...</div>;
  if (!isAdmin) return (
    <div className="container mx-auto max-w-md py-20 text-center">
      <h1 className="font-display text-2xl text-accent">ప్రవేశ నిషేధం</h1>
      <p className="mt-2 text-sm text-muted-foreground">మీకు అడ్మిన్ అనుమతి లేదు.</p>
    </div>
  );

  const navList = (
    <nav className="flex flex-col gap-1">
      {nav.map((n) => {
        const active = n.exact ? pathname === n.to : pathname === n.to && !n.search;
        return (
          <Link key={n.key} to={n.to as any} search={n.search as any} className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm ${active ? "bg-accent/15 text-accent" : "text-foreground hover:bg-muted/50"}`}>
            <n.icon className="h-4 w-4 shrink-0" /> <span className="truncate">{n.label}</span>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="container mx-auto grid gap-4 px-3 py-4 sm:px-4 sm:py-8 lg:gap-6 lg:grid-cols-[220px_1fr]">
      <div className="flex items-center justify-between rounded-2xl border border-border bg-card p-3 lg:hidden">
        <div className="font-display text-lg text-gradient-gold">Admin</div>
        <button onClick={() => setDrawer(true)} aria-label="Open admin menu" className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border hover:border-accent">
          <Menu className="h-5 w-5" />
        </button>
      </div>

      <aside className="hidden lg:block rounded-2xl border border-border bg-card p-3 h-fit sticky top-20">
        <div className="px-2 pb-3 font-display text-lg text-gradient-gold">Admin</div>
        {navList}
      </aside>

      {drawer && (
        <>
          <div className="lg:hidden fixed inset-0 z-40 bg-background/70 backdrop-blur-sm" onClick={() => setDrawer(false)} />
          <aside className="lg:hidden fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] overflow-y-auto border-r border-border bg-card p-3 shadow-elegant animate-fade-in">
            <div className="flex items-center justify-between pb-3">
              <div className="px-2 font-display text-lg text-gradient-gold">Admin</div>
              <button onClick={() => setDrawer(false)} aria-label="Close" className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border hover:border-accent"><X className="h-4 w-4" /></button>
            </div>
            {navList}
          </aside>
        </>
      )}

      <section className="min-w-0"><ErrorBoundary label="admin"><Outlet /></ErrorBoundary></section>
    </div>
  );
}
