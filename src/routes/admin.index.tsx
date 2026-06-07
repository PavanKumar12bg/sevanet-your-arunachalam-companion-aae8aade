import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { logClientError, withTimeout } from "@/lib/safe-query";

export const Route = createFileRoute("/admin/")({
  ssr: false,
  component: AdminDashboard,
});

type Stats = { listings: number; pending: number; reviews: number; pendingReviews: number; users: number; businesses: number; pendingBiz: number };

function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({ listings: 0, pending: 0, reviews: 0, pendingReviews: 0, users: 0, businesses: 0, pendingBiz: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const queries = [
          supabase.from("listings").select("*", { count: "exact", head: true }),
          supabase.from("listings").select("*", { count: "exact", head: true }).eq("status", "pending"),
          supabase.from("reviews").select("*", { count: "exact", head: true }),
          supabase.from("reviews").select("*", { count: "exact", head: true }).eq("status", "pending"),
          supabase.from("profiles").select("*", { count: "exact", head: true }),
          supabase.from("business_owners").select("*", { count: "exact", head: true }),
          supabase.from("business_owners").select("*", { count: "exact", head: true }).eq("status", "pending"),
        ];
        const results = await withTimeout(Promise.all(queries), "admin stats");
        if (!active) return;
        const [l, lp, r, rp, p, b, bp] = results;
        setStats({
          listings: l.count ?? 0, pending: lp.count ?? 0,
          reviews: r.count ?? 0, pendingReviews: rp.count ?? 0,
          users: p.count ?? 0, businesses: b.count ?? 0, pendingBiz: bp.count ?? 0,
        });
      } catch (err: any) {
        logClientError("admin stats", err);
        if (active) setError(err?.message ?? "Failed to load stats");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const cards = [
    { label: "మొత్తం లిస్టింగ్‌లు", value: stats.listings, hint: `${stats.pending} pending` },
    { label: "మొత్తం రివ్యూలు", value: stats.reviews, hint: `${stats.pendingReviews} pending` },
    { label: "వాడుకరులు", value: stats.users },
    { label: "వ్యాపారాలు", value: stats.businesses, hint: `${stats.pendingBiz} pending` },
  ];

  return (
    <div>
      <h1 className="font-display text-3xl text-gradient-gold">Dashboard</h1>
      {error && (
        <div className="mt-4 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          స్టాట్స్ లోడ్ కాలేదు: {error}
        </div>
      )}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-border bg-card p-5">
            <div className="text-sm text-muted-foreground">{c.label}</div>
            <div className="mt-2 font-display text-3xl text-accent">{loading ? "—" : c.value}</div>
            {c.hint && <div className="mt-1 text-xs text-muted-foreground">{c.hint}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

