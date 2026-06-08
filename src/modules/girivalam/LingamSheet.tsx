import { CHECKPOINTS, haversine } from "./checkpoints";
import { AUDIO_REGISTRY, type AudioKey } from "./audio-registry";

interface Props {
  selectedId: string | null;
  userPos: { lat: number; lng: number } | null;
  onClose: () => void;
}

export function LingamSheet({ selectedId, userPos, onClose }: Props) {
  if (!selectedId) return null;
  const c = CHECKPOINTS.find((x) => x.id === selectedId);
  if (!c) return null;
  const distance = userPos ? haversine(userPos, c) : null;
  const audioUrl = AUDIO_REGISTRY[c.id as AudioKey];

  return (
    <div className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm flex items-end md:items-center justify-center p-3" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl bg-card border border-gold/40 shadow-2xl overflow-hidden">
        <div className="relative">
          <img src={c.image} alt={c.english} onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} className="w-full h-64 object-cover" />
          <button onClick={onClose} className="absolute top-2 right-2 size-8 rounded-full bg-background/80 text-foreground" aria-label="Close">✕</button>
        </div>
        <div className="p-4 space-y-3">
          <div>
            <div className="text-2xl font-bold text-accent">{c.telugu}</div>
            <div className="text-lg font-semibold">{c.english}</div>
            <div className="text-xs text-muted-foreground">KM {c.km}/14 · {c.lat.toFixed(5)}, {c.lng.toFixed(5)}</div>
          </div>
          {distance !== null && (
            <div className="rounded-lg bg-secondary/60 p-3 text-center">
              <div className="text-xs text-muted-foreground">Distance from you</div>
              <div className="text-xl font-bold text-saffron">
                {distance < 1000 ? `${distance.toFixed(0)} m` : `${(distance / 1000).toFixed(2)} km`}
              </div>
            </div>
          )}
          {audioUrl && (
            <button
              onClick={() => { try { new Audio(audioUrl).play().catch(() => {}); } catch {} }}
              className="w-full rounded-lg bg-gradient-gold text-gold-foreground font-semibold py-3 shadow-lg active:scale-95 transition"
            >🔊 Play Telugu Audio Guide</button>
          )}
        </div>
      </div>
    </div>
  );
}
