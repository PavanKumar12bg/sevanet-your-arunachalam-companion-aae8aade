import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/")({
  ssr: false,
  component: AdminDashboard,
});

function AdminDashboard() {
  const [stats, setStats] = useState({ listings: 0, pending: 0, reviews: 0, pendingReviews: 0, users: 0, businesses: 0, pendingBiz: 0 });

  useEffect(() => {
    (async () => {
      const [l, lp, r, rp, p, b, bp] = await Promise.all([
        supabase.from("listings").select("*", { count: "exact", head: true }),
        supabase.from("listings").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("reviews").select("*", { count: "exact", head: true }),
        supabase.from("reviews").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("business_owners").select("*", { count: "exact", head: true }),
        supabase.from("business_owners").select("*", { count: "exact", head: true }).eq("status", "pending"),
      ]);
      setStats({
        listings: l.count ?? 0, pending: lp.count ?? 0,
        reviews: r.count ?? 0, pendingReviews: rp.count ?? 0,
        users: p.count ?? 0, businesses: b.count ?? 0, pendingBiz: bp.count ?? 0,
      });
    })();
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
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-border bg-card p-5">
            <div className="text-sm text-muted-foreground">{c.label}</div>
            <div className="mt-2 font-display text-3xl text-accent">{c.value}</div>
            {c.hint && <div className="mt-1 text-xs text-muted-foreground">{c.hint}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
