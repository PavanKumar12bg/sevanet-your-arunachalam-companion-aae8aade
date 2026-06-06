import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, X } from "lucide-react";

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
    for (const file of Array.from(files)) {
      if (file.size > 5 * 1024 * 1024) { toast.error(`${file.name}: 5MB మించకూడదు`); continue; }
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from(bucket).upload(path, file, { cacheControl: "3600", upsert: false });
      if (error) { toast.error(error.message); continue; }
      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      added.push({ url: data.publicUrl, storage_path: path });
    }
    onChange([...value, ...added]);
    setBusy(false);
  };

  const remove = async (img: UploadedImage) => {
    await supabase.storage.from(bucket).remove([img.storage_path]).catch(() => null);
    onChange(value.filter((v) => v.storage_path !== img.storage_path));
  };

  return (
    <div>
      <label className="text-sm font-medium">{label}</label>
      <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
        {value.map((img) => (
          <div key={img.storage_path} className="relative aspect-square overflow-hidden rounded-lg border border-border">
            <img src={img.url} alt="" className="h-full w-full object-cover" />
            <button type="button" onClick={() => remove(img)} className="absolute right-1 top-1 rounded-full bg-background/80 p-1 text-foreground hover:bg-destructive hover:text-destructive-foreground">
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        {value.length < max && (
          <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border text-muted-foreground hover:border-accent hover:text-accent">
            <Upload className="h-5 w-5" />
            <span className="text-xs">{busy ? "..." : "Add"}</span>
            <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => upload(e.target.files)} disabled={busy} />
          </label>
        )}
      </div>
    </div>
  );
}
