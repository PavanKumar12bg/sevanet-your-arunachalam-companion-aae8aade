import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, X, ImageOff } from "lucide-react";
import { optimizeToWebp, validateInput, makeWebpFilename } from "@/lib/image-optimize";

export interface UploadedImage {
  url: string;
  storage_path: string;
}

interface Props {
  bucket: "listings" | "reviews" | "avatars";
  userId: string;
  value: UploadedImage[];
  onChange: (next: UploadedImage[]) => void;
  max?: number;
  label?: string;
}

const SIGNED_TTL = 60 * 60 * 24 * 365 * 10; // ~10 years

export async function signImage(bucket: string, path: string): Promise<string | null> {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, SIGNED_TTL);
  if (error) return null;
  return data.signedUrl;
}

export function ImageUploader({ bucket, userId, value, onChange, max = 10, label = "చిత్రాలు" }: Props) {
  const [busy, setBusy] = useState(false);

  const upload = async (files: FileList | null) => {
    if (!files || !files.length) return;
    if (value.length + files.length > max) {
      toast.error(`గరిష్టంగా ${max} చిత్రాలు మాత్రమే`);
      return;
    }
    setBusy(true);
    const added: UploadedImage[] = [];
    const t = toast.loading("Optimizing & uploading…");
    try {
      for (const file of Array.from(files)) {
        const err = validateInput(file);
        if (err) { toast.error(err); continue; }

        const { file: webp, originalSize, optimizedSize, reductionPct } = await optimizeToWebp(file);
        const path = `${userId}/${makeWebpFilename()}`;

        const { error } = await supabase.storage.from(bucket).upload(path, webp, {
          cacheControl: "3600",
          upsert: false,
          contentType: "image/webp",
        });
        if (error) { toast.error(`Upload failed: ${error.message}`); continue; }

        const signed = await signImage(bucket, path);
        if (!signed) { toast.error(`Could not generate URL for ${file.name}`); continue; }

        if (reductionPct > 0) {
          console.info(`[image] ${file.name}: ${(originalSize/1024).toFixed(0)}KB → ${(optimizedSize/1024).toFixed(0)}KB (-${reductionPct}%)`);
        }
        added.push({ url: signed, storage_path: path });
      }
      if (added.length) toast.success(`Uploaded ${added.length} image(s)`);
    } finally {
      toast.dismiss(t);
      setBusy(false);
    }
    if (added.length) onChange([...value, ...added]);
  };

  const remove = async (img: UploadedImage) => {
    await supabase.storage.from(bucket).remove([img.storage_path]).catch(() => null);
    onChange(value.filter((v) => v.storage_path !== img.storage_path));
  };

  return (
    <div>
      <label className="text-sm font-medium">{label}</label>
      <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WEBP, HEIC · max 10MB · auto-converted to WEBP</p>
      <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
        {value.map((img) => (
          <div key={img.storage_path} className="relative aspect-square overflow-hidden rounded-lg border border-border bg-muted">
            <img
              src={img.url}
              alt=""
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover"
              onError={(e) => {
                const el = e.currentTarget;
                el.style.display = "none";
                (el.nextElementSibling as HTMLElement | null)?.style.removeProperty("display");
              }}
            />
            <div style={{ display: "none" }} className="absolute inset-0 flex items-center justify-center text-muted-foreground">
              <ImageOff className="h-5 w-5" />
            </div>
            <button type="button" onClick={() => remove(img)} className="absolute right-1 top-1 rounded-full bg-background/80 p-1 text-foreground hover:bg-destructive hover:text-destructive-foreground">
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        {value.length < max && (
          <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border text-muted-foreground hover:border-accent hover:text-accent">
            <Upload className="h-5 w-5" />
            <span className="text-xs">{busy ? "Working…" : "Add"}</span>
            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif,.heic,.heif"
              multiple
              className="hidden"
              onChange={(e) => { void upload(e.target.files); e.target.value = ""; }}
              disabled={busy}
            />
          </label>
        )}
      </div>
    </div>
  );
}
