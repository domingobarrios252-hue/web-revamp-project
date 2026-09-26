import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Eye, EyeOff, Star, ArrowUp, ArrowDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { z } from "zod";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { GalleryUploadField } from "@/components/admin/GalleryUploadField";
import { NewsVideoUploadField, deleteStoredVideo } from "@/components/admin/NewsVideoUploadField";
import { EntityRelationsField, loadRelations, saveRelations } from "@/components/admin/EntityRelationsField";
import { NewsEditor } from "@/components/admin/NewsEditor";
import { cleanBlocks, parseBlocks, validateBlocks, type NewsBlock } from "@/lib/newsBlocks";

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
  const [hubFilter, setHubFilter] = useState<string>("all");

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
        <select
          value={hubFilter}
          onChange={(e) => setHubFilter(e.target.value)}
          aria-label="Filtrar por hub"
          className="ml-auto mr-2 min-h-11 border border-border bg-background px-3 text-xs uppercase tracking-widest"
        >
          <option value="all">Todos los hubs</option>
          <option value="es">España</option>
          <option value="co">Colombia</option>
          <option value="pt">Portugal</option>
          <option value="mia">Miami</option>
        </select>
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
