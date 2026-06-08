import startA from "./assets/audio/start.mp3.asset.json";
import indraA from "./assets/audio/indra.mp3.asset.json";
import agniA from "./assets/audio/agni.mp3.asset.json";
import yamaA from "./assets/audio/yama.mp3.asset.json";
import niruthiA from "./assets/audio/niruthi.mp3.asset.json";
import varunaA from "./assets/audio/varuna.mp3.asset.json";
import vayuA from "./assets/audio/vayu.mp3.asset.json";
import kuberaA from "./assets/audio/kubera.mp3.asset.json";
import esanyaA from "./assets/audio/Eshanya.mp3.asset.json";
import arrivalA from "./assets/audio/arrival.mp3.asset.json";
import completedA from "./assets/audio/Completed.mp3.asset.json";
import wrongRouteA from "./assets/audio/wrong-route.mp3.asset.json";
import pauseA from "./assets/audio/pause.mp3.asset.json";
import resumeA from "./assets/audio/resume.mp3.asset.json";
import gpsWeakA from "./assets/audio/gps-weak.mp3.asset.json";
import n1000 from "./assets/audio/next-1000m.mp3.asset.json";
import n750 from "./assets/audio/next-750m.mp3.asset.json";
import n500 from "./assets/audio/next-500m.mp3.asset.json";
import n300 from "./assets/audio/next-300m.mp3.asset.json";
import n200 from "./assets/audio/next-200m.mp3.asset.json";
import n100 from "./assets/audio/next-100m.mp3.asset.json";
import n50 from "./assets/audio/next-50m.mp3.asset.json";

export type AudioKey =
  | "start" | "indra" | "agni" | "yama" | "niruthi" | "varuna" | "vayu" | "kubera" | "esanya"
  | "arrival" | "completed" | "wrong-route" | "pause" | "resume" | "gps-weak"
  | "next-1000m" | "next-750m" | "next-500m" | "next-300m" | "next-200m" | "next-100m" | "next-50m";

export const AUDIO_REGISTRY: Partial<Record<AudioKey, string>> = {
  start: startA.url, indra: indraA.url, agni: agniA.url, yama: yamaA.url,
  niruthi: niruthiA.url, varuna: varunaA.url, vayu: vayuA.url, kubera: kuberaA.url,
  esanya: esanyaA.url, arrival: arrivalA.url, completed: completedA.url,
  "wrong-route": wrongRouteA.url, pause: pauseA.url, resume: resumeA.url,
  "gps-weak": gpsWeakA.url,
  "next-1000m": n1000.url, "next-750m": n750.url, "next-500m": n500.url,
  "next-300m": n300.url, "next-200m": n200.url, "next-100m": n100.url, "next-50m": n50.url,
};

export function getAudioUrl(key: AudioKey): string | null {
  const url = AUDIO_REGISTRY[key];
  if (!url) {
    console.warn(`[girivalam-audio] missing audio for "${key}"`);
    return null;
  }
  return url;
}
