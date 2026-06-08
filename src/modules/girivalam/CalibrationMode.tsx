import { useRef, useState } from "react";
import routeImg from "./assets/lingams/route.jpg.asset.json";
import { CHECKPOINTS, START } from "./checkpoints";
import { applyCalibration, clearCalibration, exportCalibrationCode, loadCalibration, saveCalibration, type CalibrationMap } from "./calibration";

interface Props { onClose: () => void; }
type Node = { id: string; label: string; pxX: number; pxY: number; image?: string };

export function CalibrationMode({ onClose }: Props) {
  const [cal, setCal] = useState<CalibrationMap>(() => loadCalibration());
  const [dragging, setDragging] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const nodes: Node[] = [
    { id: "start", label: "Start", ...applyCalibration(START, cal.start) },
    ...CHECKPOINTS.map((c) => {
      const pos = applyCalibration(c, cal[c.id]);
      return { id: c.id, label: c.english, image: c.image, pxX: pos.pxX, pxY: pos.pxY };
    }),
  ];

  function moveTo(id: string, clientX: number, clientY: number) {
    const el = containerRef.current; if (!el) return;
    const r = el.getBoundingClientRect();
    const pxX = Math.max(0, Math.min(100, ((clientX - r.left) / r.width) * 100));
    const pxY = Math.max(0, Math.min(100, ((clientY - r.top) / r.height) * 100));
    const next: CalibrationMap = { ...cal, [id]: { pxX, pxY } };
    setCal(next); saveCalibration(next);
  }

  async function copyCode() {
    try { await navigator.clipboard.writeText(exportCalibrationCode()); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
  }

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur overflow-auto">
      <div className="max-w-3xl mx-auto p-3 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-bold text-gold">Calibration Mode</h2>
          <div className="flex gap-2">
            <button onClick={copyCode} className="px-3 py-1.5 rounded-md bg-saffron text-primary-foreground text-xs font-semibold">{copied ? "✓ Copied" : "Copy coords"}</button>
            <button onClick={() => { clearCalibration(); setCal({}); }} className="px-3 py-1.5 rounded-md bg-secondary text-secondary-foreground text-xs font-semibold">Reset</button>
            <button onClick={onClose} className="px-3 py-1.5 rounded-md bg-card border border-border text-xs font-semibold">Close</button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Drag each marker to its correct position on the route image. Saved locally.</p>
        <div
          ref={containerRef}
          onPointerMove={(e) => { if (!dragging) return; e.preventDefault(); moveTo(dragging, e.clientX, e.clientY); }}
          onPointerUp={() => setDragging(null)}
          onPointerLeave={() => setDragging(null)}
          className="relative w-full overflow-hidden rounded-xl border-2 border-gold/40 bg-card shadow-2xl touch-none select-none"
        >
          <img src={routeImg.url} alt="Calibration route" className="block w-full h-auto select-none pointer-events-none" draggable={false} />
          {nodes.map((n) => (
            <button
              key={n.id}
              onPointerDown={(e) => { e.preventDefault(); (e.target as HTMLElement).setPointerCapture(e.pointerId); setDragging(n.id); }}
              style={{ left: `${n.pxX}%`, top: `${n.pxY}%` }}
              className={`absolute -translate-x-1/2 -translate-y-1/2 z-10 cursor-grab active:cursor-grabbing ${dragging === n.id ? "scale-110 ring-4 ring-saffron/60" : ""}`}
              title={`${n.label} · ${n.pxX.toFixed(1)}, ${n.pxY.toFixed(1)}`}
            >
              <div className="size-10 md:size-12 rounded-full border-[3px] border-saffron bg-card shadow-lg overflow-hidden flex items-center justify-center text-[10px] font-bold">
                {n.image ? <img src={n.image} alt={n.label} className="size-full object-cover" /> : "0"}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
