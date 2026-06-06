import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/settings")({
  ssr: false,
  component: AdminSettings,
});

function AdminSettings() {
  const [audio, setAudio] = useState<any>(null);
  const [seo, setSeo] = useState<any[]>([]);
  const [newKey, setNewKey] = useState("");

  const load = async () => {
    const [{ data: a }, { data: s }] = await Promise.all([
      supabase.from("audio_settings").select("*").order("updated_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("seo_settings").select("*").order("page_key"),
    ]);
    setAudio(a);
    setSeo(s ?? []);
  };
  useEffect(() => { load(); }, []);

  const saveAudio = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...audio, updated_at: new Date().toISOString() };
    const { error } = audio.id
      ? await supabase.from("audio_settings").update(payload).eq("id", audio.id)
      : await supabase.from("audio_settings").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Audio saved");
    load();
  };

  const saveSeo = async (row: any) => {
    const { error } = await supabase.from("seo_settings").update({ title: row.title, description: row.description, og_image: row.og_image }).eq("id", row.id);
    if (error) return toast.error(error.message);
    toast.success("Saved");
  };

  const addSeo = async () => {
    if (!newKey.trim()) return;
    const { error } = await supabase.from("seo_settings").insert({ page_key: newKey.trim(), title: "", description: "" });
    if (error) return toast.error(error.message);
    setNewKey("");
    load();
  };

  const removeSeo = async (id: string) => {
    if (!confirm("Delete?")) return;
    await supabase.from("seo_settings").delete().eq("id", id);
    load();
  };

  const input = "w-full rounded-lg border border-input bg-background px-3 py-2 outline-none focus:border-accent";

  return (
    <div className="space-y-8">
      <h1 className="font-display text-3xl text-gradient-gold">Settings</h1>

      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="font-display text-xl text-accent">Background chanting</h2>
        {audio ? (
          <form onSubmit={saveAudio} className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="text-sm">Audio URL</label>
              <input required value={audio.audio_url || ""} onChange={(e) => setAudio({ ...audio, audio_url: e.target.value })} className={input + " mt-1"} />
            </div>
            <div>
              <label className="text-sm">Title</label>
              <input value={audio.title || ""} onChange={(e) => setAudio({ ...audio, title: e.target.value })} className={input + " mt-1"} />
            </div>
            <div>
              <label className="text-sm">Volume (0-1)</label>
              <input type="number" min={0} max={1} step={0.05} value={audio.volume ?? 0.4} onChange={(e) => setAudio({ ...audio, volume: Number(e.target.value) })} className={input + " mt-1"} />
            </div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!audio.autoplay} onChange={(e) => setAudio({ ...audio, autoplay: e.target.checked })} /> Autoplay</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!audio.loop} onChange={(e) => setAudio({ ...audio, loop: e.target.checked })} /> Loop</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!audio.is_active} onChange={(e) => setAudio({ ...audio, is_active: e.target.checked })} /> Active</label>
            <div className="md:col-span-2"><button className="rounded-lg bg-gradient-gold px-4 py-2 text-sm font-medium text-gold-foreground">Save audio</button></div>
          </form>
        ) : <button onClick={() => setAudio({ audio_url: "", title: "", volume: 0.4, autoplay: true, loop: true, is_active: true })} className="mt-3 rounded-lg border border-border px-4 py-2 text-sm">Create audio settings</button>}
      </section>

      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="font-display text-xl text-accent">SEO settings</h2>
        <div className="mt-3 flex gap-2">
          <input value={newKey} onChange={(e) => setNewKey(e.target.value)} placeholder="page key (e.g. home, listings)" className={input} />
          <button onClick={addSeo} className="rounded-lg bg-gradient-gold px-4 py-2 text-sm font-medium text-gold-foreground">Add</button>
        </div>
        <div className="mt-4 space-y-3">
          {seo.map((row) => (
            <div key={row.id} className="rounded-xl border border-border bg-background/40 p-3">
              <div className="flex items-center justify-between">
                <div className="font-medium text-accent">{row.page_key}</div>
                <button onClick={() => removeSeo(row.id)} className="text-xs text-destructive hover:underline">delete</button>
              </div>
              <div className="mt-2 grid gap-2 md:grid-cols-2">
                <input placeholder="Title" defaultValue={row.title || ""} onBlur={(e) => (row.title = e.target.value)} className={input} />
                <input placeholder="OG image URL" defaultValue={row.og_image || ""} onBlur={(e) => (row.og_image = e.target.value)} className={input} />
                <textarea rows={2} placeholder="Description" defaultValue={row.description || ""} onBlur={(e) => (row.description = e.target.value)} className={input + " md:col-span-2"} />
              </div>
              <button onClick={() => saveSeo(row)} className="mt-2 rounded-lg border border-border px-3 py-1 text-xs hover:border-accent">Save</button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
