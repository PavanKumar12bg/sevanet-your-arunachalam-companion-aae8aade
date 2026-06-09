import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { signImage } from "@/components/ImageUploader";
import { Phone, MessageCircle, MapPin, Navigation, Star } from "lucide-react";

export const Route = createFileRoute("/listing/$slug")({
  component: ListingDetail,
  errorComponent: ({ error }) => <div className="container py-20 text-center text-muted-foreground">{error.message}</div>,
  notFoundComponent: () => <div className="container py-20 text-center text-muted-foreground">సేవ కనుగొనబడలేదు</div>,
});

function ListingDetail() {
  const { slug } = Route.useParams();
  const [listing, setListing] = useState<any>(null);
  const [images, setImages] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("listings").select("*").eq("slug", slug).eq("status", "published").maybeSingle();
      if (!data) { setLoading(false); return; }
      setListing(data);
      const [{ data: imgs }, { data: revs }] = await Promise.all([
        supabase.from("listing_images").select("*").eq("listing_id", data.id).order("sort_order"),
        supabase.from("reviews").select("id,rating,comment,created_at,user_id").eq("listing_id", data.id).eq("status", "approved").order("created_at", { ascending: false }).limit(20),
      ]);
      const userIds = Array.from(new Set((revs ?? []).map((r: any) => r.user_id).filter((x: any): x is string => !!x)));
      const nameMap = new Map<string, string>();
      if (userIds.length) {
        const { data: profs } = await supabase.from("profiles_public" as any).select("id,full_name").in("id", userIds);
        for (const p of ((profs ?? []) as unknown as Array<{ id: string; full_name: string | null }>)) if (p.full_name) nameMap.set(p.id, p.full_name);
      }
      const signed = await Promise.all((imgs ?? []).map(async (i: any) => ({
        ...i,
        url: i.storage_path ? ((await signImage("listings", i.storage_path)) || i.url) : i.url,
      })));
      setImages(signed);
      setReviews((revs ?? []).map((r: any) => ({ ...r, profiles: { full_name: nameMap.get(r.user_id) ?? null } })));
      setLoading(false);
    })();
  }, [slug]);

  if (loading) return <div className="container mx-auto px-4 py-20"><div className="h-96 rounded-2xl bg-card/40 animate-pulse" /></div>;
  if (!listing) return <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">సేవ కనుగొనబడలేదు. <Link to="/listings" className="text-accent">తిరిగి</Link></div>;

  const gallery = [listing.cover_image, ...images.map((i) => i.url)].filter(Boolean);

  return (
    <div className="container mx-auto px-4 py-10">
      <Link to="/listings" className="text-sm text-muted-foreground hover:text-accent">← తిరిగి</Link>

      {/* Gallery */}
      <div className="mt-4 grid md:grid-cols-3 gap-3">
        <div className="md:col-span-2 aspect-[16/10] rounded-2xl overflow-hidden bg-muted">
          {gallery[0] ? <img src={gallery[0]} alt={listing.title} className="h-full w-full object-cover" /> : <div className="h-full w-full bg-gradient-flame opacity-40" />}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-1 gap-3">
          {gallery.slice(1, 3).map((src, i) => (
            <div key={i} className="aspect-square rounded-2xl overflow-hidden bg-muted"><img src={src} alt="" className="h-full w-full object-cover" /></div>
          ))}
        </div>
      </div>

      {/* Info */}
      <div className="mt-8 grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <h1 className="font-display text-4xl text-gradient-gold">{listing.title}</h1>
          {listing.address && <p className="mt-2 text-muted-foreground flex items-center gap-2"><MapPin className="h-4 w-4" />{listing.address}</p>}
          {(listing.rating_count ?? 0) > 0 && (
            <div className="mt-3 flex items-center gap-2 text-accent">
              <Star className="h-4 w-4 fill-current" />
              <span className="font-medium">{Number(listing.rating_avg).toFixed(1)}</span>
              <span className="text-xs text-muted-foreground">({listing.rating_count} reviews)</span>
            </div>
          )}
          {listing.price_range && <div className="mt-3 inline-block rounded-full bg-secondary px-3 py-1 text-sm">{listing.price_range}</div>}

          <h2 className="mt-8 font-display text-2xl text-accent">వివరణ</h2>
          <p className="mt-3 whitespace-pre-line leading-relaxed text-foreground/90">{listing.full_description || listing.short_description}</p>

          {listing.facilities?.length > 0 && (
            <>
              <h2 className="mt-8 font-display text-2xl text-accent">సౌకర్యాలు</h2>
              <ul className="mt-3 flex flex-wrap gap-2">
                {listing.facilities.map((f: string) => <li key={f} className="rounded-full border border-border bg-card px-3 py-1 text-sm">{f}</li>)}
              </ul>
            </>
          )}

          <h2 className="mt-10 font-display text-2xl text-accent">సమీక్షలు</h2>
          {reviews.length === 0 ? <p className="mt-3 text-muted-foreground text-sm">ఇంకా సమీక్షలు లేవు.</p> : (
            <ul className="mt-4 space-y-4">
              {reviews.map((r) => (
                <li key={r.id} className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{r.profiles?.full_name ?? "Devotee"}</span>
                    <span className="text-accent flex items-center gap-1"><Star className="h-3 w-3 fill-current" />{r.rating}</span>
                  </div>
                  {r.comment && <p className="mt-2 text-sm text-foreground/90">{r.comment}</p>}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Sticky actions */}
        <aside className="md:sticky md:top-24 h-fit space-y-3">
          {listing.phone && <a href={`tel:${listing.phone}`} className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-gold py-3 text-gold-foreground font-medium"><Phone className="h-4 w-4" /> కాల్</a>}
          {listing.whatsapp && <a href={`https://wa.me/${encodeURIComponent(listing.whatsapp.replace(/\D/g, ""))}`} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 rounded-2xl border border-accent bg-card py-3 font-medium"><MessageCircle className="h-4 w-4" /> WhatsApp</a>}
          {listing.latitude && listing.longitude && (
            <a href={`https://www.openstreetmap.org/?mlat=${listing.latitude}&mlon=${listing.longitude}#map=18/${listing.latitude}/${listing.longitude}`} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-card py-3 font-medium"><Navigation className="h-4 w-4" /> దారి</a>
          )}
          {listing.languages?.length > 0 && (
            <div className="rounded-2xl border border-border bg-card p-4">
              <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">భాషలు</div>
              <div className="flex flex-wrap gap-1">{listing.languages.map((l: string) => <span key={l} className="rounded-full bg-secondary px-2 py-0.5 text-xs">{l}</span>)}</div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
