import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { z } from "zod";

type Category = {
  id: string;
  scope: "Nacional" | "Internacional" | "General";
  name: string;
  slug: string;
  region_code: string | null;
  description: string | null;
  sort_order: number;
};

const schema = z.object({
  scope: z.enum(["Nacional", "Internacional", "General"]),
  name: z.string().trim().min(2).max(80),
  slug: z.string().trim().min(2).max(80).regex(/^[a-z0-9-]+$/),
  region_code: z.string().trim().max(8).optional(),
  description: z.string().trim().max(300).optional(),
  sort_order: z.number().int().min(0).max(9999),
});

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const Route = createFileRoute("/admin/categorias")({
  component: AdminCategoriesPage,
});

function AdminCategoriesPage() {
  const { isAdmin } = useAuth();
  const [items, setItems] = useState<Category[]>([]);
  const [editing, setEditing] = useState<Category | "new" | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("news_categories")
      .select("id, scope, name, slug, region_code, description, sort_order")
      .order("scope", { ascending: true })
      .order("sort_order", { ascending: true });
    setItems((data as Category[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    reload();
  }, []);

  const onDelete = async (id: string, name: string) => {
    if (!confirm(`¿Borrar la sección "${name}"? Las noticias quedarán sin categoría.`)) return;
    const { error } = await supabase.from("news_categories").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Sección borrada");
      reload();
    }
  };

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="font-display text-2xl tracking-widest md:text-3xl">
          Secciones de noticias
        </h1>
        <button
          onClick={() => setEditing("new")}
          className="font-condensed inline-flex items-center gap-1.5 bg-gold px-4 py-2 text-xs font-bold uppercase tracking-widest text-background hover:bg-gold-dark"
        >
          <Plus className="h-3.5 w-3.5" /> Nueva sección
        </button>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Cargando…</p>
      ) : (
        <div className="overflow-x-auto border border-border bg-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="font-condensed border-b border-border bg-background text-left text-[11px] uppercase tracking-widest text-muted-foreground">
                <th className="px-3 py-2">Ámbito</th>
                <th className="px-3 py-2">Nombre</th>
                <th className="px-3 py-2">Slug</th>
                <th className="px-3 py-2">Orden</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((c) => (
                <tr key={c.id} className="border-b border-border/50 last:border-0">
                  <td className="px-3 py-2">
                    <span className="bg-gold/15 px-2 py-0.5 text-xs font-bold text-gold">
                      {c.scope}
                    </span>
                  </td>
                  <td className="px-3 py-2 font-semibold text-foreground">{c.name}</td>
                  <td className="px-3 py-2 text-muted-foreground">/{c.slug}</td>
                  <td className="px-3 py-2 text-muted-foreground">{c.sort_order}</td>
                  <td className="px-3 py-2">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => setEditing(c)}
                        className="border border-border bg-background p-1.5 hover:border-gold hover:text-gold"
                        title="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => onDelete(c.id, c.name)}
                          className="border border-border bg-background p-1.5 hover:border-destructive hover:text-destructive"
                          title="Borrar"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <CategoryEditor
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

function CategoryEditor({
  item,
  onClose,
  onSaved,
}: {
  item: Category | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [scope, setScope] = useState<"Nacional" | "Internacional" | "General">(item?.scope ?? "Nacional");
  const [name, setName] = useState(item?.name ?? "");
  const [slug, setSlug] = useState(item?.slug ?? "");
  const [region, setRegion] = useState(item?.region_code ?? "");
  const [desc, setDesc] = useState(item?.description ?? "");
  const [sortOrder, setSortOrder] = useState<number>(item?.sort_order ?? 100);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!item && name && !slug) setSlug(slugify(name));
  }, [name]); // eslint-disable-line

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({
      scope,
      name,
      slug,
      region_code: region || undefined,
      description: desc || undefined,
      sort_order: sortOrder,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Datos no válidos");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        scope: parsed.data.scope,
        name: parsed.data.name,
        slug: parsed.data.slug,
        region_code: parsed.data.region_code ?? null,
        description: parsed.data.description ?? null,
        sort_order: parsed.data.sort_order,
      };
      const { error } = item
        ? await supabase.from("news_categories").update(payload).eq("id", item.id)
        : await supabase.from("news_categories").insert(payload);
      if (error) toast.error(error.message);
      else {
        toast.success(item ? "Sección actualizada" : "Sección creada");
        onSaved();
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-background/85 p-4 backdrop-blur">
      <div className="w-full max-w-lg border border-border bg-surface p-5 md:p-7">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-2xl tracking-widest">
            {item ? "Editar sección" : "Nueva sección"}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            ✕
          </button>
        </div>
        <form onSubmit={onSubmit} className="space-y-3">
          <label className="block">
            <span className="font-condensed mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">
              Ámbito
            </span>
            <select
              value={scope}
              onChange={(e) => setScope(e.target.value as typeof scope)}
              className="w-full border border-border bg-background px-3 py-2 text-sm focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
            >
              <option value="General">General</option>
              <option value="Nacional">Nacional</option>
              <option value="Internacional">Internacional</option>
            </select>
          </label>
          <Input label="Nombre" value={name} onChange={setName} required />
          <Input label="Slug (URL)" value={slug} onChange={setSlug} required />
          <div className="grid gap-3 md:grid-cols-2">
            <Input label="Código región (opcional)" value={region} onChange={setRegion} />
            <label className="block">
              <span className="font-condensed mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">
                Orden
              </span>
              <input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(Number(e.target.value))}
                className="w-full border border-border bg-background px-3 py-2 text-sm focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
              />
            </label>
          </div>
          <label className="block">
            <span className="font-condensed mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">
              Descripción
            </span>
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              rows={3}
              className="w-full border border-border bg-background px-3 py-2 text-sm focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
            />
          </label>
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
              {saving ? "Guardando…" : item ? "Guardar cambios" : "Crear sección"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Input({
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
