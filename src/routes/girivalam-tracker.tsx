import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CHECKPOINTS, GEOFENCE_RADIUS_M, haversine, START, TOTAL_KM, type LingamStatus } from "@/modules/girivalam/checkpoints";
import { RouteMap } from "@/modules/girivalam/RouteMap";
import { LingamSheet } from "@/modules/girivalam/LingamSheet";
import { useGirivalamTracker } from "@/modules/girivalam/use-tracker";
import { CalibrationMode } from "@/modules/girivalam/CalibrationMode";

export const Route = createFileRoute("/girivalam-tracker")({
  head: () => ({
    meta: [
      { title: "గిరివలం GPS Tracker · అరుణాచల · SevaNet" },
      { name: "description", content: "Automated Telugu GPS audio guide for the 14 km Arunachala Girivalam — 8 Lingam checkpoints with live tracking." },
      { name: "theme-color", content: "#c2410c" },
    ],
  }),
  component: GirivalamTrackerPage,
});

function GirivalamTrackerPage() {
  const { snapshot, live, cloud, pause, resume, reset } = useGirivalamTracker();
  const [selected, setSelected] = useState<string | null>(null);
  const [calibrating, setCalibrating] = useState(false);

  const pos = live.pos ?? snapshot.lastPos ?? { ...START, accuracy: 0, speed: null };
  const acc = live.pos?.accuracy ?? null;

  const statusOf = (id: string): LingamStatus => {
    if (snapshot.completed[id]) return "completed";
    if (live.pos) {
      const c = CHECKPOINTS.find((x) => x.id === id)!;
      if (haversine(live.pos, c) <= GEOFENCE_RADIUS_M * 2) return "reached";
    }
    return "pending";
  };

  const completedKm = Math.min(snapshot.distanceM / 1000, TOTAL_KM);
  const remainingKm = Math.max(0, TOTAL_KM - completedKm);
  const progressPct = Math.round((completedKm / TOTAL_KM) * 100);
  const nextLingam = CHECKPOINTS.find((c) => !snapshot.completed[c.id]) ?? null;
  const distToNext = nextLingam && live.pos ? haversine(live.pos, nextLingam) : null;
  const completedCount = Object.keys(snapshot.completed).length;
  const speedKmh = live.pos?.speed ? Math.max(0, live.pos.speed * 3.6) : 0;
  const elapsedMs = snapshot.startedAt ? (snapshot.endedAt ?? Date.now()) - snapshot.startedAt : 0;
  const h = Math.floor(elapsedMs / 3_600_000);
  const m = Math.floor((elapsedMs % 3_600_000) / 60_000);

  const allDone = completedCount === CHECKPOINTS.length && snapshot.completedPlayed;

  return (
    <main className="min-h-screen px-3 py-3 md:px-6 md:py-6 max-w-3xl mx-auto space-y-3">
      <header className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gold leading-tight">గిరివలం GPS Tracker</h1>
          <p className="text-xs md:text-sm text-muted-foreground">Automated Telugu audio guide · 14 km · 8 Lingams</p>
        </div>
        <div className="flex items-center gap-2">
          {!live.paused ? (
            <button onClick={pause} className="px-3 py-1.5 rounded-md bg-secondary text-secondary-foreground text-xs font-semibold">⏸ Pause</button>
          ) : (
            <button onClick={resume} className="px-3 py-1.5 rounded-md bg-saffron text-primary-foreground text-xs font-semibold">▶ Resume</button>
          )}
          <button onClick={() => setCalibrating(true)} className="px-3 py-1.5 rounded-md bg-card border border-border text-xs font-semibold">🎯 Calibrate</button>
        </div>
      </header>

      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span>
          {cloud.userId
            ? cloud.pending ? "☁️ Syncing…"
              : cloud.lastSyncedAt ? `☁️ Synced ${new Date(cloud.lastSyncedAt).toLocaleTimeString()}` : "☁️ Cloud sync ready"
            : "💾 Offline (localStorage). Sign in to sync across devices."}
        </span>
        {cloud.error && <span className="text-destructive">{cloud.error}</span>}
      </div>

      {live.error && (
        <div className="rounded-lg bg-destructive/20 border border-destructive px-3 py-2 text-sm">
          GPS error: {live.error}. Please enable location permission.
        </div>
      )}
      {acc !== null && acc > 30 && (
        <div className="rounded-lg bg-saffron/20 border border-saffron px-3 py-2 text-xs">GPS సిగ్నల్ బలహీనంగా · ±{Math.round(acc)} m</div>
      )}
      {live.paused && <div className="rounded-lg bg-muted border border-border px-3 py-2 text-xs">Tracking paused</div>}

      <RouteMap pos={pos} statusOf={statusOf} onSelect={setSelected} />

      <div className="flex items-center justify-between gap-2 text-xs">
        <div className="text-muted-foreground">
          {pos.lat.toFixed(5)}, {pos.lng.toFixed(5)}{acc !== null && <> · ±{Math.round(acc)} m</>}
        </div>
        <button onClick={reset} className="text-destructive hover:underline">Reset</button>
      </div>

      <section className="grid gap-3">
        <div className="grid grid-cols-3 gap-2">
          <Stat label="పూర్తయింది" sub="Completed" value={`${completedKm.toFixed(2)} km`} />
          <Stat label="మిగిలింది" sub="Remaining" value={`${remainingKm.toFixed(2)} km`} />
          <Stat label="ప్రగతి" sub="Progress" value={`${progressPct}%`} />
        </div>
        <div className="h-3 w-full rounded-full bg-secondary overflow-hidden">
          <div className="h-full bg-gradient-gold transition-all duration-500" style={{ width: `${progressPct}%` }} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Stat label="తదుపరి లింగం" sub="Next Lingam" value={nextLingam?.english ?? "—"} />
          <Stat label="దూరం" sub="Distance to next" value={distToNext !== null ? `${Math.round(distToNext)} m` : "—"} />
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <Mini label="Speed" value={`${speedKmh.toFixed(1)} km/h`} />
          <Mini label="Elapsed" value={snapshot.startedAt ? `${h}h ${m}m` : "—"} />
          <Mini label="Lingams" value={`${completedCount}/${CHECKPOINTS.length}`} />
        </div>
        <div className="grid grid-cols-4 gap-2">
          {CHECKPOINTS.map((c) => {
            const status = statusOf(c.id);
            const color = status === "completed" ? "bg-success/20 border-success text-success"
              : status === "reached" ? "bg-saffron/20 border-saffron text-saffron"
              : "bg-muted border-border text-muted-foreground";
            return (
              <button key={c.id} onClick={() => setSelected(c.id)} className={`rounded-md border px-2 py-1.5 text-center ${color}`}>
                <div className="text-[10px] uppercase tracking-wide truncate">{c.id}</div>
                <div className="text-xs font-semibold">{status === "completed" ? "✓" : status === "reached" ? "●" : "○"}</div>
              </button>
            );
          })}
        </div>
      </section>

      <footer className="text-center text-[11px] text-muted-foreground pt-2 pb-6">ॐ నమః శివాయ · Walk with devotion</footer>

      <LingamSheet selectedId={selected} userPos={pos} onClose={() => setSelected(null)} />
      {calibrating && <CalibrationMode onClose={() => setCalibrating(false)} />}

      {allDone && (
        <div className="fixed inset-0 z-50 bg-background/90 backdrop-blur flex items-center justify-center p-4">
          <div className="celebrate w-full max-w-md rounded-2xl bg-card border-2 border-gold p-6 shadow-2xl text-center space-y-4">
            <div className="text-5xl">🎉</div>
            <h2 className="text-3xl font-bold text-gold">గిరివలం పూర్తయింది</h2>
            <p className="text-foreground/80">Girivalam Complete</p>
            <button onClick={reset} className="w-full mt-4 rounded-lg bg-accent text-accent-foreground font-semibold py-3">Start New Girivalam</button>
          </div>
        </div>
      )}
    </main>
  );
}

function Stat({ label, sub, value }: { label: string; sub: string; value: string }) {
  return (
    <div className="rounded-lg bg-card border border-border p-3">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{sub}</div>
      <div className="text-base md:text-lg font-bold text-foreground mt-1">{value}</div>
    </div>
  );
}
function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-card border border-border p-2">
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className="text-sm font-semibold">{value}</div>
    </div>
  );
}
