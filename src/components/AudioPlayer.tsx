import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

// Global, persistent background chanting. Mounted once in __root, never unmounts.
// Survives login/logout/route changes because it lives in the root layout and
// remembers consent in localStorage so it auto-resumes on next visit.
const CONSENT_KEY = "sevanet:audio-consent";

export function AudioPlayer() {
  const ref = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let cancelled = false;

    const ensurePlaying = () => {
      if (!el.paused) return;
      el.play().catch(() => {});
    };

    supabase
      .from("audio_settings")
      .select("audio_url, volume, is_active")
      .eq("is_active", true)
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled || !data?.audio_url) return;
        el.src = data.audio_url;
        el.volume = Number(data.volume) || 0.35;
        el.loop = true;
        // If user has already consented in a previous session, try auto-play
        ensurePlaying();
      });

    // Capture the first user gesture to satisfy browser autoplay policy,
    // remember consent so we never need it again on this device.
    const onGesture = () => {
      try { localStorage.setItem(CONSENT_KEY, "1"); } catch {}
      ensurePlaying();
    };
    const opts: AddEventListenerOptions = { once: false, passive: true };
    window.addEventListener("pointerdown", onGesture, opts);
    window.addEventListener("keydown", onGesture, opts);

    // Auto-restart if audio gets paused by anything (auth flows, tab change, etc.)
    const onPause = () => {
      try {
        if (localStorage.getItem(CONSENT_KEY) === "1") ensurePlaying();
      } catch {}
    };
    el.addEventListener("pause", onPause);

    // Resume when tab becomes visible again
    const onVisible = () => { if (!document.hidden) onPause(); };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      window.removeEventListener("pointerdown", onGesture);
      window.removeEventListener("keydown", onGesture);
      el.removeEventListener("pause", onPause);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return <audio ref={ref} loop preload="auto" aria-hidden className="hidden" />;
}
