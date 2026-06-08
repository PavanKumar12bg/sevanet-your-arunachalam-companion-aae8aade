import { useEffect, useState } from "react";
import { CHECKPOINTS, START, projectToImage, TOTAL_KM, type LingamStatus } from "./checkpoints";
import routeImg from "./assets/lingams/route.jpg.asset.json";
import { loadCalibration, type CalibrationMap } from "./calibration";

interface Props {
  pos: { lat: number; lng: number; accuracy: number };
  statusOf: (id: string) => LingamStatus;
  onSelect: (id: string) => void;
}

export function RouteMap({ pos, statusOf, onSelect }: Props) {
  const [cal, setCal] = useState<CalibrationMap>(() => loadCalibration());
  const [imgLoaded, setImgLoaded] = useState(false);

  useEffect(() => {
    const onChange = () => setCal(loadCalibration());
    window.addEventListener("storage", onChange);
    window.addEventListener("girivalam-calibration", onChange);
    return () => {
      window.removeEventListener("storage", onChange);
      window.removeEventListener("girivalam-calibration", onChange);
    };
  }, []);

  const userPx = projectToImage(pos, cal);
  const startPos = cal.start ?? { pxX: START.pxX, pxY: START.pxY };

  return (
    <div className="relative w-full overflow-hidden rounded-xl border-2 border-gold/40 bg-card shadow-2xl">
      <img
        src={routeImg.url}
        alt="Arunachala Girivalam route map with 8 Lingam checkpoints"
        onLoad={() => setImgLoaded(true)}
        onError={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = "0.2"; }}
        className="block w-full h-auto select-none"
        draggable={false}
      />
      {imgLoaded && (
        <>
          <div style={{ left: `${startPos.pxX}%`, top: `${startPos.pxY}%` }} className="absolute -translate-x-1/2 -translate-y-1/2">
            <div className="size-8 md:size-10 rounded-full border-[3px] border-accent bg-accent text-accent-foreground font-bold flex items-center justify-center shadow-lg">0</div>
          </div>
          {CHECKPOINTS.map((c) => {
            const status = statusOf(c.id);
            const o = cal[c.id];
            const cx = o?.pxX ?? c.pxX;
            const cy = o?.pxY ?? c.pxY;
            const ring =
              status === "completed" ? "border-success ring-2 ring-success/50"
              : status === "reached" ? "border-saffron ring-2 ring-saffron/60"
              : "border-muted-foreground/60";
            const grayed = status === "pending" ? "grayscale-[40%] opacity-90" : "";
            return (
              <button
                key={c.id}
                onClick={() => onSelect(c.id)}
                aria-label={`${c.english} checkpoint`}
                style={{ left: `${cx}%`, top: `${cy}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 group focus:outline-none"
              >
                <div className={`size-12 md:size-16 rounded-full overflow-hidden border-[3px] ${ring} ${grayed} shadow-lg bg-card transition-transform group-hover:scale-110 group-active:scale-95`}>
                  <img src={c.image} alt={c.english} onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} className="size-full object-cover" />
                </div>
                <div className="absolute left-1/2 -translate-x-1/2 -bottom-5 whitespace-nowrap text-[10px] md:text-xs font-semibold text-foreground bg-background/85 px-1.5 py-0.5 rounded shadow">
                  {c.km}/{TOTAL_KM}
                </div>
              </button>
            );
          })}
          <div
            style={{ left: `${userPx.x}%`, top: `${userPx.y}%` }}
            className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20"
          >
            <div className="size-5 rounded-full bg-gps border-2 border-white shadow-lg gps-pulse" />
          </div>
        </>
      )}
    </div>
  );
}
