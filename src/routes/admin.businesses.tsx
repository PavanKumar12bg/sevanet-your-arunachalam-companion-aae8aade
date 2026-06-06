import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Check, X, Trash2 } from "lucide-react";

export const Route = createFileRoute("/admin/businesses")({
  ssr: false,
  component: AdminBusinesses,
});

function AdminBusinesses() {
  const [items, setItems] = useState<any[]>([]);
  const [status, setStatus] = useState("pending");

  const load = async () => {
    let q = supabase.from("business_owners").select("*,profiles:user_id(full_name,phone)").order("created_at", { ascending: false });
    if (status !== "all") q = q.eq("status", status as any);
    const { data, error } = await q;
    if (error) toast.error(error.message);
    setItems(data ?? []);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [status]);

  const update = async (id: string, s: string) => {
    const { error } = await supabase.from("business_owners").update({ status: s as any }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(s === "approved" ? "Approved — user promoted" : "Updated");
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete application?")) return;
    await supabase.from("business_owners").delete().eq("id", id);
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl text-gradient-gold">Business Applications</h1>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-lg border border-input bg-background px-3 py-2">
          <option value="all">All</option><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option>
        </select>
      </div>
      <div className="mt-4 space-y-3">
        {items.length === 0 ? <div className="text-muted-foreground">లేవు</div> :
          items.map((b) => (
            <div key={b.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="font-display text-lg text-accent">{b.business_name}</div>
                  <div className="text-sm text-muted-foreground">{b.profiles?.full_name} • {b.contact_phone || b.profiles?.phone || "—"}</div>
                  <div className="text-xs text-muted-foreground">Applied {new Date(b.created_at).toLocaleDateString()}</div>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs ${b.status === "approved" ? "bg-emerald-500/15 text-emerald-400" : b.status === "rejected" ? "bg-destructive/15 text-destructive" : "bg-amber-500/15 text-amber-400"}`}>{b.status}</span>
              </div>
              {b.notes && <p className="mt-2 text-sm text-muted-foreground">{b.notes}</p>}
              <div className="mt-3 flex gap-2">
                <button onClick={() => update(b.id, "approved")} className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-3 py-1 text-xs text-emerald-400 hover:bg-emerald-500/25"><Check className="h-3 w-3" /> Approve</button>
                <button onClick={() => update(b.id, "rejected")} className="inline-flex items-center gap-1 rounded-full bg-destructive/15 px-3 py-1 text-xs text-destructive hover:bg-destructive/25"><X className="h-3 w-3" /> Reject</button>
                <button onClick={() => remove(b.id)} className="ml-auto inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs text-destructive hover:bg-destructive/10"><Trash2 className="h-3 w-3" /></button>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
