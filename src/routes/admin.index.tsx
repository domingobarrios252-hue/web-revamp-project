import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Eye, EyeOff, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { z } from "zod";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { GalleryUploadField } from "@/components/admin/GalleryUploadField";

type Category = { id: string; name: string; slug: string; scope: string };
type Writer = { id: string; full_name: string; published: boolean };
type News = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  author: string;
  writer_id: string | null;
  category_id: string | null;
  legacy_tag: string | null;
  image_url: string | null;
  gallery: string[];
  read_minutes: number | null;
  featured: boolean;
  published: boolean;
  views_count: number;
  published_at: string;
};

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
  read_minutes: z.number().int().min(1).max(60).optional(),
  featured: z.boolean(),
  published: z.boolean(),
  published_at: z.string().min(1, "Fecha requerida"),
});

// Convert ISO timestamp to local datetime-local input value (YYYY-MM-DDTHH:mm)
function toLocalInput(iso: string | null | undefined): string {
  const d = iso ? new Date(iso) : new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
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
          "id, title, slug, excerpt, content, author, writer_id, category_id, legacy_tag, image_url, gallery, read_minutes, featured, published, views_count, published_at"
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
    const { error } = await supabase.from("news").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Noticia borrada");
      reload();
    }
  };

  const togglePublish = async (n: News) => {
    const { error } = await supabase
      .from("news")
      .update({ published: !n.published })
      .eq("id", n.id);
    if (error) toast.error(error.message);
    else reload();
  };

  const toggleFeatured = async (n: News) => {
    if (!n.featured) {
      // Unset others first
      await supabase.from("news").update({ featured: false }).eq("featured", true);
    }
    const { error } = await supabase
      .from("news")
      .update({ featured: !n.featured })
      .eq("id", n.id);
    if (error) toast.error(error.message);
    else reload();
  };

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
                        <IconBtn title={n.published ? "Despublicar" : "Publicar"} onClick={() => togglePublish(n)}>
                          {n.published ? <Eye className="h-4 w-4 text-gold" /> : <EyeOff className="h-4 w-4" />}
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
  const [title, setTitle] = useState(item?.title ?? "");
  const [slug, setSlug] = useState(item?.slug ?? "");
  const [excerpt, setExcerpt] = useState(item?.excerpt ?? "");
  const [content, setContent] = useState(item?.content ?? "");
  const [writerId, setWriterId] = useState(item?.writer_id ?? "");
  const [categoryId, setCategoryId] = useState(item?.category_id ?? "");
  const [legacyTag, setLegacyTag] = useState(item?.legacy_tag ?? "");
  const [imageUrl, setImageUrl] = useState(item?.image_url ?? "");
  const [gallery, setGallery] = useState<string[]>(item?.gallery ?? []);
  const [readMinutes, setReadMinutes] = useState<number | "">(item?.read_minutes ?? 4);
  const [featured, setFeatured] = useState(item?.featured ?? false);
  const [published, setPublished] = useState(item?.published ?? true);
  const [publishedAt, setPublishedAt] = useState<string>(toLocalInput(item?.published_at));
  const [saving, setSaving] = useState(false);

  // Auto-slug for new
  useEffect(() => {
    if (!item && title && !slug) setSlug(slugify(title));
  }, [title]); // eslint-disable-line react-hooks/exhaustive-deps

  // Only show published writers in dropdown, but include current one if it's hidden
  const visibleWriters = writers.filter((w) => w.published || w.id === writerId);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      read_minutes: typeof readMinutes === "number" ? readMinutes : undefined,
      featured,
      published,
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
    setSaving(true);
    try {
      if (featured) {
        await supabase.from("news").update({ featured: false }).eq("featured", true);
      }
      const payload = {
        title: parsed.data.title,
        slug: parsed.data.slug,
        excerpt: parsed.data.excerpt ?? null,
        content: parsed.data.content ?? null,
        author: writer.full_name,
        writer_id: writer.id,
        category_id: parsed.data.category_id ?? null,
        legacy_tag: parsed.data.legacy_tag ?? null,
        image_url: parsed.data.image_url || null,
        gallery: parsed.data.gallery,
        read_minutes: parsed.data.read_minutes ?? null,
        featured: parsed.data.featured,
        published: parsed.data.published,
      };
      const { error } = item
        ? await supabase.from("news").update(payload).eq("id", item.id)
        : await supabase.from("news").insert(payload);
      if (error) {
        toast.error(error.message);
      } else {
        toast.success(item ? "Noticia actualizada" : "Noticia creada");
        onSaved();
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-background/85 p-4 backdrop-blur">
      <div className="w-full max-w-3xl border border-border bg-surface p-5 md:p-7">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-2xl tracking-widest">
            {item ? "Editar noticia" : "Nueva noticia"}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            ✕
          </button>
        </div>
        <form onSubmit={onSubmit} className="space-y-3">
          <Field label="Título" value={title} onChange={setTitle} required />
          <Field label="Slug (URL)" value={slug} onChange={setSlug} required />
          <div className="grid gap-3 md:grid-cols-2">
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
                ...categories.map((c) => ({
                  value: c.id,
                  label: `${c.scope} · ${c.name}`,
                })),
              ]}
            />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Etiqueta (opcional)" value={legacyTag} onChange={setLegacyTag} />
            <NumberField label="Min. lectura" value={readMinutes} onChange={setReadMinutes} />
          </div>
          <div>
            <span className="font-condensed mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">
              Imagen de portada
            </span>
            <ImageUploadField
              value={imageUrl}
              onChange={setImageUrl}
              folder="news"
              nameHint={slug || title}
              placeholder="URL o subir archivo"
            />
          </div>
          <div>
            <span className="font-condensed mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">
              Galería de imágenes ({gallery.length})
            </span>
            <GalleryUploadField
              value={gallery}
              onChange={setGallery}
              folder="news/gallery"
              nameHint={slug || title}
            />
          </div>
          <TextareaField label="Resumen" value={excerpt} onChange={setExcerpt} rows={3} />
          <TextareaField
            label="Contenido (un párrafo por línea)"
            value={content}
            onChange={setContent}
            rows={10}
          />
          <div className="flex flex-wrap gap-4">
            <Checkbox label="Publicada" checked={published} onChange={setPublished} />
            <Checkbox label="Destacada (hero portada)" checked={featured} onChange={setFeatured} />
          </div>
          <div className="flex justify-end gap-2 border-t border-border pt-3">
            <button
              type="button"
              onClick={onClose}
              className="font-condensed border border-border px-4 py-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="font-condensed bg-gold px-5 py-2 text-xs font-bold uppercase tracking-widest text-background hover:bg-gold-dark disabled:opacity-50"
            >
              {saving ? "Guardando…" : item ? "Guardar cambios" : "Crear noticia"}
            </button>
          </div>
        </form>
      </div>
    </div>
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
