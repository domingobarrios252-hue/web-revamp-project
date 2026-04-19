import { useState } from "react";
import { Upload, X, ArrowUp, ArrowDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Props = {
  value: string[];
  onChange: (urls: string[]) => void;
  bucket?: string;
  folder: string;
  nameHint?: string;
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
}: Props) {
  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput] = useState("");

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of files) {
        const ext = file.name.split(".").pop() ?? "jpg";
        const prefix = safeName(nameHint) || crypto.randomUUID();
        const path = `${folder}/${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
        const { error } = await supabase.storage.from(bucket).upload(path, file, {
          cacheControl: "3600",
          upsert: false,
        });
        if (error) {
          toast.error(`${file.name}: ${error.message}`);
          continue;
        }
        const { data } = supabase.storage.from(bucket).getPublicUrl(path);
        uploaded.push(data.publicUrl);
      }
      if (uploaded.length > 0) {
        onChange([...value, ...uploaded]);
        toast.success(`${uploaded.length} imagen(es) añadida(s)`);
      }
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const addUrl = () => {
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
    const next = [...value];
    next.splice(i, 1);
    onChange(next);
  };

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= value.length) return;
    const next = [...value];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <div>
      <div className="flex items-center gap-2">
        <input
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addUrl();
            }
          }}
          placeholder="Pega una URL y pulsa Enter, o sube archivos"
          className="input flex-1"
        />
        <button
          type="button"
          onClick={addUrl}
          className="font-condensed border border-border bg-background px-3 py-2 text-xs uppercase tracking-widest text-muted-foreground hover:border-gold hover:text-gold"
        >
          Añadir URL
        </button>
        <label className="font-condensed inline-flex cursor-pointer items-center gap-1 border border-border bg-background px-3 py-2 text-xs uppercase tracking-widest text-gold hover:bg-gold/10">
          <Upload className="h-3.5 w-3.5" /> {uploading ? "Subiendo…" : "Subir"}
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFiles}
            className="hidden"
          />
        </label>
      </div>

      {value.length > 0 ? (
        <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {value.map((url, i) => (
            <li
              key={`${url}-${i}`}
              className="group relative border border-border bg-background"
            >
              <img src={url} alt="" className="h-24 w-full object-cover" />
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-background/85 px-1.5 py-1 opacity-0 transition-opacity group-hover:opacity-100">
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                    className="text-muted-foreground hover:text-gold disabled:opacity-30"
                    title="Mover arriba"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(i, 1)}
                    disabled={i === value.length - 1}
                    className="text-muted-foreground hover:text-gold disabled:opacity-30"
                    title="Mover abajo"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="text-muted-foreground hover:text-destructive"
                  title="Eliminar"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <span className="font-condensed absolute left-1 top-1 bg-background/80 px-1 text-[10px] text-gold">
                {i + 1}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="font-condensed mt-3 text-[11px] uppercase tracking-widest text-muted-foreground">
          Sin imágenes en la galería todavía.
        </p>
      )}
    </div>
  );
}
