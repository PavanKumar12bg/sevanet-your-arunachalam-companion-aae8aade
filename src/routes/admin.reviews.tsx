import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Check, X, Star, Trash2 } from "lucide-react";

export const Route = createFileRoute("/admin/reviews")({
  ssr: false,
  component: AdminReviews,
});

function AdminReviews() {
  const [items, setItems] = useState<any[]>([]);
  const [status, setStatus] = useState("pending");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    let q = supabase.from("reviews").select("id,rating,comment,status,created_at,user_id,listings(title,slug),profiles:user_id(full_name)").order("created_at", { ascending: false }).limit(200);
    if (status !== "all") q = q.eq("status", status as any);
    const { data, error } = await q;
    if (error) toast.error(error.message);
    setItems(data ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [status]);

  const setReviewStatus = async (id: string, s: string) => {
    const { error } = await supabase.from("reviews").update({ status: s as any }).eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };
  const remove = async (id: string) => {
    if (!confirm("Delete review?")) return;
    await supabase.from("reviews").delete().eq("id", id);
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl text-gradient-gold">Reviews</h1>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-lg border border-input bg-background px-3 py-2">
          <option value="all">All</option><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option>
        </select>
      </div>
      <div className="mt-4 space-y-3">
        {loading ? <div className="text-muted-foreground">లోడ్...</div> :
          items.length === 0 ? <div className="text-muted-foreground">లేవు</div> :
          items.map((r) => (
            <div key={r.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="font-medium">{r.listings?.title || "—"}</div>
                  <div className="text-xs text-muted-foreground">by {r.profiles?.full_name || "Anonymous"} • {new Date(r.created_at).toLocaleDateString()}</div>
                  <div className="mt-1 flex items-center gap-1 text-accent">
                    {Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`h-3.5 w-3.5 ${i < r.rating ? "fill-accent" : ""}`} />)}
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs ${r.status === "approved" ? "bg-emerald-500/15 text-emerald-400" : r.status === "rejected" ? "bg-destructive/15 text-destructive" : "bg-amber-500/15 text-amber-400"}`}>{r.status}</span>
                </div>
              </div>
              {r.comment && <p className="mt-2 text-sm text-muted-foreground">{r.comment}</p>}
              <div className="mt-3 flex gap-2">
                <button onClick={() => setReviewStatus(r.id, "approved")} className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-3 py-1 text-xs text-emerald-400 hover:bg-emerald-500/25"><Check className="h-3 w-3" /> Approve</button>
                <button onClick={() => setReviewStatus(r.id, "rejected")} className="inline-flex items-center gap-1 rounded-full bg-destructive/15 px-3 py-1 text-xs text-destructive hover:bg-destructive/25"><X className="h-3 w-3" /> Reject</button>
                <button onClick={() => remove(r.id)} className="ml-auto inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs text-destructive hover:bg-destructive/10"><Trash2 className="h-3 w-3" /> Delete</button>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
