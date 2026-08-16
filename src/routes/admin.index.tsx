import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  Plus, Pencil, Trash2, Eye, EyeOff, Star, ArrowUp, ArrowDown,
  Bold, Italic, List, ListOrdered, Quote, Link2, Minus, Heading2, Heading3,
  Image as ImageIcon, Video as VideoIcon, Images,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { z } from "zod";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { GalleryUploadField } from "@/components/admin/GalleryUploadField";
import { NewsVideoUploadField, deleteStoredVideo } from "@/components/admin/NewsVideoUploadField";
import { EntityRelationsField, loadRelations, saveRelations } from "@/components/admin/EntityRelationsField";
import { ContentBlocksEditor } from "@/components/admin/ContentBlocksEditor";
import { cleanBlocks, createBlock, parseBlocks, validateBlocks, type NewsBlock } from "@/lib/newsBlocks";

type Category = { id: string; name: string; slug: string; scope: string };
type Writer = { id: string; full_name: string; published: boolean };
type News = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  content_blocks: unknown;
  author: string;
  writer_id: string | null;
  category_id: string | null;
  legacy_tag: string | null;
  image_url: string | null;
  image_crops: import("@/lib/imageCrops").ImageCrops | null;
  hero_display_mode: "crop" | "full";
  gallery: string[];
  video_url: string | null;
  video_embed_url: string | null;
  video_poster_url: string | null;
  read_minutes: number | null;
  featured: boolean;
  hero_order: number;
  published: boolean;
  status: "draft" | "pending" | "published" | "rejected";
  section_id: string | null;
  review_feedback: string | null;
  views_count: number;
  published_at: string;
  country_code: string | null;
  live_active: boolean | null;
  live_event_id: string | null;
  live_start_at: string | null;
  live_end_at: string | null;
};
type EventOpt = { id: string; name: string; start_date: string | null };

const newsSchema = z.object({
  title: z.string().trim().min(3).max(200),
  slug: z.string().trim().min(3).max(200).regex(/^[a-z0-9-]+$/, "Solo minúsculas, números y guiones"),
  excerpt: z.string().trim().max(500).optional(),
  content: z.string().trim().max(20000).optional(),
  writer_id: z.string().uuid({ message: "Selecciona un redactor" }),
  category_id: z.string().uuid().optional(),
  legacy_tag: z.string().trim().max(60).optional(),
  image_url: z.string().trim().url().optional().or(z.literal("")),
  gallery: z.array(z.string().trim().url()).max(50).default([]),
  video_url: z.string().trim().url().optional().or(z.literal("")),
  video_embed_url: z.string().trim().max(2000).optional().or(z.literal("")),
  video_poster_url: z.string().trim().url().optional().or(z.literal("")),
  read_minutes: z.number().int().min(1).max(60).optional(),
  featured: z.boolean(),
  status: z.enum(["draft", "pending", "published", "rejected"]),
  published_at: z.string().min(1, "Fecha requerida"),
});

// Convert ISO timestamp to local datetime-local input value (YYYY-MM-DDTHH:mm)
function toLocalInput(iso: string | null | undefined): string {
  const d = iso ? new Date(iso) : new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toLocalInputOptional(iso: string | null | undefined): string {
  if (!iso) return "";
  return toLocalInput(iso);
}

function computeLiveBadgeState(
  active: boolean,
  startIso: string,
  endIso: string,
): "live" | "scheduled" | "ended" | "off" {
  if (!active) return "off";
  const now = Date.now();
  const start = startIso ? new Date(startIso).getTime() : null;
  const end = endIso ? new Date(endIso).getTime() : null;
  if (start !== null && now < start) return "scheduled";
  if (end !== null && now > end) return "ended";
  return "live";
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export const Route = createFileRoute("/admin/")({
  component: AdminNewsList,
});

function AdminNewsList() {
  const { isAdmin } = useAuth();
  const [news, setNews] = useState<News[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [writers, setWriters] = useState<Writer[]>([]);
  const [editing, setEditing] = useState<News | "new" | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = async () => {
    setLoading(true);
    const [{ data: n }, { data: c }, { data: w }] = await Promise.all([
      supabase
        .from("news")
        .select(
          "id, title, slug, excerpt, content, content_blocks, author, writer_id, category_id, legacy_tag, image_url, image_crops, hero_display_mode, gallery, video_url, video_embed_url, video_poster_url, read_minutes, featured, hero_order, published, status, section_id, review_feedback, views_count, published_at, country_code, live_active, live_event_id, live_start_at, live_end_at"
        )
        .order("published_at", { ascending: false }),
      supabase
        .from("news_categories")
        .select("id, name, slug, scope")
        .order("sort_order", { ascending: true }),
      supabase
        .from("writers")
        .select("id, full_name, published")
        .order("sort_order", { ascending: true })
        .order("full_name", { ascending: true }),
    ]);
    setNews((n as News[]) ?? []);
    setCategories((c as Category[]) ?? []);
    setWriters((w as Writer[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    reload();
  }, []);

  const onDelete = async (id: string, title: string) => {
    if (!confirm(`¿Borrar "${title}"?`)) return;
    const target = news.find((n) => n.id === id);
    const { error } = await supabase.from("news").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      // Clean up the uploaded video file from storage if any.
      if (target?.video_url) {
        try { await deleteStoredVideo(target.video_url); } catch { /* ignore */ }
      }
      toast.success("Noticia borrada");
      reload();
    }
  };

  const togglePublish = async (n: News) => {
    const { error } = await supabase
      .from("news")
      .update({ status: n.status === "published" ? "draft" : "published" })
      .eq("id", n.id);
    if (error) toast.error(error.message);
    else reload();
  };

  const toggleFeatured = async (n: News) => {
    const nextFeatured = !n.featured;
    const featuredList = news.filter((x) => x.featured);
    const nextOrder = nextFeatured
      ? (featuredList.reduce((m, x) => Math.max(m, x.hero_order ?? 0), 0) + 1)
      : 0;
    const { error } = await supabase
      .from("news")
      .update({ featured: nextFeatured, hero_order: nextOrder })
      .eq("id", n.id);
    if (error) toast.error(error.message);
    else reload();
  };

  const moveHero = async (n: News, dir: -1 | 1) => {
    const sorted = news
      .filter((x) => x.featured)
      .sort((a, b) => (a.hero_order ?? 0) - (b.hero_order ?? 0) || a.published_at.localeCompare(b.published_at));
    const idx = sorted.findIndex((x) => x.id === n.id);
    const swapIdx = idx + dir;
    if (idx < 0 || swapIdx < 0 || swapIdx >= sorted.length) return;
    const a = sorted[idx];
    const b = sorted[swapIdx];
    const aOrder = a.hero_order ?? idx + 1;
    const bOrder = b.hero_order ?? swapIdx + 1;
    const [r1, r2] = await Promise.all([
      supabase.from("news").update({ hero_order: bOrder }).eq("id", a.id),
      supabase.from("news").update({ hero_order: aOrder }).eq("id", b.id),
    ]);
    const error = r1.error || r2.error;
    if (error) toast.error(error.message);
    else reload();
  };

  const heroSorted = news
    .filter((n) => n.featured && n.status === "published")
    .sort((a, b) => (a.hero_order ?? 0) - (b.hero_order ?? 0) || b.published_at.localeCompare(a.published_at));

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="font-display text-2xl tracking-widest md:text-3xl">
          Noticias
        </h1>
        <button
          onClick={() => setEditing("new")}
          className="font-condensed inline-flex items-center gap-1.5 bg-gold px-4 py-2 text-xs font-bold uppercase tracking-widest text-background hover:bg-gold-dark"
        >
          <Plus className="h-3.5 w-3.5" /> Nueva noticia
        </button>
      </div>

      {!loading && heroSorted.length > 0 && (
        <div className="mb-6 border border-gold/40 bg-surface">
          <div className="flex items-center justify-between border-b border-border px-3 py-2">
            <h2 className="font-condensed text-[11px] font-bold uppercase tracking-widest text-gold">
              Hero destacado · orden del carrusel ({heroSorted.length}/5)
            </h2>
            <span className="text-[11px] text-muted-foreground">Solo se muestran las primeras 5</span>
          </div>
          <ul>
            {heroSorted.map((n, i) => (
              <li
                key={n.id}
                className={
                  "flex items-center gap-3 border-b border-border/50 px-3 py-2 last:border-0 " +
                  (i >= 5 ? "opacity-50" : "")
                }
              >
                <span className="font-condensed w-6 text-center text-xs font-bold text-gold">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold text-foreground">{n.title}</div>
                  <div className="truncate text-xs text-muted-foreground">/{n.slug}</div>
                </div>
                <div className="flex gap-1">
                  <IconBtn title="Subir" onClick={() => moveHero(n, -1)}>
                    <ArrowUp className="h-4 w-4" />
                  </IconBtn>
                  <IconBtn title="Bajar" onClick={() => moveHero(n, 1)}>
                    <ArrowDown className="h-4 w-4" />
                  </IconBtn>
                  <IconBtn title="Quitar del hero" onClick={() => toggleFeatured(n)}>
                    <Star className="h-4 w-4 fill-gold text-gold" />
                  </IconBtn>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      {loading ? (
        <p className="text-muted-foreground">Cargando…</p>
      ) : news.length === 0 ? (
        <p className="text-muted-foreground">No hay noticias todavía.</p>
      ) : (
        <div className="overflow-x-auto border border-border bg-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="font-condensed border-b border-border bg-background text-left text-[11px] uppercase tracking-widest text-muted-foreground">
                <th className="px-3 py-2">Título</th>
                <th className="px-3 py-2">Categoría</th>
                <th className="px-3 py-2">Autor</th>
                <th className="px-3 py-2 text-right">Vistas</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {news.map((n) => {
                const cat = categories.find((c) => c.id === n.category_id);
                return (
                  <tr key={n.id} className="border-b border-border/50 last:border-0">
                    <td className="px-3 py-2">
                      <div className="font-semibold text-foreground">{n.title}</div>
                      <div className="text-xs text-muted-foreground">/{n.slug}</div>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">{cat?.name ?? "—"}</td>
                    <td className="px-3 py-2 text-muted-foreground">{n.author}</td>
                    <td className="px-3 py-2 text-right text-muted-foreground">
                      {n.views_count}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex justify-end gap-1">
                        <IconBtn title={n.featured ? "Quitar destacada" : "Destacar"} onClick={() => toggleFeatured(n)}>
                          <Star className={n.featured ? "h-4 w-4 fill-gold text-gold" : "h-4 w-4"} />
                        </IconBtn>
                        <IconBtn title={n.status === "published" ? "Despublicar" : "Publicar"} onClick={() => togglePublish(n)}>
                          {n.status === "published" ? <Eye className="h-4 w-4 text-gold" /> : <EyeOff className="h-4 w-4" />}
                        </IconBtn>
                        <IconBtn title="Editar" onClick={() => setEditing(n)}>
                          <Pencil className="h-4 w-4" />
                        </IconBtn>
                        {isAdmin && (
                          <IconBtn title="Borrar" onClick={() => onDelete(n.id, n.title)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </IconBtn>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <NewsEditor
          item={editing === "new" ? null : editing}
          categories={categories}
          writers={writers}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            reload();
          }}
        />
      )}
    </div>
  );
}

function IconBtn({
  children,
  title,
  onClick,
}: {
  children: React.ReactNode;
  title: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="border border-border bg-background p-1.5 text-muted-foreground transition-colors hover:border-gold hover:text-gold"
    >
      {children}
    </button>
  );
}

function NewsEditor({
  item,
  categories,
  writers,
  onClose,
  onSaved,
}: {
  item: News | null;
  categories: Category[];
  writers: Writer[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const { isAdmin } = useAuth();
  const [title, setTitle] = useState(item?.title ?? "");
  const [slug, setSlug] = useState(item?.slug ?? "");
  const [excerpt, setExcerpt] = useState(item?.excerpt ?? "");
  const [content, setContent] = useState(item?.content ?? "");
  const [blocks, setBlocks] = useState<NewsBlock[]>(parseBlocks(item?.content_blocks));
  const [writerId, setWriterId] = useState(item?.writer_id ?? "");
  const [categoryId, setCategoryId] = useState(item?.category_id ?? "");
  const [legacyTag, setLegacyTag] = useState(item?.legacy_tag ?? "");
  const [imageUrl, setImageUrl] = useState(item?.image_url ?? "");
  const [imageCrops, setImageCrops] = useState<import("@/lib/imageCrops").ImageCrops>(
    (item?.image_crops as import("@/lib/imageCrops").ImageCrops | null) ?? {}
  );
  const [heroDisplayMode, setHeroDisplayMode] = useState<"crop" | "full">(
    item?.hero_display_mode ?? "crop"
  );
  const [gallery, setGallery] = useState<string[]>(item?.gallery ?? []);
  const [videoUrl, setVideoUrl] = useState<string>(item?.video_url ?? "");
  const [videoEmbedUrl, setVideoEmbedUrl] = useState<string>(item?.video_embed_url ?? "");
  const [videoPosterUrl, setVideoPosterUrl] = useState<string>(item?.video_poster_url ?? "");
  const [readMinutes, setReadMinutes] = useState<number | "">(item?.read_minutes ?? 4);
  const [featured, setFeatured] = useState(item?.featured ?? false);
  const [status, setStatus] = useState<News["status"]>(item?.status ?? "draft");
  const [publishedAt, setPublishedAt] = useState<string>(toLocalInput(item?.published_at));
  const [saving, setSaving] = useState(false);
  const [relClubs, setRelClubs] = useState<string[]>([]);
  const [relSkaters, setRelSkaters] = useState<string[]>([]);
  const [relFeds, setRelFeds] = useState<string[]>([]);
  const [visHome, setVisHome] = useState(true);
  // Hub scope is mutually exclusive — a noticia pertenece como máximo a UN hub
  // de país. Esto evita que se mezcle el contenido entre /hub/es y /hub/co.
  const [hubScope, setHubScope] = useState<"none" | "es" | "co">("none");
  // Directo: distintivo EN DIRECTO en el hero de portada
  const [liveActive, setLiveActive] = useState<boolean>(item?.live_active ?? false);
  const [liveEventId, setLiveEventId] = useState<string>(item?.live_event_id ?? "");
  const [liveStartAt, setLiveStartAt] = useState<string>(toLocalInputOptional(item?.live_start_at));
  const [liveEndAt, setLiveEndAt] = useState<string>(toLocalInputOptional(item?.live_end_at));
  const [eventOptions, setEventOptions] = useState<EventOpt[]>([]);

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
        supabase
          .from("news_visibility")
          .select("channel, country_code")
          .eq("news_id", item.id),
      ]);
      setRelClubs(c); setRelSkaters(s); setRelFeds(f);
      const rows = (v.data ?? []) as { channel: string; country_code: string | null }[];
      if (rows.length === 0) {
        // Compatibilidad: derivar del country_code legacy si está presente.
        setVisHome(true);
        if (item.country_code === "co") setHubScope("co");
        else if (item.country_code === "es") setHubScope("es");
        else setHubScope("none");
      } else {
        setVisHome(rows.some((r) => r.channel === "global_home"));
        const hasES = rows.some((r) => r.channel === "country" && r.country_code === "es");
        const hasCO = rows.some((r) => r.channel === "country" && r.country_code === "co");
        // Si por datos legacy existen ambos, nos quedamos con el primero alfabético
        // y avisamos al editor para que lo corrija al guardar.
        if (hasES && hasCO) setHubScope("es");
        else if (hasES) setHubScope("es");
        else if (hasCO) setHubScope("co");
        else setHubScope("none");
      }
    })();
  }, [item]);

  // Auto-slug for new
  useEffect(() => {
    if (!item && title && !slug) setSlug(slugify(title));
  }, [title]); // eslint-disable-line react-hooks/exhaustive-deps

  // Only show published writers in dropdown, but include current one if it's hidden
  const visibleWriters = writers.filter((w) => w.published || w.id === writerId);

  const onSubmit = async (e: React.FormEvent | null, overrideStatus?: News["status"]) => {
    e?.preventDefault();
    const effectiveStatus = overrideStatus ?? status;

    const parsed = newsSchema.safeParse({
      title,
      slug,
      excerpt: excerpt || undefined,
      content: content || undefined,
      writer_id: writerId,
      category_id: categoryId || undefined,
      legacy_tag: legacyTag || undefined,
      image_url: imageUrl || undefined,
      gallery,
      video_url: videoUrl || undefined,
      video_embed_url: videoEmbedUrl || undefined,
      video_poster_url: videoPosterUrl || undefined,
      read_minutes: typeof readMinutes === "number" ? readMinutes : undefined,
      featured,
      status: effectiveStatus,
      published_at: publishedAt,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Datos no válidos");
      return;
    }
    const writer = writers.find((w) => w.id === parsed.data.writer_id);
    if (!writer) {
      toast.error("Redactor no válido");
      return;
    }
    // Validación de consistencia: el country_code se deriva siempre del hub
    // seleccionado, y los hubs de país son excluyentes — nunca se mezclan.
    if (!visHome && hubScope === "none") {
      toast.error("Selecciona al menos un destino (Portada general o un Hub de país).");
      return;
    }
    // Validación de bloques de contenido: no se publica con campos obligatorios vacíos.
    const blockIssues = validateBlocks(blocks);
    const blockErrors = blockIssues.filter((i) => i.level === "error");
    if (blockErrors.length > 0 && (effectiveStatus === "published" || effectiveStatus === "pending")) {
      const first = blockErrors[0];
      toast.error(
        `Bloque ${first.index + 1}: ${first.message}${
          blockErrors.length > 1 ? ` (+${blockErrors.length - 1} más)` : ""
        }`,
      );
      return;
    }

    // country_code debe ser non-null en BD. Si no se elige hub de país,
    // conservamos el valor actual (o 'es' por defecto en nuevas noticias).
    const derivedCountry: string =
      hubScope === "es" ? "es" : hubScope === "co" ? "co" : (item?.country_code ?? "es");

    setSaving(true);
    try {
      if (featured) {
        await supabase.from("news").update({ featured: false }).eq("featured", true);
      }
      // country_code se sincroniza siempre con el hub seleccionado para que
      // los fallbacks legacy no muestren la noticia en hubs equivocados.
      const payload = {
        title: parsed.data.title,
        slug: parsed.data.slug,
        excerpt: parsed.data.excerpt ?? null,
        content: parsed.data.content ?? null,
        content_blocks: cleanBlocks(blocks) as never,
        author: writer.full_name,
        writer_id: writer.id,
        category_id: parsed.data.category_id ?? null,
        legacy_tag: parsed.data.legacy_tag ?? null,
        image_url: parsed.data.image_url || null,
        image_crops: imageCrops as never,
        hero_display_mode: heroDisplayMode,
        gallery: parsed.data.gallery,
        video_url: parsed.data.video_url || null,
        video_embed_url: parsed.data.video_embed_url || null,
        video_poster_url: parsed.data.video_poster_url || null,
        read_minutes: parsed.data.read_minutes ?? null,
        featured: parsed.data.featured,
        status: parsed.data.status,
        published_at: new Date(parsed.data.published_at).toISOString(),
        country_code: derivedCountry,
        live_active: liveActive,
        live_event_id: liveActive && liveEventId ? liveEventId : null,
        live_start_at: liveActive && liveStartAt ? new Date(liveStartAt).toISOString() : null,
        live_end_at: liveActive && liveEndAt ? new Date(liveEndAt).toISOString() : null,
      };
      let newsId = item?.id ?? null;
      if (item) {
        const { error } = await supabase.from("news").update(payload).eq("id", item.id);
        if (error) { toast.error(error.message); return; }
      } else {
        const { data, error } = await supabase.from("news").insert(payload).select("id").single();
        if (error) { toast.error(error.message); return; }
        newsId = (data as { id: string }).id;
      }
      if (newsId) {
        try {
          await Promise.all([
            saveRelations("news", "clubs", newsId, relClubs),
            saveRelations("news", "skaters", newsId, relSkaters),
            saveRelations("news", "federations", newsId, relFeds),
          ]);
        } catch (e) {
          toast.error(`Relaciones no guardadas: ${(e as Error).message}`);
        }
        // Save visibility: replace global_home + country rows.
        // Insert one-by-one so a single RLS rejection doesn't drop them all.
        try {
          await supabase
            .from("news_visibility")
            .delete()
            .eq("news_id", newsId)
            .in("channel", ["global_home", "country"]);
          const rows: { news_id: string; channel: "global_home" | "country"; country_code?: string }[] = [];
          if (visHome) rows.push({ news_id: newsId, channel: "global_home" });
          if (hubScope === "es") rows.push({ news_id: newsId, channel: "country", country_code: "es" });
          if (hubScope === "co") rows.push({ news_id: newsId, channel: "country", country_code: "co" });
          const failed: string[] = [];
          for (const row of rows) {
            const { error: visErr } = await supabase.from("news_visibility").insert(row);
            if (visErr) {
              failed.push(`${row.channel}${row.country_code ? `:${row.country_code}` : ""} (${visErr.message})`);
            }
          }
          if (failed.length > 0) {
            toast.error(`Visibilidad parcial — no se guardaron: ${failed.join(", ")}`);
          }
        } catch (e) {
          toast.error(`Visibilidad no guardada: ${(e as Error).message}`);
        }
      }

      toast.success(item ? "Noticia actualizada" : "Noticia creada");
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  const contentRef = useRef<HTMLTextAreaElement | null>(null);
  const [tab, setTab] = useState<"contenido" | "media" | "opciones" | "publicar">("contenido");
  const [showSlug, setShowSlug] = useState(false);
  const [showBlocks, setShowBlocks] = useState(parseBlocks(item?.content_blocks).length > 0);
  const [showVideoUpload, setShowVideoUpload] = useState(Boolean(item?.video_url));
  const [showLive, setShowLive] = useState(Boolean(item?.live_active));

  const canPublish = isAdmin;

  const applyMd = (before: string, after = "", placeholder = "") => {
    const el = contentRef.current;
    if (!el) return;
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    const sel = content.slice(start, end) || placeholder;
    const next = content.slice(0, start) + before + sel + after + content.slice(end);
    setContent(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + before.length, start + before.length + sel.length);
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-background/90 p-0 backdrop-blur md:p-4">
      <div className="mx-auto w-full max-w-[1400px] border border-border bg-surface pb-24">
        {/* Cabecera */}
        <div className="sticky top-0 z-20 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border bg-surface/95 px-4 py-3 backdrop-blur md:px-6">
          <div className="min-w-0">
            <h2 className="font-display truncate text-xl tracking-widest md:text-2xl">
              {item ? "Editar noticia" : "Nueva noticia"}
            </h2>
            <p className="truncate text-xs text-muted-foreground">
              {title ? `rollerzone.es/noticias/${slug || slugify(title)}` : "Mesa de redacción RollerZone"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar editor"
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center border border-border text-muted-foreground hover:border-gold hover:text-gold"
          >
            ✕
          </button>
        </div>

        {/* Pestañas */}
        <div className="filters-scroll flex gap-1 overflow-x-auto border-b border-border px-2 md:px-6">
          {([
            { id: "contenido", label: "Contenido" },
            { id: "media", label: "Imágenes y vídeo" },
            { id: "opciones", label: "Opciones" },
            { id: "publicar", label: "Publicar" },
          ] as const).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              aria-current={tab === t.id}
              className={`font-condensed min-h-11 shrink-0 border-b-2 px-4 text-[11px] font-bold uppercase tracking-widest transition-colors ${
                tab === t.id
                  ? "border-gold text-gold"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <form onSubmit={onSubmit} className="grid gap-5 p-4 md:p-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,3fr)]">
          {/* ================= COLUMNA PRINCIPAL ================= */}
          <div className="min-w-0 space-y-5">
            {tab === "contenido" && (
              <>
                <div>
                  <label className="sr-only" htmlFor="news-title">Título</label>
                  <input
                    id="news-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    maxLength={200}
                    placeholder="Escribe un título atractivo para tu noticia..."
                    className="font-display w-full border-0 border-b border-border bg-transparent px-0 py-3 text-2xl tracking-wide text-foreground placeholder:text-muted-foreground focus:border-gold focus:outline-none md:text-3xl"
                  />
                  <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
                    <button
                      type="button"
                      onClick={() => setShowSlug((v) => !v)}
                      className="font-condensed uppercase tracking-widest text-gold hover:underline"
                    >
                      {showSlug ? "Ocultar URL" : "Editar URL"}
                    </button>
                    <span className={title.length > 100 ? "text-amber-400" : ""}>
                      {title.length} / 100
                    </span>
                  </div>
                  {showSlug && (
                    <div className="mt-2">
                      <Field label="Slug (URL)" value={slug} onChange={setSlug} required />
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        rollerzone.es/noticias/{slug || "…"}
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="news-excerpt"
                    className="font-condensed mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground"
                  >
                    Entradilla / Resumen
                  </label>
                  <textarea
                    id="news-excerpt"
                    value={excerpt}
                    onChange={(e) => setExcerpt(e.target.value)}
                    rows={3}
                    maxLength={500}
                    placeholder="Una breve descripción que aparecerá bajo el título..."
                    className="w-full border border-border bg-background px-3 py-2 text-sm focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
                  />
                  <p className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>Se usa como entradilla, en listados, portada, redes y SEO (mismo campo, sin datos duplicados).</span>
                    <span className={excerpt.length > 200 ? "text-amber-400" : ""}>{excerpt.length} / 200</span>
                  </p>
                </div>

                <div>
                  <span className="font-condensed mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">
                    Contenido de la noticia
                  </span>
                  <div className="flex flex-wrap gap-1 border border-b-0 border-border bg-background/60 p-1.5">
                    <MdBtn title="Párrafo" onClick={() => applyMd("\n\n", "", "")}>P</MdBtn>
                    <MdBtn title="Título H2" onClick={() => applyMd("\n## ", "", "Título de sección")}><Heading2 className="h-4 w-4" /></MdBtn>
                    <MdBtn title="Subtítulo H3" onClick={() => applyMd("\n### ", "", "Subtítulo")}><Heading3 className="h-4 w-4" /></MdBtn>
                    <MdBtn title="Negrita" onClick={() => applyMd("**", "**", "texto")}><Bold className="h-4 w-4" /></MdBtn>
                    <MdBtn title="Cursiva" onClick={() => applyMd("*", "*", "texto")}><Italic className="h-4 w-4" /></MdBtn>
                    <MdBtn title="Lista" onClick={() => applyMd("\n- ", "", "elemento")}><List className="h-4 w-4" /></MdBtn>
                    <MdBtn title="Lista numerada" onClick={() => applyMd("\n1. ", "", "elemento")}><ListOrdered className="h-4 w-4" /></MdBtn>
                    <MdBtn title="Cita" onClick={() => applyMd("\n> ", "", "cita")}><Quote className="h-4 w-4" /></MdBtn>
                    <MdBtn title="Enlace" onClick={() => applyMd("[", "](https://)", "texto del enlace")}><Link2 className="h-4 w-4" /></MdBtn>
                    <MdBtn title="Separador" onClick={() => applyMd("\n\n---\n\n")}><Minus className="h-4 w-4" /></MdBtn>
                    <span className="mx-1 w-px self-stretch bg-border" />
                    <MdBtn
                      title="Insertar imagen (bloques)"
                      onClick={() => { setShowBlocks(true); setBlocks([...blocks, createBlock("image")]); }}
                    >
                      <ImageIcon className="h-4 w-4" />
                    </MdBtn>
                    <MdBtn
                      title="Insertar vídeo (bloques)"
                      onClick={() => { setShowBlocks(true); setBlocks([...blocks, createBlock("video")]); }}
                    >
                      <VideoIcon className="h-4 w-4" />
                    </MdBtn>
                    <MdBtn
                      title="Insertar galería (bloques)"
                      onClick={() => { setShowBlocks(true); setBlocks([...blocks, createBlock("gallery")]); }}
                    >
                      <Images className="h-4 w-4" />
                    </MdBtn>
                  </div>
                  <textarea
                    ref={contentRef}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={16}
                    placeholder="Escribe aquí la noticia. Un párrafo por línea. Puedes usar la barra superior para dar formato."
                    className="w-full border border-border bg-background px-3 py-3 text-sm leading-relaxed focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
                  />
                </div>

                {/* Contenido avanzado por bloques */}
                <div className="border border-border p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-condensed text-[11px] uppercase tracking-widest text-muted-foreground">
                      Contenido avanzado {blocks.length > 0 ? `(${blocks.length} bloques)` : ""}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowBlocks((v) => !v)}
                      className="font-condensed inline-flex min-h-11 items-center gap-2 border border-border px-3 text-[11px] uppercase tracking-widest text-gold hover:bg-gold/10"
                    >
                      <Plus className="h-3.5 w-3.5" /> {showBlocks ? "Ocultar bloques" : "Añadir bloque"}
                    </button>
                  </div>
                  {showBlocks ? (
                    <div className="mt-3">
                      <p className="mb-3 text-xs text-muted-foreground">
                        Si añades bloques, la noticia se mostrará con ellos en este orden en lugar del texto
                        clásico. La portada y la galería final se mantienen aparte.
                      </p>
                      <ContentBlocksEditor
                        value={blocks}
                        onChange={setBlocks}
                        nameHint={slug || title}
                        title={title}
                      />
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Opcional: reportaje editorial por bloques (texto, imagen, galería, vídeo, cita, separador).
                    </p>
                  )}
                </div>
              </>
            )}

            {tab === "media" && (
              <>
                <SectionCard title="Imagen de portada">
                  <ImageUploadField
                    value={imageUrl}
                    onChange={setImageUrl}
                    folder="news"
                    nameHint={slug || title}
                    placeholder="URL o subir archivo"
                    crops={imageCrops}
                    onCropsChange={setImageCrops}
                    previewClassName="mt-3 h-40 w-full max-w-md object-cover"
                  />
                  <p className="mt-2 text-[11px] text-muted-foreground">Recomendado 1200×630 px</p>
                  {imageUrl && (
                    <div className="mt-3">
                      <span className="font-condensed mb-1.5 block text-[11px] uppercase tracking-widest text-muted-foreground">
                        Imagen principal del artículo
                      </span>
                      <div className="flex flex-wrap gap-3 text-sm">
                        <label className="inline-flex items-center gap-2">
                          <input
                            type="radio"
                            name="hero-display-mode"
                            value="crop"
                            checked={heroDisplayMode === "crop"}
                            onChange={() => setHeroDisplayMode("crop")}
                            className="accent-[var(--gold,#caa15a)]"
                          />
                          Recortada (Hero 16:9)
                        </label>
                        <label className="inline-flex items-center gap-2">
                          <input
                            type="radio"
                            name="hero-display-mode"
                            value="full"
                            checked={heroDisplayMode === "full"}
                            onChange={() => setHeroDisplayMode("full")}
                            className="accent-[var(--gold,#caa15a)]"
                          />
                          Completa (sin recorte)
                        </label>
                      </div>
                      <button
                        type="button"
                        onClick={() => setImageUrl("")}
                        className="font-condensed mt-3 inline-flex min-h-11 items-center border border-border px-3 text-[11px] uppercase tracking-widest text-destructive hover:border-destructive"
                      >
                        Eliminar portada
                      </button>
                    </div>
                  )}
                </SectionCard>

                <SectionCard title={`Galería de imágenes (${gallery.length})`}>
                  <GalleryUploadField
                    value={gallery}
                    onChange={setGallery}
                    folder="news/gallery"
                    nameHint={slug || title}
                  />
                </SectionCard>

                <SectionCard title="Vídeo (opcional)">
                  <label className="block">
                    <span className="font-condensed mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">
                      URL del vídeo
                    </span>
                    <input
                      value={videoEmbedUrl}
                      onChange={(e) => setVideoEmbedUrl(e.target.value)}
                      placeholder="Pega una URL de YouTube, Vimeo, Facebook, Twitch u otro proveedor compatible"
                      className="w-full border border-border bg-background px-3 py-2 text-sm focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
                    />
                  </label>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    El proveedor se detecta automáticamente.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowVideoUpload((v) => !v)}
                    className="font-condensed mt-3 inline-flex min-h-11 items-center gap-2 border border-border px-3 text-[11px] uppercase tracking-widest text-gold hover:bg-gold/10"
                  >
                    {showVideoUpload ? "Ocultar opciones avanzadas" : "Subir vídeo propio / miniatura"}
                  </button>
                  {showVideoUpload && (
                    <div className="mt-3 space-y-4">
                      <div>
                        <span className="font-condensed mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">
                          Archivo de vídeo (MP4/WebM/MOV, máx. 200 MB)
                        </span>
                        <NewsVideoUploadField
                          value={videoUrl}
                          onChange={setVideoUrl}
                          nameHint={slug || title}
                        />
                      </div>
                      <div>
                        <span className="font-condensed mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">
                          Miniatura / portada del vídeo (opcional)
                        </span>
                        <ImageUploadField
                          value={videoPosterUrl}
                          onChange={setVideoPosterUrl}
                          folder="news/video-posters"
                          nameHint={slug || title}
                          placeholder="URL o subir imagen de portada"
                        />
                      </div>
                    </div>
                  )}
                </SectionCard>
              </>
            )}

            {tab === "opciones" && (
              <>
                <SectionCard title="¿Dónde se mostrará?">
                  <Checkbox label="Portada general (home + /noticias)" checked={visHome} onChange={setVisHome} />
                  <div className="mt-3">
                    <span className="font-condensed mb-1.5 block text-[11px] uppercase tracking-widest text-muted-foreground">
                      Hub de país (excluyentes — solo uno)
                    </span>
                    <div className="flex flex-wrap gap-4 text-sm">
                      {([
                        { value: "none", label: "Ninguno" },
                        { value: "es", label: "España" },
                        { value: "co", label: "Colombia" },
                      ] as const).map((opt) => (
                        <label key={opt.value} className="inline-flex cursor-pointer items-center gap-2">
                          <input
                            type="radio"
                            name="hubScope"
                            value={opt.value}
                            checked={hubScope === opt.value}
                            onChange={() => setHubScope(opt.value)}
                            className="accent-gold"
                          />
                          <span>{opt.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  {!visHome && hubScope === "none" && (
                    <p className="mt-2 text-xs text-amber-400">
                      Sin destino seleccionado: la noticia quedará oculta de todas las portadas y hubs.
                    </p>
                  )}
                  {hubScope !== "none" && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Solo se publicará en el hub <strong>{hubScope === "es" ? "España" : "Colombia"}</strong>
                      {visHome ? " además de la portada general." : "."} El <code>country_code</code> se sincroniza automáticamente.
                    </p>
                  )}
                </SectionCard>

                <SectionCard title="Relacionados">
                  <div className="grid gap-3 md:grid-cols-3">
                    <div>
                      <span className="font-condensed mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">Clubes</span>
                      <EntityRelationsField kind="clubs" country="es" value={relClubs} onChange={setRelClubs} />
                    </div>
                    <div>
                      <span className="font-condensed mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">Patinadores</span>
                      <EntityRelationsField kind="skaters" country="es" value={relSkaters} onChange={setRelSkaters} />
                    </div>
                    <div>
                      <span className="font-condensed mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">Federaciones</span>
                      <EntityRelationsField kind="federations" country="es" value={relFeds} onChange={setRelFeds} />
                    </div>
                  </div>
                </SectionCard>

                <SectionCard title="SEO / URL">
                  <Field label="Slug (URL)" value={slug} onChange={setSlug} required />
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    rollerzone.es/noticias/{slug || "…"}
                  </p>
                  <div className="mt-3">
                    <Field label="Etiqueta (opcional)" value={legacyTag} onChange={setLegacyTag} />
                  </div>
                </SectionCard>
              </>
            )}

            {tab === "publicar" && (
              <>
                <SectionCard title="Publicación">
                  <div className="grid gap-3 md:grid-cols-2">
                    <label className="block">
                      <span className="font-condensed mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">
                        Fecha de publicación
                      </span>
                      <input
                        type="datetime-local"
                        value={publishedAt}
                        onChange={(e) => setPublishedAt(e.target.value)}
                        required
                        className="w-full border border-border bg-background px-3 py-2 text-sm focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
                      />
                    </label>
                    <SelectField
                      label="Estado editorial"
                      value={status}
                      onChange={(value) => setStatus(value as News["status"])}
                      options={
                        canPublish
                          ? [
                              { value: "draft", label: "Borrador" },
                              { value: "pending", label: "Pendiente de revisión" },
                              { value: "published", label: "Publicado" },
                              { value: "rejected", label: "Rechazado" },
                            ]
                          : [
                              { value: "draft", label: "Borrador" },
                              { value: "pending", label: "Pendiente de revisión" },
                            ]
                      }
                    />
                  </div>
                  <div className="mt-3">
                    <Checkbox label="Destacada (hero portada)" checked={featured} onChange={setFeatured} />
                  </div>
                  {!canPublish && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Tu perfil puede crear y editar noticias y enviarlas a revisión. La publicación la realiza un administrador.
                    </p>
                  )}
                </SectionCard>

                <SectionCard title="Directo (avanzado)">
                  <button
                    type="button"
                    onClick={() => setShowLive((v) => !v)}
                    className="font-condensed inline-flex min-h-11 items-center gap-2 border border-border px-3 text-[11px] uppercase tracking-widest text-gold hover:bg-gold/10"
                  >
                    {showLive ? "Ocultar ajustes de directo" : "Configurar directo"}
                  </button>
                  {showLive && (
                    <div className="mt-3">
                      <Checkbox
                        label="Esta noticia pertenece a un directo"
                        checked={liveActive}
                        onChange={setLiveActive}
                      />
                      {liveActive && (
                        <div className="mt-3 space-y-3">
                          <SelectField
                            label="Evento o streaming vinculado (opcional)"
                            value={liveEventId}
                            onChange={setLiveEventId}
                            options={[
                              { value: "", label: "— Sin evento vinculado —" },
                              ...eventOptions.map((e) => ({
                                value: e.id,
                                label: e.start_date
                                  ? `${e.name} (${new Date(e.start_date).toLocaleDateString("es-ES")})`
                                  : e.name,
                              })),
                            ]}
                          />
                          <div className="grid gap-3 md:grid-cols-2">
                            <label className="block">
                              <span className="font-condensed mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">
                                Inicio del directo (opcional)
                              </span>
                              <input
                                type="datetime-local"
                                value={liveStartAt}
                                onChange={(e) => setLiveStartAt(e.target.value)}
                                className="w-full border border-border bg-background px-3 py-2 text-sm focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
                              />
                            </label>
                            <label className="block">
                              <span className="font-condensed mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">
                                Fin del directo (opcional)
                              </span>
                              <input
                                type="datetime-local"
                                value={liveEndAt}
                                onChange={(e) => setLiveEndAt(e.target.value)}
                                className="w-full border border-border bg-background px-3 py-2 text-sm focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
                              />
                            </label>
                          </div>
                          <div>
                            <span className="font-condensed mb-1.5 block text-[11px] uppercase tracking-widest text-muted-foreground">
                              Vista previa del distintivo
                            </span>
                            {(() => {
                              const state = computeLiveBadgeState(liveActive, liveStartAt, liveEndAt);
                              if (state === "live") {
                                return (
                                  <span className="inline-flex items-center gap-2 rounded-sm bg-[oklch(0.62_0.22_25)] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[3px] text-white shadow-lg">
                                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-white" />
                                    EN DIRECTO
                                  </span>
                                );
                              }
                              if (state === "scheduled") {
                                return <span className="text-xs text-muted-foreground">Programado — aparecerá al comenzar el directo.</span>;
                              }
                              if (state === "ended") {
                                return <span className="text-xs text-muted-foreground">El directo ya ha finalizado.</span>;
                              }
                              return <span className="text-xs text-muted-foreground">Interruptor desactivado.</span>;
                            })()}
                          </div>
                        </div>
                      )}
                      <p className="mt-3 text-xs text-muted-foreground">
                        Si la noticia no pertenece a un directo y fue publicada hace menos de 72 horas, se mostrará
                        automáticamente el distintivo dorado <strong>NUEVA NOTICIA</strong>.
                      </p>
                    </div>
                  )}
                </SectionCard>
              </>
            )}
          </div>

          {/* ================= COLUMNA DERECHA ================= */}
          <aside className="min-w-0 space-y-4">
            <SectionCard title="Imagen de portada">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt=""
                  loading="lazy"
                  className="mb-2 aspect-video w-full object-cover"
                />
              ) : (
                <div className="mb-2 grid aspect-video w-full place-items-center border border-dashed border-border text-center text-xs text-muted-foreground">
                  Arrastra una imagen aquí o usa SUBIR IMAGEN
                </div>
              )}
              <ImageUploadField
                value={imageUrl}
                onChange={setImageUrl}
                folder="news"
                nameHint={slug || title}
                placeholder="URL o subir imagen"
                crops={imageCrops}
                onCropsChange={setImageCrops}
                previewClassName="hidden"
              />
              <p className="mt-2 text-[11px] text-muted-foreground">Recomendado 1200×630 px</p>
            </SectionCard>

            <SectionCard title="Información básica">
              <div className="space-y-3">
                <SelectField
                  label="Redactor / Autor *"
                  value={writerId}
                  onChange={setWriterId}
                  options={[
                    { value: "", label: visibleWriters.length === 0 ? "— Crea un redactor primero —" : "— Selecciona redactor —" },
                    ...visibleWriters.map((w) => ({
                      value: w.id,
                      label: w.published ? w.full_name : `${w.full_name} (oculto)`,
                    })),
                  ]}
                />
                <SelectField
                  label="Sección / Categoría"
                  value={categoryId}
                  onChange={setCategoryId}
                  options={[
                    { value: "", label: "— Sin categoría —" },
                    ...categories.map((c) => ({ value: c.id, label: `${c.scope} · ${c.name}` })),
                  ]}
                />
                <Field label="Etiqueta (opcional)" value={legacyTag} onChange={setLegacyTag} />
                <NumberField label="Min. lectura" value={readMinutes} onChange={setReadMinutes} />
              </div>
            </SectionCard>

            <SectionCard title="Publicación">
              <div className="space-y-3">
                <label className="block">
                  <span className="font-condensed mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">
                    Fecha de publicación
                  </span>
                  <input
                    type="datetime-local"
                    value={publishedAt}
                    onChange={(e) => setPublishedAt(e.target.value)}
                    required
                    className="w-full border border-border bg-background px-3 py-2 text-sm focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
                  />
                </label>
                <SelectField
                  label="Estado"
                  value={status}
                  onChange={(value) => setStatus(value as News["status"])}
                  options={
                    canPublish
                      ? [
                          { value: "draft", label: "Borrador" },
                          { value: "pending", label: "Pendiente" },
                          { value: "published", label: "Publicado" },
                          { value: "rejected", label: "Rechazado" },
                        ]
                      : [
                          { value: "draft", label: "Borrador" },
                          { value: "pending", label: "Pendiente" },
                        ]
                  }
                />
                <Checkbox label="Destacada / Hero" checked={featured} onChange={setFeatured} />
              </div>
            </SectionCard>
          </aside>

          {/* ================= BARRA FIJA ================= */}
          <div className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-t border-border bg-surface/95 px-4 py-3 backdrop-blur md:px-6">
            <span className="font-condensed min-w-0 truncate text-[11px] uppercase tracking-widest text-muted-foreground">
              <span className="mr-2 inline-block h-2 w-2 rounded-full bg-gold align-middle" />
              {saving ? "Guardando…" : item ? "Cambios listos para guardar" : "Borrador sin guardar"}
            </span>
            <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
              {item && (
                <a
                  href={`/noticias/${item.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-condensed inline-flex min-h-11 items-center border border-border px-3 text-[11px] font-bold uppercase tracking-widest text-muted-foreground hover:border-gold hover:text-gold"
                >
                  Vista previa
                </a>
              )}
              <button
                type="button"
                onClick={onClose}
                className="font-condensed inline-flex min-h-11 items-center border border-border px-3 text-[11px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => onSubmit(null, "draft")}
                className="font-condensed inline-flex min-h-11 items-center border border-border px-3 text-[11px] font-bold uppercase tracking-widest text-foreground hover:border-gold hover:text-gold disabled:opacity-50"
              >
                Guardar borrador
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => onSubmit(null, canPublish ? "published" : "pending")}
                className="font-condensed inline-flex min-h-11 items-center bg-gold px-4 text-[11px] font-bold uppercase tracking-widest text-background hover:bg-gold-dark disabled:opacity-50"
              >
                {canPublish ? "Publicar noticia" : "Enviar a revisión"}
              </button>
              <button
                type="submit"
                disabled={saving}
                className="font-condensed inline-flex min-h-11 items-center border border-gold px-3 text-[11px] font-bold uppercase tracking-widest text-gold hover:bg-gold/10 disabled:opacity-50"
              >
                {item ? "Guardar cambios" : "Crear noticia"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border border-border bg-background/40 p-4">
      <h3 className="font-condensed mb-3 text-[11px] font-bold uppercase tracking-widest text-gold">
        {title}
      </h3>
      {children}
    </section>
  );
}

function MdBtn({
  children,
  title,
  onClick,
}: {
  children: React.ReactNode;
  title: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className="font-condensed inline-flex h-9 min-w-9 items-center justify-center border border-border bg-background px-2 text-xs uppercase text-muted-foreground hover:border-gold hover:text-gold"
    >
      {children}
    </button>
  );
}


function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
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
        required={required}
        className="w-full border border-border bg-background px-3 py-2 text-sm focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
      />
    </label>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | "";
  onChange: (v: number | "") => void;
}) {
  return (
    <label className="block">
      <span className="font-condensed mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <input
        type="number"
        value={value}
        min={1}
        max={60}
        onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
        className="w-full border border-border bg-background px-3 py-2 text-sm focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
      />
    </label>
  );
}

function TextareaField({
  label,
  value,
  onChange,
  rows = 4,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  return (
    <label className="block">
      <span className="font-condensed mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="w-full border border-border bg-background px-3 py-2 text-sm focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
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
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-border bg-background px-3 py-2 text-sm focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function Checkbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="font-condensed flex cursor-pointer items-center gap-2 text-xs uppercase tracking-widest text-foreground">
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
