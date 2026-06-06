import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/business/register")({
  head: () => ({ meta: [{ title: "వ్యాపార నమోదు — సేవనెట్" }] }),
  component: BizReg,
});

function BizReg() {
  const nav = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [form, setForm] = useState({ business_name: "", contact_phone: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { toast.error("మొదట లాగిన్ అవ్వండి"); return nav({ to: "/login" }); }
    setLoading(true);
    const { error } = await supabase.from("business_owners").insert({ user_id: user.id, business_name: form.business_name, contact_phone: form.contact_phone });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("దరఖాస్తు పంపబడింది. మేము త్వరలో సంప్రదిస్తాము.");
    nav({ to: "/" });
  };

  return (
    <div className="container mx-auto max-w-md px-4 py-16">
      <h1 className="font-display text-3xl text-gradient-gold text-center">వ్యాపార నమోదు</h1>
      <p className="mt-2 text-center text-sm text-muted-foreground">మీ సేవను సేవనెట్‌లో జాబితా చేయండి</p>
      <form onSubmit={submit} className="mt-8 space-y-4 rounded-2xl border border-border bg-card p-6">
        <input required placeholder="వ్యాపారం పేరు" value={form.business_name} onChange={(e) => setForm({ ...form, business_name: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 outline-none focus:border-accent" />
        <input required placeholder="ఫోన్" value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 outline-none focus:border-accent" />
        <button disabled={loading} className="w-full rounded-lg bg-gradient-gold py-2.5 font-medium text-gold-foreground disabled:opacity-60">{loading ? "..." : "దరఖాస్తు పంపండి"}</button>
      </form>
    </div>
  );
}
