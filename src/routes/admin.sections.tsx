import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { z } from "zod";

type Section = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  active: boolean;
  sort_order: number;
};

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9-]+$/, "Solo minúsculas, números y guiones"),
  description: z.string().trim().max(500).optional(),
  active: z.boolean(),
  sort_order: z.number().int().min(0).max(9999),
});

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export const Route = createFileRoute("/admin/sections")({
  head: () => ({
    meta: [
      { title: "Secciones editoriales — RollerZone" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminSectionsPage,
});

function AdminSectionsPage() {
  const { isAdmin } = useAuth();
  const [items, setItems] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Section | "new" | null>(null);

  const reload = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("sections")
      .select("id, name, slug, description, active, sort_order")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });
    setItems((data as Section[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    reload();
  }, []);

  if (!isAdmin) {
    return <p className="text-muted-foreground">Solo administradores pueden gestionar secciones.</p>;
  }

  const onDelete = async (s: Section) => {
    if (!confirm(`¿Borrar la sección "${s.name}"?`)) return;
    const { error } = await supabase.from("sections").delete().eq("id", s.id);
    if (error) toast.error(error.message);
    else {
      toast.success("Sección borrada");
      reload();
    }
  };

  const toggleActive = async (s: Section) => {
    const { error } = await supabase
      .from("sections")
      .update({ active: !s.active })
      .eq("id", s.id);
    if (error) toast.error(error.message);
    else reload();
  };

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="font-display text-2xl tracking-widest md:text-3xl">Secciones editoriales</h1>
        <button
          onClick={() => setEditing("new")}
          className="font-condensed inline-flex items-center gap-1.5 bg-gold px-4 py-2 text-xs font-bold uppercase tracking-widest text-background hover:bg-gold-dark"
        >
          <Plus className="h-3.5 w-3.5" /> Nueva sección
        </button>
      </div>

      <p className="mb-4 text-sm text-muted-foreground">
        Las secciones editoriales agrupan a los colaboradores y sus noticias por área (Asturias, Navarra, Colombia, Internacional…).
      </p>

      {loading ? (
        <p className="text-muted-foreground">Cargando…</p>
      ) : items.length === 0 ? (
        <p className="text-muted-foreground">No hay secciones todavía.</p>
      ) : (
        <div className="overflow-x-auto border border-border bg-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="font-condensed border-b border-border bg-background text-left text-[11px] uppercase tracking-widest text-muted-foreground">
                <th className="px-3 py-2">Nombre</th>
                <th className="px-3 py-2">Slug</th>
                <th className="px-3 py-2 text-right">Orden</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((s) => (
                <tr key={s.id} className="border-b border-border/50 last:border-0">
                  <td className="px-3 py-2">
                    <div className="font-semibold text-foreground">{s.name}</div>
                    {s.description && (
                      <div className="text-xs text-muted-foreground">{s.description}</div>
                    )}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{s.slug}</td>
                  <td className="px-3 py-2 text-right text-muted-foreground">{s.sort_order}</td>
                  <td className="px-3 py-2">
                    <div className="flex justify-end gap-1">
                      <IconBtn title={s.active ? "Desactivar" : "Activar"} onClick={() => toggleActive(s)}>
                        {s.active ? <Eye className="h-4 w-4 text-gold" /> : <EyeOff className="h-4 w-4" />}
                      </IconBtn>
                      <IconBtn title="Editar" onClick={() => setEditing(s)}>
                        <Pencil className="h-4 w-4" />
                      </IconBtn>
                      <IconBtn title="Borrar" onClick={() => onDelete(s)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </IconBtn>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <SectionEditor
          item={editing === "new" ? null : editing}
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

function SectionEditor({
  item,
  onClose,
  onSaved,
}: {
  item: Section | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(item?.name ?? "");
  const [slug, setSlug] = useState(item?.slug ?? "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [active, setActive] = useState(item?.active ?? true);
  const [sortOrder, setSortOrder] = useState<number>(item?.sort_order ?? 0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!item && name && !slug) setSlug(slugify(name));
  }, [name]); // eslint-disable-line react-hooks/exhaustive-deps

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({
      name,
      slug,
      description: description || undefined,
      active,
      sort_order: sortOrder,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Datos no válidos");
      return;
    }
    setSaving(true);
    const payload = {
      name: parsed.data.name,
      slug: parsed.data.slug,
      description: parsed.data.description ?? null,
      active: parsed.data.active,
      sort_order: parsed.data.sort_order,
    };
    const { error } = item
      ? await supabase.from("sections").update(payload).eq("id", item.id)
      : await supabase.from("sections").insert(payload);
    setSaving(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(item ? "Sección actualizada" : "Sección creada");
      onSaved();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-background/85 p-4 backdrop-blur">
      <div className="w-full max-w-xl border border-border bg-surface p-5 md:p-7">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-2xl tracking-widest">
            {item ? "Editar sección" : "Nueva sección"}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            ✕
          </button>
        </div>
        <form onSubmit={onSubmit} className="space-y-3">
          <Field label="Nombre" value={name} onChange={setName} required />
          <Field label="Slug" value={slug} onChange={setSlug} required />
          <label className="block">
            <span className="font-condensed mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">
              Descripción
            </span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full border border-border bg-background px-3 py-2 text-sm focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="font-condensed mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">
                Orden
              </span>
              <input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(Number(e.target.value) || 0)}
                className="w-full border border-border bg-background px-3 py-2 text-sm focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
              />
            </label>
            <label className="mt-6 inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="h-4 w-4"
              />
              Activa
            </label>
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
              {saving ? "Guardando…" : item ? "Guardar" : "Crear"}
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
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="font-condensed mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full border border-border bg-background px-3 py-2 text-sm focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
      />
    </label>
  );
}
