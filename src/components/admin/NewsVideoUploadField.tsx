import { useRef, useState } from "react";
import { Upload, Trash2, Film } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const BUCKET = "media";
const MAX_BYTES = 200 * 1024 * 1024; // 200 MB
const ALLOWED = ["video/mp4", "video/webm", "video/quicktime", "video/x-m4v"];

type Props = {
  /** Public URL of the uploaded video (or empty). */
  value: string;
  onChange: (url: string) => void;
  /** Slug or id used to organise files by news item. */
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

/** Extract storage object path from a public URL (bucket-relative). */
export function extractStoragePath(url: string, bucket = BUCKET): string | null {
  if (!url) return null;
  const m = url.match(new RegExp(`/storage/v1/object/(?:public|sign)/${bucket}/([^?]+)`));
  return m ? decodeURIComponent(m[1]) : null;
}

export async function deleteStoredVideo(url: string) {
  const path = extractStoragePath(url);
  if (!path) return;
  await supabase.storage.from(BUCKET).remove([path]);
}

export function NewsVideoUploadField({ value, onChange, nameHint }: Props) {
  const [progress, setProgress] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const xhrRef = useRef<XMLHttpRequest | null>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!ALLOWED.includes(file.type) && !/\.(mp4|webm|mov|m4v)$/i.test(file.name)) {
      toast.error("Formato no válido. Usa MP4, WebM o MOV.");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error(
        `El archivo pesa ${(file.size / 1024 / 1024).toFixed(1)} MB. El tamaño máximo permitido es 200 MB.`,
      );
      return;
    }

    setUploading(true);
    setProgress(0);
    try {
      // Remove previous video if replacing
      if (value) {
        try {
          await deleteStoredVideo(value);
        } catch {
          /* best effort */
        }
      }

      const ext = (file.name.split(".").pop() ?? "mp4").toLowerCase();
      const prefix = safeName(nameHint) || "video";
      const path = `news/videos/${prefix}/${Date.now()}.${ext}`;

      const { data: signed, error: signErr } = await supabase.storage
        .from(BUCKET)
        .createSignedUploadUrl(path);
      if (signErr || !signed) {
        toast.error(signErr?.message ?? "No se pudo iniciar la subida");
        return;
      }

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhrRef.current = xhr;
        xhr.open("PUT", signed.signedUrl, true);
        xhr.setRequestHeader("Content-Type", file.type || "video/mp4");
        xhr.upload.onprogress = (ev) => {
          if (ev.lengthComputable) setProgress(Math.round((ev.loaded / ev.total) * 100));
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error(`Error de subida (${xhr.status})`));
        };
        xhr.onerror = () => reject(new Error("Error de red durante la subida"));
        xhr.send(file);
      });

      const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
      onChange(pub.publicUrl);
      toast.success("Vídeo subido correctamente");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setUploading(false);
      setProgress(null);
      xhrRef.current = null;
    }
  };

  const handleRemove = async () => {
    if (!value) return;
    if (!confirm("¿Eliminar el vídeo? Se borrará también del almacenamiento.")) return;
    try {
      await deleteStoredVideo(value);
    } catch {
      /* ignore */
    }
    onChange("");
    toast.success("Vídeo eliminado");
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <label className="font-condensed inline-flex cursor-pointer items-center gap-1 border border-border bg-background px-3 py-2 text-xs uppercase tracking-widest text-gold hover:bg-gold/10">
          <Upload className="h-3.5 w-3.5" />
          {uploading ? "Subiendo…" : value ? "Sustituir vídeo" : "Subir vídeo (MP4, máx. 200 MB)"}
          <input
            type="file"
            accept="video/mp4,video/webm,video/quicktime,video/x-m4v"
            onChange={handleFile}
            disabled={uploading}
            className="hidden"
          />
        </label>
        {value && !uploading && (
          <button
            type="button"
            onClick={handleRemove}
            className="font-condensed inline-flex items-center gap-1 border border-border bg-background px-3 py-2 text-xs uppercase tracking-widest text-red-400 hover:bg-red-500/10"
          >
            <Trash2 className="h-3.5 w-3.5" /> Eliminar
          </button>
        )}
      </div>

      {uploading && progress !== null && (
        <div className="space-y-1">
          <div className="h-2 w-full overflow-hidden rounded bg-border">
            <div
              className="h-full bg-gold transition-[width] duration-150"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="font-condensed text-[11px] uppercase tracking-widest text-muted-foreground">
            Subiendo… {progress}%
          </p>
        </div>
      )}

      {value && !uploading && (
        <div className="mt-2">
          <video
            src={value}
            controls
            preload="metadata"
            className="w-full max-w-md border border-border bg-black"
          >
            <track kind="captions" />
          </video>
          <p className="font-condensed mt-1 flex items-center gap-1 text-[11px] uppercase tracking-widest text-muted-foreground">
            <Film className="h-3 w-3" /> Vista previa del vídeo
          </p>
        </div>
      )}
    </div>
  );
}
