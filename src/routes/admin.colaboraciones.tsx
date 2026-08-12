import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Trash2, X, Star, Eye, EyeOff, Search, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { GalleryUploadField } from "@/components/admin/GalleryUploadField";
import {
  COLLAB_CATEGORIES,
  COLLAB_STATUS,
  COLLAB_TYPES,
  categoryLabel,
  normalizeCollaboration,
  slugify,
  typeLabel,
  type Collaboration,
} from "@/lib/colaboraciones";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db: any = supabase;

export const Route = createFileRoute("/admin/colaboraciones")({
  head: () => ({
    meta: [
      { title: "Admin · Colaboraciones y convenios" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminColaboraciones,
});

type Form = Omit<Collaboration, "id">;

const empty = (): Form => ({
  slug: "",
  title: "",
  year: new Date().getFullYear(),
  entity: "",
  category: "federaciones",
  type: "colaboracion_oficial",
  short_description: "",
  content_md: "",
  project_md: "",
  objective_md: "",
  collaboration_md: "",
  result_md: "",
  cover_url: "",
  entity_logo_url: "",
  start_date: null,
  end_date: null,
  gallery: [],
  video_url: "",
  flipbook_url: "",
  pdf_url: "",
  external_url: "",
  related_news: [],
  status: "draft",
  featured_home: false,
  sort_order: 10,
  published_at: null,
  seo_title: "",
  seo_description: "",
});

function AdminColaboraciones() {
  const { isAdmin } = useAuth();
  const [items, setItems] = useState<Collaboration[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Collaboration | null>(null);
  const [form, setForm] = useState<Form>(empty());
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await db
      .from("collaborations")
      .select("*")
      .order("year", { ascending: false })
      .order("sort_order", { ascending: true });
    if (error) toast.error(error.message);
    setItems(((data ?? []) as Record<string, unknown>[]).map(normalizeCollaboration));
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((i) => {
      if (statusFilter !== "all" && i.status !== statusFilter) return false;
      if (!q) return true;
      return (
        i.title.toLowerCase().includes(q) ||
        i.entity.toLowerCase().includes(q) ||
        i.slug.toLowerCase().includes(q)
      );
    });
  }, [items, search, statusFilter]);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((p) => ({ ...p, [k]: v }));

  const openNew = () => {
    setEditing(null);
    setForm(empty());
    setShowForm(true);
  };

  const openEdit = (c: Collaboration) => {
    setEditing(c);
    const { id: _id, ...rest } = c;
    void _id;
    setForm(rest);
    setShowForm(true);
  };

  const save = async () => {
    const title = form.title.trim();
    if (!title) return toast.error("El título es obligatorio.");
    const slug = (form.slug.trim() || slugify(title)).trim();
    if (!form.entity.trim()) return toast.error("Indica la entidad colaboradora.");
    if (form.status === "published" && !form.short_description.trim()) {
      return toast.error("Añade una descripción corta antes de publicar.");
    }
    setSaving(true);
    const payload = { ...form, title, slug };
    const { error } = editing
      ? await db.from("collaborations").update(payload).eq("id", editing.id)
      : await db.from("collaborations").insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(editing ? "Colaboración actualizada." : "Colaboración creada.");
    setShowForm(false);
    setEditing(null);
    load();
  };

  const remove = async (c: Collaboration) => {
    if (!confirm(`¿Eliminar "${c.title}"?`)) return;
    const { error } = await db.from("collaborations").delete().eq("id", c.id);
    if (error) return toast.error(error.message);
    toast.success("Colaboración eliminada.");
    load();
  };

  const patch = async (c: Collaboration, values: Partial<Collaboration>) => {
    const { error } = await db.from("collaborations").update(values).eq("id", c.id);
    if (error) return toast.error(error.message);
    load();
  };

  return (
    <div className="min-w-0">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl uppercase tracking-widest text-gold">
            Colaboraciones y convenios
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Archivo institucional de proyectos, convenios y acuerdos de RollerZone.
          </p>
        </div>
        <button
          onClick={openNew}
          className="font-condensed inline-flex min-h-[44px] items-center gap-2 bg-gold px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-background"
        >
          <Plus className="h-4 w-4" /> Nueva colaboración
        </button>
      </header>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex min-h-[44px] flex-1 items-center gap-2 border border-border bg-surface px-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por título o entidad…"
            className="w-full bg-transparent py-2 text-sm text-foreground outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="min-h-[44px] border border-border bg-surface px-3 text-sm text-foreground"
        >
          <option value="all">Todos los estados</option>
          {COLLAB_STATUS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-muted-foreground">Cargando…</div>
      ) : filtered.length === 0 ? (
        <div className="border border-dashed border-border p-8 text-center text-muted-foreground">
          No hay colaboraciones todavía.
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((c) => (
            <li
              key={c.id}
              className="flex flex-wrap items-center gap-3 border border-border bg-surface p-3"
            >
              <div className="h-14 w-24 shrink-0 overflow-hidden bg-surface-2">
                {c.cover_url ? (
                  <img src={c.cover_url} alt="" className="h-full w-full object-cover" />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-condensed text-[10px] font-bold uppercase tracking-[2px] text-gold">
                  {typeLabel(c.type)} · {c.year} · {categoryLabel(c.category)}
                </div>
                <div className="truncate font-semibold text-foreground">{c.title}</div>
                <div className="truncate text-xs text-muted-foreground">
                  {c.entity} · /colaboraciones/{c.slug}
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => patch(c, { featured_home: !c.featured_home })}
                  title="Destacar en portada"
                  className={`p-2 ${c.featured_home ? "text-gold" : "text-muted-foreground hover:text-gold"}`}
                >
                  <Star className="h-4 w-4" />
                </button>
                <button
                  onClick={() =>
                    patch(c, { status: c.status === "published" ? "hidden" : "published" })
                  }
                  title={c.status === "published" ? "Despublicar" : "Publicar"}
                  className="p-2 text-muted-foreground hover:text-gold"
                >
                  {c.status === "published" ? (
                    <Eye className="h-4 w-4" />
                  ) : (
                    <EyeOff className="h-4 w-4" />
                  )}
                </button>
                <a
                  href={`/colaboraciones/${c.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-muted-foreground hover:text-gold"
                  title="Ver en la web"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
                <button
                  onClick={() => openEdit(c)}
                  className="p-2 text-muted-foreground hover:text-gold"
                  title="Editar"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                {isAdmin && (
                  <button
                    onClick={() => remove(c)}
                    className="p-2 text-muted-foreground hover:text-destructive"
                    title="Eliminar"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-background/95 p-4">
          <div className="mx-auto max-w-3xl border border-border bg-surface p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-xl uppercase tracking-widest text-gold">
                {editing ? "Editar colaboración" : "Nueva colaboración"}
              </h2>
              <button onClick={() => setShowForm(false)} className="p-2 text-muted-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-4">
              <Field label="Título">
                <input
                  className={inputCls}
                  value={form.title}
                  onChange={(e) => set("title", e.target.value)}
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Slug (URL)">
                  <input
                    className={inputCls}
                    value={form.slug}
                    placeholder={slugify(form.title)}
                    onChange={(e) => set("slug", e.target.value)}
                  />
                </Field>
                <Field label="Año">
                  <input
                    type="number"
                    className={inputCls}
                    value={form.year}
                    onChange={(e) => set("year", Number(e.target.value) || form.year)}
                  />
                </Field>
                <Field label="Entidad">
                  <input
                    className={inputCls}
                    value={form.entity}
                    onChange={(e) => set("entity", e.target.value)}
                  />
                </Field>
                <Field label="Categoría">
                  <select
                    className={inputCls}
                    value={form.category}
                    onChange={(e) => set("category", e.target.value)}
                  >
                    {COLLAB_CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Tipo de colaboración">
                  <select
                    className={inputCls}
                    value={form.type}
                    onChange={(e) => set("type", e.target.value)}
                  >
                    {COLLAB_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Estado">
                  <select
                    className={inputCls}
                    value={form.status}
                    onChange={(e) => set("status", e.target.value)}
                  >
                    {COLLAB_STATUS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Publicación programada">
                  <input
                    type="datetime-local"
                    className={inputCls}
                    value={form.published_at ? form.published_at.slice(0, 16) : ""}
                    onChange={(e) =>
                      set("published_at", e.target.value ? new Date(e.target.value).toISOString() : null)
                    }
                  />
                </Field>
                <Field label="Orden">
                  <input
                    type="number"
                    className={inputCls}
                    value={form.sort_order}
                    onChange={(e) => set("sort_order", Number(e.target.value) || 0)}
                  />
                </Field>
                <Field label="Fecha inicio">
                  <input
                    type="date"
                    className={inputCls}
                    value={form.start_date ?? ""}
                    onChange={(e) => set("start_date", e.target.value || null)}
                  />
                </Field>
                <Field label="Fecha fin">
                  <input
                    type="date"
                    className={inputCls}
                    value={form.end_date ?? ""}
                    onChange={(e) => set("end_date", e.target.value || null)}
                  />
                </Field>
              </div>

              <label className="flex items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={form.featured_home}
                  onChange={(e) => set("featured_home", e.target.checked)}
                />
                Destacar en portada
              </label>

              <Field label="Descripción corta">
                <textarea
                  rows={3}
                  className={inputCls}
                  value={form.short_description}
                  onChange={(e) => set("short_description", e.target.value)}
                />
              </Field>

              <Field label="Imagen principal">
                <ImageUploadField
                  value={form.cover_url}
                  onChange={(url) => set("cover_url", url)}
                  folder="colaboraciones"
                  nameHint={form.slug || form.title}
                />
              </Field>
              <Field label="Logo de la entidad">
                <ImageUploadField
                  value={form.entity_logo_url}
                  onChange={(url) => set("entity_logo_url", url)}
                  folder="colaboraciones/logos"
                  nameHint={`${form.slug || form.title}-logo`}
                  previewClassName="mt-2 h-16 w-auto object-contain"
                />
              </Field>

              <Field label="El proyecto (Markdown)">
                <textarea
                  rows={5}
                  className={inputCls}
                  value={form.project_md}
                  onChange={(e) => set("project_md", e.target.value)}
                />
              </Field>
              <Field label="Objetivo (Markdown)">
                <textarea
                  rows={4}
                  className={inputCls}
                  value={form.objective_md}
                  onChange={(e) => set("objective_md", e.target.value)}
                />
              </Field>
              <Field label="La colaboración (Markdown)">
                <textarea
                  rows={4}
                  className={inputCls}
                  value={form.collaboration_md}
                  onChange={(e) => set("collaboration_md", e.target.value)}
                />
              </Field>
              <Field label="Resultado (Markdown)">
                <textarea
                  rows={4}
                  className={inputCls}
                  value={form.result_md}
                  onChange={(e) => set("result_md", e.target.value)}
                />
              </Field>
              <Field label="Información adicional (Markdown)">
                <textarea
                  rows={4}
                  className={inputCls}
                  value={form.content_md}
                  onChange={(e) => set("content_md", e.target.value)}
                />
              </Field>

              <Field label="Galería">
                <GalleryUploadField
                  value={form.gallery}
                  onChange={(urls) => set("gallery", urls)}
                  folder="colaboraciones/galeria"
                  nameHint={form.slug || form.title}
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Vídeo (YouTube / Vimeo / iframe)">
                  <input
                    className={inputCls}
                    value={form.video_url}
                    onChange={(e) => set("video_url", e.target.value)}
                  />
                </Field>
                <Field label="Flipbook (URL)">
                  <input
                    className={inputCls}
                    value={form.flipbook_url}
                    onChange={(e) => set("flipbook_url", e.target.value)}
                  />
                </Field>
                <Field label="URL externa">
                  <input
                    className={inputCls}
                    value={form.external_url}
                    onChange={(e) => set("external_url", e.target.value)}
                  />
                </Field>
              </div>

              <Field label="Documento PDF público">
                <ImageUploadField
                  value={form.pdf_url}
                  onChange={(url) => set("pdf_url", url)}
                  folder="colaboraciones/documentos"
                  nameHint={form.slug || form.title}
                  accept="application/pdf"
                  previewClassName="hidden"
                  placeholder="URL del PDF o subir archivo"
                />
              </Field>

              <RelatedNewsPicker
                value={form.related_news}
                onChange={(ids) => set("related_news", ids)}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="SEO · Título">
                  <input
                    className={inputCls}
                    value={form.seo_title}
                    onChange={(e) => set("seo_title", e.target.value)}
                  />
                </Field>
                <Field label="SEO · Descripción">
                  <input
                    className={inputCls}
                    value={form.seo_description}
                    onChange={(e) => set("seo_description", e.target.value)}
                  />
                </Field>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={save}
                disabled={saving}
                className="font-condensed min-h-[44px] bg-gold px-5 text-[11px] font-bold uppercase tracking-widest text-background disabled:opacity-60"
              >
                {saving ? "Guardando…" : "Guardar"}
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="font-condensed min-h-[44px] border border-border px-5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const inputCls =
  "w-full min-h-[44px] border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-gold";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="font-condensed mb-1 block text-[10px] font-bold uppercase tracking-[2px] text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

type NewsOption = { id: string; title: string; slug: string };

function RelatedNewsPicker({
  value,
  onChange,
}: {
  value: string[];
  onChange: (ids: string[]) => void;
}) {
  const [options, setOptions] = useState<NewsOption[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await db
        .from("news")
        .select("id, title, slug")
        .order("published_at", { ascending: false })
        .limit(300);
      setOptions((data ?? []) as NewsOption[]);
    })();
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return options.slice(0, 20);
    return options.filter((o) => o.title.toLowerCase().includes(s)).slice(0, 20);
  }, [options, q]);

  const selected = options.filter((o) => value.includes(o.id));

  return (
    <div>
      <span className="font-condensed mb-1 block text-[10px] font-bold uppercase tracking-[2px] text-muted-foreground">
        Noticias relacionadas
      </span>
      {selected.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {selected.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => onChange(value.filter((v) => v !== s.id))}
              className="inline-flex items-center gap-1 border border-gold/60 px-2 py-1 text-xs text-gold"
            >
              {s.title} <X className="h-3 w-3" />
            </button>
          ))}
        </div>
      )}
      <input
        className={inputCls}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Buscar noticia…"
      />
      <div className="mt-2 max-h-48 overflow-y-auto border border-border">
        {filtered.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => onChange(value.includes(o.id) ? value : [...value, o.id])}
            className="block w-full truncate px-3 py-2 text-left text-sm text-muted-foreground hover:bg-background hover:text-gold"
          >
            {o.title}
          </button>
        ))}
      </div>
    </div>
  );
}
