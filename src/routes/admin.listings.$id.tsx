import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { ListingForm } from "@/components/ListingForm";
import { useRole } from "@/lib/use-role";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/admin/listings/$id")({
  ssr: false,
  component: AdminListingEdit,
});

function AdminListingEdit() {
  const { id } = useParams({ from: "/admin/listings/$id" });
  const { userId, isAdmin, loading } = useRole();
  const nav = useNavigate();
  const isNew = id === "new";

  if (loading || !userId) return <div className="py-10 text-center text-muted-foreground">లోడ్...</div>;
  if (!isAdmin) return <div className="py-10 text-center text-destructive">Access denied</div>;

  return (
    <div>
      <Link to="/admin/listings" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-accent">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>
      <h1 className="mt-2 font-display text-3xl text-gradient-gold">{isNew ? "New Listing" : "Edit Listing"}</h1>
      <div className="mt-6 rounded-2xl border border-border bg-card p-5">
        <ListingForm userId={userId} isAdmin listingId={isNew ? undefined : id} onSaved={() => nav({ to: "/admin/listings" })} />
      </div>
    </div>
  );
}
