import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type Announcement = { id: string; message: string; link_url: string | null };

export function AnnouncementBar() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    let active = true;
    supabase
      .from("announcements" as any)
      .select("id,message,link_url")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .then(({ data }) => {
        if (!active) return;
        setItems(((data as any) ?? []) as Announcement[]);
      });
    return () => { active = false; };
  }, []);

  if (!mounted || items.length === 0) return null;

  // Repeat list 2× for a seamless infinite marquee.
  const loop = [...items, ...items];

  return (
    <div
      className="sticky top-16 z-30 border-b border-accent/30 bg-gradient-to-r from-accent/10 via-accent/5 to-accent/10 backdrop-blur-md"
      role="region"
      aria-label="Announcements"
    >
      <div className="marquee group overflow-hidden whitespace-nowrap py-2 text-sm text-foreground/90">
        <div className="marquee-track inline-flex gap-12 px-4 will-change-transform">
          {loop.map((a, i) => (
            <span key={`${a.id}-${i}`} className="inline-flex items-center gap-2">
              {a.link_url ? (
                <a href={a.link_url} className="hover:text-accent transition-colors">{a.message}</a>
              ) : (
                <span>{a.message}</span>
              )}
              <span aria-hidden className="text-accent/60">•</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
