import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Hotel, UtensilsCrossed, Landmark, Footprints, Bath, Cross, Car, Map, Search } from "lucide-react";
import heroAsset from "@/assets/arunachalam-deities.jpeg.asset.json";
import shivaAsset from "@/assets/arunachalam-shiva.jpeg.asset.json";
import { supabase } from "@/integrations/supabase/client";
import { logClientError, withTimeout } from "@/lib/safe-query";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "సేవనెట్ — తెలుగు భక్తుల కోసం అరుణాచల సేవా వేదిక" },
      { name: "description", content: "అరుణాచల యాత్రకు హోటల్స్, భోజనం, ధర్మశాలలు, మ్యాప్‌లు." },
    ],
  }),
  component: Home,
});

const QUICK = [
  { slug: "hotels", te: "హోటల్స్", icon: Hotel },
  { slug: "restaurants", te: "భోజనం", icon: UtensilsCrossed },
  { slug: "dharmashalas", te: "ధర్మశాలలు", icon: Landmark },
  { slug: "girivalam", te: "గిరివలం", icon: Footprints, href: "/map" },
  { slug: "bath", te: "స్నానం", icon: Bath },
  { slug: "hospitals", te: "హాస్పిటల్", icon: Cross },
  { slug: "autos", te: "ఆటో", icon: Car },
  { slug: "map", te: "మ్యాప్", icon: Map, href: "/map" },
];

type Featured = { id: string; title: string; slug: string; short_description: string | null; cover_image: string | null; rating_avg: number | null };

function Home() {
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
          <img src={heroAsset.url} alt="అరుణాచల దేవతలు" className="h-full w-full object-cover opacity-50" />
          <div className="absolute inset-0 bg-gradient-hero" />
        </div>
        <div className="container mx-auto px-4 pt-20 pb-16 md:pt-32 md:pb-24 text-center">
          <div className="inline-block rounded-full border border-accent/40 bg-background/40 px-4 py-1 text-xs tracking-widest text-accent backdrop-blur">ఓం నమః శివాయ · అరుణాచలం</div>
          <h1 className="mt-6 font-display text-5xl md:text-7xl leading-[1.05] text-gradient-gold">సేవనెట్</h1>
          <p className="mt-4 text-lg md:text-xl text-foreground/90 max-w-2xl mx-auto">తెలుగు భక్తుల కోసం అరుణాచల సేవా వేదిక</p>
          <p className="mt-2 text-sm text-muted-foreground max-w-xl mx-auto">హోటల్స్ · భోజనం · ధర్మశాలలు · దవాఖానాలు · మ్యాప్‌లు — ఒకే చోట</p>

          <form
            onSubmit={(e) => { e.preventDefault(); window.location.href = `/listings?q=${encodeURIComponent(q)}`; }}
            className="mt-8 mx-auto max-w-xl flex items-center gap-2 rounded-full border border-accent/40 bg-card/70 backdrop-blur p-1.5 shadow-elegant"
          >
            <Search className="h-5 w-5 ml-3 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="హోటల్, రెస్టారెంట్, ఆలయం..."
              className="flex-1 bg-transparent py-2 outline-none placeholder:text-muted-foreground"
            />
            <button type="submit" className="rounded-full bg-gradient-gold px-5 py-2 text-sm font-medium text-gold-foreground">వెతకండి</button>
          </form>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="container mx-auto px-4 -mt-8 relative z-10">
        <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
          {QUICK.map(({ slug, te, icon: Icon, href }) => (
            <Link
              key={slug}
              to={href ?? "/listings"}
              search={href ? undefined : { category: slug } as any}
              className="group flex flex-col items-center gap-2 rounded-2xl border border-border bg-card/60 backdrop-blur px-2 py-4 hover:border-accent hover:bg-card transition-all hover:-translate-y-0.5"
            >
              <div className="h-11 w-11 rounded-xl bg-gradient-flame/80 flex items-center justify-center group-hover:shadow-glow transition-shadow">
                <Icon className="h-5 w-5 text-gold" />
              </div>
              <span className="text-xs text-center font-medium">{te}</span>
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
              <h3 className="font-display text-2xl md:text-3xl text-gradient-gold">గిరివలం GPS ట్రాకర్</h3>
              <p className="mt-2 text-sm md:text-base text-muted-foreground">అరుణాచల గిరివలం యాత్రను GPS ద్వారా ప్రత్యక్షంగా ట్రాక్ చేయండి.</p>
            </div>
            <div className="text-accent text-2xl">→</div>
          </div>
        </Link>
      </section>

      {/* Featured */}
      <section className="container mx-auto px-4 py-16">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="font-display text-3xl text-accent">ప్రముఖ సేవలు</h2>
            <p className="text-muted-foreground text-sm mt-1">భక్తుల ద్వారా ఎక్కువగా ఎంచుకున్నవి</p>
          </div>
          <Link to="/listings" className="text-sm text-accent hover:underline">అన్నీ చూడండి →</Link>
        </div>
        {featured.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card/40 p-12 text-center text-muted-foreground">
            ఇంకా సేవలు జోడించబడలేదు. త్వరలో అందుబాటులో ఉంటాయి.
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
            <div className="text-xs tracking-widest text-accent uppercase">అరుణాచల మహాత్మ్యం</div>
            <h2 className="mt-3 font-display text-3xl md:text-4xl text-gradient-gold">అగ్ని లింగ క్షేత్రం</h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              పంచభూత లింగాలలో అగ్ని తత్త్వం అరుణాచలంలో వెలసింది. గిరివలం చేస్తే జన్మ జన్మ పాపాలు తొలగిపోతాయని భక్తుల విశ్వాసం.
            </p>
            <Link to="/map" className="mt-6 inline-block rounded-full bg-gradient-gold px-5 py-2 text-sm font-medium text-gold-foreground">గిరివలం మ్యాప్</Link>
          </div>
        </div>
      </section>
    </>
  );
}
