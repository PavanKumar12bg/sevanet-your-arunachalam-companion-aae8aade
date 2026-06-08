import { CHECKPOINTS, START } from "./checkpoints";

const KEY = "girivalam-calibration-v1";

export interface CalibrationMap {
  start?: { pxX: number; pxY: number };
  [lingamId: string]: { pxX: number; pxY: number } | undefined;
}

export function loadCalibration(): CalibrationMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

export function saveCalibration(c: CalibrationMap) {
  try {
    localStorage.setItem(KEY, JSON.stringify(c));
    window.dispatchEvent(new Event("girivalam-calibration"));
  } catch {}
}

export function clearCalibration() {
  try {
    localStorage.removeItem(KEY);
    window.dispatchEvent(new Event("girivalam-calibration"));
  } catch {}
}

export function applyCalibration<T extends { pxX: number; pxY: number }>(
  defaults: T,
  override?: { pxX: number; pxY: number },
): T {
  return override ? { ...defaults, pxX: override.pxX, pxY: override.pxY } : defaults;
}

export function exportCalibrationCode(): string {
  const c = loadCalibration();
  const lines: string[] = [];
  const s = applyCalibration(START, c.start);
  lines.push(`export const START = { lat: ${START.lat}, lng: ${START.lng}, pxX: ${s.pxX}, pxY: ${s.pxY} };`);
  lines.push("// Lingam pxX/pxY overrides:");
  for (const cp of CHECKPOINTS) {
    const o = applyCalibration(cp, c[cp.id]);
    lines.push(`// ${cp.id}: pxX: ${o.pxX.toFixed(2)}, pxY: ${o.pxY.toFixed(2)}`);
  }
  return lines.join("\n");
}
