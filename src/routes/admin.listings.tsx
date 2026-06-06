import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Pencil, Trash2, Plus, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/admin/listings")({
  ssr: false,
  component: AdminListings,
});

function AdminListings() {
  const [items, setItems] = useState<any[]>([]);
  const [status, setStatus] = useState<string>("all");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    let query = supabase.from("listings").select("id,title,slug,status,is_featured,view_count,rating_avg,rating_count,categories(name_te)").order("created_at", { ascending: false }).limit(200);
    if (status !== "all") query = query.eq("status", status as any);
    if (q) query = query.ilike("title", `%${q}%`);
    const { data, error } = await query;
    if (error) toast.error(error.message);
    setItems(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [status]);

  const setListingStatus = async (id: string, s: string) => {
    const { error } = await supabase.from("listings").update({ status: s as any }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Updated");
    load();
  };

  const toggleFeatured = async (id: string, v: boolean) => {
    await supabase.from("listings").update({ is_featured: !v }).eq("id", id);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this listing permanently?")) return;
    const { error } = await supabase.from("listings").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    load();
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl text-gradient-gold">Listings</h1>
        <Link to="/admin/listings/$id" params={{ id: "new" }} className="inline-flex items-center gap-2 rounded-full bg-gradient-gold px-4 py-2 text-sm font-medium text-gold-foreground">
          <Plus className="h-4 w-4" /> New listing
        </Link>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <form onSubmit={(e) => { e.preventDefault(); load(); }} className="flex flex-1 min-w-[200px] gap-2">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search title..." className="flex-1 rounded-lg border border-input bg-background px-3 py-2 outline-none focus:border-accent" />
          <button className="rounded-lg border border-border px-4 hover:border-accent">Search</button>
        </form>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-lg border border-input bg-background px-3 py-2">
          <option value="all">All status</option>
          <option value="draft">Draft</option>
          <option value="pending">Pending</option>
          <option value="published">Published</option>
          <option value="rejected">Rejected</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/30 text-left text-xs uppercase text-muted-foreground">
            <tr><th className="p-3">Title</th><th className="p-3">Category</th><th className="p-3">Status</th><th className="p-3">Rating</th><th className="p-3">Views</th><th className="p-3">Actions</th></tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">లోడ్...</td></tr> :
              items.length === 0 ? <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">లేవు</td></tr> :
              items.map((it) => (
                <tr key={it.id} className="border-t border-border">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{it.title}</span>
                      {it.is_featured && <span className="rounded bg-accent/20 px-1.5 text-xs text-accent">★</span>}
                    </div>
                    <div className="text-xs text-muted-foreground">/{it.slug}</div>
                  </td>
                  <td className="p-3 text-muted-foreground">{it.categories?.name_te || "—"}</td>
                  <td className="p-3">
                    <select value={it.status} onChange={(e) => setListingStatus(it.id, e.target.value)} className="rounded border border-input bg-background px-2 py-1 text-xs">
                      <option value="draft">draft</option>
                      <option value="pending">pending</option>
                      <option value="published">published</option>
                      <option value="rejected">rejected</option>
                      <option value="archived">archived</option>
                    </select>
                  </td>
                  <td className="p-3 text-muted-foreground">{Number(it.rating_avg ?? 0).toFixed(1)} ({it.rating_count})</td>
                  <td className="p-3 text-muted-foreground">{it.view_count}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <button title="Featured" onClick={() => toggleFeatured(it.id, it.is_featured)} className="rounded p-1 hover:bg-muted">★</button>
                      <Link to="/listing/$slug" params={{ slug: it.slug }} className="rounded p-1 hover:bg-muted"><ExternalLink className="h-4 w-4" /></Link>
                      <Link to="/admin/listings/$id" params={{ id: it.id }} className="rounded p-1 hover:bg-muted"><Pencil className="h-4 w-4" /></Link>
                      <button onClick={() => remove(it.id)} className="rounded p-1 text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
