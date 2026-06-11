import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Save, Trash2 } from "lucide-react";

export const Route = createFileRoute("/admin/announcements")({
  ssr: false,
  component: AdminAnnouncements,
});

type Announcement = {
  id?: string;
  message: string;
  link_url: string | null;
  is_active: boolean;
  sort_order: number;
};

const empty: Announcement = { message: "", link_url: "", is_active: true, sort_order: 0 };

function AdminAnnouncements() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [draft, setDraft] = useState<Announcement>(empty);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data } = await supabase
      .from("announcements" as any)
      .select("*")
      .order("sort_order", { ascending: true });
    setItems(((data as any) ?? []) as Announcement[]);
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);

  const add = async () => {
    if (!draft.message.trim()) return toast.error("Message required");
    const { error } = await supabase.from("announcements" as any).insert(draft);
    if (error) return toast.error(error.message);
    setDraft(empty);
    toast.success("Added");
    void load();
  };

  const save = async (a: Announcement) => {
    const { error } = await supabase.from("announcements" as any).update(a).eq("id", a.id!);
    if (error) return toast.error(error.message);
    toast.success("Saved");
    void load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete?")) return;
    await supabase.from("announcements" as any).delete().eq("id", id);
    void load();
  };

  const toggleAll = async (active: boolean) => {
    await supabase.from("announcements" as any).update({ is_active: active }).neq("id", "00000000-0000-0000-0000-000000000000");
    toast.success(active ? "Bar enabled" : "Bar disabled");
    void load();
  };

  const input = "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-accent";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl text-gradient-gold">Announcement Bar</h1>
        <div className="flex gap-2">
          <button onClick={() => toggleAll(true)} className="rounded-lg border border-accent/40 px-3 py-1.5 text-xs text-accent hover:bg-accent/10">Enable all</button>
          <button onClick={() => toggleAll(false)} className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:border-destructive hover:text-destructive">Disable all</button>
        </div>
      </div>

      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="font-display text-lg text-accent">Add announcement</h2>
        <div className="mt-3 grid gap-2 md:grid-cols-4">
          <input className={input + " md:col-span-2"} placeholder="Message" value={draft.message} onChange={(e) => setDraft({ ...draft, message: e.target.value })} />
          <input className={input} placeholder="Link URL (optional)" value={draft.link_url ?? ""} onChange={(e) => setDraft({ ...draft, link_url: e.target.value })} />
          <input className={input} type="number" placeholder="Sort order" value={draft.sort_order} onChange={(e) => setDraft({ ...draft, sort_order: Number(e.target.value) || 0 })} />
        </div>
        <label className="mt-2 flex items-center gap-1.5 text-sm"><input type="checkbox" checked={draft.is_active} onChange={(e) => setDraft({ ...draft, is_active: e.target.checked })} /> Active</label>
        <button onClick={add} className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-gradient-gold px-4 py-2 text-sm font-medium text-gold-foreground">
          <Plus className="h-4 w-4" /> Add
        </button>
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-lg text-accent">All announcements ({items.length})</h2>
        {loading ? <p className="text-muted-foreground">Loading…</p> : items.map((a) => (
          <div key={a.id} className="rounded-xl border border-border bg-card p-3">
            <div className="grid gap-2 md:grid-cols-4">
              <input className={input + " md:col-span-2"} value={a.message} onChange={(e) => setItems(items.map(x => x.id === a.id ? { ...x, message: e.target.value } : x))} />
              <input className={input} value={a.link_url ?? ""} placeholder="Link URL" onChange={(e) => setItems(items.map(x => x.id === a.id ? { ...x, link_url: e.target.value } : x))} />
              <input className={input} type="number" value={a.sort_order} onChange={(e) => setItems(items.map(x => x.id === a.id ? { ...x, sort_order: Number(e.target.value) || 0 } : x))} />
            </div>
            <div className="mt-2 flex items-center justify-between text-sm">
              <label className="flex items-center gap-1.5"><input type="checkbox" checked={a.is_active} onChange={(e) => setItems(items.map(x => x.id === a.id ? { ...x, is_active: e.target.checked } : x))} /> Active</label>
              <div className="flex gap-2">
                <button onClick={() => save(a)} className="inline-flex items-center gap-1 rounded-lg border border-accent/40 px-3 py-1.5 text-xs text-accent hover:bg-accent/10"><Save className="h-3 w-3" /> Save</button>
                <button onClick={() => remove(a.id!)} className="inline-flex items-center gap-1 rounded-lg border border-destructive/40 px-3 py-1.5 text-xs text-destructive hover:bg-destructive/10"><Trash2 className="h-3 w-3" /> Delete</button>
              </div>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
