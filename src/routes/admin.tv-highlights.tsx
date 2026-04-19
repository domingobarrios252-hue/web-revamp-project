import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X, Upload, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import { youTubeThumbnail } from "@/lib/youtube";

export const Route = createFileRoute("/admin/tv-highlights")({
  head: () => ({ meta: [{ title: "Admin · Highlights TV" }, { name: "robots", content: "noindex" }] }),
  component: AdminTvHighlights,
});

type Item = {
  id: string;
  title: string;
  description: string | null;
  video_url: string;
  thumbnail_url: string | null;
  category: string | null;
  duration: string | null;
  published: boolean;
  featured: boolean;
  sort_order: number;
};

const schema = z.object({
  title: z.string().trim().min(2).max(200),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  video_url: z.string().trim().url("URL del vídeo no válida"),
  thumbnail_url: z.string().trim().url().optional().or(z.literal("")),
  category: z.string().trim().max(50).optional().or(z.literal("")),
  duration: z.string().trim().max(20).optional().or(z.literal("")),
  published: z.boolean(),
  featured: z.boolean(),
  sort_order: z.number().int().min(0).max(9999),
});

function AdminTvHighlights() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Item | null>(null);
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("tv_highlights")
      .select("*")
      .order("featured", { ascending: false })
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
    setItems((data as Item[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const onDelete = async (id: string) => {
    if (!confirm("¿Eliminar este highlight?")) return;
    const { error } = await supabase.from("tv_highlights").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Highlight eliminado");
    load();
  };

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="font-display text-2xl tracking-widest">Highlights TV</h1>
        <button
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
          className="font-condensed inline-flex items-center gap-2 bg-gold px-4 py-2 text-xs font-bold uppercase tracking-widest text-background hover:bg-gold-dark"
        >
          <Plus className="h-4 w-4" /> Nuevo highlight
        </button>
      </div>

      {showForm && (
        <HighlightForm
          initial={editing}
          onClose={() => {
            setShowForm(false);
            setEditing(null);
          }}
          onSaved={() => {
            setShowForm(false);
            setEditing(null);
            load();
          }}
        />
      )}

      {loading ? (
        <p className="text-muted-foreground">Cargando…</p>
      ) : items.length === 0 ? (
        <p className="text-muted-foreground">Aún no hay highlights. Crea el primero.</p>
      ) : (
        <div className="overflow-x-auto border border-border">
          <table className="w-full">
            <thead className="border-b border-border bg-surface">
              <tr className="font-condensed text-[11px] uppercase tracking-widest text-muted-foreground">
                <th className="px-3 py-2 text-left">Miniatura</th>
                <th className="px-3 py-2 text-left">Título</th>
                <th className="px-3 py-2 text-left">Categoría</th>
                <th className="px-3 py-2 text-left">Duración</th>
                <th className="px-3 py-2 text-left">Destacado</th>
                <th className="px-3 py-2 text-left">Estado</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((h) => {
                const thumb = h.thumbnail_url || youTubeThumbnail(h.video_url);
                return (
                  <tr key={h.id} className="border-b border-border/60 last:border-0">
                    <td className="px-3 py-2">
                      {thumb ? (
                        <img src={thumb} alt="" className="h-12 w-20 object-cover" />
                      ) : (
                        <div className="h-12 w-20 bg-surface" />
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <div className="font-display text-sm uppercase">{h.title}</div>
                    </td>
                    <td className="px-3 py-2 text-xs text-gold">{h.category ?? "—"}</td>
                    <td className="px-3 py-2 text-xs">{h.duration ?? "—"}</td>
                    <td className="px-3 py-2 text-xs">
                      {h.featured ? <Star className="h-3.5 w-3.5 fill-gold text-gold" /> : "—"}
                    </td>
                    <td className="px-3 py-2 text-xs">
                      {h.published ? (
                        <span className="text-gold">Publicado</span>
                      ) : (
                        <span className="text-muted-foreground">Oculto</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button
                        onClick={() => {
                          setEditing(h);
                          setShowForm(true);
                        }}
                        className="mr-2 text-muted-foreground hover:text-gold"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => onDelete(h.id)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function HighlightForm({
  initial,
  onClose,
  onSaved,
}: {
  initial: Item | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [videoUrl, setVideoUrl] = useState(initial?.video_url ?? "");
  const [thumbnailUrl, setThumbnailUrl] = useState(initial?.thumbnail_url ?? "");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [duration, setDuration] = useState(initial?.duration ?? "");
  const [published, setPublished] = useState(initial?.published ?? true);
  const [featured, setFeatured] = useState(initial?.featured ?? false);
  const [sortOrder, setSortOrder] = useState(initial?.sort_order ?? 0);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const uploadThumb = async (file: File) => {
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `tv/highlights/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("media").upload(path, file);
    if (error) {
      toast.error(error.message);
      setUploading(false);
      return;
    }
    const { data } = supabase.storage.from("media").getPublicUrl(path);
    setThumbnailUrl(data.publicUrl);
    setUploading(false);
  };

  const onSave = async () => {
    const parsed = schema.safeParse({
      title,
      description,
      video_url: videoUrl,
      thumbnail_url: thumbnailUrl,
      category,
      duration,
      published,
      featured,
      sort_order: Number(sortOrder) || 0,
    });
    if (!parsed.success) return toast.error(parsed.error.errors[0]?.message ?? "Datos inválidos");

    setSaving(true);
    const payload = {
      title: parsed.data.title,
      description: parsed.data.description || null,
      video_url: parsed.data.video_url,
      thumbnail_url: parsed.data.thumbnail_url || null,
      category: parsed.data.category || null,
      duration: parsed.data.duration || null,
      published: parsed.data.published,
      featured: parsed.data.featured,
      sort_order: parsed.data.sort_order,
    };
    const { error } = initial
      ? await supabase.from("tv_highlights").update(payload).eq("id", initial.id)
      : await supabase.from("tv_highlights").insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(initial ? "Highlight actualizado" : "Highlight creado");
    onSaved();
  };

  const ytThumb = youTubeThumbnail(videoUrl);

  return (
    <div className="mb-6 border border-gold bg-surface p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-lg tracking-widest text-gold">
          {initial ? "Editar highlight" : "Nuevo highlight"}
        </h2>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="block md:col-span-2">
          <span className="font-condensed mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">
            Título *
          </span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="input" />
        </label>
        <label className="block md:col-span-2">
          <span className="font-condensed mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">
            Descripción
          </span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="input min-h-[60px]"
          />
        </label>
        <label className="block md:col-span-2">
          <span className="font-condensed mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">
            URL del vídeo (YouTube o Twitch) *
          </span>
          <input
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            className="input"
          />
        </label>
        <label className="block">
          <span className="font-condensed mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">
            Categoría
          </span>
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Ej: Mundial, Nacional, Highlights"
            className="input"
          />
        </label>
        <label className="block">
          <span className="font-condensed mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">
            Duración
          </span>
          <input
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="Ej: 3:45"
            className="input"
          />
        </label>
        <label className="block md:col-span-2">
          <span className="font-condensed mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">
            Miniatura personalizada (opcional — si no, se usa la del vídeo)
          </span>
          <div className="flex items-center gap-2">
            <input
              value={thumbnailUrl}
              onChange={(e) => setThumbnailUrl(e.target.value)}
              placeholder="URL o subir archivo"
              className="input flex-1"
            />
            <label className="font-condensed inline-flex cursor-pointer items-center gap-1 border border-border bg-background px-3 py-2 text-xs uppercase tracking-widest text-gold hover:bg-gold/10">
              <Upload className="h-3.5 w-3.5" /> {uploading ? "…" : "Subir"}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files?.[0] && uploadThumb(e.target.files[0])}
                className="hidden"
              />
            </label>
          </div>
          {(thumbnailUrl || ytThumb) && (
            <img
              src={thumbnailUrl || ytThumb || ""}
              alt=""
              className="mt-2 h-32 w-auto border border-border object-cover"
            />
          )}
        </label>
        <label className="block">
          <span className="font-condensed mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">
            Orden
          </span>
          <input
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(Number(e.target.value))}
            className="input"
          />
        </label>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
            />
            <span className="font-condensed text-xs uppercase tracking-widest">Destacado</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={published}
              onChange={(e) => setPublished(e.target.checked)}
            />
            <span className="font-condensed text-xs uppercase tracking-widest">Publicado</span>
          </label>
        </div>
      </div>
      <div className="mt-5 flex gap-2">
        <button
          onClick={onSave}
          disabled={saving}
          className="font-condensed bg-gold px-5 py-2 text-xs font-bold uppercase tracking-widest text-background hover:bg-gold-dark disabled:opacity-50"
        >
          {saving ? "Guardando…" : initial ? "Guardar" : "Crear highlight"}
        </button>
        <button
          onClick={onClose}
          className="font-condensed border border-border px-5 py-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
