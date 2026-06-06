import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "నమోదు — సేవనెట్" }] }),
  component: Register,
});

function Register() {
  const nav = useNavigate();
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", password: "" });
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < 6) return toast.error("పాస్‌వర్డ్ కనీసం 6 అక్షరాలు ఉండాలి");
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { emailRedirectTo: window.location.origin, data: { full_name: form.full_name, phone: form.phone } },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("ఖాతా సృష్టించబడింది! ఇమెయిల్ చూడండి.");
    nav({ to: "/" });
  };

  return (
    <div className="container mx-auto max-w-md px-4 py-16">
      <h1 className="font-display text-4xl text-gradient-gold text-center">నమోదు</h1>
      <form onSubmit={submit} className="mt-8 space-y-4 rounded-2xl border border-border bg-card p-6 shadow-elegant">
        <input required placeholder="పూర్తి పేరు" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 outline-none focus:border-accent" />
        <input type="email" required placeholder="ఇమెయిల్" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 outline-none focus:border-accent" />
        <input placeholder="ఫోన్ (ఐచ్ఛికం)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 outline-none focus:border-accent" />
        <input type="password" required placeholder="పాస్‌వర్డ్" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 outline-none focus:border-accent" />
        <button disabled={loading} className="w-full rounded-lg bg-gradient-gold py-2.5 font-medium text-gold-foreground disabled:opacity-60">{loading ? "..." : "ఖాతా సృష్టించు"}</button>
        <div className="text-center text-sm">ఇప్పటికే ఖాతా ఉందా? <Link to="/login" className="text-accent">లాగిన్</Link></div>
      </form>
    </div>
  );
}
