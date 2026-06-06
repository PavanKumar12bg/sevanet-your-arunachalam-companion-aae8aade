import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "పాస్‌వర్డ్ మర్చిపోయారా — సేవనెట్" }] }),
  component: Forgot,
});

function Forgot() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/` });
    if (error) return toast.error(error.message);
    setSent(true);
  };
  return (
    <div className="container mx-auto max-w-md px-4 py-16">
      <h1 className="font-display text-3xl text-gradient-gold text-center">పాస్‌వర్డ్ రీసెట్</h1>
      {sent ? (
        <p className="mt-8 text-center text-muted-foreground">మీ ఇమెయిల్‌కు లింక్ పంపబడింది.</p>
      ) : (
        <form onSubmit={submit} className="mt-8 space-y-4 rounded-2xl border border-border bg-card p-6">
          <input type="email" required placeholder="ఇమెయిల్" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-lg border border-input bg-background px-3 py-2 outline-none focus:border-accent" />
          <button className="w-full rounded-lg bg-gradient-gold py-2.5 font-medium text-gold-foreground">లింక్ పంపండి</button>
          <div className="text-center text-sm"><Link to="/login" className="text-accent">లాగిన్‌కు తిరిగి</Link></div>
        </form>
      )}
    </div>
  );
}
