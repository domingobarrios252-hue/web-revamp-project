import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Star,
  Eye,
  EyeOff,
  GripVertical,
  Copy,
  Archive,
  ArrowLeft,
  ExternalLink,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import type { ImageCrops } from "@/lib/imageCrops";
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// Types kept loose because generated Supabase types don't include special_editorials yet.
type Special = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  cover_url: string;
  hero_image_url: string;
  status: "active" | "hidden" | "archived" | "draft";
  featured_home: boolean;
  sort_order: number;
  start_date: string | null;
  end_date: string | null;
};

type Piece = {
  id: string;
  special_slug: string;
  slug: string;
  number: string;
  kicker: string;
  title: string;
  description: string;
  image_url: string;
  thumbnail_url: string;
  excerpt: string;
  content_md: string;
  category: string;
  external_url: string;
  sort_order: number;
  featured: boolean;
  visible: boolean;
  status: string;
  crops: ImageCrops | null;
};

const PIECE_STATUS = [
  { value: "published", label: "Publicada" },
  { value: "hidden", label: "Oculta" },
  { value: "draft", label: "Borrador" },
];

const SPECIAL_STATUS = [
  { value: "active", label: "Activo" },
  { value: "hidden", label: "Oculto" },
  { value: "archived", label: "Archivado" },
  { value: "draft", label: "Borrador" },
] as const;

const db = supabase as unknown as {
  from: (t: string) => ReturnType<typeof supabase.from>;
};

export const Route = createFileRoute("/admin/especiales")({
  head: () => ({
    meta: [
      { title: "Admin · Especiales editoriales" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminEspeciales,
});

function AdminEspeciales() {
  const [view, setView] = useState<"list" | "pieces">("list");
  const [activeSpecial, setActiveSpecial] = useState<Special | null>(null);

  if (view === "pieces" && activeSpecial) {
    return (
      <PiecesPanel
        special={activeSpecial}
        onBack={() => {
          setView("list");
          setActiveSpecial(null);
        }}
      />
    );
  }

  return (
    <SpecialsPanel
      onOpenPieces={(s) => {
        setActiveSpecial(s);
        setView("pieces");
      }}
    />
  );
}

/* ============================================================
   PANEL A · Lista de especiales
============================================================ */

const emptySpecial = (): Omit<Special, "id"> => ({
  slug: "",
  title: "",
  subtitle: "",
  description: "",
  cover_url: "",
  hero_image_url: "",
  status: "draft",
  featured_home: false,
  sort_order: 10,
  start_date: null,
  end_date: null,
});

function SpecialsPanel({ onOpenPieces }: { onOpenPieces: (s: Special) => void }) {
  const { isAdmin } = useAuth();
  const [items, setItems] = useState<Special[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | Special["status"]>("all");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Special | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Omit<Special, "id">>(emptySpecial());

  const load = async () => {
    setLoading(true);
    const { data, error } = await db
      .from("special_editorials")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setItems((data ?? []) as unknown as Special[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((s) => {
      if (filter !== "all" && s.status !== filter) return false;
      if (!q) return true;
      return s.title.toLowerCase().includes(q) || s.slug.toLowerCase().includes(q);
    });
  }, [items, filter, search]);

  const openNew = () => {
    setEditing(null);
    setForm(emptySpecial());
    setShowForm(true);
  };

  const openEdit = (s: Special) => {
    setEditing(s);
    const { id: _id, ...rest } = s;
    void _id;
    setForm(rest);
    setShowForm(true);
  };

  const save = async () => {
    const slug = form.slug.trim();
    const title = form.title.trim();
    if (!slug || !title) return toast.error("Slug y título son obligatorios");
    const payload = { ...form, slug, title };
    if (editing) {
      const { error } = await db.from("special_editorials").update(payload).eq("id", editing.id);
      if (error) return toast.error(error.message);
      toast.success("Especial actualizado");
    } else {
      const { error } = await db.from("special_editorials").insert(payload);
      if (error) return toast.error(error.message);
      toast.success("Especial creado");
    }
    setShowForm(false);
    load();
  };

  const setStatus = async (s: Special, status: Special["status"]) => {
    const { error } = await db.from("special_editorials").update({ status }).eq("id", s.id);
    if (error) return toast.error(error.message);
    load();
  };

  const remove = async (s: Special) => {
    if (!isAdmin) return toast.error("Solo administradores");
    if (!confirm(`¿Eliminar el especial "${s.title}" y todas sus piezas? Esta acción no se puede deshacer.`)) return;
    // delete pieces first
    await db.from("special_pieces").delete().eq("special_slug", s.slug);
    const { error } = await db.from("special_editorials").delete().eq("id", s.id);
    if (error) return toast.error(error.message);
    toast.success("Especial eliminado");
    load();
  };

  const duplicate = async (s: Special) => {
    const suffix = Date.now().toString(36).slice(-4);
    const newSlug = `${s.slug}-copia-${suffix}`;
    const { id: _id, ...rest } = s;
    void _id;
    const { error } = await db.from("special_editorials").insert({
      ...rest,
      slug: newSlug,
      title: `${s.title} (copia)`,
      status: "draft",
      featured_home: false,
    });
    if (error) return toast.error(error.message);
    // copy pieces as draft
    const { data: pieces } = await db.from("special_pieces").select("*").eq("special_slug", s.slug);
    if (pieces && pieces.length > 0) {
      const rows = (pieces as unknown as Piece[]).map(({ id: _pid, ...p }) => {
        void _pid;
        return { ...p, special_slug: newSlug, status: "draft", visible: false, featured: false };
      });
      await db.from("special_pieces").insert(rows);
    }
    toast.success("Especial duplicado como borrador");
    load();
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl tracking-widest">ESPECIALES EDITORIALES</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Crea, edita, oculta o archiva especiales. Haz clic en un especial para gestionar sus piezas.
          </p>
        </div>
        <button
          onClick={openNew}
          className="font-condensed inline-flex items-center gap-2 bg-gold px-4 py-2 text-xs font-bold uppercase tracking-widest text-background hover:bg-gold-dark"
        >
          <Plus className="h-4 w-4" /> Nuevo especial
        </button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 border border-border bg-surface p-1">
          {(["all", ...SPECIAL_STATUS.map((s) => s.value)] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as typeof filter)}
              className={
                "font-condensed px-3 py-1.5 text-[11px] uppercase tracking-widest transition-colors " +
                (filter === f ? "bg-gold text-background" : "text-muted-foreground hover:text-foreground")
              }
            >
              {f === "all" ? "Todos" : SPECIAL_STATUS.find((s) => s.value === f)?.label}
            </button>
          ))}
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por título o slug…"
          className="flex-1 min-w-[220px] max-w-md border border-border bg-surface px-3 py-2 text-sm"
        />
      </div>

      {loading ? (
        <div className="text-muted-foreground">Cargando…</div>
      ) : filtered.length === 0 ? (
        <div className="border border-dashed border-border p-8 text-center text-muted-foreground">
          Sin especiales para este filtro.
        </div>
      ) : (
        <ul className="divide-y divide-border border border-border bg-surface">
          {filtered.map((s) => (
            <li key={s.id} className="flex items-center gap-3 px-3 py-3 hover:bg-surface-2">
              <div className="h-14 w-24 shrink-0 overflow-hidden rounded border border-border bg-background">
                {s.cover_url ? (
                  <img src={s.cover_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground">
                    sin img
                  </div>
                )}
              </div>
              <button
                onClick={() => onOpenPieces(s)}
                className="min-w-0 flex-1 text-left"
                type="button"
              >
                <div className="flex items-center gap-2">
                  <span className={statusBadgeClass(s.status)}>{statusLabel(s.status)}</span>
                  {s.featured_home && <Star className="h-3.5 w-3.5 fill-gold text-gold" />}
                </div>
                <div className="mt-1 truncate text-sm font-medium text-foreground">{s.title}</div>
                <div className="truncate text-[11px] text-muted-foreground">
                  /especiales/{s.slug}
                  {(s.start_date || s.end_date) && (
                    <> · {s.start_date ?? "?"} → {s.end_date ?? "?"}</>
                  )}
                </div>
              </button>

              <Link
                to="/especiales/$slug"
                params={{ slug: s.slug }}
                target="_blank"
                className="text-muted-foreground hover:text-gold"
                aria-label="Ver público"
              >
                <ExternalLink className="h-4 w-4" />
              </Link>
              <button
                onClick={() => duplicate(s)}
                className="text-muted-foreground hover:text-gold"
                aria-label="Duplicar"
                type="button"
              >
                <Copy className="h-4 w-4" />
              </button>
              <button
                onClick={() => setStatus(s, s.status === "active" ? "hidden" : "active")}
                className="text-muted-foreground hover:text-gold"
                aria-label={s.status === "active" ? "Ocultar" : "Activar"}
                type="button"
              >
                {s.status === "active" ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </button>
              <button
                onClick={() => setStatus(s, "archived")}
                className="text-muted-foreground hover:text-gold"
                aria-label="Archivar"
                type="button"
              >
                <Archive className="h-4 w-4" />
              </button>
              <button
                onClick={() => openEdit(s)}
                className="text-muted-foreground hover:text-gold"
                aria-label="Editar"
                type="button"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                onClick={() => remove(s)}
                className="text-muted-foreground hover:text-destructive"
                aria-label="Eliminar"
                type="button"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {showForm && (
        <Modal title={editing ? "EDITAR ESPECIAL" : "NUEVO ESPECIAL"} onClose={() => setShowForm(false)}>
          <div className="space-y-4">
            <Field label="Título">
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full border border-border bg-surface px-3 py-2 text-sm"
              />
            </Field>
            <Field label="Slug (URL)">
              <input
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                disabled={!!editing}
                placeholder="camino-al-mundial-2026"
                className="w-full border border-border bg-surface px-3 py-2 text-sm disabled:opacity-60"
              />
            </Field>
            <Field label="Subtítulo">
              <input
                value={form.subtitle}
                onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                className="w-full border border-border bg-surface px-3 py-2 text-sm"
              />
            </Field>
            <Field label="Descripción">
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full border border-border bg-surface px-3 py-2 text-sm"
              />
            </Field>
            <Field label="Imagen de portada">
              <ImageUploadField
                value={form.cover_url}
                onChange={(url) => setForm((f) => ({ ...f, cover_url: url }))}
                folder="specials"
                nameHint={form.slug || form.title}
                previewClassName="mt-2 h-32 w-56 object-cover rounded"
              />
            </Field>
            <Field label="Imagen hero (opcional)">
              <ImageUploadField
                value={form.hero_image_url}
                onChange={(url) => setForm((f) => ({ ...f, hero_image_url: url }))}
                folder="specials"
                nameHint={(form.slug || form.title) + "-hero"}
                previewClassName="mt-2 h-32 w-56 object-cover rounded"
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Fecha inicio">
                <input
                  type="date"
                  value={form.start_date ?? ""}
                  onChange={(e) => setForm({ ...form, start_date: e.target.value || null })}
                  className="w-full border border-border bg-surface px-3 py-2 text-sm"
                />
              </Field>
              <Field label="Fecha fin">
                <input
                  type="date"
                  value={form.end_date ?? ""}
                  onChange={(e) => setForm({ ...form, end_date: e.target.value || null })}
                  className="w-full border border-border bg-surface px-3 py-2 text-sm"
                />
              </Field>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Estado">
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as Special["status"] })}
                  className="w-full border border-border bg-surface px-3 py-2 text-sm"
                >
                  {SPECIAL_STATUS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Orden">
                <input
                  type="number"
                  value={form.sort_order}
                  onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })}
                  className="w-full border border-border bg-surface px-3 py-2 text-sm"
                />
              </Field>
              <div className="flex items-end">
                <label className="flex items-center gap-2 text-xs">
                  <Switch
                    checked={form.featured_home}
                    onCheckedChange={(v) => setForm({ ...form, featured_home: v })}
                  />
                  <span className="font-condensed uppercase tracking-widest text-muted-foreground">
                    Destacado en portada
                  </span>
                </label>
              </div>
            </div>

            <FormActions onCancel={() => setShowForm(false)} onSave={save} />
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ============================================================
   PANEL B · Piezas de un especial
============================================================ */

const emptyPiece = (): Omit<Piece, "id" | "special_slug"> => ({
  slug: "",
  number: "",
  kicker: "",
  title: "",
  description: "",
  image_url: "",
  thumbnail_url: "",
  excerpt: "",
  content_md: "",
  category: "",
  external_url: "",
  sort_order: 10,
  featured: false,
  visible: true,
  status: "published",
  crops: {},
});

function PiecesPanel({ special, onBack }: { special: Special; onBack: () => void }) {
  const { isAdmin } = useAuth();
  const [items, setItems] = useState<Piece[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "published" | "hidden" | "draft">("all");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Piece | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Omit<Piece, "id" | "special_slug">>(emptyPiece());

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const load = async () => {
    setLoading(true);
    const { data, error } = await db
      .from("special_pieces")
      .select("*")
      .eq("special_slug", special.slug)
      .order("sort_order", { ascending: true });
    if (error) toast.error(error.message);
    setItems((data ?? []) as unknown as Piece[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [special.slug]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((p) => {
      if (filter !== "all" && p.status !== filter) return false;
      if (!q) return true;
      return p.title.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q);
    });
  }, [items, filter, search]);

  const openNew = () => {
    setEditing(null);
    setForm({ ...emptyPiece(), sort_order: (items[items.length - 1]?.sort_order ?? 0) + 10 });
    setShowForm(true);
  };

  const openEdit = (p: Piece) => {
    setEditing(p);
    const { id: _id, special_slug: _s, ...rest } = p;
    void _id;
    void _s;
    setForm({ ...emptyPiece(), ...rest, crops: (p.crops ?? {}) as ImageCrops });
    setShowForm(true);
  };

  const save = async () => {
    const slug = form.slug.trim();
    const title = form.title.trim();
    if (!slug || !title) return toast.error("Slug y título son obligatorios");
    const payload = {
      ...form,
      special_slug: special.slug,
      slug,
      title,
      crops: form.crops as unknown as never,
    };
    if (editing) {
      const { error } = await db.from("special_pieces").update(payload).eq("id", editing.id);
      if (error) return toast.error(error.message);
      toast.success("Pieza actualizada");
    } else {
      const { error } = await db.from("special_pieces").insert(payload);
      if (error) return toast.error(error.message);
      toast.success("Pieza creada");
    }
    setShowForm(false);
    load();
  };

  const toggleField = async (p: Piece, field: "featured" | "visible") => {
    const { error } = await db
      .from("special_pieces")
      .update({ [field]: !p[field] })
      .eq("id", p.id);
    if (error) return toast.error(error.message);
    load();
  };

  const remove = async (p: Piece) => {
    if (!isAdmin) return toast.error("Solo administradores");
    if (!confirm(`¿Eliminar la pieza "${p.title}"?`)) return;
    const { error } = await db.from("special_pieces").delete().eq("id", p.id);
    if (error) return toast.error(error.message);
    toast.success("Pieza eliminada");
    load();
  };

  const onDragEnd = async (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIdx = items.findIndex((x) => x.id === active.id);
    const newIdx = items.findIndex((x) => x.id === over.id);
    if (oldIdx < 0 || newIdx < 0) return;
    const reordered = arrayMove(items, oldIdx, newIdx).map((it, i) => ({
      ...it,
      sort_order: (i + 1) * 10,
    }));
    setItems(reordered);
    const updates = reordered.map((it) =>
      db.from("special_pieces").update({ sort_order: it.sort_order }).eq("id", it.id),
    );
    const results = await Promise.all(updates);
    if (results.some((r) => r.error)) {
      toast.error("No se pudo guardar el orden");
      load();
    } else {
      toast.success("Orden actualizado");
    }
  };

  return (
    <div>
      <div className="mb-4">
        <button
          onClick={onBack}
          className="font-condensed inline-flex items-center gap-2 text-[11px] uppercase tracking-widest text-muted-foreground hover:text-gold"
          type="button"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Volver a especiales
        </button>
      </div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="font-condensed text-[11px] uppercase tracking-widest text-gold">
            {statusLabel(special.status)} · /especiales/{special.slug}
          </div>
          <h1 className="font-display mt-1 text-3xl tracking-widest">{special.title.toUpperCase()}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Arrastra para reordenar. Edita los datos de cada pieza.
          </p>
        </div>
        <button
          onClick={openNew}
          className="font-condensed inline-flex items-center gap-2 bg-gold px-4 py-2 text-xs font-bold uppercase tracking-widest text-background hover:bg-gold-dark"
        >
          <Plus className="h-4 w-4" /> Nueva pieza
        </button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 border border-border bg-surface p-1">
          {(["all", "published", "hidden", "draft"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={
                "font-condensed px-3 py-1.5 text-[11px] uppercase tracking-widest " +
                (filter === f ? "bg-gold text-background" : "text-muted-foreground hover:text-foreground")
              }
            >
              {f === "all" ? "Todas" : PIECE_STATUS.find((s) => s.value === f)?.label}
            </button>
          ))}
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por título o slug…"
          className="flex-1 min-w-[220px] max-w-md border border-border bg-surface px-3 py-2 text-sm"
        />
      </div>

      {loading ? (
        <div className="text-muted-foreground">Cargando…</div>
      ) : filtered.length === 0 ? (
        <div className="border border-dashed border-border p-8 text-center text-muted-foreground">
          Sin piezas. Crea la primera.
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={filtered.map((i) => i.id)} strategy={verticalListSortingStrategy}>
            <ul className="divide-y divide-border border border-border bg-surface">
              {filtered.map((p) => (
                <SortableRow
                  key={p.id}
                  piece={p}
                  specialSlug={special.slug}
                  onEdit={() => openEdit(p)}
                  onRemove={() => remove(p)}
                  onToggle={(f) => toggleField(p, f)}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}

      {showForm && (
        <Modal
          title={editing ? "EDITAR PIEZA" : "NUEVA PIEZA"}
          onClose={() => setShowForm(false)}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <Field label="Nº">
                <input
                  value={form.number}
                  onChange={(e) => setForm({ ...form, number: e.target.value })}
                  className="w-full border border-border bg-surface px-3 py-2 text-sm"
                  placeholder="01"
                />
              </Field>
              <Field label="Antetítulo (kicker)">
                <input
                  value={form.kicker}
                  onChange={(e) => setForm({ ...form, kicker: e.target.value })}
                  className="w-full border border-border bg-surface px-3 py-2 text-sm"
                  placeholder="Presentación"
                />
              </Field>
              <Field label="Categoría / etiqueta">
                <input
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full border border-border bg-surface px-3 py-2 text-sm"
                  placeholder="reportaje"
                />
              </Field>
            </div>

            <Field label="Título">
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full border border-border bg-surface px-3 py-2 text-sm"
              />
            </Field>

            <Field label="Slug (URL)">
              <input
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                disabled={!!editing}
                className="w-full border border-border bg-surface px-3 py-2 text-sm disabled:opacity-60"
                placeholder="titulo-de-la-pieza"
              />
            </Field>

            <Field label="Entradilla / descripción corta">
              <textarea
                rows={2}
                value={form.excerpt}
                onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                className="w-full border border-border bg-surface px-3 py-2 text-sm"
              />
            </Field>

            <Field label="Descripción (para tarjeta)">
              <textarea
                rows={2}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full border border-border bg-surface px-3 py-2 text-sm"
              />
            </Field>

            <Field label="Contenido (Markdown)">
              <textarea
                rows={10}
                value={form.content_md}
                onChange={(e) => setForm({ ...form, content_md: e.target.value })}
                className="w-full border border-border bg-surface px-3 py-2 font-mono text-xs"
                placeholder="# Título&#10;&#10;Párrafo con **negrita** e [enlaces](https://…)."
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Miniatura (tarjeta)">
                <ImageUploadField
                  value={form.thumbnail_url}
                  onChange={(url) => setForm((f) => ({ ...f, thumbnail_url: url }))}
                  folder="specials"
                  nameHint={(form.slug || form.title) + "-thumb"}
                  previewClassName="mt-2 h-24 w-40 object-cover rounded"
                />
              </Field>
              <Field label="Imagen destacada (ficha)">
                <ImageUploadField
                  value={form.image_url}
                  onChange={(url) => setForm((f) => ({ ...f, image_url: url }))}
                  folder="specials"
                  nameHint={form.slug || form.title}
                  previewClassName="mt-2 h-24 w-40 object-cover rounded"
                  crops={form.crops}
                  onCropsChange={(next) => setForm((f) => ({ ...f, crops: next }))}
                />
              </Field>
            </div>

            <Field label="Enlace externo (opcional)">
              <input
                value={form.external_url}
                onChange={(e) => setForm({ ...form, external_url: e.target.value })}
                placeholder="https://…"
                className="w-full border border-border bg-surface px-3 py-2 text-sm"
              />
            </Field>

            <div className="grid grid-cols-3 gap-3">
              <Field label="Orden">
                <input
                  type="number"
                  value={form.sort_order}
                  onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })}
                  className="w-full border border-border bg-surface px-3 py-2 text-sm"
                />
              </Field>
              <Field label="Estado">
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full border border-border bg-surface px-3 py-2 text-sm"
                >
                  {PIECE_STATUS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="flex flex-col justify-end gap-2">
                <label className="flex items-center gap-2 text-xs">
                  <Switch
                    checked={form.featured}
                    onCheckedChange={(v) => setForm({ ...form, featured: v })}
                  />
                  <span className="font-condensed uppercase tracking-widest text-muted-foreground">
                    Destacada
                  </span>
                </label>
                <label className="flex items-center gap-2 text-xs">
                  <Switch
                    checked={form.visible}
                    onCheckedChange={(v) => setForm({ ...form, visible: v })}
                  />
                  <span className="font-condensed uppercase tracking-widest text-muted-foreground">
                    Visible
                  </span>
                </label>
              </div>
            </div>

            <FormActions onCancel={() => setShowForm(false)} onSave={save} />
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ============================================================
   Componentes auxiliares
============================================================ */

function SortableRow({
  piece,
  specialSlug,
  onEdit,
  onRemove,
  onToggle,
}: {
  piece: Piece;
  specialSlug: string;
  onEdit: () => void;
  onRemove: () => void;
  onToggle: (field: "featured" | "visible") => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: piece.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };
  const thumb = piece.thumbnail_url || piece.image_url;
  return (
    <li
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 bg-surface px-3 py-3 hover:bg-surface-2"
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab touch-none text-muted-foreground hover:text-gold active:cursor-grabbing"
        aria-label="Arrastrar"
        type="button"
      >
        <GripVertical className="h-5 w-5" />
      </button>

      <div className="h-14 w-20 shrink-0 overflow-hidden rounded border border-border bg-background">
        {thumb ? (
          <img src={thumb} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground">
            sin img
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-display text-sm text-gold">{piece.number}</span>
          <span className="font-condensed text-[10px] uppercase tracking-widest text-gold/80">
            {piece.kicker || piece.category}
          </span>
          <span className={statusBadgeClass(piece.status)}>{statusLabel(piece.status)}</span>
        </div>
        <div className="truncate text-sm text-foreground">{piece.title}</div>
        <div className="truncate text-[11px] text-muted-foreground">/{piece.slug}</div>
      </div>

      <Link
        to="/especiales/$slug/$piece"
        params={{ slug: specialSlug, piece: piece.slug }}
        target="_blank"
        className="text-muted-foreground hover:text-gold"
        aria-label="Vista previa"
      >
        <ExternalLink className="h-4 w-4" />
      </Link>
      <button
        onClick={() => onToggle("featured")}
        className={piece.featured ? "text-gold" : "text-muted-foreground hover:text-gold"}
        aria-label="Destacada"
        type="button"
      >
        <Star className={"h-4 w-4 " + (piece.featured ? "fill-gold" : "")} />
      </button>
      <button
        onClick={() => onToggle("visible")}
        className={piece.visible ? "text-foreground" : "text-muted-foreground"}
        aria-label="Visible"
        type="button"
      >
        {piece.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
      </button>
      <button
        onClick={onEdit}
        className="text-muted-foreground hover:text-gold"
        aria-label="Editar"
        type="button"
      >
        <Pencil className="h-4 w-4" />
      </button>
      <button
        onClick={onRemove}
        className="text-muted-foreground hover:text-destructive"
        aria-label="Eliminar"
        type="button"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </li>
  );
}

function Field({
  label,
  children,
  wide,
}: {
  label: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className={wide ? "col-span-2" : ""}>
      <label className="font-condensed mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-auto border border-border bg-background p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl tracking-widest">{title}</h2>
          <button onClick={onClose} aria-label="Cerrar" type="button">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function FormActions({ onCancel, onSave }: { onCancel: () => void; onSave: () => void }) {
  return (
    <div className="flex justify-end gap-2 pt-2">
      <button
        onClick={onCancel}
        className="font-condensed border border-border px-4 py-2 text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground"
        type="button"
      >
        Cancelar
      </button>
      <button
        onClick={onSave}
        className="font-condensed bg-gold px-4 py-2 text-xs font-bold uppercase tracking-widest text-background hover:bg-gold-dark"
        type="button"
      >
        Guardar
      </button>
    </div>
  );
}

function statusLabel(s: string): string {
  switch (s) {
    case "active":
      return "Activo";
    case "hidden":
      return "Oculto";
    case "archived":
      return "Archivado";
    case "draft":
      return "Borrador";
    case "published":
      return "Publicada";
    case "live":
      return "Publicada";
    case "preparing":
      return "Preparando";
    case "upcoming":
      return "Próximamente";
    default:
      return s;
  }
}

function statusBadgeClass(s: string): string {
  const base =
    "font-condensed inline-block px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest ";
  switch (s) {
    case "active":
    case "published":
    case "live":
      return base + "bg-gold/20 text-gold";
    case "hidden":
      return base + "bg-muted text-muted-foreground";
    case "archived":
      return base + "bg-surface-2 text-muted-foreground";
    case "draft":
      return base + "border border-border text-muted-foreground";
    default:
      return base + "text-muted-foreground";
  }
}
