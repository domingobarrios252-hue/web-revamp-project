import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X, ArrowUp, ArrowDown, Star, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";

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

const emptyForm = {
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
};

function AdminEspeciales() {
  const { isAdmin } = useAuth();
  const [specialSlug, setSpecialSlug] = useState(SPECIALS[0].slug);
  const [items, setItems] = useState<Piece[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Piece | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);

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
    const { error } = await supabase
      .from("special_pieces")
      .update({ [field]: !p[field] })
      .eq("id", p.id);
    if (error) return toast.error(error.message);
    load();
  };

  const move = async (p: Piece, dir: -1 | 1) => {
    const idx = items.findIndex((x) => x.id === p.id);
    const swap = items[idx + dir];
    if (!swap) return;
    const a = supabase
      .from("special_pieces")
      .update({ sort_order: swap.sort_order })
      .eq("id", p.id);
    const b = supabase
      .from("special_pieces")
      .update({ sort_order: p.sort_order })
      .eq("id", swap.id);
    const [r1, r2] = await Promise.all([a, b]);
    if (r1.error || r2.error) {
      toast.error("No se pudo reordenar");
      return;
    }
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

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl tracking-widest">ESPECIALES EDITORIALES</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gestiona piezas del dossier: orden, destacadas y visibilidad pública.
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
        <div className="border border-border bg-surface">
          <table className="w-full">
            <thead className="border-b border-border bg-background/50">
              <tr className="font-condensed text-left text-[11px] uppercase tracking-widest text-muted-foreground">
                <th className="px-3 py-2 w-24">Orden</th>
                <th className="px-3 py-2 w-16">Nº</th>
                <th className="px-3 py-2">Pieza</th>
                <th className="px-3 py-2 w-28">Estado</th>
                <th className="px-3 py-2 w-20 text-center">Destacada</th>
                <th className="px-3 py-2 w-20 text-center">Visible</th>
                <th className="px-3 py-2 w-32 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.map((p, i) => (
                <tr key={p.id} className="border-b border-border last:border-b-0">
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => move(p, -1)}
                        disabled={i === 0}
                        className="rounded border border-border p-1 text-muted-foreground hover:text-gold disabled:opacity-30"
                        aria-label="Subir"
                      >
                        <ArrowUp className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => move(p, 1)}
                        disabled={i === items.length - 1}
                        className="rounded border border-border p-1 text-muted-foreground hover:text-gold disabled:opacity-30"
                        aria-label="Bajar"
                      >
                        <ArrowDown className="h-3 w-3" />
                      </button>
                      <span className="ml-1 text-[11px] text-muted-foreground">{p.sort_order}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2 font-display text-sm text-gold">{p.number}</td>
                  <td className="px-3 py-2">
                    <div className="font-condensed text-[10px] uppercase tracking-widest text-gold/80">
                      {p.kicker}
                    </div>
                    <div className="text-sm text-foreground">{p.title}</div>
                    <div className="mt-0.5 text-[11px] text-muted-foreground">/{p.slug}</div>
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">
                    {STATUS_OPTIONS.find((s) => s.value === p.status)?.label ?? p.status}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <button
                      onClick={() => toggleField(p, "featured")}
                      className={p.featured ? "text-gold" : "text-muted-foreground hover:text-gold"}
                      aria-label="Destacada"
                    >
                      <Star className={"h-4 w-4 " + (p.featured ? "fill-gold" : "")} />
                    </button>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <button
                      onClick={() => toggleField(p, "visible")}
                      className={p.visible ? "text-foreground" : "text-muted-foreground"}
                      aria-label="Visible"
                    >
                      {p.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </button>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      onClick={() => openEdit(p)}
                      className="mr-2 inline-flex items-center text-muted-foreground hover:text-gold"
                      aria-label="Editar"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => remove(p)}
                      className="inline-flex items-center text-muted-foreground hover:text-destructive"
                      aria-label="Eliminar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-auto border border-border bg-background p-6">
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
                    Debe coincidir con un archivo de ruta existente en /camino-al-europeo-2026/&lt;slug&gt;.
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

              <Field label="Imagen (URL)">
                <input
                  value={form.image_url}
                  onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                  className="w-full border border-border bg-surface px-3 py-2 text-sm"
                  placeholder="https://..."
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
