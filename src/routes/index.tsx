import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Hotel, UtensilsCrossed, Landmark, Footprints, Bath, Cross, Car, Map, Search } from "lucide-react";
import heroAsset from "@/assets/arunachalam-deities.jpeg.asset.json";
import shivaAsset from "@/assets/arunachalam-shiva.jpeg.asset.json";
import { supabase } from "@/integrations/supabase/client";
import { logClientError, withTimeout } from "@/lib/safe-query";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SevaNet – Telugu Pilgrim Companion" },
      { name: "description", content: "SevaNet (సేవనెట్) — Telugu pilgrim companion for Arunachalam: hotels, food, dharmashalas, hospitals, maps & Girivalam GPS tracker." },
    ],
  }),
  component: Home,
});

const QUICK: ReadonlyArray<{ slug: string; key: string; icon: any; href?: string }> = [
  { slug: "hotels", key: "hotels", icon: Hotel },
  { slug: "restaurants", key: "restaurants", icon: UtensilsCrossed },
  { slug: "dharmashalas", key: "dharmashalas", icon: Landmark },
  { slug: "girivalam", key: "girivalam", icon: Footprints, href: "/map" },
  { slug: "bath", key: "bath", icon: Bath },
  { slug: "hospitals", key: "hospitals", icon: Cross },
  { slug: "autos", key: "autos", icon: Car },
  { slug: "map", key: "map", icon: Map, href: "/map" },
];

type Featured = { id: string; title: string; slug: string; short_description: string | null; cover_image: string | null; rating_avg: number | null };

function Home() {
  const { t } = useTranslation();
  const [featured, setFeatured] = useState<Featured[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data, error } = await withTimeout(
          supabase
            .from("listings")
            .select("id,title,slug,short_description,cover_image,rating_avg")
            .eq("status", "published")
            .order("is_featured", { ascending: false })
            .order("created_at", { ascending: false })
            .limit(6),
          "load featured listings",
        );
        if (error) throw error;
        if (active) setFeatured(data ?? []);
      } catch (error) {
        logClientError("load featured listings", error);
        if (active) setFeatured([]);
      }
    })();
    return () => { active = false; };
  }, []);

  return (
    <>
      {/* Hero */}
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <img src={heroAsset.url} alt="అరుణాచల దేవతలు" className="sn-hero-bg h-full w-full object-cover opacity-50" />
          <div className="absolute inset-0 bg-gradient-hero" />
        </div>
        <div className="container mx-auto px-4 pt-20 pb-16 md:pt-32 md:pb-24 text-center">
          <div className="sn-reveal sn-reveal-1 inline-block rounded-full border border-accent/40 bg-background/40 px-4 py-1 text-xs tracking-widest text-accent backdrop-blur">{t("home.badge")}</div>
          <h1 className="sn-reveal sn-reveal-2 mt-6 font-display text-5xl md:text-7xl leading-[1.05] text-gradient-gold">{t("brand.name")}</h1>
          <p className="sn-reveal sn-reveal-2 mt-4 text-lg md:text-xl text-foreground/90 max-w-2xl mx-auto">{t("brand.tagline")}</p>
          <p className="sn-reveal sn-reveal-3 mt-2 text-sm text-muted-foreground max-w-xl mx-auto">{t("home.subhead")}</p>

          <form
            onSubmit={(e) => { e.preventDefault(); window.location.href = `/listings?q=${encodeURIComponent(q)}`; }}
            className="sn-reveal sn-reveal-3 mt-8 mx-auto max-w-xl flex items-center gap-2 rounded-full border border-accent/40 bg-card/70 backdrop-blur p-1.5 shadow-elegant"
          >
            <Search className="h-5 w-5 ml-3 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("home.searchPlaceholder")}
              className="flex-1 bg-transparent py-2 outline-none placeholder:text-muted-foreground"
            />
            <button type="submit" className="rounded-full bg-gradient-gold px-5 py-2 text-sm font-medium text-gold-foreground">{t("home.search")}</button>
          </form>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="container mx-auto px-4 -mt-8 relative z-10">
        <div className="grid grid-cols-4 md:grid-cols-8 gap-3 sn-reveal sn-reveal-4">
          {QUICK.map(({ slug, key, icon: Icon, href }) => (
            <Link
              key={slug}
              to={href ?? "/listings"}
              search={href ? undefined : { category: slug } as any}
              className="group flex flex-col items-center gap-2 rounded-2xl border border-border bg-card/60 backdrop-blur px-2 py-4 hover:border-accent hover:bg-card transition-all hover:-translate-y-0.5"
            >
              <div className="h-11 w-11 rounded-xl bg-gradient-flame/80 flex items-center justify-center group-hover:shadow-glow transition-shadow">
                <Icon className="h-5 w-5 text-gold" />
              </div>
              <span className="text-xs text-center font-medium">{t(`quick.${key}`)}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Girivalam Tracker feature card */}
      <section className="container mx-auto px-4 pt-12">
        <Link
          to="/girivalam-tracker"
          className="block rounded-3xl border-2 border-accent/40 bg-card/60 backdrop-blur p-6 md:p-8 hover:border-accent hover:-translate-y-0.5 transition-all shadow-elegant group"
        >
          <div className="flex items-start gap-4">
            <div className="h-14 w-14 shrink-0 rounded-2xl bg-gradient-gold flex items-center justify-center text-2xl shadow-glow group-hover:scale-110 transition-transform">🕉️</div>
            <div className="flex-1">
              <h3 className="font-display text-2xl md:text-3xl text-gradient-gold">{t("home.trackerTitle")}</h3>
              <p className="mt-2 text-sm md:text-base text-muted-foreground">{t("home.trackerDesc")}</p>
            </div>
            <div className="text-accent text-2xl">→</div>
          </div>
        </Link>
      </section>

      {/* Featured */}
      <section className="container mx-auto px-4 py-16">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="font-display text-3xl text-accent">{t("home.featured")}</h2>
            <p className="text-muted-foreground text-sm mt-1">{t("home.featuredSub")}</p>
          </div>
          <Link to="/listings" className="text-sm text-accent hover:underline">{t("home.viewAll")}</Link>
        </div>
        {featured.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card/40 p-12 text-center text-muted-foreground">
            {t("home.noListings")}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {featured.map((l) => (
              <Link key={l.id} to="/listing/$slug" params={{ slug: l.slug }} className="group rounded-2xl border border-border bg-card overflow-hidden hover:border-accent transition-all hover:-translate-y-1 shadow-elegant">
                <div className="aspect-[4/3] bg-muted overflow-hidden">
                  {l.cover_image
                    ? <img src={l.cover_image} alt={l.title} onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} className="h-full w-full object-cover group-hover:scale-105 transition-transform" />
                    : <div className="h-full w-full bg-gradient-flame opacity-30" />}
                </div>
                <div className="p-4">
                  <h3 className="font-display text-lg">{l.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{l.short_description}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Temple section */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 gap-8 items-center rounded-3xl border border-accent/30 bg-card/50 overflow-hidden">
          <div className="aspect-[4/3] md:aspect-auto md:h-full">
            <img src={shivaAsset.url} alt="అరుణాచలేశ్వర" className="h-full w-full object-cover" />
          </div>
          <div className="p-8 md:p-12">
            <div className="text-xs tracking-widest text-accent uppercase">{t("home.templeKicker")}</div>
            <h2 className="mt-3 font-display text-3xl md:text-4xl text-gradient-gold">{t("home.templeTitle")}</h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">{t("home.templeBody")}</p>
            <Link to="/map" className="mt-6 inline-block rounded-full bg-gradient-gold px-5 py-2 text-sm font-medium text-gold-foreground">{t("home.templeCta")}</Link>
          </div>
        </div>
      </section>
    </>
  );
}
