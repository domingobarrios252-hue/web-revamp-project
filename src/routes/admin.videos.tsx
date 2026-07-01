import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Save, Star, Trash2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import { videoEmbedUrl, videoThumbnail } from "@/lib/videoEmbed";
import { VIDEO_CATEGORIES } from "@/lib/hub/useVideos";

export const Route = createFileRoute("/admin/videos")({
  head: () => ({
    meta: [
      { title: "Admin · Vídeos del hub TV — RollerZone" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminVideosPage,
});

type VideoRow = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  video_url: string | null;
  youtube_id: string | null;
  thumbnail_url: string | null;
  category: string | null;
  country_code: string;
  featured: boolean;
  published: boolean;
  published_at: string;
  sort_order: number | null;
};

const schema = z.object({
  title: z.string().trim().min(2).max(200),
  slug: z.string().trim().min(2).max(200).regex(/^[a-z0-9-]+$/, "Solo minúsculas, números y guiones"),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  video_url: z.string().trim().url("URL no válida"),
  thumbnail_url: z.string().trim().url().optional().or(z.literal("")),
  category: z.string().trim().max(50).optional().or(z.literal("")),
  country_code: z.string().trim().min(2).max(3),
  featured: z.boolean(),
  published: z.boolean(),
  sort_order: z.number().int().min(0).max(9999),
});

const slugify = (v: string) =>
  v
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);

function AdminVideosPage() {
  const [rows, setRows] = useState<VideoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<VideoRow | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [filterCountry, setFilterCountry] = useState<string>("");

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("videos")
      .select("*")
      .order("featured", { ascending: false })
      .order("published_at", { ascending: false });
    if (error) toast.error(error.message);
    setRows((data as VideoRow[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(
    () => (filterCountry ? rows.filter((r) => r.country_code === filterCountry) : rows),
    [rows, filterCountry],
  );

  const onDelete = async (id: string) => {
    if (!confirm("¿Eliminar este vídeo?")) return;
    const { error } = await supabase.from("videos").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Vídeo eliminado");
    load();
  };

  const toggleFeatured = async (r: VideoRow) => {
    const { error } = await supabase.from("videos").update({ featured: !r.featured }).eq("id", r.id);
    if (error) return toast.error(error.message);
    load();
  };

  const togglePublished = async (r: VideoRow) => {
    const { error } = await supabase.from("videos").update({ published: !r.published }).eq("id", r.id);
    if (error) return toast.error(error.message);
    load();
  };

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl uppercase tracking-widest text-gold">
            Vídeos del hub · RollerZone TV
          </h1>
          <p className="text-xs text-muted-foreground">
            Aquí se editan los vídeos que aparecen en <code>/hub/&lt;país&gt;/tv</code> (España y Colombia).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filterCountry}
            onChange={(e) => setFilterCountry(e.target.value)}
            className="rounded border border-border bg-background px-2 py-1.5 text-xs"
          >
            <option value="">Todos los países</option>
            <option value="es">España</option>
            <option value="co">Colombia</option>
          </select>
          <button
            onClick={() => {
              setEditing(null);
              setShowForm(true);
            }}
            className="font-condensed inline-flex items-center gap-2 bg-gold px-4 py-2 text-xs font-bold uppercase tracking-widest text-background hover:bg-gold-dark"
          >
            <Plus className="h-4 w-4" /> Nuevo vídeo
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Cargando…</p>
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground">No hay vídeos.</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-surface">
          <table className="w-full text-sm">
            <thead className="bg-black/30 text-[10px] uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left">Título</th>
                <th className="px-3 py-2 text-left">País</th>
                <th className="px-3 py-2 text-left">Categoría</th>
                <th className="px-3 py-2 text-left">Estado</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const thumb = r.thumbnail_url ?? videoThumbnail(r.video_url);
                return (
                  <tr key={r.id} className="border-t border-border">
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-3">
                        {thumb ? (
                          <img src={thumb} alt="" className="h-10 w-16 rounded object-cover" loading="lazy" />
                        ) : (
                          <div className="h-10 w-16 rounded bg-black/40" />
                        )}
                        <div className="min-w-0">
                          <div className="truncate font-medium text-foreground">{r.title}</div>
                          <div className="truncate text-[10px] text-muted-foreground">/{r.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2 uppercase">{r.country_code}</td>
                    <td className="px-3 py-2">{r.category ?? "—"}</td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap items-center gap-1 text-[10px]">
                        <button
                          onClick={() => togglePublished(r)}
                          className={`rounded px-2 py-0.5 uppercase tracking-widest ${
                            r.published ? "bg-emerald-600/20 text-emerald-300" : "bg-black/40 text-muted-foreground"
                          }`}
                        >
                          {r.published ? "Publicado" : "Borrador"}
                        </button>
                        <button
                          onClick={() => toggleFeatured(r)}
                          className={`inline-flex items-center gap-1 rounded px-2 py-0.5 uppercase tracking-widest ${
                            r.featured ? "bg-gold/20 text-gold" : "bg-black/40 text-muted-foreground"
                          }`}
                        >
                          <Star className="h-3 w-3" /> Destacado
                        </button>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setEditing(r);
                            setShowForm(true);
                          }}
                          className="rounded border border-border p-1 hover:bg-background"
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onDelete(r.id)}
                          className="rounded border border-border p-1 text-destructive hover:bg-destructive/10"
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <VideoForm
          initial={editing}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            load();
          }}
        />
      )}
    </div>
  );
}

function VideoForm({
  initial,
  onClose,
  onSaved,
}: {
  initial: VideoRow | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [videoUrl, setVideoUrl] = useState(initial?.video_url ?? "");
  const [thumbnail, setThumbnail] = useState(initial?.thumbnail_url ?? "");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [country, setCountry] = useState(initial?.country_code ?? "es");
  const [featured, setFeatured] = useState(initial?.featured ?? false);
  const [published, setPublished] = useState(initial?.published ?? true);
  const [sortOrder, setSortOrder] = useState(initial?.sort_order ?? 0);
  const [saving, setSaving] = useState(false);

  const previewEmbed = videoEmbedUrl(videoUrl);

  const onSubmit = async () => {
    const parsed = schema.safeParse({
      title,
      slug: slug || slugify(title),
      description,
      video_url: videoUrl,
      thumbnail_url: thumbnail,
      category,
      country_code: country,
      featured,
      published,
      sort_order: Number(sortOrder) || 0,
    });
    if (!parsed.success) return toast.error(parsed.error.errors[0]?.message ?? "Datos inválidos");

    const payload: Record<string, unknown> = {
      title: parsed.data.title,
      slug: parsed.data.slug,
      description: parsed.data.description || null,
      video_url: parsed.data.video_url,
      thumbnail_url: parsed.data.thumbnail_url || null,
      category: parsed.data.category || null,
      country_code: parsed.data.country_code,
      featured: parsed.data.featured,
      published: parsed.data.published,
      sort_order: parsed.data.sort_order,
    };
    if (!initial) payload.published_at = new Date().toISOString();

    setSaving(true);
    const { error } = initial
      ? await supabase.from("videos").update(payload).eq("id", initial.id)
      : await supabase.from("videos").insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(initial ? "Vídeo actualizado" : "Vídeo creado");
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4">
      <div className="w-full max-w-3xl rounded-lg border border-border bg-surface p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg uppercase tracking-widest text-gold">
            {initial ? "Editar vídeo" : "Nuevo vídeo"}
          </h2>
          <button onClick={onClose} className="rounded border border-border p-1 hover:bg-background">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="md:col-span-2 block">
            <span className="mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">Título *</span>
            <input
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (!initial && !slug) setSlug(slugify(e.target.value));
              }}
              className="w-full rounded border border-border bg-background px-2 py-1.5 text-sm"
            />
          </label>
          <label className="md:col-span-2 block">
            <span className="mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">Slug *</span>
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="ej: entrevista-juan-perez"
              className="w-full rounded border border-border bg-background px-2 py-1.5 text-sm"
            />
          </label>
          <label className="md:col-span-2 block">
            <span className="mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">
              URL del vídeo * (YouTube, Facebook, Twitch)
            </span>
            <input
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=... · https://facebook.com/.../videos/..."
              className="w-full rounded border border-border bg-background px-2 py-1.5 text-sm"
            />
          </label>
          <label className="md:col-span-2 block">
            <span className="mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">
              Miniatura (opcional)
            </span>
            <input
              value={thumbnail}
              onChange={(e) => setThumbnail(e.target.value)}
              placeholder="URL de imagen"
              className="w-full rounded border border-border bg-background px-2 py-1.5 text-sm"
            />
          </label>
          <label className="md:col-span-2 block">
            <span className="mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">Descripción</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded border border-border bg-background px-2 py-1.5 text-sm"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">País *</span>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full rounded border border-border bg-background px-2 py-1.5 text-sm"
            >
              <option value="es">España (es)</option>
              <option value="co">Colombia (co)</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">Categoría</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded border border-border bg-background px-2 py-1.5 text-sm"
            >
              <option value="">—</option>
              {VIDEO_CATEGORIES.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">Orden</span>
            <input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value))}
              className="w-full rounded border border-border bg-background px-2 py-1.5 text-sm"
            />
          </label>
          <div className="flex items-center gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} />
              Publicado
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} />
              Destacado
            </label>
          </div>
        </div>

        {previewEmbed && (
          <div className="mt-4">
            <div className="mb-1 text-[11px] uppercase tracking-widest text-muted-foreground">Vista previa</div>
            <div className="aspect-video w-full overflow-hidden border border-border bg-black">
              <iframe src={previewEmbed} title="preview" allowFullScreen className="h-full w-full" />
            </div>
          </div>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded border border-border px-4 py-2 text-xs uppercase tracking-widest hover:bg-background"
          >
            Cancelar
          </button>
          <button
            onClick={onSubmit}
            disabled={saving}
            className="inline-flex items-center gap-2 bg-gold px-5 py-2 text-xs font-bold uppercase tracking-widest text-background hover:bg-gold-dark disabled:opacity-50"
          >
            <Save className="h-4 w-4" /> {saving ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}
