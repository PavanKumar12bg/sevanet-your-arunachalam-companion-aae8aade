import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { slugify } from "@/lib/utils";
import { ImageUploader, type UploadedImage } from "./ImageUploader";
import { logClientError, withTimeout } from "@/lib/safe-query";

export interface ListingFormData {
  id?: string;
  title: string;
  slug: string;
  category_id: string | null;
  short_description: string;
  full_description: string;
  address: string;
  phone: string;
  whatsapp: string;
  price_range: string;
  latitude: number | null;
  longitude: number | null;
  facilities: string;
  languages: string;
  cover_image: string;
  seo_title: string;
  seo_description: string;
  is_featured: boolean;
  status: "draft" | "pending" | "published" | "rejected" | "archived";
}

const empty: ListingFormData = {
  title: "", slug: "", category_id: null, short_description: "", full_description: "",
  address: "", phone: "", whatsapp: "", price_range: "", latitude: null, longitude: null,
  facilities: "", languages: "Telugu, English", cover_image: "", seo_title: "", seo_description: "",
  is_featured: false, status: "pending",
};

interface Props {
  userId: string;
  isAdmin: boolean;
  listingId?: string;
  onSaved: (id: string) => void;
}

export function ListingForm({ userId, isAdmin, listingId, onSaved }: Props) {
  const [form, setForm] = useState<ListingFormData>(empty);
  const [cats, setCats] = useState<{ id: string; name_te: string; name_en: string }[]>([]);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [loading, setLoading] = useState(!!listingId);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from("categories").select("id,name_te,name_en").eq("is_active", true).order("sort_order").then(({ data }) => setCats(data ?? []));
  }, []);

  useEffect(() => {
    if (!listingId) return;
    (async () => {
      try {
        const [{ data: l, error: listingError }, { data: imgs, error: imageError }] = await Promise.all([
          withTimeout(supabase.from("listings").select("*").eq("id", listingId).maybeSingle(), "load listing editor"),
          withTimeout(supabase.from("listing_images").select("url,storage_path").eq("listing_id", listingId).order("sort_order"), "load listing images"),
        ]);
        if (listingError || imageError) throw listingError || imageError;
        if (l) {
          setForm({
            id: l.id, title: l.title, slug: l.slug, category_id: l.category_id,
            short_description: l.short_description ?? "", full_description: l.full_description ?? "",
            address: l.address ?? "", phone: l.phone ?? "", whatsapp: l.whatsapp ?? "",
            price_range: l.price_range ?? "", latitude: l.latitude, longitude: l.longitude,
            facilities: (l.facilities ?? []).join(", "), languages: (l.languages ?? []).join(", "),
            cover_image: l.cover_image ?? "", seo_title: l.seo_title ?? "", seo_description: l.seo_description ?? "",
            is_featured: l.is_featured, status: l.status,
          });
        }
        const resolved = await Promise.all(
          (imgs ?? []).filter((i) => i.storage_path).map(async (i) => ({
            url: (await signImage("listings", i.storage_path!)) || i.url,
            storage_path: i.storage_path!,
          }))
        );
        setImages(resolved);
      } catch (error) {
        logClientError("load listing editor", error);
        toast.error("Listing could not be loaded. Please refresh and try again.");
      } finally {
        setLoading(false);
      }
    })();
  }, [listingId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload: any = {
      title: form.title,
      slug: form.slug || slugify(form.title),
      category_id: form.category_id,
      short_description: form.short_description,
      full_description: form.full_description,
      address: form.address,
      phone: form.phone,
      whatsapp: form.whatsapp,
      price_range: form.price_range,
      latitude: form.latitude,
      longitude: form.longitude,
      facilities: form.facilities.split(",").map((s) => s.trim()).filter(Boolean),
      languages: form.languages.split(",").map((s) => s.trim()).filter(Boolean),
      cover_image: form.cover_image || images[0]?.url || null,
      seo_title: form.seo_title,
      seo_description: form.seo_description,
      is_featured: isAdmin ? form.is_featured : false,
      status: isAdmin ? form.status : "pending",
      owner_id: userId,
    };

    let savedId = listingId;
    if (listingId) {
      const { error } = await supabase.from("listings").update(payload).eq("id", listingId);
      if (error) { setSaving(false); return toast.error(error.message); }
    } else {
      const { data, error } = await supabase.from("listings").insert(payload).select("id").maybeSingle();
      if (error || !data) { setSaving(false); return toast.error(error?.message || "Save failed"); }
      savedId = data.id;
    }

    // Sync images: delete existing rows then re-insert from current state
    if (savedId) {
      await supabase.from("listing_images").delete().eq("listing_id", savedId);
      if (images.length) {
        await supabase.from("listing_images").insert(images.map((img, i) => ({
          listing_id: savedId!, url: img.url, storage_path: img.storage_path, sort_order: i,
        })));
      }
    }

    setSaving(false);
    toast.success("సేవ్ చేయబడింది");
    if (savedId) onSaved(savedId);
  };

  if (loading) return <div className="py-10 text-center text-muted-foreground">లోడ్ అవుతోంది...</div>;

  const input = "w-full rounded-lg border border-input bg-background px-3 py-2 outline-none focus:border-accent";

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-sm font-medium">పేరు *</label>
          <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value, slug: form.slug || slugify(e.target.value) })} className={input + " mt-1"} />
        </div>
        <div>
          <label className="text-sm font-medium">Slug</label>
          <input value={form.slug} onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })} className={input + " mt-1"} />
        </div>
        <div>
          <label className="text-sm font-medium">విభాగం *</label>
          <select required value={form.category_id ?? ""} onChange={(e) => setForm({ ...form, category_id: e.target.value || null })} className={input + " mt-1"}>
            <option value="">— ఎంచుకోండి —</option>
            {cats.map((c) => <option key={c.id} value={c.id}>{c.name_te} ({c.name_en})</option>)}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium">ధర పరిధి</label>
          <input value={form.price_range} onChange={(e) => setForm({ ...form, price_range: e.target.value })} placeholder="₹500 - ₹2000" className={input + " mt-1"} />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium">సంక్షిప్త వివరణ</label>
        <textarea rows={2} value={form.short_description} onChange={(e) => setForm({ ...form, short_description: e.target.value })} className={input + " mt-1"} />
      </div>
      <div>
        <label className="text-sm font-medium">పూర్తి వివరణ</label>
        <textarea rows={6} value={form.full_description} onChange={(e) => setForm({ ...form, full_description: e.target.value })} className={input + " mt-1"} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-sm font-medium">చిరునామా</label>
          <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className={input + " mt-1"} />
        </div>
        <div>
          <label className="text-sm font-medium">ఫోన్</label>
          <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={input + " mt-1"} />
        </div>
        <div>
          <label className="text-sm font-medium">WhatsApp</label>
          <input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} className={input + " mt-1"} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium">అక్షాంశం</label>
            <input type="number" step="any" value={form.latitude ?? ""} onChange={(e) => setForm({ ...form, latitude: e.target.value ? Number(e.target.value) : null })} className={input + " mt-1"} />
          </div>
          <div>
            <label className="text-sm font-medium">రేఖాంశం</label>
            <input type="number" step="any" value={form.longitude ?? ""} onChange={(e) => setForm({ ...form, longitude: e.target.value ? Number(e.target.value) : null })} className={input + " mt-1"} />
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-sm font-medium">సదుపాయాలు (కామాతో వేరు చేయండి)</label>
          <input value={form.facilities} onChange={(e) => setForm({ ...form, facilities: e.target.value })} placeholder="AC, Parking, Wi-Fi" className={input + " mt-1"} />
        </div>
        <div>
          <label className="text-sm font-medium">భాషలు</label>
          <input value={form.languages} onChange={(e) => setForm({ ...form, languages: e.target.value })} className={input + " mt-1"} />
        </div>
      </div>

      <ImageUploader bucket="listings" userId={userId} value={images} onChange={setImages} max={10} />

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-sm font-medium">SEO Title</label>
          <input value={form.seo_title} onChange={(e) => setForm({ ...form, seo_title: e.target.value })} className={input + " mt-1"} />
        </div>
        <div>
          <label className="text-sm font-medium">SEO Description</label>
          <input value={form.seo_description} onChange={(e) => setForm({ ...form, seo_description: e.target.value })} className={input + " mt-1"} />
        </div>
      </div>

      {isAdmin && (
        <div className="grid gap-4 rounded-lg border border-accent/30 bg-accent/5 p-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium">స్థితి</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as any })} className={input + " mt-1"}>
              <option value="draft">Draft</option>
              <option value="pending">Pending</option>
              <option value="published">Published</option>
              <option value="rejected">Rejected</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <label className="mt-7 flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} />
            ఫీచర్డ్ చేయండి
          </label>
        </div>
      )}

      <button disabled={saving} className="w-full rounded-lg bg-gradient-gold py-2.5 font-medium text-gold-foreground disabled:opacity-60">
        {saving ? "సేవ్ అవుతోంది..." : "సేవ్ చేయండి"}
      </button>
    </form>
  );
}
