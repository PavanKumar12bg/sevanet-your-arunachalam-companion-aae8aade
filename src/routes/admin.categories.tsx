import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Pencil, Trash2, Plus } from "lucide-react";
import { slugify } from "@/lib/utils";

export const Route = createFileRoute("/admin/categories")({
  ssr: false,
  component: AdminCategories,
});

interface Cat { id?: string; name_te: string; name_en: string; slug: string; icon: string; description: string; sort_order: number; is_active: boolean; }
const empty: Cat = { name_te: "", name_en: "", slug: "", icon: "", description: "", sort_order: 0, is_active: true };

function AdminCategories() {
  const [items, setItems] = useState<Cat[]>([]);
  const [editing, setEditing] = useState<Cat | null>(null);

  const load = async () => {
    const { data } = await supabase.from("categories").select("*").order("sort_order");
    setItems((data ?? []) as any);
  };
  useEffect(() => { load(); }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    const payload = { ...editing, slug: editing.slug || slugify(editing.name_en) };
    const { error } = editing.id
      ? await supabase.from("categories").update(payload).eq("id", editing.id)
      : await supabase.from("categories").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Saved");
    setEditing(null);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete?")) return;
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  const input = "w-full rounded-lg border border-input bg-background px-3 py-2 outline-none focus:border-accent";

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl text-gradient-gold">Categories</h1>
        <button onClick={() => setEditing(empty)} className="inline-flex items-center gap-2 rounded-full bg-gradient-gold px-4 py-2 text-sm font-medium text-gold-foreground">
          <Plus className="h-4 w-4" /> New
        </button>
      </div>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/30 text-left text-xs uppercase text-muted-foreground">
            <tr><th className="p-3">Order</th><th className="p-3">Telugu</th><th className="p-3">English</th><th className="p-3">Slug</th><th className="p-3">Active</th><th className="p-3"></th></tr>
          </thead>
          <tbody>
            {items.map((c) => (
              <tr key={c.id} className="border-t border-border">
                <td className="p-3">{c.sort_order}</td>
                <td className="p-3 font-medium">{c.name_te}</td>
                <td className="p-3 text-muted-foreground">{c.name_en}</td>
                <td className="p-3 text-muted-foreground">{c.slug}</td>
                <td className="p-3">{c.is_active ? "✓" : "—"}</td>
                <td className="p-3">
                  <div className="flex gap-2">
                    <button onClick={() => setEditing(c)} className="rounded p-1 hover:bg-muted"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => c.id && remove(c.id)} className="rounded p-1 text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4" onClick={() => setEditing(null)}>
          <form onSubmit={save} onClick={(e) => e.stopPropagation()} className="w-full max-w-lg space-y-3 rounded-2xl border border-border bg-card p-6">
            <h2 className="font-display text-xl text-accent">{editing.id ? "Edit" : "New"} category</h2>
            <div className="grid grid-cols-2 gap-3">
              <input required placeholder="తెలుగు పేరు" value={editing.name_te} onChange={(e) => setEditing({ ...editing, name_te: e.target.value })} className={input} />
              <input required placeholder="English name" value={editing.name_en} onChange={(e) => setEditing({ ...editing, name_en: e.target.value, slug: editing.slug || slugify(e.target.value) })} className={input} />
              <input placeholder="slug" value={editing.slug} onChange={(e) => setEditing({ ...editing, slug: slugify(e.target.value) })} className={input} />
              <input placeholder="icon (lucide name)" value={editing.icon} onChange={(e) => setEditing({ ...editing, icon: e.target.value })} className={input} />
              <input type="number" placeholder="sort order" value={editing.sort_order} onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })} className={input} />
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editing.is_active} onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })} /> Active</label>
            </div>
            <textarea rows={3} placeholder="Description" value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} className={input} />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setEditing(null)} className="rounded-lg border border-border px-4 py-2 text-sm">Cancel</button>
              <button className="rounded-lg bg-gradient-gold px-4 py-2 text-sm font-medium text-gold-foreground">Save</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
