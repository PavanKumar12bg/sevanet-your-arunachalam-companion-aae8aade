import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Phone, Copy, ShieldAlert, Star } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/safety")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Safety & Emergency Contacts — SevaNet" },
      { name: "description", content: "Emergency helplines, police stations, ambulance, fire service and tourist assistance for Arunachalam pilgrims." },
      { property: "og:title", content: "Safety & Emergency Contacts — SevaNet" },
      { property: "og:description", content: "Emergency helplines, police stations, ambulance and tourist assistance for Arunachalam pilgrims." },
    ],
  }),
  component: SafetyPage,
});

type Contact = {
  id: string;
  category: string;
  name: string;
  phone: string;
  description: string | null;
  address: string | null;
  pincode: string | null;
  is_featured: boolean;
  sort_order: number;
};

function SafetyPage() {
  const [items, setItems] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    supabase
      .from("safety_contacts" as any)
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .then(({ data }) => {
        if (!active) return;
        setItems(((data as any) ?? []) as Contact[]);
        setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const grouped = items.reduce<Record<string, Contact[]>>((acc, c) => {
    (acc[c.category] ||= []).push(c);
    return acc;
  }, {});

  const copy = async (phone: string) => {
    try {
      await navigator.clipboard.writeText(phone);
      toast.success("Copied " + phone);
    } catch {
      toast.error("Copy failed");
    }
  };

  return (
    <div className="container mx-auto max-w-5xl px-4 py-10">
      <header className="mb-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/5 px-3 py-1 text-xs text-accent">
          <ShieldAlert className="h-3.5 w-3.5" /> Emergency & Safety
        </div>
        <h1 className="mt-3 font-display text-3xl sm:text-4xl text-gradient-gold">Safety Contacts</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Verified emergency numbers, Tiruvannamalai police stations and tourist assistance for Arunachalam pilgrims. Tap any number to call directly.
        </p>
      </header>

      {loading ? (
        <div className="py-20 text-center text-muted-foreground">Loading…</div>
      ) : items.length === 0 ? (
        <div className="py-20 text-center text-muted-foreground">No contacts available.</div>
      ) : (
        <div className="space-y-10">
          {Object.entries(grouped).map(([category, list]) => (
            <section key={category}>
              <h2 className="mb-3 font-display text-xl text-accent">{category}</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {list.map((c) => (
                  <article
                    key={c.id}
                    className={`rounded-2xl border bg-card p-4 transition-colors ${c.is_featured ? "border-accent/50 shadow-elegant" : "border-border hover:border-accent/40"}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          {c.is_featured && <Star className="h-3.5 w-3.5 text-accent" />}
                          <h3 className="font-medium text-foreground">{c.name}</h3>
                        </div>
                        {c.description && <p className="mt-1 text-xs text-muted-foreground">{c.description}</p>}
                        {(c.address || c.pincode) && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {c.address}{c.address && c.pincode ? " · " : ""}{c.pincode}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <a
                        href={`tel:${c.phone.replace(/[^0-9+]/g, "")}`}
                        className="inline-flex items-center gap-1.5 rounded-full bg-gradient-gold px-3 py-1.5 text-xs font-medium text-gold-foreground"
                      >
                        <Phone className="h-3.5 w-3.5" /> {c.phone}
                      </a>
                      <button
                        onClick={() => copy(c.phone)}
                        className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:border-accent hover:text-accent"
                      >
                        <Copy className="h-3 w-3" /> Copy
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
