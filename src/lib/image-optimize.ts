// Browser-side image optimization for listing uploads.
// Resizes (max 1280px wide), compresses (~75% quality) and converts to WEBP.
// Falls back to original file if compression fails.

export type OptimizedImage = {
  file: File;
  originalSize: number;
  optimizedSize: number;
  reductionPct: number;
};

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const MAX_WIDTH = 1280;
const QUALITY = 0.75;

export const ACCEPTED_INPUT = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
];

export function validateInput(file: File): string | null {
  // Some browsers report HEIC with empty mime; accept by extension.
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  const heic = ext === "heic" || ext === "heif";
  if (!heic && file.type && !ACCEPTED_INPUT.includes(file.type)) {
    return `${file.name}: unsupported format (JPG, PNG, WEBP, HEIC only)`;
  }
  if (file.size > MAX_BYTES) {
    return `${file.name}: maximum upload size is 10 MB`;
  }
  return null;
}

export async function optimizeToWebp(file: File): Promise<OptimizedImage> {
  const originalSize = file.size;
  try {
    const mod = await import("browser-image-compression");
    const compress = mod.default ?? (mod as any);
    const compressed: File = await compress(file, {
      maxSizeMB: 0.5,
      maxWidthOrHeight: MAX_WIDTH,
      useWebWorker: true,
      fileType: "image/webp",
      initialQuality: QUALITY,
    });
    return {
      file: compressed,
      originalSize,
      optimizedSize: compressed.size,
      reductionPct: originalSize > 0 ? Math.round((1 - compressed.size / originalSize) * 100) : 0,
    };
  } catch (e) {
    console.warn("Image optimization failed, uploading original", e);
    return { file, originalSize, optimizedSize: originalSize, reductionPct: 0 };
  }
}

export function makeWebpFilename(): string {
  const ts = Date.now();
  const rand = Math.random().toString(36).slice(2, 8);
  return `listing-${ts}-${rand}.webp`;
}
