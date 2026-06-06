import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export function AudioPlayer() {
  const ref = useRef<HTMLAudioElement>(null);
  const [muted, setMuted] = useState(true);
  const [url, setUrl] = useState<string | null>(null);
  const [vol, setVol] = useState(0.35);

  useEffect(() => {
    supabase
      .from("audio_settings")
      .select("audio_url, volume, is_active")
      .eq("is_active", true)
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.audio_url) {
          setUrl(data.audio_url);
          setVol(Number(data.volume) || 0.35);
        }
      });
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el || !url) return;
    el.volume = vol;
    const tryPlay = () => el.play().then(() => setMuted(false)).catch(() => {});
    tryPlay();
    const onClick = () => { tryPlay(); window.removeEventListener("click", onClick); };
    window.addEventListener("click", onClick, { once: true });
    return () => window.removeEventListener("click", onClick);
  }, [url, vol]);

  const toggle = () => {
    const el = ref.current;
    if (!el) return;
    if (el.paused) { el.play(); setMuted(false); }
    else { el.pause(); setMuted(true); }
  };

  if (!url) return null;

  return (
    <>
      <audio ref={ref} src={url} loop preload="auto" />
      <button
        onClick={toggle}
        aria-label={muted ? "Play chant" : "Pause chant"}
        className="fixed bottom-5 right-5 z-50 h-12 w-12 rounded-full bg-gradient-gold text-gold-foreground shadow-glow flex items-center justify-center hover:scale-110 transition-transform"
      >
        {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
      </button>
    </>
  );
}
