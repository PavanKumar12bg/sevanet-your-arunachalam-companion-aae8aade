import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

// Hidden, persistent background chanting. No visible controls.
// Admin manages source/volume via /admin/settings (audio).
export function AudioPlayer() {
  const ref = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("audio_settings")
      .select("audio_url, volume, is_active")
      .eq("is_active", true)
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled || !data?.audio_url) return;
        const el = ref.current;
        if (!el) return;
        el.src = data.audio_url;
        el.volume = Number(data.volume) || 0.35;
        el.loop = true;
        const tryPlay = () => el.play().catch(() => {});
        tryPlay();
        const onGesture = () => {
          tryPlay();
          window.removeEventListener("click", onGesture);
          window.removeEventListener("touchstart", onGesture);
          window.removeEventListener("keydown", onGesture);
        };
        window.addEventListener("click", onGesture, { once: true });
        window.addEventListener("touchstart", onGesture, { once: true });
        window.addEventListener("keydown", onGesture, { once: true });
      });
    return () => { cancelled = true; };
  }, []);

  return <audio ref={ref} loop preload="auto" aria-hidden className="hidden" />;
}
