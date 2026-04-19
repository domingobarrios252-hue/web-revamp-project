import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import { youTubeThumbnail } from "@/lib/youtube";

export const Route = createFileRoute("/admin/tv-emisiones")({
  head: () => ({ meta: [{ title: "Admin · Emisiones TV" }, { name: "robots", content: "noindex" }] }),
  component: AdminTvEmisiones,
});

type Item = {
  id: string;
  title: string;
  description: string | null;
  scheduled_at: string;
  stream_url: string | null;
  cover_url: string | null;
  platform: string;
  location: string | null;
  published: boolean;
  sort_order: number;
};

const schema = z.object({
  title: z.string().trim().min(2).max(200),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  scheduled_at: z.string().min(1, "Fecha requerida"),
  stream_url: z.string().trim().url().optional().or(z.literal("")),
  cover_url: z.string().trim().url().optional().or(z.literal("")),
  platform: z.string().trim().min(1).max(50),
  location: z.string().trim().max(150).optional().or(z.literal("")),
  published: z.boolean(),
  sort_order: z.number().int().min(0).max(9999),
});

function AdminTvEmisiones() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Item | null>(null);
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("tv_broadcasts")
      .select("*")
      .order("scheduled_at", { ascending: true });
    setItems((data as Item[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const onDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta emisión?")) return;
    const { error } = await supabase.from("tv_broadcasts").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Emisión eliminada");
    load();
  };

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="font-display text-2xl tracking-widest">Próximas emisiones</h1>
        <button
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
          className="font-condensed inline-flex items-center gap-2 bg-gold px-4 py-2 text-xs font-bold uppercase tracking-widest text-background hover:bg-gold-dark"
        >
          <Plus className="h-4 w-4" /> Nueva emisión
        </button>
      </div>

      {showForm && (
        <BroadcastForm
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
        <p className="text-muted-foreground">Aún no hay emisiones. Crea la primera.</p>
      ) : (
        <div className="overflow-x-auto border border-border">
          <table className="w-full">
            <thead className="border-b border-border bg-surface">
              <tr className="font-condensed text-[11px] uppercase tracking-widest text-muted-foreground">
                <th className="px-3 py-2 text-left">Cuándo</th>
                <th className="px-3 py-2 text-left">Título</th>
                <th className="px-3 py-2 text-left">Plataforma</th>
                <th className="px-3 py-2 text-left">Lugar</th>
                <th className="px-3 py-2 text-left">Estado</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((b) => (
                <tr key={b.id} className="border-b border-border/60 last:border-0">
                  <td className="font-condensed px-3 py-2 text-xs uppercase tracking-wider text-gold">
                    {new Date(b.scheduled_at).toLocaleString("es-ES", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-3 py-2">
                    <div className="font-display text-sm uppercase">{b.title}</div>
                  </td>
                  <td className="px-3 py-2 text-xs">{b.platform}</td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">{b.location ?? "—"}</td>
                  <td className="px-3 py-2 text-xs">
                    {b.published ? (
                      <span className="text-gold">Publicado</span>
                    ) : (
                      <span className="text-muted-foreground">Oculto</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      onClick={() => {
                        setEditing(b);
                        setShowForm(true);
                      }}
                      className="mr-2 text-muted-foreground hover:text-gold"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => onDelete(b.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function BroadcastForm({
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
  const [scheduledAt, setScheduledAt] = useState(
    initial?.scheduled_at ? toLocalInput(initial.scheduled_at) : ""
  );
  const [streamUrl, setStreamUrl] = useState(initial?.stream_url ?? "");
  const [coverUrl, setCoverUrl] = useState(initial?.cover_url ?? "");
  const [platform, setPlatform] = useState(initial?.platform ?? "YouTube");
  const [location, setLocation] = useState(initial?.location ?? "");
  const [published, setPublished] = useState(initial?.published ?? true);
  const [sortOrder, setSortOrder] = useState(initial?.sort_order ?? 0);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const uploadCover = async (file: File) => {
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `tv/broadcasts/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("media").upload(path, file);
    if (error) {
      toast.error(error.message);
      setUploading(false);
      return;
    }
    const { data } = supabase.storage.from("media").getPublicUrl(path);
    setCoverUrl(data.publicUrl);
    setUploading(false);
  };

  const onSave = async () => {
    const parsed = schema.safeParse({
      title,
      description,
      scheduled_at: scheduledAt,
      stream_url: streamUrl,
      cover_url: coverUrl,
      platform,
      location,
      published,
      sort_order: Number(sortOrder) || 0,
    });
    if (!parsed.success) return toast.error(parsed.error.errors[0]?.message ?? "Datos inválidos");

    setSaving(true);
    const payload = {
      title: parsed.data.title,
      description: parsed.data.description || null,
      scheduled_at: new Date(parsed.data.scheduled_at).toISOString(),
      stream_url: parsed.data.stream_url || null,
      cover_url: parsed.data.cover_url || null,
      platform: parsed.data.platform,
      location: parsed.data.location || null,
      published: parsed.data.published,
      sort_order: parsed.data.sort_order,
    };
    const { error } = initial
      ? await supabase.from("tv_broadcasts").update(payload).eq("id", initial.id)
      : await supabase.from("tv_broadcasts").insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(initial ? "Emisión actualizada" : "Emisión creada");
    onSaved();
  };

  const ytThumb = youTubeThumbnail(streamUrl);

  return (
    <div className="mb-6 border border-gold bg-surface p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-lg tracking-widest text-gold">
          {initial ? "Editar emisión" : "Nueva emisión"}
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
            className="input min-h-[80px]"
          />
        </label>
        <label className="block">
          <span className="font-condensed mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">
            Fecha y hora *
          </span>
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            className="input"
          />
        </label>
        <label className="block">
          <span className="font-condensed mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">
            Plataforma
          </span>
          <select value={platform} onChange={(e) => setPlatform(e.target.value)} className="input">
            <option>YouTube</option>
            <option>Twitch</option>
            <option>Otro</option>
          </select>
        </label>
        <label className="block md:col-span-2">
          <span className="font-condensed mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">
            URL del stream
          </span>
          <input
            value={streamUrl}
            onChange={(e) => setStreamUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            className="input"
          />
        </label>
        <label className="block">
          <span className="font-condensed mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">
            Lugar
          </span>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="input"
            placeholder="Ej: Madrid"
          />
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
        <label className="block md:col-span-2">
          <span className="font-condensed mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">
            Imagen de portada (opcional — si no la pones, se usa la miniatura de YouTube)
          </span>
          <div className="flex items-center gap-2">
            <input
              value={coverUrl}
              onChange={(e) => setCoverUrl(e.target.value)}
              placeholder="URL o subir archivo"
              className="input flex-1"
            />
            <label className="font-condensed inline-flex cursor-pointer items-center gap-1 border border-border bg-background px-3 py-2 text-xs uppercase tracking-widest text-gold hover:bg-gold/10">
              <Upload className="h-3.5 w-3.5" /> {uploading ? "…" : "Subir"}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files?.[0] && uploadCover(e.target.files[0])}
                className="hidden"
              />
            </label>
          </div>
          {(coverUrl || ytThumb) && (
            <img
              src={coverUrl || ytThumb || ""}
              alt=""
              className="mt-2 h-32 w-auto border border-border object-cover"
            />
          )}
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
      <div className="mt-5 flex gap-2">
        <button
          onClick={onSave}
          disabled={saving}
          className="font-condensed bg-gold px-5 py-2 text-xs font-bold uppercase tracking-widest text-background hover:bg-gold-dark disabled:opacity-50"
        >
          {saving ? "Guardando…" : initial ? "Guardar" : "Crear emisión"}
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

function toLocalInput(iso: string) {
  const d = new Date(iso);
  const tz = d.getTimezoneOffset();
  const local = new Date(d.getTime() - tz * 60000);
  return local.toISOString().slice(0, 16);
}
