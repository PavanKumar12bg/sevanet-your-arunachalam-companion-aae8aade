import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Trash2, Plus, Save } from "lucide-react";

export const Route = createFileRoute("/admin/safety")({
  ssr: false,
  component: AdminSafety,
});

type Contact = {
  id?: string;
  category: string;
  name: string;
  phone: string;
  description: string | null;
  address: string | null;
  pincode: string | null;
  is_featured: boolean;
  is_active: boolean;
  sort_order: number;
};

const empty: Contact = {
  category: "Emergency Helplines", name: "", phone: "", description: "",
  address: "", pincode: "", is_featured: false, is_active: true, sort_order: 0,
};

function AdminSafety() {
  const [items, setItems] = useState<Contact[]>([]);
  const [draft, setDraft] = useState<Contact>(empty);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data } = await supabase
      .from("safety_contacts" as any)
      .select("*")
      .order("sort_order", { ascending: true });
    setItems(((data as any) ?? []) as Contact[]);
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);

  const add = async () => {
    if (!draft.name.trim() || !draft.phone.trim()) return toast.error("Name and phone required");
    const { error } = await supabase.from("safety_contacts" as any).insert(draft);
    if (error) return toast.error(error.message);
    setDraft(empty);
    toast.success("Added");
    void load();
  };

  const save = async (c: Contact) => {
    const { error } = await supabase.from("safety_contacts" as any).update(c).eq("id", c.id!);
    if (error) return toast.error(error.message);
    toast.success("Saved");
    void load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this contact?")) return;
    await supabase.from("safety_contacts" as any).delete().eq("id", id);
    void load();
  };

  const input = "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-accent";

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl text-gradient-gold">Safety Contacts</h1>

      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="font-display text-lg text-accent">Add new contact</h2>
        <div className="mt-3 grid gap-2 md:grid-cols-3">
          <input className={input} placeholder="Category" value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} />
          <input className={input} placeholder="Name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          <input className={input} placeholder="Phone" value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} />
          <input className={input + " md:col-span-2"} placeholder="Description" value={draft.description ?? ""} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
          <input className={input} type="number" placeholder="Sort order" value={draft.sort_order} onChange={(e) => setDraft({ ...draft, sort_order: Number(e.target.value) || 0 })} />
          <input className={input} placeholder="Address" value={draft.address ?? ""} onChange={(e) => setDraft({ ...draft, address: e.target.value })} />
          <input className={input} placeholder="Pincode" value={draft.pincode ?? ""} onChange={(e) => setDraft({ ...draft, pincode: e.target.value })} />
          <div className="flex items-center gap-3 text-sm">
            <label className="flex items-center gap-1.5"><input type="checkbox" checked={draft.is_featured} onChange={(e) => setDraft({ ...draft, is_featured: e.target.checked })} /> Featured</label>
            <label className="flex items-center gap-1.5"><input type="checkbox" checked={draft.is_active} onChange={(e) => setDraft({ ...draft, is_active: e.target.checked })} /> Active</label>
          </div>
        </div>
        <button onClick={add} className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-gradient-gold px-4 py-2 text-sm font-medium text-gold-foreground">
          <Plus className="h-4 w-4" /> Add contact
        </button>
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-lg text-accent">All contacts ({items.length})</h2>
        {loading ? <p className="text-muted-foreground">Loading…</p> : items.map((c) => (
          <div key={c.id} className="rounded-xl border border-border bg-card p-3">
            <div className="grid gap-2 md:grid-cols-6">
              <input className={input} value={c.category} onChange={(e) => setItems(items.map(x => x.id === c.id ? { ...x, category: e.target.value } : x))} />
              <input className={input} value={c.name} onChange={(e) => setItems(items.map(x => x.id === c.id ? { ...x, name: e.target.value } : x))} />
              <input className={input} value={c.phone} onChange={(e) => setItems(items.map(x => x.id === c.id ? { ...x, phone: e.target.value } : x))} />
              <input className={input + " md:col-span-2"} value={c.description ?? ""} onChange={(e) => setItems(items.map(x => x.id === c.id ? { ...x, description: e.target.value } : x))} />
              <input className={input} type="number" value={c.sort_order} onChange={(e) => setItems(items.map(x => x.id === c.id ? { ...x, sort_order: Number(e.target.value) || 0 } : x))} />
            </div>
            <div className="mt-2 flex items-center justify-between text-sm">
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5"><input type="checkbox" checked={c.is_featured} onChange={(e) => setItems(items.map(x => x.id === c.id ? { ...x, is_featured: e.target.checked } : x))} /> Featured</label>
                <label className="flex items-center gap-1.5"><input type="checkbox" checked={c.is_active} onChange={(e) => setItems(items.map(x => x.id === c.id ? { ...x, is_active: e.target.checked } : x))} /> Active</label>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => save(c)} className="inline-flex items-center gap-1 rounded-lg border border-accent/40 px-3 py-1.5 text-xs text-accent hover:bg-accent/10"><Save className="h-3 w-3" /> Save</button>
                <button onClick={() => remove(c.id!)} className="inline-flex items-center gap-1 rounded-lg border border-destructive/40 px-3 py-1.5 text-xs text-destructive hover:bg-destructive/10"><Trash2 className="h-3 w-3" /> Delete</button>
              </div>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
