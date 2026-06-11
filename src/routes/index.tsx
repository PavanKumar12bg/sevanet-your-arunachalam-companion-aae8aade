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
        <div className="container mx-auto px-4 pt-14 pb-12 md:pt-24 md:pb-20 text-center">
          <div className="sn-reveal sn-reveal-1 inline-block rounded-full border border-accent/40 bg-background/40 px-4 py-1 text-[11px] tracking-[0.25em] uppercase text-accent backdrop-blur">{t("home.badge")}</div>
          <h1 className="sn-reveal sn-reveal-2 mt-5 font-display text-[2.75rem] leading-[1.05] md:text-7xl text-gradient-gold">{t("brand.name")}</h1>
          <p className="sn-reveal sn-reveal-2 mt-3 text-base md:text-xl text-foreground/90 max-w-2xl mx-auto">{t("brand.tagline")}</p>
          <p className="sn-reveal sn-reveal-3 mt-2 text-sm text-muted-foreground max-w-xl mx-auto">{t("home.subhead")}</p>

          <form
            onSubmit={(e) => { e.preventDefault(); window.location.href = `/listings?q=${encodeURIComponent(q)}`; }}
            className="sn-reveal sn-reveal-3 mt-7 mx-auto max-w-xl flex items-center gap-2 rounded-full glass-strong p-1.5 shadow-elegant"
          >
            <Search className="h-5 w-5 ml-3 text-muted-foreground shrink-0" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("home.searchPlaceholder")}
              className="flex-1 min-w-0 bg-transparent py-2 outline-none placeholder:text-muted-foreground text-sm"
            />
            <button type="submit" className="shrink-0 rounded-full bg-gradient-gold px-4 sm:px-5 py-2 text-sm font-medium text-gold-foreground">{t("home.search")}</button>
          </form>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="container mx-auto px-4 -mt-6 relative z-10">
        <div className="grid grid-cols-4 md:grid-cols-8 gap-2.5 sm:gap-3 sn-reveal sn-reveal-4">
          {QUICK.map(({ slug, key, icon: Icon, href }) => (
            <Link
              key={slug}
              to={href ?? "/listings"}
              search={href ? undefined : { category: slug } as any}
              className="group flex flex-col items-center gap-2 rounded-2xl glass px-2 py-3.5 hover:border-accent transition-all hover:-translate-y-0.5"
            >
              <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-gradient-flame/80 flex items-center justify-center group-hover:shadow-glow transition-shadow">
                <Icon className="h-5 w-5 text-gold" />
              </div>
              <span className="text-[11px] sm:text-xs text-center font-medium leading-tight">{t(`quick.${key}`)}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Girivalam Tracker feature card */}
      <section className="container mx-auto px-4 pt-10 md:pt-14">
        <Link
          to="/girivalam-tracker"
          className="block rounded-3xl glass-strong p-5 md:p-8 hover:-translate-y-0.5 transition-all shadow-elegant group"
        >
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 md:h-14 md:w-14 shrink-0 rounded-2xl bg-gradient-gold flex items-center justify-center text-2xl shadow-glow group-hover:scale-110 transition-transform">🕉️</div>
            <div className="flex-1 min-w-0">
              <h3 className="font-display text-xl md:text-3xl text-gradient-gold leading-tight">{t("home.trackerTitle")}</h3>
              <p className="mt-1.5 text-sm md:text-base text-muted-foreground line-clamp-2 md:line-clamp-none">{t("home.trackerDesc")}</p>
            </div>
            <div className="text-accent text-2xl shrink-0">→</div>
          </div>
        </Link>
      </section>

      {/* Featured */}
      <section className="container mx-auto px-4 py-12 md:py-16">
        <div className="flex items-end justify-between mb-5 md:mb-6 gap-3">
          <div className="min-w-0">
            <div className="text-[11px] tracking-[0.25em] uppercase text-accent/80">{t("home.featuredSub")}</div>
            <h2 className="font-display text-2xl md:text-4xl text-accent mt-1 truncate">{t("home.featured")}</h2>
          </div>
          <Link to="/listings" className="text-sm text-accent hover:underline shrink-0">{t("home.viewAll")} →</Link>
        </div>
        {featured.length === 0 ? (
          <div className="rounded-2xl glass p-10 text-center text-muted-foreground">
            {t("home.noListings")}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {featured.map((l) => (
              <Link key={l.id} to="/listing/$slug" params={{ slug: l.slug }} className="group rounded-2xl glass overflow-hidden hover:border-accent transition-all hover:-translate-y-1 shadow-elegant flex flex-col">
                <div className="aspect-[4/3] bg-muted overflow-hidden">
                  {l.cover_image
                    ? <img src={l.cover_image} alt={l.title} onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} className="h-full w-full object-cover group-hover:scale-105 transition-transform" />
                    : <div className="h-full w-full bg-gradient-flame opacity-30" />}
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <h3 className="font-display text-lg leading-snug">{l.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{l.short_description}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Temple section */}
      <section className="container mx-auto px-4 pb-16 md:pb-20">
        <div className="grid md:grid-cols-2 gap-0 items-stretch rounded-3xl glass overflow-hidden">
          <div className="aspect-[4/3] md:aspect-auto md:h-full">
            <img src={shivaAsset.url} alt="అరుణాచలేశ్వర" className="h-full w-full object-cover" />
          </div>
          <div className="p-6 sm:p-8 md:p-12 flex flex-col justify-center">
            <div className="text-[11px] tracking-[0.25em] text-accent uppercase">{t("home.templeKicker")}</div>
            <h2 className="mt-3 font-display text-2xl md:text-4xl text-gradient-gold leading-tight">{t("home.templeTitle")}</h2>
            <p className="mt-4 text-sm md:text-base text-muted-foreground leading-relaxed">{t("home.templeBody")}</p>
            <Link to="/map" className="mt-6 inline-block self-start rounded-full bg-gradient-gold px-5 py-2 text-sm font-medium text-gold-foreground">{t("home.templeCta")}</Link>
          </div>
        </div>
      </section>
    </>
  );
}
