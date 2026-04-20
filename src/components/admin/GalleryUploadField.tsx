import { useState } from "react";
import { Upload, Trash2, ArrowLeft, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Props = {
  /** Current ordered list of public URLs */
  value: string[];
  /** Called whenever the list changes */
  onChange: (urls: string[]) => void;
  /** Storage bucket name (default: "media") */
  bucket?: string;
  /** Folder inside the bucket (e.g. "news", "events") */
  folder: string;
  /** Optional name hint used as the file prefix (e.g. slug) */
  nameHint?: string;
  /** Accept attribute for the file input */
  accept?: string;
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

export function GalleryUploadField({
  value,
  onChange,
  bucket = "media",
  folder,
  nameHint,
  accept = "image/*",
}: Props) {
  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput] = useState("");

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setUploading(true);
    const uploaded: string[] = [];
    try {
      for (const file of files) {
        const ext = file.name.split(".").pop() ?? "jpg";
        const prefix = safeName(nameHint) || crypto.randomUUID();
        const path = `${folder}/${prefix}-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)}.${ext}`;
        const { error } = await supabase.storage
          .from(bucket)
          .upload(path, file, { cacheControl: "3600", upsert: false });
        if (error) {
          toast.error(`${file.name}: ${error.message}`);
          continue;
        }
        const { data } = supabase.storage.from(bucket).getPublicUrl(path);
        uploaded.push(data.publicUrl);
      }
      if (uploaded.length > 0) {
        onChange([...value, ...uploaded]);
        toast.success(
          uploaded.length === 1 ? "Imagen subida" : `${uploaded.length} imágenes subidas`
        );
      }
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const addByUrl = () => {
    const url = urlInput.trim();
    if (!url) return;
    try {
      new URL(url);
    } catch {
      toast.error("URL no válida");
      return;
    }
    onChange([...value, url]);
    setUrlInput("");
  };

  const remove = (i: number) => {
    onChange(value.filter((_, idx) => idx !== i));
  };

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= value.length) return;
    const next = [...value];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <label className="font-condensed inline-flex cursor-pointer items-center gap-1 border border-border bg-background px-3 py-2 text-xs uppercase tracking-widest text-gold hover:bg-gold/10">
          <Upload className="h-3.5 w-3.5" />
          {uploading ? "Subiendo…" : "Subir imágenes"}
          <input
            type="file"
            accept={accept}
            multiple
            onChange={handleFiles}
            className="hidden"
            disabled={uploading}
          />
        </label>
        <div className="flex flex-1 items-center gap-2 min-w-[220px]">
          <input
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="…o pega una URL"
            className="w-full border border-border bg-background px-3 py-2 text-sm focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addByUrl();
              }
            }}
          />
          <button
            type="button"
            onClick={addByUrl}
            className="font-condensed border border-border px-3 py-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-gold"
          >
            Añadir
          </button>
        </div>
      </div>

      {value.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Aún no hay imágenes en la galería. Sube una o pega una URL.
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {value.map((url, i) => (
            <li
              key={`${url}-${i}`}
              className="group relative border border-border bg-background"
            >
              <img
                src={url}
                alt=""
                className="h-28 w-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.opacity = "0.3";
                }}
              />
              <div className="absolute inset-x-0 top-0 flex items-center justify-between bg-background/80 px-1 py-0.5 text-[10px] uppercase tracking-widest text-gold">
                <span>#{i + 1}</span>
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="text-muted-foreground hover:text-destructive"
                  title="Eliminar"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-background/80 px-1 py-0.5">
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  className="text-muted-foreground hover:text-gold disabled:opacity-30"
                  title="Mover a la izquierda"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i === value.length - 1}
                  className="text-muted-foreground hover:text-gold disabled:opacity-30"
                  title="Mover a la derecha"
                >
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
