import indraImg from "./assets/lingams/indra.jpg.asset.json";
import agniImg from "./assets/lingams/agni.jpg.asset.json";
import yamaImg from "./assets/lingams/yama.jpg.asset.json";
import niruthiImg from "./assets/lingams/niruthi.jpg.asset.json";
import varunaImg from "./assets/lingams/varuna.jpg.asset.json";
import vayuImg from "./assets/lingams/vayu.jpg.asset.json";
import kuberaImg from "./assets/lingams/kubera.jpg.asset.json";
import esanyaImg from "./assets/lingams/esanya.jpg.asset.json";

export interface Checkpoint {
  id: string;
  km: number;
  english: string;
  telugu: string;
  lat: number;
  lng: number;
  image: string;
  pxX: number;
  pxY: number;
}

export const START = { lat: 12.23113, lng: 79.07094, pxX: 78, pxY: 78 };

export const CHECKPOINTS: Checkpoint[] = [
  { id: "indra",   km: 1,  english: "Indra Lingam",   telugu: "ఇంద్ర లింగం",   lat: 12.22954, lng: 79.07034, image: indraImg.url,   pxX: 82, pxY: 72 },
  { id: "agni",    km: 2,  english: "Agni Lingam",    telugu: "అగ్ని లింగం",   lat: 12.22438, lng: 79.05913, image: agniImg.url,    pxX: 50, pxY: 82 },
  { id: "yama",    km: 3,  english: "Yama Lingam",    telugu: "యమ లింగం",     lat: 12.22666, lng: 79.04445, image: yamaImg.url,    pxX: 22, pxY: 82 },
  { id: "niruthi", km: 5,  english: "Niruthi Lingam", telugu: "నిరృతి లింగం", lat: 12.23482, lng: 79.03262, image: niruthiImg.url, pxX: 10, pxY: 55 },
  { id: "varuna",  km: 7,  english: "Varuna Lingam",  telugu: "వరుణ లింగం",   lat: 12.24963, lng: 79.03466, image: varunaImg.url,  pxX: 12, pxY: 30 },
  { id: "vayu",    km: 8,  english: "Vayu Lingam",    telugu: "వాయు లింగం",   lat: 12.25790, lng: 79.04735, image: vayuImg.url,    pxX: 26, pxY: 14 },
  { id: "kubera",  km: 10, english: "Kubera Lingam",  telugu: "కుబేర లింగం",  lat: 12.25550, lng: 79.06108, image: kuberaImg.url,  pxX: 58, pxY: 11 },
  { id: "esanya",  km: 11, english: "Esanya Lingam",  telugu: "ఈశాన్య లింగం", lat: 12.24544, lng: 79.07395, image: esanyaImg.url,  pxX: 86, pxY: 30 },
];

export const TOTAL_KM = 14;
export const GEOFENCE_RADIUS_M = 50;

export function haversine(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function projectToImage(
  pos: { lat: number; lng: number },
  overrides?: Record<string, { pxX: number; pxY: number } | undefined>,
): { x: number; y: number } {
  const s = overrides?.start ?? { pxX: START.pxX, pxY: START.pxY };
  const cps = CHECKPOINTS.map((c) => {
    const o = overrides?.[c.id];
    return { lat: c.lat, lng: c.lng, pxX: o?.pxX ?? c.pxX, pxY: o?.pxY ?? c.pxY };
  });
  const nodes = [
    { lat: START.lat, lng: START.lng, pxX: s.pxX, pxY: s.pxY },
    ...cps,
    { lat: START.lat, lng: START.lng, pxX: s.pxX, pxY: s.pxY },
  ];
  let best = { dist: Infinity, x: nodes[0].pxX, y: nodes[0].pxY };
  for (let i = 0; i < nodes.length - 1; i++) {
    const a = nodes[i];
    const b = nodes[i + 1];
    const ab = haversine(a, b);
    const ap = haversine(a, pos);
    const bp = haversine(b, pos);
    let t = (ap * ap - bp * bp + ab * ab) / (2 * ab * ab);
    t = Math.max(0, Math.min(1, t));
    const px = a.pxX + (b.pxX - a.pxX) * t;
    const py = a.pxY + (b.pxY - a.pxY) * t;
    const projLat = a.lat + (b.lat - a.lat) * t;
    const projLng = a.lng + (b.lng - a.lng) * t;
    const d = haversine(pos, { lat: projLat, lng: projLng });
    if (d < best.dist) best = { dist: d, x: px, y: py };
  }
  return { x: best.x, y: best.y };
}

export type LingamStatus = "pending" | "reached" | "completed";
