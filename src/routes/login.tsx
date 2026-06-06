import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "లాగిన్ — సేవనెట్" }] }),
  component: Login,
});

function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("స్వాగతం!");
    nav({ to: "/" });
  };

  return (
    <div className="container mx-auto max-w-md px-4 py-16">
      <h1 className="font-display text-4xl text-gradient-gold text-center">లాగిన్</h1>
      <form onSubmit={submit} className="mt-8 space-y-4 rounded-2xl border border-border bg-card p-6 shadow-elegant">
        <div>
          <label className="text-sm text-muted-foreground">ఇమెయిల్</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 outline-none focus:border-accent" />
        </div>
        <div>
          <label className="text-sm text-muted-foreground">పాస్‌వర్డ్</label>
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 outline-none focus:border-accent" />
        </div>
        <button disabled={loading} className="w-full rounded-lg bg-gradient-gold py-2.5 font-medium text-gold-foreground disabled:opacity-60">{loading ? "..." : "లాగిన్"}</button>
        <div className="text-center text-sm text-muted-foreground">
          <Link to="/forgot-password" className="hover:text-accent">పాస్‌వర్డ్ మర్చిపోయారా?</Link>
        </div>
        <div className="text-center text-sm">
          ఖాతా లేదా? <Link to="/register" className="text-accent">నమోదు చేసుకోండి</Link>
        </div>
      </form>
    </div>
  );
}
