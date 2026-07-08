import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Save, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import { videoEmbedUrl } from "@/lib/videoEmbed";

export const Route = createFileRoute("/admin/tv")({
  head: () => ({ meta: [{ title: "Admin · TV" }, { name: "robots", content: "noindex" }] }),
  component: AdminTv,
});

const schema = z.object({
  live_stream_url: z.string().trim().url().optional().or(z.literal("")),
  live_title: z.string().trim().min(2).max(150),
  live_subtitle: z.string().trim().max(300).optional().or(z.literal("")),
  live_thumbnail_url: z.string().trim().url().optional().or(z.literal("")),
  live_starts_at: z.string().optional().or(z.literal("")),
  live_ends_at: z.string().optional().or(z.literal("")),
  live_is_active: z.boolean(),
  status_label: z.enum(["live", "upcoming", "finished"]),
  next_event_title: z.string().trim().max(200).optional().or(z.literal("")),
  next_event_at: z.string().optional().or(z.literal("")),
  premium_autoplay: z.boolean(),
  premium_interval_ms: z.number().int().min(1500).max(30000),
  premium_show_arrows: z.boolean(),
  premium_show_dots: z.boolean(),
  subscribe_title: z.string().trim().max(200).optional().or(z.literal("")),
  subscribe_text: z.string().trim().max(500).optional().or(z.literal("")),
  subscribe_button_text: z.string().trim().max(80).optional().or(z.literal("")),
  subscribe_button_url: z.string().trim().url().optional().or(z.literal("")),
  live_center_event_slug: z.string().trim().max(200).optional().or(z.literal("")),
  show_live_center: z.boolean(),
  live_center_position: z.enum(["right", "bottom"]),
  show_full_results_button: z.boolean(),
});

type Row = {
  id: string;
  live_stream_url: string | null;
  live_title: string;
  live_subtitle: string | null;
  live_thumbnail_url: string | null;
  live_starts_at: string | null;
  live_ends_at: string | null;
  live_is_active: boolean;
  status_label: string;
  next_event_title: string | null;
  next_event_at: string | null;
  premium_autoplay: boolean;
  premium_interval_ms: number;
  premium_show_arrows: boolean;
  premium_show_dots: boolean;
  subscribe_title: string | null;
  subscribe_text: string | null;
  subscribe_button_text: string | null;
  subscribe_button_url: string | null;
  live_center_event_slug: string | null;
  show_live_center: boolean;
  live_center_position: "right" | "bottom";
  show_full_results_button: boolean;
};

type EventOption = { id: string; slug: string; name: string; event_date: string | null };

function AdminTv() {
  const [row, setRow] = useState<Row | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [streamUrl, setStreamUrl] = useState("");
  const [title, setTitle] = useState("RollerZone TV");
  const [subtitle, setSubtitle] = useState("");
  const [thumbUrl, setThumbUrl] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [liveActive, setLiveActive] = useState(false);
  const [statusLabel, setStatusLabel] = useState<"live" | "upcoming" | "finished">("upcoming");
  const [nextTitle, setNextTitle] = useState("");
  const [nextAt, setNextAt] = useState("");

  const [premAutoplay, setPremAutoplay] = useState(true);
  const [premInterval, setPremInterval] = useState(5000);
  const [premArrows, setPremArrows] = useState(false);
  const [premDots, setPremDots] = useState(true);

  const [subTitle, setSubTitle] = useState("");
  const [subText, setSubText] = useState("");
  const [subBtnText, setSubBtnText] = useState("");
  const [subBtnUrl, setSubBtnUrl] = useState("");

  const [lcEventSlug, setLcEventSlug] = useState("");
  const [showLc, setShowLc] = useState(false);
  const [lcPosition, setLcPosition] = useState<"right" | "bottom">("right");
  const [showFullBtn, setShowFullBtn] = useState(true);
  const [events, setEvents] = useState<EventOption[]>([]);

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
      setThumbUrl(r.live_thumbnail_url ?? "");
      setStartsAt(r.live_starts_at ? toLocalInput(r.live_starts_at) : "");
      setEndsAt(r.live_ends_at ? toLocalInput(r.live_ends_at) : "");
      setLiveActive(r.live_is_active);
      setStatusLabel((r.status_label as "live" | "upcoming" | "finished") ?? "upcoming");
      setNextTitle(r.next_event_title ?? "");
      setNextAt(r.next_event_at ? toLocalInput(r.next_event_at) : "");
      setPremAutoplay(r.premium_autoplay);
      setPremInterval(r.premium_interval_ms);
      setPremArrows(r.premium_show_arrows);
      setPremDots(r.premium_show_dots);
      setSubTitle(r.subscribe_title ?? "");
      setSubText(r.subscribe_text ?? "");
      setSubBtnText(r.subscribe_button_text ?? "");
      setSubBtnUrl(r.subscribe_button_url ?? "");
      setLcEventSlug(r.live_center_event_slug ?? "");
      setShowLc(r.show_live_center ?? false);
      setLcPosition((r.live_center_position as "right" | "bottom") ?? "right");
      setShowFullBtn(r.show_full_results_button ?? true);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    supabase
      .from("result_events")
      .select("id, slug, name, event_date")
      .order("event_date", { ascending: false, nullsFirst: false })
      .limit(200)
      .then(({ data }) => setEvents((data as EventOption[]) ?? []));
  }, []);

  const onSave = async () => {
    const parsed = schema.safeParse({
      live_stream_url: streamUrl,
      live_title: title,
      live_subtitle: subtitle,
      live_thumbnail_url: thumbUrl,
      live_starts_at: startsAt,
      live_ends_at: endsAt,
      live_is_active: liveActive,
      status_label: statusLabel,
      next_event_title: nextTitle,
      next_event_at: nextAt,
      premium_autoplay: premAutoplay,
      premium_interval_ms: premInterval,
      premium_show_arrows: premArrows,
      premium_show_dots: premDots,
      subscribe_title: subTitle,
      subscribe_text: subText,
      subscribe_button_text: subBtnText,
      subscribe_button_url: subBtnUrl,
      live_center_event_slug: lcEventSlug,
      show_live_center: showLc,
      live_center_position: lcPosition,
      show_full_results_button: showFullBtn,
    });
    if (!parsed.success) return toast.error(parsed.error.errors[0]?.message ?? "Datos inválidos");

    setSaving(true);
    const d = parsed.data;
    const payload = {
      live_stream_url: d.live_stream_url || null,
      live_title: d.live_title,
      live_subtitle: d.live_subtitle || null,
      live_thumbnail_url: d.live_thumbnail_url || null,
      live_starts_at: d.live_starts_at ? new Date(d.live_starts_at).toISOString() : null,
      live_ends_at: d.live_ends_at ? new Date(d.live_ends_at).toISOString() : null,
      live_is_active: d.live_is_active,
      status_label: d.status_label,
      next_event_title: d.next_event_title || null,
      next_event_at: d.next_event_at ? new Date(d.next_event_at).toISOString() : null,
      premium_autoplay: d.premium_autoplay,
      premium_interval_ms: d.premium_interval_ms,
      premium_show_arrows: d.premium_show_arrows,
      premium_show_dots: d.premium_show_dots,
      subscribe_title: d.subscribe_title || null,
      subscribe_text: d.subscribe_text || null,
      subscribe_button_text: d.subscribe_button_text || null,
      subscribe_button_url: d.subscribe_button_url || null,
      live_center_event_slug: d.live_center_event_slug || null,
      show_live_center: d.show_live_center,
      live_center_position: d.live_center_position,
      show_full_results_button: d.show_full_results_button,
    };

    const { error } = row
      ? await supabase.from("tv_settings").update(payload).eq("id", row.id)
      : await supabase.from("tv_settings").insert(payload);

    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Configuración guardada");
    load();
  };

  const previewEmbed = videoEmbedUrl(streamUrl);

  if (loading) return <p className="text-muted-foreground">Cargando…</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl tracking-widest">RollerZone TV</h1>
        <button
          onClick={onSave}
          disabled={saving}
          className="font-condensed inline-flex items-center gap-2 bg-gold px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-background hover:bg-gold-dark disabled:opacity-50"
        >
          <Save className="h-4 w-4" /> {saving ? "Guardando…" : "Guardar cambios"}
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        {/* LEFT COLUMN */}
        <div className="space-y-6">
          {/* EVENTO PRINCIPAL */}
          <Card title="Evento principal">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Título del evento *" value={title} onChange={setTitle} />
              <SelectField
                label="Estado"
                value={statusLabel}
                onChange={(v) => setStatusLabel(v as "live" | "upcoming" | "finished")}
                options={[
                  { value: "live", label: "En directo" },
                  { value: "upcoming", label: "Próximamente" },
                  { value: "finished", label: "Finalizado" },
                ]}
              />
            </div>
            <Field label="Subtítulo" value={subtitle} onChange={setSubtitle} placeholder="Descripción corta" />
            <Field
              label="URL del directo (YouTube · Facebook Live · Twitch · iframe)"
              value={streamUrl}
              onChange={setStreamUrl}
              placeholder="https://youtube.com/… · https://twitch.tv/…"
            />
            <Field
              label="Miniatura (URL, opcional — imagen mostrada antes de pulsar Play)"
              value={thumbUrl}
              onChange={setThumbUrl}
              placeholder="https://…"
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                label="Inicio de emisión"
                value={startsAt}
                onChange={setStartsAt}
                type="datetime-local"
              />
              <Field
                label="Fin de emisión"
                value={endsAt}
                onChange={setEndsAt}
                type="datetime-local"
              />
            </div>
            <Toggle
              label='Activar "EN DIRECTO AHORA" manualmente (override — se muestra el badge rojo tanto en /tv como en la home)'
              checked={liveActive}
              onChange={setLiveActive}
            />
            <p className="font-condensed text-[10px] uppercase tracking-wider text-muted-foreground">
              Si no activas el interruptor, se detectará automáticamente entre inicio y fin.
            </p>
          </Card>

          {/* SIGUIENTE EMISIÓN */}
          <Card title="Siguiente emisión (opcional)">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                label="Título del próximo evento"
                value={nextTitle}
                onChange={setNextTitle}
                placeholder="Ej: Campeonato de España"
              />
              <Field
                label="Fecha y hora"
                value={nextAt}
                onChange={setNextAt}
                type="datetime-local"
              />
            </div>
          </Card>

          {/* LIVE CENTER */}
          <Card title="Live Center asociado">
            <p className="font-condensed text-[11px] uppercase tracking-widest text-muted-foreground">
              Vincula un evento de <span className="text-gold">Resultados</span> para mostrar su Live Center junto al vídeo (pruebas en directo, próximas, últimos resultados y clasificaciones rápidas).
            </p>
            <label className="block">
              <span className="font-condensed mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">
                Evento asociado
              </span>
              <select value={lcEventSlug} onChange={(e) => setLcEventSlug(e.target.value)} className="input">
                <option value="">— Sin evento asociado —</option>
                {events.map((e) => (
                  <option key={e.id} value={e.slug}>
                    {e.name}
                    {e.event_date ? ` · ${new Date(e.event_date).toLocaleDateString("es-ES")}` : ""}
                  </option>
                ))}
              </select>
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <Toggle label="Mostrar Live Center en la página pública" checked={showLc} onChange={setShowLc} />
              <SelectField
                label="Posición del Live Center"
                value={lcPosition}
                onChange={(v) => setLcPosition(v as "right" | "bottom")}
                options={[
                  { value: "right", label: "Derecha del vídeo" },
                  { value: "bottom", label: "Debajo del vídeo" },
                ]}
              />
              <Toggle
                label='Mostrar botón "Ver resultados completos"'
                checked={showFullBtn}
                onChange={setShowFullBtn}
              />
            </div>
            <p className="font-condensed text-[10px] uppercase tracking-wider text-muted-foreground">
              Si no hay evento asociado o el Live Center está desactivado, la página /tv funciona como siempre (solo vídeo).
            </p>
          </Card>

          {/* BANNERS */}
          <Card title="Banners publicitarios">
            <div className="grid gap-3 sm:grid-cols-2">
              <BannerLink
                title="Banners laterales verticales"
                description="Columna derecha, junto al reproductor. Se apilan varios."
                placement="tv_sidebar"
              />
              <BannerLink
                title="Banner premium horizontal"
                description="Ancho completo debajo del reproductor. Si activas varios se convierte en slider."
                placement="tv_premium"
              />
            </div>
          </Card>

          {/* PREMIUM BANNER SETTINGS */}
          <Card title="Ajustes del banner premium (slider)">
            <div className="grid gap-3 sm:grid-cols-2">
              <Toggle label="Autoplay del slider" checked={premAutoplay} onChange={setPremAutoplay} />
              <label className="block">
                <span className="font-condensed mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">
                  Velocidad (ms entre slides)
                </span>
                <input
                  type="number"
                  min={1500}
                  max={30000}
                  step={500}
                  value={premInterval}
                  onChange={(e) => setPremInterval(Number(e.target.value || 5000))}
                  className="input"
                />
              </label>
              <Toggle label="Mostrar flechas de navegación" checked={premArrows} onChange={setPremArrows} />
              <Toggle label="Mostrar puntos indicadores" checked={premDots} onChange={setPremDots} />
            </div>
            <p className="font-condensed text-[10px] uppercase tracking-wider text-muted-foreground">
              El slider se activa automáticamente cuando hay más de 1 banner activo con ubicación <span className="text-gold">tv_premium</span>.
            </p>
          </Card>

          {/* CONTENIDO */}
          <Card title="Contenido de la página">
            <div className="grid gap-3 sm:grid-cols-3">
              <BannerLink title="Próximas carreras" description="Gestión de emisiones programadas." placement="" href="/admin/tv-emisiones" />
              <BannerLink title="Highlights & momentos" description="Vídeos destacados de la parrilla." placement="" href="/admin/tv-highlights" />
              <BannerLink title="Vídeos del hub" description="Biblioteca de vídeos por país." placement="" href="/admin/videos" />
            </div>
          </Card>

          {/* SUSCRIPCIÓN */}
          <Card title="Bloque final de suscripción">
            <Field label="Título" value={subTitle} onChange={setSubTitle} placeholder="¿No te quieres perder nada?" />
            <label className="block">
              <span className="font-condensed mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">
                Texto
              </span>
              <textarea
                value={subText}
                onChange={(e) => setSubText(e.target.value)}
                rows={3}
                className="input"
                placeholder="Suscríbete a nuestro canal…"
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Texto del botón" value={subBtnText} onChange={setSubBtnText} placeholder="Suscribirse al canal" />
              <Field label="Enlace del botón" value={subBtnUrl} onChange={setSubBtnUrl} placeholder="https://youtube.com/…" />
            </div>
          </Card>
        </div>

        {/* PREVIEW */}
        <div className="space-y-4 lg:sticky lg:top-4 lg:h-fit">
          <Card title="Vista previa del reproductor">
            <div className="aspect-video w-full overflow-hidden border border-border bg-black">
              {previewEmbed ? (
                <iframe src={previewEmbed} title="preview" allowFullScreen className="h-full w-full" />
              ) : thumbUrl ? (
                <img src={thumbUrl} alt="preview" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                  Pega una URL para ver la vista previa
                </div>
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              <p className="font-display text-foreground">{title || "—"}</p>
              {subtitle && <p className="mt-1">{subtitle}</p>}
              <p className="font-condensed mt-2 uppercase tracking-widest text-gold">
                Estado: {liveActive ? "EN DIRECTO (forzado)" : statusLabel}
              </p>
            </div>
          </Card>

          <Link
            to="/tv"
            className="font-condensed flex items-center justify-center gap-2 border border-gold/60 px-4 py-3 text-xs font-bold uppercase tracking-widest text-gold hover:bg-gold hover:text-background"
          >
            <ExternalLink className="h-3.5 w-3.5" /> Abrir página pública /tv
          </Link>
        </div>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3 border border-border bg-surface p-5">
      <h2 className="font-display text-sm tracking-widest text-gold">{title.toUpperCase()}</h2>
      {children}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="font-condensed mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="input"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="block">
      <span className="font-condensed mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="input">
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="font-condensed flex cursor-pointer items-start gap-2 text-xs uppercase tracking-widest text-foreground">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 accent-[oklch(0.78_0.16_70)]"
      />
      <span>{label}</span>
    </label>
  );
}

function BannerLink({
  title,
  description,
  placement,
  href,
}: {
  title: string;
  description: string;
  placement: string;
  href?: string;
}) {
  const to = href ?? "/admin/banners";
  return (
    <a
      href={to}
      className="group block border border-border bg-background p-4 transition-colors hover:border-gold"
    >
      <p className="font-display text-sm uppercase tracking-widest text-foreground group-hover:text-gold">
        {title}
      </p>
      <p className="font-condensed mt-1 text-[11px] uppercase tracking-wider text-muted-foreground">
        {description}
      </p>
      {placement && (
        <p className="font-condensed mt-2 text-[10px] uppercase tracking-widest text-gold">
          Ubicación: {placement}
        </p>
      )}
    </a>
  );
}

function toLocalInput(iso: string) {
  const d = new Date(iso);
  const tz = d.getTimezoneOffset();
  const local = new Date(d.getTime() - tz * 60000);
  return local.toISOString().slice(0, 16);
}
