// Optional Lovable Cloud sync for the Girivalam Tracker.
import { supabase } from "@/integrations/supabase/client";
import { CHECKPOINTS } from "./checkpoints";
import type { TrackerSnapshot } from "./tracker-service";

export interface CloudSyncState {
  userId: string | null;
  lastSyncedAt: number | null;
  error: string | null;
  pending: boolean;
}

export type CloudSyncListener = (s: CloudSyncState) => void;

export class CloudSync {
  private state: CloudSyncState = { userId: null, lastSyncedAt: null, error: null, pending: false };
  private listeners = new Set<CloudSyncListener>();
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private lastPushedJson = "";
  private authSub: { unsubscribe: () => void } | null = null;
  private destroyed = false;

  async init(): Promise<TrackerSnapshot | null> {
    try {
      const { data } = await supabase.auth.getUser();
      this.state.userId = data.user?.id ?? null;
    } catch { this.state.userId = null; }
    const sub = supabase.auth.onAuthStateChange((_e, session) => {
      this.state.userId = session?.user?.id ?? null;
      this.emit();
    });
    this.authSub = sub.data.subscription;
    this.emit();
    return this.state.userId ? this.pull() : null;
  }

  getState() { return this.state; }
  subscribe(l: CloudSyncListener) {
    this.listeners.add(l); l(this.state);
    return () => { this.listeners.delete(l); };
  }
  private emit() { for (const l of this.listeners) l({ ...this.state }); }

  async pull(): Promise<TrackerSnapshot | null> {
    if (!this.state.userId) return null;
    try {
      const { data, error } = await supabase
        .from("girivalam_progress")
        .select("snapshot, updated_at")
        .eq("user_id", this.state.userId)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      this.state.lastSyncedAt = new Date(data.updated_at).getTime();
      this.state.error = null;
      this.emit();
      return data.snapshot as unknown as TrackerSnapshot;
    } catch (e: any) {
      this.state.error = e?.message ?? "pull failed";
      this.emit();
      return null;
    }
  }

  push(snapshot: TrackerSnapshot) {
    if (!this.state.userId || this.destroyed) return;
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => this.flush(snapshot), 3000);
  }

  private async flush(snapshot: TrackerSnapshot) {
    if (!this.state.userId) return;
    const json = JSON.stringify(snapshot);
    if (json === this.lastPushedJson) return;
    this.state.pending = true; this.emit();
    try {
      const { error } = await supabase
        .from("girivalam_progress")
        .upsert({
          user_id: this.state.userId,
          snapshot: snapshot as any,
          distance_m: snapshot.distanceM,
          completed_count: Object.keys(snapshot.completed).length,
          is_completed:
            Object.keys(snapshot.completed).length === CHECKPOINTS.length &&
            snapshot.completedPlayed,
          started_at: snapshot.startedAt ? new Date(snapshot.startedAt).toISOString() : null,
          ended_at: snapshot.endedAt ? new Date(snapshot.endedAt).toISOString() : null,
        }, { onConflict: "user_id" });
      if (error) throw error;
      this.lastPushedJson = json;
      this.state.lastSyncedAt = Date.now();
      this.state.error = null;
    } catch (e: any) {
      this.state.error = e?.message ?? "push failed";
    } finally {
      this.state.pending = false; this.emit();
    }
  }

  destroy() {
    this.destroyed = true;
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    try { this.authSub?.unsubscribe(); } catch {}
    this.listeners.clear();
  }
}
