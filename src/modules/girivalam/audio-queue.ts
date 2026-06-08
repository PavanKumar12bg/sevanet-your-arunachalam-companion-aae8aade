// Audio queue with priority. Never overlaps. Requests global audio focus
// while playing so SevaNet's background chanting pauses automatically.
import { AudioKey, getAudioUrl } from "./audio-registry";
import { audioFocus } from "@/lib/audio-focus";

const PRIORITY: Record<AudioKey, number> = {
  completed: 0,
  indra: 1, agni: 1, yama: 1, niruthi: 1, varuna: 1, vayu: 1, kubera: 1, esanya: 1, start: 1,
  arrival: 2,
  "wrong-route": 3,
  "gps-weak": 4,
  "next-1000m": 5, "next-750m": 5, "next-500m": 5, "next-300m": 5,
  "next-200m": 5, "next-100m": 5, "next-50m": 5,
  pause: 2, resume: 2,
};

interface QueueItem { key: AudioKey; onEnd?: () => void; }

export class AudioQueue {
  private queue: QueueItem[] = [];
  private current: HTMLAudioElement | null = null;
  private destroyed = false;
  private focusHeld = false;

  enqueue(key: AudioKey, onEnd?: () => void) {
    if (this.destroyed) return;
    const url = getAudioUrl(key);
    if (!url) { onEnd?.(); return; }
    this.queue.push({ key, onEnd });
    this.queue.sort((a, b) => PRIORITY[a.key] - PRIORITY[b.key]);
    this.acquireFocus();
    this.tick();
  }

  private acquireFocus() {
    if (this.focusHeld) return;
    this.focusHeld = true;
    audioFocus.request();
  }

  private releaseFocus() {
    if (!this.focusHeld) return;
    this.focusHeld = false;
    audioFocus.release();
  }

  private tick() {
    if (this.destroyed) return;
    if (this.current) return;
    const next = this.queue.shift();
    if (!next) { this.releaseFocus(); return; }
    const url = getAudioUrl(next.key);
    if (!url) { next.onEnd?.(); this.tick(); return; }
    const a = new Audio(url);
    this.current = a;
    const advance = () => {
      this.current = null;
      next.onEnd?.();
      this.tick();
    };
    a.addEventListener("ended", advance);
    a.addEventListener("error", () => {
      console.warn(`[girivalam-audio] failed to play ${next.key}`);
      advance();
    });
    a.play().catch((err) => {
      console.warn(`[girivalam-audio] play blocked for ${next.key}`, err);
      advance();
    });
  }

  destroy() {
    this.destroyed = true;
    if (this.current) { try { this.current.pause(); } catch {} this.current = null; }
    this.queue = [];
    this.releaseFocus();
  }
}
