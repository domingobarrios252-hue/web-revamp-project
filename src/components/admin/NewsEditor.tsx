import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Eye, Save, Send, X, Check, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { EntityRelationsField, loadRelations, saveRelations } from "@/components/admin/EntityRelationsField";
import { ContentBlocksEditor } from "@/components/admin/ContentBlocksEditor";
import { NewsContentBlocks } from "@/components/site/NewsContentBlocks";
import {
  cleanBlocks,
  estimateReadMinutes,
  legacyToBlocks,
  parseBlocks,
  validateBlocks,
  type NewsBlock,
} from "@/lib/newsBlocks";
import type { ImageCrops } from "@/lib/imageCrops";

export type NewsStatus = "draft" | "pending" | "published" | "rejected";

export type NewsEditorItem = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  content_blocks: unknown;
  writer_id: string | null;
  category_id: string | null;
  legacy_tag: string | null;
  image_url: string | null;
  image_crops: ImageCrops | null;
  hero_display_mode: "crop" | "full";
  gallery: string[];
  video_url: string | null;
  video_embed_url: string | null;
  video_poster_url: string | null;
  read_minutes: number | null;
  featured: boolean;
  status: NewsStatus;
  published_at: string;
  country_code: string | null;
  live_active: boolean | null;
  live_event_id: string | null;
  live_start_at: string | null;
  live_end_at: string | null;
};

type Category = { id: string; name: string; scope: string };
type Writer = { id: string; full_name: string; published: boolean };
type EventOpt = { id: string; name: string; start_date: string | null };

/** Hub / edición: un único valor. El código coincide con news.country_code. */
export const HUBS = [
  { value: "general", label: "General" },
  { value: "es", label: "España" },
  { value: "co", label: "Colombia" },
  { value: "pt", label: "Portugal" },
  { value: "mia", label: "Miami" },
] as const;
type Hub = (typeof HUBS)[number]["value"];

const schema = z.object({
  title: z.string().trim().min(3, "El título debe tener al menos 3 caracteres").max(200),
  slug: z.string().trim().min(3, "Slug demasiado corto").max(200).regex(/^[a-z0-9-]+$/, "Slug: solo minúsculas, números y guiones"),
  excerpt: z.string().trim().max(500, "El subtítulo admite 500 caracteres").optional(),
  writer_id: z.string().uuid({ message: "Selecciona un autor" }),
});

function toLocalInput(iso: string | null | undefined): string {
  const d = iso ? new Date(iso) : new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
const toLocalOpt = (iso: string | null | undefined) => (iso ? toLocalInput(iso) : "");

export function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

const inputCls =
  "w-full border border-border bg-background px-3 py-2 text-sm focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold";
const labelCls = "font-condensed mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground";

type SaveState = "idle" | "dirty" | "saving" | "saved" | "error";

export function NewsEditor({
  item,
  categories,
  writers,
  onClose,
  onSaved,
}: {
  item: NewsEditorItem | null;
  categories: Category[];
  writers: Writer[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [newsId, setNewsId] = useState<string | null>(item?.id ?? null);
  const [title, setTitle] = useState(item?.title ?? "");
  const [slug, setSlug] = useState(item?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(item));
  const [excerpt, setExcerpt] = useState(item?.excerpt ?? "");
  // Un único editor: el contenido clásico, vídeo y galería se convierten en bloques.
  const [blocks, setBlocks] = useState<NewsBlock[]>(() =>
    legacyToBlocks({
      blocks: parseBlocks(item?.content_blocks),
      content: item?.content,
      gallery: item?.gallery,
      video_url: item?.video_url,
      video_embed_url: item?.video_embed_url,
      video_poster_url: item?.video_poster_url,
    }),
  );
  const [writerId, setWriterId] = useState(item?.writer_id ?? "");
  const [categoryId, setCategoryId] = useState(item?.category_id ?? "");
  const [legacyTag, setLegacyTag] = useState(item?.legacy_tag ?? "");
  const [imageUrl, setImageUrl] = useState(item?.image_url ?? "");
  const [imageCrops, setImageCrops] = useState<ImageCrops>(item?.image_crops ?? {});
  const [heroDisplayMode, setHeroDisplayMode] = useState<"crop" | "full">(item?.hero_display_mode ?? "crop");
  const [manualMinutes, setManualMinutes] = useState<number | "">("");
  const [featured, setFeatured] = useState(item?.featured ?? false);
  const [status, setStatus] = useState<NewsStatus>(item?.status ?? "draft");
  const [publishedAt, setPublishedAt] = useState(toLocalInput(item?.published_at));
  const [relClubs, setRelClubs] = useState<string[]>([]);
  const [relSkaters, setRelSkaters] = useState<string[]>([]);
  const [relFeds, setRelFeds] = useState<string[]>([]);
  const [visHome, setVisHome] = useState(true);
  const [hub, setHub] = useState<Hub>("general");
  const [liveActive, setLiveActive] = useState(item?.live_active ?? false);
  const [liveEventId, setLiveEventId] = useState(item?.live_event_id ?? "");
  const [liveStartAt, setLiveStartAt] = useState(toLocalOpt(item?.live_start_at));
  const [liveEndAt, setLiveEndAt] = useState(toLocalOpt(item?.live_end_at));
  const [eventOptions, setEventOptions] = useState<EventOpt[]>([]);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [preview, setPreview] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const loaded = useRef(!item);
  const hadCountryRow = useRef(false);
  const savingRef = useRef(false);

  const autoMinutes = useMemo(() => estimateReadMinutes(blocks), [blocks]);
  const readMinutes = typeof manualMinutes === "number" ? manualMinutes : autoMinutes;

  useEffect(() => {
    supabase
      .from("events")
      .select("id, name, start_date")
      .order("start_date", { ascending: false })
      .limit(200)
      .then(({ data }) => setEventOptions((data as EventOpt[]) ?? []));
  }, []);

  useEffect(() => {
    if (!item) return;
    (async () => {
      const [c, s, f, v] = await Promise.all([
        loadRelations("news", "clubs", item.id),
        loadRelations("news", "skaters", item.id),
        loadRelations("news", "federations", item.id),
        supabase.from("news_visibility").select("channel, country_code").eq("news_id", item.id),
      ]);
      setRelClubs(c);
      setRelSkaters(s);
      setRelFeds(f);
      const rows = (v.data ?? []) as { channel: string; country_code: string | null }[];
      const valid = HUBS.map((h) => h.value) as string[];
      // El hub es siempre el valor real guardado en news.country_code.
      setHub(item.country_code && valid.includes(item.country_code) ? (item.country_code as Hub) : "general");
      hadCountryRow.current = rows.some((r) => r.channel === "country");
      setVisHome(rows.length === 0 ? true : rows.some((r) => r.channel === "global_home"));
      // Evita que la carga inicial dispare el autoguardado.
      setTimeout(() => {
        loaded.current = true;
      }, 0);
    })();
  }, [item]);

  // Slug automático desde el título (solo mientras no se edite a mano; las noticias
  // existentes conservan su URL).
  useEffect(() => {
    if (!slugTouched) setSlug(slugify(title));
  }, [title, slugTouched]);

  const visibleWriters = writers.filter((w) => w.published || w.id === writerId);

  const save = useCallback(
    async (targetStatus: NewsStatus, opts: { silent?: boolean; close?: boolean } = {}) => {
      if (savingRef.current) return false;
      const parsed = schema.safeParse({ title, slug, excerpt: excerpt || undefined, writer_id: writerId });
      if (!parsed.success) {
        if (!opts.silent) toast.error(parsed.error.issues[0]?.message ?? "Datos no válidos");
        return false;
      }
      if (!visHome && hub === "general") {
        if (!opts.silent) toast.error("Activa la portada general o elige un hub.");
        return false;
      }
      if (targetStatus === "published" || targetStatus === "pending") {
        const errs = validateBlocks(blocks).filter((i) => i.level === "error");
        if (errs.length > 0) {
          toast.error(`Bloque ${errs[0].index + 1}: ${errs[0].message}${errs.length > 1 ? ` (+${errs.length - 1} más)` : ""}`);
          return false;
        }
      }
      const writer = writers.find((w) => w.id === writerId);
      if (!writer) {
        if (!opts.silent) toast.error("Autor no válido");
        return false;
      }
      const clean = cleanBlocks(blocks);
      // "general" se guarda como edición real e independiente.
      const countryCode = hub;
      // Noticias antiguas que nunca tuvieron fila de hub la conservan así si el hub no cambia,
      // para no alterar dónde aparecen en las páginas públicas.
      const keepNoCountryRow = !!item && !hadCountryRow.current && item.country_code === hub;
      const plain = clean
        .filter((b) => b.type === "text" || b.type === "heading")
        .map((b) => (b as { text: string }).text)
        .join("\n\n");

      savingRef.current = true;
      setSaveState("saving");
      try {
        const payload = {
          title: parsed.data.title,
          slug: parsed.data.slug,
          excerpt: parsed.data.excerpt ?? null,
          content: plain || null,
          content_blocks: clean as never,
          author: writer.full_name,
          writer_id: writer.id,
          category_id: categoryId || null,
          legacy_tag: legacyTag.trim() || null,
          image_url: imageUrl.trim() || null,
          image_crops: imageCrops as never,
          hero_display_mode: heroDisplayMode,
          // Galería y vídeo viven ahora dentro de los bloques.
          gallery: [],
          video_url: null,
          video_embed_url: null,
          video_poster_url: null,
          read_minutes: readMinutes,
          featured,
          status: targetStatus,
          published_at: new Date(publishedAt).toISOString(),
          country_code: countryCode,
          live_active: liveActive,
          live_event_id: liveActive && liveEventId ? liveEventId : null,
          live_start_at: liveActive && liveStartAt ? new Date(liveStartAt).toISOString() : null,
          live_end_at: liveActive && liveEndAt ? new Date(liveEndAt).toISOString() : null,
        };
        let id = newsId;
        if (id) {
          const { error } = await supabase.from("news").update(payload).eq("id", id);
          if (error) throw error;
        } else {
          const { data, error } = await supabase.from("news").insert(payload).select("id").single();
          if (error) throw error;
          id = (data as { id: string }).id;
          setNewsId(id);
        }
        await Promise.all([
          saveRelations("news", "clubs", id, relClubs),
          saveRelations("news", "skaters", id, relSkaters),
          saveRelations("news", "federations", id, relFeds),
        ]);
        await supabase.from("news_visibility").delete().eq("news_id", id).in("channel", ["global_home", "country"]);
        const rows: { news_id: string; channel: "global_home" | "country"; country_code?: string }[] = [];
        if (visHome) rows.push({ news_id: id, channel: "global_home" });
        if (hub !== "general" && !keepNoCountryRow) rows.push({ news_id: id, channel: "country", country_code: hub });
        hadCountryRow.current = rows.some((r) => r.channel === "country");
        for (const row of rows) {
          const { error } = await supabase.from("news_visibility").insert(row);
          if (error && !opts.silent) toast.error(`Visibilidad no guardada: ${error.message}`);
        }
        setStatus(targetStatus);
        setSaveState("saved");
        setSavedAt(new Date());
        if (!opts.silent) {
          toast.success(
            targetStatus === "published" ? "Noticia publicada" : targetStatus === "pending" ? "Enviada a revisión" : "Borrador guardado",
          );
        }
        if (opts.close) onSaved();
        return true;
      } catch (e) {
        setSaveState("error");
        toast.error((e as Error).message);
        return false;
      } finally {
        savingRef.current = false;
      }
    },
    [
      title, slug, excerpt, writerId, visHome, hub, blocks, writers, item, featured, newsId, categoryId,
      legacyTag, imageUrl, imageCrops, heroDisplayMode, readMinutes, publishedAt, liveActive, liveEventId,
      liveStartAt, liveEndAt, relClubs, relSkaters, relFeds, onSaved,
    ],
  );

  // Autosave: solo borradores, 4 s después del último cambio. Nunca publica.
  const fingerprint = JSON.stringify([
    title, slug, excerpt, blocks, writerId, categoryId, legacyTag, imageUrl, imageCrops, heroDisplayMode,
    manualMinutes, featured, publishedAt, relClubs, relSkaters, relFeds, visHome, hub, liveActive,
    liveEventId, liveStartAt, liveEndAt,
  ]);
  const firstFp = useRef<string | null>(null);
  useEffect(() => {
    if (!loaded.current) return;
    if (firstFp.current === null) {
      firstFp.current = fingerprint;
      return;
    }
    if (fingerprint === firstFp.current && saveState === "idle") return;
    setSaveState("dirty");
    if (status !== "draft") return;
    const t = setTimeout(() => {
      void save("draft", { silent: true });
    }, 4000);
    return () => clearTimeout(t);
  }, [fingerprint]); // eslint-disable-line react-hooks/exhaustive-deps

  const indicator = (() => {
    if (saveState === "saving") return <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Guardando…</>;
    if (saveState === "saved" && savedAt)
      return <><Check className="h-3.5 w-3.5 text-gold" /> Guardado {savedAt.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}</>;
    if (saveState === "error") return <span className="text-destructive">Error al guardar</span>;
    if (saveState === "dirty") return status === "draft" ? "Cambios sin guardar…" : "Cambios sin guardar";
    return item ? "Sin cambios" : "Nuevo borrador";
  })();

  const statusLabel: Record<NewsStatus, string> = {
    draft: "Borrador",
    pending: "Pendiente de revisión",
    published: "Publicada",
    rejected: "Rechazada",
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-background">
      {/* Barra superior */}
      <div className="sticky top-0 z-10 border-b border-border bg-surface/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2 px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar editor"
            className="inline-flex h-11 w-11 items-center justify-center border border-border text-muted-foreground hover:border-gold hover:text-gold"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="min-w-0 flex-1">
            <h2 className="font-display truncate text-lg tracking-widest">{item ? "Editar noticia" : "Nueva noticia"}</h2>
            <p className="font-condensed inline-flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-muted-foreground">
              {statusLabel[status]} · {indicator}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void save("draft")}
            className="font-condensed inline-flex min-h-11 items-center gap-2 border border-border px-3 text-xs font-bold uppercase tracking-widest text-foreground hover:border-gold hover:text-gold"
          >
            <Save className="h-4 w-4" /> <span className="hidden sm:inline">Guardar borrador</span><span className="sm:hidden">Borrador</span>
          </button>
          <button
            type="button"
            onClick={() => setPreview(true)}
            className="font-condensed inline-flex min-h-11 items-center gap-2 border border-border px-3 text-xs font-bold uppercase tracking-widest text-foreground hover:border-gold hover:text-gold"
          >
            <Eye className="h-4 w-4" /> <span className="hidden sm:inline">Vista previa</span>
          </button>
          <button
            type="button"
            onClick={() => void save("published", { close: true })}
            className="font-condensed inline-flex min-h-11 items-center gap-2 bg-gold px-4 text-xs font-bold uppercase tracking-widest text-background hover:bg-gold-dark"
          >
            <Send className="h-4 w-4" /> {status === "published" ? "Actualizar" : "Publicar"}
          </button>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* Zona principal */}
        <main className="min-w-0 space-y-5">
          <textarea
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título de la noticia"
            rows={2}
            aria-label="Título"
            className="font-display w-full resize-none border-0 border-b border-border bg-transparent px-0 py-2 text-2xl leading-tight tracking-wide focus:border-gold focus:outline-none md:text-4xl"
          />
          <div>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Subtítulo / entradilla: resume la noticia en una o dos frases"
              rows={2}
              maxLength={500}
              aria-label="Subtítulo / Entradilla"
              className="w-full resize-none border-0 border-b border-border bg-transparent px-0 py-2 text-base text-muted-foreground focus:border-gold focus:text-foreground focus:outline-none md:text-lg"
            />
            <p className="mt-1 text-right text-[11px] text-muted-foreground">{excerpt.length}/500</p>
          </div>

          <section className="border border-border bg-surface p-4">
            <span className={labelCls}>Imagen de portada</span>
            <ImageUploadField
              value={imageUrl}
              onChange={setImageUrl}
              folder="news"
              nameHint={slug || title}
              placeholder="URL o subir imagen de portada"
              crops={imageCrops}
              onCropsChange={setImageCrops}
              previewClassName="mt-3 aspect-video w-full max-w-xl object-cover"
            />
            {imageUrl && (
              <div className="mt-3 flex flex-wrap gap-4 text-sm">
                {(["crop", "full"] as const).map((m) => (
                  <label key={m} className="inline-flex min-h-11 items-center gap-2">
                    <input
                      type="radio"
                      checked={heroDisplayMode === m}
                      onChange={() => setHeroDisplayMode(m)}
                      className="accent-[var(--gold,#caa15a)]"
                    />
                    {m === "crop" ? "Recortada (16:9)" : "Completa (sin recorte)"}
                  </label>
                ))}
              </div>
            )}
          </section>

          <section>
            <div className="mb-2 flex items-center justify-between">
              <span className="font-display text-lg tracking-widest">Artículo</span>
              <span className="font-condensed text-[11px] uppercase tracking-widest text-muted-foreground">
                {readMinutes} min de lectura
              </span>
            </div>
            <ContentBlocksEditor value={blocks} onChange={setBlocks} nameHint={slug || title} title={title} />
          </section>
        </main>

        {/* Barra lateral */}
        <aside className="space-y-4">
          <Panel title="Publicación">
            <label className="block">
              <span className={labelCls}>Estado editorial</span>
              <select value={status} onChange={(e) => setStatus(e.target.value as NewsStatus)} className={inputCls}>
                {(Object.keys(statusLabel) as NewsStatus[]).map((s) => (
                  <option key={s} value={s}>{statusLabel[s]}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className={labelCls}>Fecha de publicación</span>
              <input type="datetime-local" value={publishedAt} onChange={(e) => setPublishedAt(e.target.value)} className={inputCls} />
            </label>
            <p className="text-[11px] text-muted-foreground">
              El autoguardado solo actúa en borradores y nunca publica.
            </p>
          </Panel>

          <Panel title="Hero portada">
            <Toggle label="Destacar como hero de portada" checked={featured} onChange={setFeatured} />
            <Toggle label="Mostrar en portada general" checked={visHome} onChange={setVisHome} />
          </Panel>

          <Panel title="Hub / edición">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-2">
              {HUBS.map((h) => (
                <button
                  key={h.value}
                  type="button"
                  onClick={() => setHub(h.value)}
                  aria-pressed={hub === h.value}
                  className={`font-condensed min-h-11 border px-2 text-xs font-bold uppercase tracking-widest ${
                    hub === h.value ? "border-gold bg-gold/15 text-gold" : "border-border text-muted-foreground hover:border-gold/60"
                  }`}
                >
                  {h.label}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground">
              {hub === "general"
                ? visHome
                  ? "Solo en la portada general."
                  : "Sin destino: activa la portada general o elige un hub."
                : `Se publicará en ${HUBS.find((h) => h.value === hub)?.label}${visHome ? " y en la portada general" : ""}.`}
            </p>
          </Panel>

          <Panel title="Autor y categoría">
            <label className="block">
              <span className={labelCls}>Autor *</span>
              <select value={writerId} onChange={(e) => setWriterId(e.target.value)} className={inputCls}>
                <option value="">{visibleWriters.length === 0 ? "— Crea un redactor primero —" : "— Selecciona autor —"}</option>
                {visibleWriters.map((w) => (
                  <option key={w.id} value={w.id}>{w.published ? w.full_name : `${w.full_name} (oculto)`}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className={labelCls}>Categoría</span>
              <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={inputCls}>
                <option value="">— Sin categoría —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.scope} · {c.name}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className={labelCls}>Etiqueta</span>
              <input value={legacyTag} onChange={(e) => setLegacyTag(e.target.value)} maxLength={60} placeholder="Ej. Liga Nacional" className={inputCls} />
            </label>
          </Panel>

          <Panel title="Relacionados">
            <EntityRelationsField compact kind="clubs" label="Clubes" value={relClubs} onChange={setRelClubs} />
            <EntityRelationsField compact kind="skaters" label="Patinadores" value={relSkaters} onChange={setRelSkaters} />
            <EntityRelationsField compact kind="federations" label="Federaciones" value={relFeds} onChange={setRelFeds} />
          </Panel>

          <div className="border border-border bg-surface">
            <button
              type="button"
              onClick={() => setAdvancedOpen((o) => !o)}
              className="font-condensed flex min-h-11 w-full items-center justify-between px-4 text-xs font-bold uppercase tracking-widest text-gold"
            >
              Opciones avanzadas
              <ChevronDown className={`h-4 w-4 transition-transform ${advancedOpen ? "rotate-180" : ""}`} />
            </button>
            {advancedOpen && (
              <div className="space-y-3 border-t border-border p-4">
                <label className="block">
                  <span className={labelCls}>Slug (URL)</span>
                  <input
                    value={slug}
                    onChange={(e) => {
                      setSlugTouched(true);
                      setSlug(slugify(e.target.value));
                    }}
                    className={inputCls}
                  />
                  {item && <span className="mt-1 block text-[11px] text-muted-foreground">Cambiarlo rompe los enlaces ya compartidos.</span>}
                </label>
                <label className="block">
                  <span className={labelCls}>Minutos de lectura (auto: {autoMinutes})</span>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={manualMinutes}
                    placeholder={`${autoMinutes} (automático)`}
                    onChange={(e) => setManualMinutes(e.target.value === "" ? "" : Math.min(60, Math.max(1, Number(e.target.value))))}
                    className={inputCls}
                  />
                </label>
                <div className="space-y-3 border-t border-border pt-3">
                  <Toggle label="Distintivo EN DIRECTO en el hero" checked={liveActive} onChange={setLiveActive} />
                  {liveActive && (
                    <>
                      <select value={liveEventId} onChange={(e) => setLiveEventId(e.target.value)} className={inputCls}>
                        <option value="">— Sin evento vinculado —</option>
                        {eventOptions.map((e) => (
                          <option key={e.id} value={e.id}>
                            {e.start_date ? `${e.name} (${new Date(e.start_date).toLocaleDateString("es-ES")})` : e.name}
                          </option>
                        ))}
                      </select>
                      <label className="block">
                        <span className={labelCls}>Inicio (opcional)</span>
                        <input type="datetime-local" value={liveStartAt} onChange={(e) => setLiveStartAt(e.target.value)} className={inputCls} />
                      </label>
                      <label className="block">
                        <span className={labelCls}>Fin (opcional)</span>
                        <input type="datetime-local" value={liveEndAt} onChange={(e) => setLiveEndAt(e.target.value)} className={inputCls} />
                      </label>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>

      {preview && (
        <div className="fixed inset-0 z-[60] overflow-y-auto bg-background">
          <div className="sticky top-0 flex items-center justify-between border-b border-border bg-surface px-4 py-3">
            <span className="font-condensed text-xs font-bold uppercase tracking-widest text-gold">Vista previa</span>
            <button
              type="button"
              onClick={() => setPreview(false)}
              className="font-condensed min-h-11 border border-border px-4 text-xs uppercase tracking-widest hover:border-gold hover:text-gold"
            >
              Volver a editar
            </button>
          </div>
          <article className="mx-auto max-w-3xl space-y-5 px-6 py-8">
            <h1 className="font-display text-3xl leading-tight tracking-wide md:text-5xl">{title || "Sin título"}</h1>
            {excerpt && <p className="text-lg text-muted-foreground">{excerpt}</p>}
            <p className="font-condensed text-[11px] uppercase tracking-widest text-muted-foreground">
              {writers.find((w) => w.id === writerId)?.full_name ?? "Autor"} · {readMinutes} min
            </p>
            {imageUrl && <img src={imageUrl} alt={title} className={`w-full border border-border ${heroDisplayMode === "crop" ? "aspect-video object-cover" : "h-auto"}`} />}
            <NewsContentBlocks blocks={cleanBlocks(blocks)} title={title} />
          </article>
        </div>
      )}
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3 border border-border bg-surface p-4">
      <h3 className="font-condensed text-xs font-bold uppercase tracking-widest text-gold">{title}</h3>
      {children}
    </section>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 accent-[oklch(0.78_0.16_70)]"
      />
      {label}
    </label>
  );
}
