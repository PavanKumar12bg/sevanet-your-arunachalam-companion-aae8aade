import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, Star } from "lucide-react";
import { logClientError, withTimeout } from "@/lib/safe-query";

export const Route = createFileRoute("/listings")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "సేవలు — సేవనెట్" },
      { name: "description", content: "అరుణాచలంలో అన్ని సేవలు ఒకే చోట." },
    ],
  }),
  validateSearch: (s: Record<string, unknown>) => ({
    category: typeof s.category === "string" ? s.category : undefined,
    q: typeof s.q === "string" ? s.q : undefined,
  }),
  component: ListingsPage,
});

type Cat = { id: string; slug: string; name_te: string };
type Listing = { id: string; title: string; slug: string; short_description: string | null; cover_image: string | null; address: string | null; rating_avg: number | null; rating_count: number | null; category_id: string | null };

function ListingsPage() {
  const { category, q } = Route.useSearch();
  const [cats, setCats] = useState<Cat[]>([]);
  const [items, setItems] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    withTimeout(supabase.from("categories").select("id,slug,name_te").eq("is_active", true).order("sort_order"), "load categories")
      .then(({ data, error }) => {
        if (error) throw error;
        setCats(data ?? []);
      })
      .catch((error) => logClientError("load categories", error));
  }, []);

  useEffect(() => {
    setLoading(true);
    (async () => {
      let qb = supabase.from("listings").select("id,title,slug,short_description,cover_image,address,rating_avg,rating_count,category_id,categories!inner(slug)").eq("status", "published").order("is_featured", { ascending: false }).limit(60);
      if (category) qb = qb.eq("categories.slug", category);
      if (q) qb = qb.or(`title.ilike.%${q}%,short_description.ilike.%${q}%`);
      try {
        const { data, error } = await withTimeout(qb, "load public listings");
        if (error) throw error;
        setItems((data as any) ?? []);
      } catch (error) {
        logClientError("load public listings", error);
        setItems([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [category, q]);

  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="font-display text-4xl text-gradient-gold">సేవలు</h1>
      <p className="text-muted-foreground mt-2">{q ? `వెతుకులాట: "${q}"` : "విభాగాన్ని ఎంచుకోండి"}</p>

      <div className="mt-6 flex flex-wrap gap-2">
        <Link to="/listings" className={`rounded-full px-4 py-1.5 text-sm border ${!category ? "bg-gradient-gold text-gold-foreground border-transparent" : "border-border hover:border-accent"}`}>అన్నీ</Link>
        {cats.map((c) => (
          <Link key={c.id} to="/listings" search={{ category: c.slug }} className={`rounded-full px-4 py-1.5 text-sm border ${category === c.slug ? "bg-gradient-gold text-gold-foreground border-transparent" : "border-border hover:border-accent"}`}>{c.name_te}</Link>
        ))}
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-64 rounded-2xl bg-card/40 animate-pulse" />)
        ) : items.length === 0 ? (
          <div className="md:col-span-3 rounded-2xl border border-border bg-card/40 p-12 text-center text-muted-foreground">
            ఈ విభాగంలో సేవలు ఇంకా అందుబాటులో లేవు.
          </div>
        ) : (
          items.map((l) => (
            <Link key={l.id} to="/listing/$slug" params={{ slug: l.slug }} className="group rounded-2xl border border-border bg-card overflow-hidden hover:border-accent transition-all hover:-translate-y-1 shadow-elegant">
              <div className="aspect-[4/3] bg-muted overflow-hidden">
                {l.cover_image ? <img src={l.cover_image} alt={l.title} onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} className="h-full w-full object-cover group-hover:scale-105 transition-transform" /> : <div className="h-full w-full bg-gradient-flame opacity-30" />}
              </div>
              <div className="p-4">
                <h3 className="font-display text-lg">{l.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{l.short_description}</p>
                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                  {l.address && <span className="flex items-center gap-1 truncate"><MapPin className="h-3 w-3" />{l.address}</span>}
                  {(l.rating_count ?? 0) > 0 && <span className="flex items-center gap-1 text-accent"><Star className="h-3 w-3 fill-current" />{Number(l.rating_avg).toFixed(1)}</span>}
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
