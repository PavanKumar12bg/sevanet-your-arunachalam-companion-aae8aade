import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { ListingForm } from "@/components/ListingForm";
import { useRole } from "@/lib/use-role";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/business/listings/$id")({
  ssr: false,
  head: () => ({ meta: [{ title: "Listing editor — సేవనెట్" }, { name: "robots", content: "noindex" }] }),
  component: BusinessEdit,
});

function BusinessEdit() {
  const { id } = useParams({ from: "/business/listings/$id" });
  const { userId, loading, isBusinessOwner, isAdmin } = useRole();
  const nav = useNavigate();
  const isNew = id === "new";
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    if (loading || !userId) return;
    if (isNew) { setAllowed(isBusinessOwner); return; }
    supabase.from("listings").select("owner_id").eq("id", id).maybeSingle().then(({ data }) => {
      setAllowed(!!data && (data.owner_id === userId || isAdmin));
    });
  }, [id, userId, loading, isBusinessOwner, isAdmin, isNew]);

  useEffect(() => { if (!loading && !userId) nav({ to: "/login" }); }, [loading, userId, nav]);

  if (loading || allowed === null) return <div className="py-20 text-center text-muted-foreground">లోడ్...</div>;
  if (!allowed) return (
    <div className="container mx-auto max-w-md py-20 text-center">
      <h1 className="font-display text-2xl text-accent">ప్రవేశం లేదు</h1>
      <p className="mt-2 text-sm text-muted-foreground">{isNew ? "మీ వ్యాపార దరఖాస్తు ఆమోదం పొందాలి." : "ఈ లిస్టింగ్‌కి యాజమాన్యం లేదు."}</p>
      <Link to="/business/dashboard" className="mt-4 inline-block rounded-full bg-gradient-gold px-4 py-2 text-sm font-medium text-gold-foreground">డాష్‌బోర్డ్</Link>
    </div>
  );

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <Link to="/business/dashboard" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-accent">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>
      <h1 className="mt-2 font-display text-3xl text-gradient-gold">{isNew ? "కొత్త లిస్టింగ్" : "లిస్టింగ్ సవరించండి"}</h1>
      <p className="mt-1 text-sm text-muted-foreground">సేవ్ తర్వాత మీ సమర్పణ సమీక్షకు పంపబడుతుంది.</p>
      <div className="mt-6 rounded-2xl border border-border bg-card p-5">
        <ListingForm userId={userId!} isAdmin={false} listingId={isNew ? undefined : id} onSaved={() => nav({ to: "/business/dashboard" })} />
      </div>
    </div>
  );
}
