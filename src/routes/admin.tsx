import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useRole } from "@/lib/use-role";
import { useEffect } from "react";
import { LayoutDashboard, List, FolderTree, Star, Users, Briefcase, Settings, Hotel, UtensilsCrossed, Bath, Music, Search } from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — సేవనెట్" }, { name: "robots", content: "noindex" }] }),
  ssr: false,
  component: AdminLayout,
});

const nav = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/listings", label: "All Listings", icon: List },
  { to: "/admin/listings", label: "Hotels", icon: Hotel, search: { cat: "hotels" } },
  { to: "/admin/listings", label: "Restaurants", icon: UtensilsCrossed, search: { cat: "restaurants" } },
  { to: "/admin/listings", label: "Toilets", icon: Bath, search: { cat: "toilets" } },
  { to: "/admin/categories", label: "Categories", icon: FolderTree },
  { to: "/admin/reviews", label: "Reviews", icon: Star },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/businesses", label: "Businesses", icon: Briefcase },
  { to: "/admin/settings", label: "Settings", icon: Settings },
];

function AdminLayout() {
  const { loading, userId, isAdmin } = useRole();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

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

  return (
    <div className="container mx-auto grid gap-6 px-4 py-8 lg:grid-cols-[220px_1fr]">
      <aside className="rounded-2xl border border-border bg-card p-3">
        <div className="px-2 pb-3 font-display text-lg text-gradient-gold">Admin</div>
        <nav className="flex flex-col gap-1">
          {nav.map((n) => {
            const active = n.exact ? pathname === n.to : pathname.startsWith(n.to);
            return (
              <Link key={n.to} to={n.to} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${active ? "bg-accent/15 text-accent" : "text-foreground hover:bg-muted/50"}`}>
                <n.icon className="h-4 w-4" /> {n.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <section className="min-w-0"><Outlet /></section>
    </div>
  );
}
