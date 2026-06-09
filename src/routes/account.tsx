import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/account")({
  head: () => ({ meta: [{ title: "ఖాతా — సేవనెట్" }] }),
  ssr: false,
  component: Account,
});

function Account() {
  const nav = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [favs, setFavs] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return nav({ to: "/login" });
      setUser(data.user);
      const [{ data: p }, { data: f }] = await Promise.all([
        supabase.from("profiles").select("id,full_name,preferred_language,created_at,updated_at").eq("id", data.user.id).maybeSingle(),
        supabase.from("favorites").select("listing_id,listings(title,slug,cover_image)").eq("user_id", data.user.id),
      ]);
      setProfile(p);
      setFavs(f ?? []);
    })();
  }, [nav]);

  const signOut = async () => { await supabase.auth.signOut(); toast.success("లాగ్ అవుట్ అయ్యారు"); nav({ to: "/" }); };

  if (!user) return null;

  return (
    <div className="container mx-auto max-w-3xl px-4 py-12">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl text-gradient-gold">నమస్తే, {profile?.full_name || user.email}</h1>
        <button onClick={signOut} className="rounded-full border border-border px-4 py-1.5 text-sm hover:border-accent">లాగ్ అవుట్</button>
      </div>

      <h2 className="mt-10 font-display text-xl text-accent">ఇష్టమైనవి</h2>
      {favs.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">మీ ఇష్టమైన సేవలు ఇక్కడ కనిపిస్తాయి.</p>
      ) : (
        <div className="mt-4 grid sm:grid-cols-2 gap-3">
          {favs.map((f) => (
            <a key={f.listing_id} href={`/listing/${f.listings.slug}`} className="rounded-xl border border-border bg-card p-3 flex gap-3 hover:border-accent">
              <div className="h-16 w-16 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                {f.listings.cover_image && <img src={f.listings.cover_image} alt="" className="h-full w-full object-cover" />}
              </div>
              <div className="font-medium">{f.listings.title}</div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
