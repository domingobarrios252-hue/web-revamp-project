import { useState } from "react";
import { Upload, Crop as CropIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ImageCropEditor } from "@/components/admin/ImageCropEditor";
import type { ImageCrops } from "@/lib/imageCrops";

type Props = {
  /** Current public URL value */
  value: string;
  /** Called when a file finishes uploading or user types a URL */
  onChange: (url: string) => void;
  /** Storage bucket name (default: "media") */
  bucket?: string;
  /** Folder inside the bucket (e.g. "sponsors", "events") */
  folder: string;
  /** Optional name hint used as the file prefix (e.g. slug) */
  nameHint?: string;
  /** Accept attribute for the file input (default: image/*) */
  accept?: string;
  /** Preview classes applied to the rendered <img> */
  previewClassName?: string;
  /** Placeholder for the URL input */
  placeholder?: string;
  /** Optional crop metadata. When provided, shows "Editar encuadre" button. */
  crops?: ImageCrops | null;
  /** Called when the user saves new crop metadata. */
  onCropsChange?: (next: ImageCrops) => void;
};

function safeName(s?: string) {
  return (s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function ImageUploadField({
  value,
  onChange,
  bucket = "media",
  folder,
  nameHint,
  accept = "image/*",
  previewClassName = "mt-2 h-24 w-40 object-cover",
  placeholder = "URL o subir archivo",
  crops,
  onCropsChange,
}: Props) {
  const [uploading, setUploading] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() ?? "jpg";
      const prefix = safeName(nameHint) || crypto.randomUUID();
      const path = `${folder}/${prefix}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from(bucket).upload(path, file, {
        cacheControl: "3600",
        upsert: false,
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      onChange(data.publicUrl);
      // Reset crops on new image — the previous framing no longer applies.
      if (onCropsChange) onCropsChange({});
      toast.success("Imagen subida");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const cropsCount = crops ? Object.keys(crops).length : 0;

  return (
    <div>
      <div className="flex items-center gap-2">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="input flex-1"
        />
        <label className="font-condensed inline-flex cursor-pointer items-center gap-1 border border-border bg-background px-3 py-2 text-xs uppercase tracking-widest text-gold hover:bg-gold/10">
          <Upload className="h-3.5 w-3.5" /> {uploading ? "Subiendo…" : "Subir"}
          <input type="file" accept={accept} onChange={handleFile} className="hidden" />
        </label>
        {onCropsChange && value && (
          <button
            type="button"
            onClick={() => setEditorOpen(true)}
            className="font-condensed inline-flex items-center gap-1 border border-border bg-background px-3 py-2 text-xs uppercase tracking-widest text-gold hover:bg-gold/10"
            title="Definir recortes Hero, Card, Miniatura y Retrato"
          >
            <CropIcon className="h-3.5 w-3.5" /> Encuadre
            {cropsCount > 0 && (
              <span className="ml-1 rounded bg-gold/20 px-1 text-[10px]">{cropsCount}/4</span>
            )}
          </button>
        )}
      </div>
      {value && <img loading="lazy" decoding="async" src={value} alt="" className={previewClassName} />}
      {editorOpen && onCropsChange && value && (
        <ImageCropEditor
          imageUrl={value}
          value={crops ?? {}}
          onChange={onCropsChange}
          onClose={() => setEditorOpen(false)}
        />
      )}
    </div>
  );
}
