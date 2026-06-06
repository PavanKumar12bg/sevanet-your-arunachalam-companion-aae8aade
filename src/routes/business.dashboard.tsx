import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useRole } from "@/lib/use-role";
import { Plus, Pencil, ExternalLink, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/business/dashboard")({
  head: () => ({ meta: [{ title: "వ్యాపార డాష్‌బోర్డ్ — సేవనెట్" }, { name: "robots", content: "noindex" }] }),
  ssr: false,
  component: BusinessDashboard,
});

const statusBadge = (s: string) => {
  const map: Record<string, string> = {
    published: "bg-emerald-500/15 text-emerald-400",
    pending: "bg-amber-500/15 text-amber-400",
    rejected: "bg-destructive/15 text-destructive",
    draft: "bg-muted text-muted-foreground",
    archived: "bg-muted text-muted-foreground",
  };
  return map[s] || "bg-muted text-muted-foreground";
};

function BusinessDashboard() {
  const { loading, userId, isBusinessOwner } = useRole();
  const nav = useNavigate();
  const [biz, setBiz] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!userId) { nav({ to: "/login" }); return; }
    (async () => {
      const [{ data: b }, { data: l }] = await Promise.all([
        supabase.from("business_owners").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("listings").select("id,title,slug,status,view_count,rating_avg,rating_count,updated_at,cover_image").eq("owner_id", userId).order("updated_at", { ascending: false }),
      ]);
      setBiz(b);
      setItems(l ?? []);
      setFetching(false);
    })();
  }, [loading, userId, nav]);

  const remove = async (id: string) => {
    if (!confirm("Delete this listing?")) return;
    const { error } = await supabase.from("listings").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setItems(items.filter((i) => i.id !== id));
  };

  if (loading || fetching) return <div className="py-20 text-center text-muted-foreground">లోడ్...</div>;

  const canCreate = isBusinessOwner || biz?.status === "approved";

  return (
    <div className="container mx-auto max-w-5xl px-4 py-10">
      <h1 className="font-display text-3xl text-gradient-gold">వ్యాపార డాష్‌బోర్డ్</h1>

      {!biz ? (
        <div className="mt-6 rounded-2xl border border-border bg-card p-6">
          <p className="text-muted-foreground">మీరు ఇంకా వ్యాపార దరఖాస్తు ఇవ్వలేదు.</p>
          <Link to="/business/register" className="mt-3 inline-block rounded-full bg-gradient-gold px-4 py-2 text-sm font-medium text-gold-foreground">వ్యాపార నమోదు చేయండి</Link>
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-border bg-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="font-display text-xl text-accent">{biz.business_name}</div>
              <div className="text-xs text-muted-foreground">Application status</div>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs ${statusBadge(biz.status)}`}>{biz.status}</span>
          </div>
          {biz.status === "pending" && <p className="mt-2 text-sm text-muted-foreground">మీ దరఖాస్తు సమీక్షలో ఉంది. ఆమోదం తర్వాత మీరు లిస్టింగ్‌లు సృష్టించవచ్చు.</p>}
          {biz.status === "rejected" && <p className="mt-2 text-sm text-destructive">దరఖాస్తు తిరస్కరించబడింది. వివరాల కోసం మమ్మల్ని సంప్రదించండి.</p>}
        </div>
      )}

      <div className="mt-8 flex items-center justify-between">
        <h2 className="font-display text-2xl text-accent">మీ లిస్టింగ్‌లు</h2>
        {canCreate && (
          <Link to="/business/listings/$id" params={{ id: "new" }} className="inline-flex items-center gap-2 rounded-full bg-gradient-gold px-4 py-2 text-sm font-medium text-gold-foreground">
            <Plus className="h-4 w-4" /> కొత్త లిస్టింగ్
          </Link>
        )}
      </div>

      <div className="mt-4 grid gap-3">
        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground">
            {canCreate ? "మొదటి లిస్టింగ్ సృష్టించండి" : "ఆమోదం తర్వాత మీరు లిస్టింగ్‌లు చేర్చవచ్చు"}
          </div>
        ) : items.map((l) => (
          <div key={l.id} className="flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-card p-4">
            <div className="h-16 w-16 overflow-hidden rounded-lg bg-muted">
              {l.cover_image && <img src={l.cover_image} alt="" className="h-full w-full object-cover" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{l.title}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs ${statusBadge(l.status)}`}>{l.status}</span>
              </div>
              <div className="text-xs text-muted-foreground">★ {Number(l.rating_avg ?? 0).toFixed(1)} ({l.rating_count}) • {l.view_count} views</div>
            </div>
            <div className="flex gap-1">
              {l.status === "published" && <Link to="/listing/$slug" params={{ slug: l.slug }} className="rounded p-2 hover:bg-muted"><ExternalLink className="h-4 w-4" /></Link>}
              <Link to="/business/listings/$id" params={{ id: l.id }} className="rounded p-2 hover:bg-muted"><Pencil className="h-4 w-4" /></Link>
              <button onClick={() => remove(l.id)} className="rounded p-2 text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
