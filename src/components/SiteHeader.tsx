import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

export function SiteHeader() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setUser(s?.user ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-full bg-gradient-gold flex items-center justify-center font-display text-gold-foreground font-bold">ఓం</div>
          <div className="leading-tight">
            <div className="font-display text-xl text-gradient-gold">సేవనెట్</div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">SevaNet</div>
          </div>
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm">
          <Link to="/listings" className="hover:text-accent transition-colors">సేవలు</Link>
          <Link to="/map" className="hover:text-accent transition-colors">మ్యాప్</Link>
          <Link to="/about" className="hover:text-accent transition-colors">గురించి</Link>
        </nav>
        <div className="flex items-center gap-2 text-sm">
          {user ? (
            <Link to="/account" className="rounded-full border border-accent/40 px-4 py-1.5 hover:bg-accent/10">ఖాతా</Link>
          ) : (
            <>
              <Link to="/login" className="text-muted-foreground hover:text-foreground">లాగిన్</Link>
              <Link to="/register" className="rounded-full bg-gradient-gold px-4 py-1.5 text-gold-foreground font-medium">నమోదు</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
