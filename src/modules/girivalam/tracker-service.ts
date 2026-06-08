// Isolated tracking service for /girivalam-tracker. All listeners are
// created on start() and destroyed on stop()/destroy().
import { AudioQueue } from "./audio-queue";
import type { AudioKey } from "./audio-registry";
import { CHECKPOINTS, GEOFENCE_RADIUS_M, haversine, START, TOTAL_KM } from "./checkpoints";

export interface TrackerSnapshot {
  startedAt: number | null;
  endedAt: number | null;
  pausedAt: number | null;
  completed: Record<string, number>;
  distanceM: number;
  lastPos: { lat: number; lng: number; ts: number; accuracy: number; speed: number | null } | null;
  alertsFired: Record<string, boolean>;
  startPlayed: boolean;
  completedPlayed: boolean;
  wrongRouteLastAt: number | null;
  gpsWeakActive: boolean;
}

const KEY = "girivalam-tracker-v2";
const DIST_THRESHOLDS: Array<{ d: number; key: AudioKey; tag: string }> = [
  { d: 1000, key: "next-1000m", tag: "1000m" },
  { d: 750, key: "next-750m", tag: "750m" },
  { d: 500, key: "next-500m", tag: "500m" },
  { d: 300, key: "next-300m", tag: "300m" },
  { d: 200, key: "next-200m", tag: "200m" },
  { d: 100, key: "next-100m", tag: "100m" },
  { d: 50, key: "next-50m", tag: "50m" },
];

const WRONG_ROUTE_M = 100;
const WRONG_ROUTE_REPEAT_MS = 5 * 60 * 1000;
const GPS_WEAK_M = 30;

function freshSnapshot(): TrackerSnapshot {
  return {
    startedAt: null, endedAt: null, pausedAt: null,
    completed: {}, distanceM: 0, lastPos: null, alertsFired: {},
    startPlayed: false, completedPlayed: false,
    wrongRouteLastAt: null, gpsWeakActive: false,
  };
}

function loadSnapshot(): TrackerSnapshot {
  if (typeof window === "undefined") return freshSnapshot();
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...freshSnapshot(), ...JSON.parse(raw) };
  } catch {}
  return freshSnapshot();
}

function saveSnapshot(s: TrackerSnapshot) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {}
}

export interface LiveData {
  pos: { lat: number; lng: number; accuracy: number; speed: number | null } | null;
  error: string | null;
  paused: boolean;
}

export type Listener = (s: TrackerSnapshot, live: LiveData) => void;

export class GirivalamTracker {
  private snapshot: TrackerSnapshot = loadSnapshot();
  private live: LiveData = { pos: null, error: null, paused: false };
  private queue = new AudioQueue();
  private watchId: number | null = null;
  private saveTimer: ReturnType<typeof setInterval> | null = null;
  private listeners = new Set<Listener>();
  private destroyed = false;

  getSnapshot() { return this.snapshot; }
  getLive() { return this.live; }

  applySnapshot(remote: TrackerSnapshot) {
    if (this.destroyed) return;
    const localCount = Object.keys(this.snapshot.completed).length;
    const remoteCount = Object.keys(remote.completed ?? {}).length;
    const localDist = this.snapshot.distanceM || 0;
    const remoteDist = remote.distanceM || 0;
    if (remoteCount > localCount || remoteDist > localDist) {
      this.snapshot = { ...freshSnapshot(), ...remote };
      saveSnapshot(this.snapshot);
      this.emit();
    }
  }

  subscribe(l: Listener) {
    this.listeners.add(l);
    l(this.snapshot, this.live);
    return () => { this.listeners.delete(l); };
  }

  private emit() { for (const l of this.listeners) l(this.snapshot, this.live); }

  start() {
    if (this.destroyed) return;
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      this.live.error = "Geolocation not supported";
      this.emit();
      return;
    }
    if (!this.snapshot.startedAt) this.snapshot.startedAt = Date.now();
    this.snapshot.pausedAt = null;
    this.live.paused = false;
    this.beginWatch();
    this.saveTimer = setInterval(() => saveSnapshot(this.snapshot), 10_000);
    this.emit();
  }

  private beginWatch() {
    if (this.watchId !== null) return;
    this.watchId = navigator.geolocation.watchPosition(
      (p) => this.handlePosition(p),
      (e) => { this.live.error = e.message; this.emit(); },
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 15000 },
    );
  }

  private handlePosition(p: GeolocationPosition) {
    if (this.destroyed || this.live.paused) return;
    this.live.error = null;
    const cur = {
      lat: p.coords.latitude, lng: p.coords.longitude,
      accuracy: p.coords.accuracy, speed: p.coords.speed,
    };
    this.live.pos = cur;

    if (this.snapshot.lastPos) {
      const d = haversine(this.snapshot.lastPos, cur);
      if (d < 100) this.snapshot.distanceM += d;
    }
    this.snapshot.lastPos = { ...cur, ts: Date.now() };

    if (cur.accuracy > GPS_WEAK_M) {
      if (!this.snapshot.gpsWeakActive) {
        this.snapshot.gpsWeakActive = true;
        this.queue.enqueue("gps-weak");
      }
    } else if (this.snapshot.gpsWeakActive) {
      this.snapshot.gpsWeakActive = false;
    }

    if (!this.snapshot.startPlayed) {
      const dStart = haversine(cur, START);
      if (dStart <= GEOFENCE_RADIUS_M) {
        this.snapshot.startPlayed = true;
        this.queue.enqueue("start");
      }
    }

    for (const c of CHECKPOINTS) {
      const d = haversine(cur, c);
      if (d <= GEOFENCE_RADIUS_M && !this.snapshot.completed[c.id]) {
        this.snapshot.completed[c.id] = Date.now();
        const key = c.id as AudioKey;
        this.queue.enqueue(key, () => this.queue.enqueue("arrival"));
      }
    }

    const next = CHECKPOINTS.find((c) => !this.snapshot.completed[c.id]);
    if (next) {
      const dNext = haversine(cur, next);
      for (const t of DIST_THRESHOLDS) {
        if (dNext <= t.d) {
          const tag = `${next.id}:${t.tag}`;
          if (!this.snapshot.alertsFired[tag]) {
            this.snapshot.alertsFired[tag] = true;
            this.queue.enqueue(t.key);
          }
        }
      }
    }

    const nodes = [START, ...CHECKPOINTS];
    const minD = Math.min(...nodes.map((n) => haversine(cur, n)));
    if (minD > WRONG_ROUTE_M) {
      const now = Date.now();
      if (!this.snapshot.wrongRouteLastAt || now - this.snapshot.wrongRouteLastAt > WRONG_ROUTE_REPEAT_MS) {
        this.snapshot.wrongRouteLastAt = now;
        this.queue.enqueue("wrong-route");
      }
    }

    const allDone = CHECKPOINTS.every((c) => this.snapshot.completed[c.id]);
    if (allDone && this.snapshot.distanceM / 1000 >= TOTAL_KM && !this.snapshot.completedPlayed) {
      this.snapshot.completedPlayed = true;
      this.snapshot.endedAt = Date.now();
      this.queue.enqueue("completed");
    }

    saveSnapshot(this.snapshot);
    this.emit();
  }

  pause() {
    if (this.destroyed) return;
    this.live.paused = true;
    this.snapshot.pausedAt = Date.now();
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    this.queue.enqueue("pause");
    saveSnapshot(this.snapshot);
    this.emit();
  }

  resume() {
    if (this.destroyed) return;
    this.live.paused = false;
    this.snapshot.pausedAt = null;
    this.queue.enqueue("resume");
    this.beginWatch();
    this.emit();
  }

  reset() {
    this.snapshot = freshSnapshot();
    saveSnapshot(this.snapshot);
    this.emit();
  }

  destroy() {
    this.destroyed = true;
    if (this.watchId !== null) {
      try { navigator.geolocation.clearWatch(this.watchId); } catch {}
      this.watchId = null;
    }
    if (this.saveTimer) clearInterval(this.saveTimer);
    this.queue.destroy();
    this.listeners.clear();
    saveSnapshot(this.snapshot);
  }
}
