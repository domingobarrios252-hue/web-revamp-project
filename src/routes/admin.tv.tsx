import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import { youTubeEmbedUrl } from "@/lib/youtube";

export const Route = createFileRoute("/admin/tv")({
  head: () => ({ meta: [{ title: "Admin · TV" }, { name: "robots", content: "noindex" }] }),
  component: AdminTv,
});

const schema = z.object({
  live_stream_url: z.string().trim().url().optional().or(z.literal("")),
  live_title: z.string().trim().min(2).max(150),
  live_subtitle: z.string().trim().max(300).optional().or(z.literal("")),
  live_starts_at: z.string().optional().or(z.literal("")),
  live_ends_at: z.string().optional().or(z.literal("")),
  next_event_title: z.string().trim().max(200).optional().or(z.literal("")),
  next_event_at: z.string().optional().or(z.literal("")),
});

type Row = {
  id: string;
  live_stream_url: string | null;
  live_title: string;
  live_subtitle: string | null;
  live_starts_at: string | null;
  live_ends_at: string | null;
  next_event_title: string | null;
  next_event_at: string | null;
};

function AdminTv() {
  const [row, setRow] = useState<Row | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [streamUrl, setStreamUrl] = useState("");
  const [title, setTitle] = useState("RollerZone TV");
  const [subtitle, setSubtitle] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [nextTitle, setNextTitle] = useState("");
  const [nextAt, setNextAt] = useState("");

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("tv_settings")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const r = data as Row | null;
    setRow(r);
    if (r) {
      setStreamUrl(r.live_stream_url ?? "");
      setTitle(r.live_title ?? "RollerZone TV");
      setSubtitle(r.live_subtitle ?? "");
      setStartsAt(r.live_starts_at ? toLocalInput(r.live_starts_at) : "");
      setEndsAt(r.live_ends_at ? toLocalInput(r.live_ends_at) : "");
      setNextTitle(r.next_event_title ?? "");
      setNextAt(r.next_event_at ? toLocalInput(r.next_event_at) : "");
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const onSave = async () => {
    const parsed = schema.safeParse({
      live_stream_url: streamUrl,
      live_title: title,
      live_subtitle: subtitle,
      live_starts_at: startsAt,
      live_ends_at: endsAt,
      next_event_title: nextTitle,
      next_event_at: nextAt,
    });
    if (!parsed.success) return toast.error(parsed.error.errors[0]?.message ?? "Datos inválidos");

    setSaving(true);
    const payload = {
      live_stream_url: parsed.data.live_stream_url || null,
      live_title: parsed.data.live_title,
      live_subtitle: parsed.data.live_subtitle || null,
      live_starts_at: parsed.data.live_starts_at ? new Date(parsed.data.live_starts_at).toISOString() : null,
      live_ends_at: parsed.data.live_ends_at ? new Date(parsed.data.live_ends_at).toISOString() : null,
      next_event_title: parsed.data.next_event_title || null,
      next_event_at: parsed.data.next_event_at ? new Date(parsed.data.next_event_at).toISOString() : null,
    };

    const { error } = row
      ? await supabase.from("tv_settings").update(payload).eq("id", row.id)
      : await supabase.from("tv_settings").insert(payload);

    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Configuración guardada");
    load();
  };

  const previewEmbed = youTubeEmbedUrl(streamUrl);

  if (loading) return <p className="text-muted-foreground">Cargando…</p>;

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="font-display text-2xl tracking-widest">RollerZone TV</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        <div className="space-y-5 border border-border bg-surface p-5">
          <h2 className="font-display text-sm tracking-widest text-gold">EMISIÓN PRINCIPAL</h2>

          <label className="block">
            <span className="font-condensed mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">
              URL del directo de YouTube *
            </span>
            <input
              value={streamUrl}
              onChange={(e) => setStreamUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=... o /live/..."
              className="input"
            />
            <p className="font-condensed mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">
              Pega cualquier URL de YouTube (watch, live, embed, youtu.be)
            </p>
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="font-condensed mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">
                Título *
              </span>
              <input value={title} onChange={(e) => setTitle(e.target.value)} className="input" />
            </label>
            <label className="block">
              <span className="font-condensed mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">
                Subtítulo
              </span>
              <input
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                className="input"
                placeholder="Una línea descriptiva"
              />
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="font-condensed mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">
                Inicio de emisión
              </span>
              <input
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                className="input"
              />
            </label>
            <label className="block">
              <span className="font-condensed mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">
                Fin de emisión
              </span>
              <input
                type="datetime-local"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                className="input"
              />
            </label>
          </div>
          <p className="font-condensed text-[10px] uppercase tracking-wider text-muted-foreground">
            Si la hora actual está entre Inicio y Fin, se mostrará "EN DIRECTO" automáticamente.
          </p>

          <div className="border-t border-border pt-5">
            <h2 className="font-display text-sm tracking-widest text-gold">SIGUIENTE EMISIÓN (opcional)</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="font-condensed mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">
                  Título del próximo evento
                </span>
                <input
                  value={nextTitle}
                  onChange={(e) => setNextTitle(e.target.value)}
                  className="input"
                  placeholder="Ej: Campeonato de España"
                />
              </label>
              <label className="block">
                <span className="font-condensed mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">
                  Fecha y hora
                </span>
                <input
                  type="datetime-local"
                  value={nextAt}
                  onChange={(e) => setNextAt(e.target.value)}
                  className="input"
                />
              </label>
            </div>
          </div>

          <button
            onClick={onSave}
            disabled={saving}
            className="font-condensed inline-flex items-center gap-2 bg-gold px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-background hover:bg-gold-dark disabled:opacity-50"
          >
            <Save className="h-4 w-4" /> {saving ? "Guardando…" : "Guardar configuración"}
          </button>
        </div>

        {/* Preview */}
        <div className="border border-border bg-surface p-5">
          <h2 className="font-display mb-3 text-sm tracking-widest text-gold">VISTA PREVIA</h2>
          <div className="aspect-video w-full overflow-hidden border border-border bg-black">
            {previewEmbed ? (
              <iframe src={previewEmbed} title="preview" allowFullScreen className="h-full w-full" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                Pega una URL para ver la vista previa
              </div>
            )}
          </div>
          <div className="mt-3 text-xs text-muted-foreground">
            <p className="font-display text-foreground">{title || "—"}</p>
            {subtitle && <p className="mt-1">{subtitle}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

function toLocalInput(iso: string) {
  // Convert ISO to "YYYY-MM-DDTHH:mm" in local time for datetime-local input
  const d = new Date(iso);
  const tz = d.getTimezoneOffset();
  const local = new Date(d.getTime() - tz * 60000);
  return local.toISOString().slice(0, 16);
}
