import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Star,
  Eye,
  EyeOff,
  GripVertical,
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

type Piece = {
  id: string;
  special_slug: string;
  slug: string;
  number: string;
  kicker: string;
  title: string;
  description: string;
  image_url: string;
  sort_order: number;
  featured: boolean;
  visible: boolean;
  status: string;
  crops: ImageCrops | null;
};

const SPECIALS = [
  { slug: "camino-al-europeo-2026", label: "Camino al Europeo 2026" },
];

const STATUS_OPTIONS = [
  { value: "live", label: "En vivo" },
  { value: "preparing", label: "En preparación" },
  { value: "upcoming", label: "Próximamente" },
];

export const Route = createFileRoute("/admin/especiales")({
  head: () => ({
    meta: [
      { title: "Admin · Especiales" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminEspeciales,
});

type FormState = {
  slug: string;
  number: string;
  kicker: string;
  title: string;
  description: string;
  image_url: string;
  sort_order: number;
  featured: boolean;
  visible: boolean;
  status: string;
  crops: ImageCrops;
};

const emptyForm: FormState = {
  slug: "",
  number: "",
  kicker: "",
  title: "",
  description: "",
  image_url: "",
  sort_order: 10,
  featured: false,
  visible: true,
  status: "live",
  crops: {},
};

function AdminEspeciales() {
  const { isAdmin } = useAuth();
  const [specialSlug, setSpecialSlug] = useState(SPECIALS[0].slug);
  const [items, setItems] = useState<Piece[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Piece | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("special_pieces")
      .select("*")
      .eq("special_slug", specialSlug)
      .order("sort_order", { ascending: true });
    if (error) toast.error(error.message);
    setItems((data ?? []) as Piece[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [specialSlug]);

  const openNew = () => {
    setEditing(null);
    setForm({
      ...emptyForm,
      sort_order: (items[items.length - 1]?.sort_order ?? 0) + 10,
    });
    setShowForm(true);
  };

  const openEdit = (p: Piece) => {
    setEditing(p);
    setForm({
      slug: p.slug,
      number: p.number,
      kicker: p.kicker,
      title: p.title,
      description: p.description,
      image_url: p.image_url,
      sort_order: p.sort_order,
      featured: p.featured,
      visible: p.visible,
      status: p.status,
      crops: (p.crops ?? {}) as ImageCrops,
    });
    setShowForm(true);
  };

  const save = async () => {
    const slug = form.slug.trim();
    const title = form.title.trim();
    if (!slug || !title) {
      toast.error("Slug y título son obligatorios");
      return;
    }
    const payload = {
      special_slug: specialSlug,
      slug,
      number: form.number.trim(),
      kicker: form.kicker.trim(),
      title,
      description: form.description.trim(),
      image_url: form.image_url.trim(),
      sort_order: form.sort_order,
      featured: form.featured,
      visible: form.visible,
      status: form.status,
      crops: form.crops as unknown as Record<string, unknown>,
    };
    if (editing) {
      const { error } = await supabase
        .from("special_pieces")
        .update(payload)
        .eq("id", editing.id);
      if (error) return toast.error(error.message);
      toast.success("Pieza actualizada");
    } else {
      const { error } = await supabase.from("special_pieces").insert(payload);
      if (error) return toast.error(error.message);
      toast.success("Pieza creada");
    }
    setShowForm(false);
    load();
  };

  const toggleField = async (p: Piece, field: "featured" | "visible") => {
    const update: Partial<Piece> = { [field]: !p[field] };
    const { error } = await supabase
      .from("special_pieces")
      .update(update)
      .eq("id", p.id);
    if (error) return toast.error(error.message);
    load();
  };

  const remove = async (p: Piece) => {
    if (!isAdmin) return toast.error("Solo administradores");
    if (!confirm(`¿Eliminar "${p.title}"?`)) return;
    const { error } = await supabase.from("special_pieces").delete().eq("id", p.id);
    if (error) return toast.error(error.message);
    toast.success("Eliminada");
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
    setItems(reordered); // optimistic
    const updates = reordered.map((it) =>
      supabase
        .from("special_pieces")
        .update({ sort_order: it.sort_order })
        .eq("id", it.id),
    );
    const results = await Promise.all(updates);
    if (results.some((r) => r.error)) {
      toast.error("No se pudo guardar el nuevo orden");
      load();
    } else {
      toast.success("Orden actualizado");
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl tracking-widest">ESPECIALES EDITORIALES</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Arrastra para reordenar. Edita imagen y encuadre por pieza.
          </p>
        </div>
        <button
          onClick={openNew}
          className="font-condensed inline-flex items-center gap-2 bg-gold px-4 py-2 text-xs font-bold uppercase tracking-widest text-background hover:bg-gold-dark"
        >
          <Plus className="h-4 w-4" /> Nueva pieza
        </button>
      </div>

      <div className="mb-4 flex items-center gap-3">
        <label className="font-condensed text-[11px] uppercase tracking-widest text-muted-foreground">
          Especial
        </label>
        <select
          value={specialSlug}
          onChange={(e) => setSpecialSlug(e.target.value)}
          className="border border-border bg-surface px-3 py-2 text-sm"
        >
          {SPECIALS.map((s) => (
            <option key={s.slug} value={s.slug}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-muted-foreground">Cargando…</div>
      ) : items.length === 0 ? (
        <div className="border border-dashed border-border p-8 text-center text-muted-foreground">
          Sin piezas. Crea la primera.
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
            <ul className="divide-y divide-border border border-border bg-surface">
              {items.map((p) => (
                <SortableRow
                  key={p.id}
                  piece={p}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-auto border border-border bg-background p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-xl tracking-widest">
                {editing ? "EDITAR PIEZA" : "NUEVA PIEZA"}
              </h2>
              <button onClick={() => setShowForm(false)} aria-label="Cerrar">
                <X className="h-5 w-5" />
              </button>
            </div>

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
                <Field label="Antetítulo (kicker)" wide>
                  <input
                    value={form.kicker}
                    onChange={(e) => setForm({ ...form, kicker: e.target.value })}
                    className="w-full border border-border bg-surface px-3 py-2 text-sm"
                    placeholder="Presentación"
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
                  placeholder="presentacion-europeo-2026"
                />
                {!editing && (
                  <div className="mt-1 text-[11px] text-muted-foreground">
                    Debe coincidir con un archivo de ruta existente en
                    /camino-al-europeo-2026/&lt;slug&gt;.
                  </div>
                )}
              </Field>

              <Field label="Descripción">
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full border border-border bg-surface px-3 py-2 text-sm"
                />
              </Field>

              <Field label="Imagen">
                <ImageUploadField
                  value={form.image_url}
                  onChange={(url) => setForm((f) => ({ ...f, image_url: url }))}
                  folder="specials"
                  nameHint={form.slug || form.title}
                  previewClassName="mt-2 h-32 w-56 object-cover rounded"
                  crops={form.crops}
                  onCropsChange={(next) => setForm((f) => ({ ...f, crops: next }))}
                />
              </Field>

              <div className="grid grid-cols-3 gap-3">
                <Field label="Orden">
                  <input
                    type="number"
                    value={form.sort_order}
                    onChange={(e) =>
                      setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })
                    }
                    className="w-full border border-border bg-surface px-3 py-2 text-sm"
                  />
                </Field>
                <Field label="Estado">
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full border border-border bg-surface px-3 py-2 text-sm"
                  >
                    {STATUS_OPTIONS.map((s) => (
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

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowForm(false)}
                  className="font-condensed border border-border px-4 py-2 text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground"
                >
                  Cancelar
                </button>
                <button
                  onClick={save}
                  className="font-condensed bg-gold px-4 py-2 text-xs font-bold uppercase tracking-widest text-background hover:bg-gold-dark"
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SortableRow({
  piece,
  onEdit,
  onRemove,
  onToggle,
}: {
  piece: Piece;
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
        aria-label="Arrastrar para reordenar"
        type="button"
      >
        <GripVertical className="h-5 w-5" />
      </button>

      <div className="h-14 w-20 shrink-0 overflow-hidden rounded border border-border bg-background">
        {piece.image_url ? (
          <img src={piece.image_url} alt="" className="h-full w-full object-cover" />
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
            {piece.kicker}
          </span>
        </div>
        <div className="truncate text-sm text-foreground">{piece.title}</div>
        <div className="truncate text-[11px] text-muted-foreground">/{piece.slug}</div>
      </div>

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
