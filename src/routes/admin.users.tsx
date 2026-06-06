import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/users")({
  ssr: false,
  component: AdminUsers,
});

const ALL_ROLES = ["super_admin", "admin", "business_owner", "user"] as const;

function AdminUsers() {
  const [rows, setRows] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    let pq = supabase.from("profiles").select("id,full_name,phone,preferred_language,created_at").order("created_at", { ascending: false }).limit(300);
    if (q) pq = pq.ilike("full_name", `%${q}%`);
    const { data: profiles } = await pq;
    const ids = (profiles ?? []).map((p) => p.id);
    const { data: roles } = ids.length ? await supabase.from("user_roles").select("user_id,role").in("user_id", ids) : { data: [] as any[] };
    const map = new Map<string, string[]>();
    (roles ?? []).forEach((r: any) => { const arr = map.get(r.user_id) ?? []; arr.push(r.role); map.set(r.user_id, arr); });
    setRows((profiles ?? []).map((p) => ({ ...p, roles: map.get(p.id) ?? [] })));
    setLoading(false);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const toggleRole = async (userId: string, role: string, has: boolean) => {
    if (has) {
      const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role as any);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: role as any });
      if (error) return toast.error(error.message);
    }
    load();
  };

  return (
    <div>
      <h1 className="font-display text-3xl text-gradient-gold">Users</h1>
      <form onSubmit={(e) => { e.preventDefault(); load(); }} className="mt-4 flex gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name..." className="flex-1 rounded-lg border border-input bg-background px-3 py-2" />
        <button className="rounded-lg border border-border px-4 hover:border-accent">Search</button>
      </form>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/30 text-left text-xs uppercase text-muted-foreground">
            <tr><th className="p-3">Name</th><th className="p-3">Phone</th><th className="p-3">Roles</th><th className="p-3">Joined</th></tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">లోడ్...</td></tr> :
              rows.map((u) => (
                <tr key={u.id} className="border-t border-border align-top">
                  <td className="p-3 font-medium">{u.full_name || "—"}<div className="text-xs text-muted-foreground">{u.id.slice(0, 8)}...</div></td>
                  <td className="p-3 text-muted-foreground">{u.phone || "—"}</td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1">
                      {ALL_ROLES.map((r) => {
                        const has = u.roles.includes(r);
                        return (
                          <button key={r} onClick={() => toggleRole(u.id, r, has)}
                            className={`rounded-full px-2.5 py-1 text-xs transition ${has ? "bg-accent text-accent-foreground" : "border border-border text-muted-foreground hover:border-accent"}`}>
                            {r}
                          </button>
                        );
                      })}
                    </div>
                  </td>
                  <td className="p-3 text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
