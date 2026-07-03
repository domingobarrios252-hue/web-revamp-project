import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Eye, EyeOff, Sparkles, Plus, Trash2, Save } from "lucide-react";

type PageStatus = "active" | "hidden" | "coming_soon";

interface Row {
  id: string;
  slug: string;
  label: string;
  category: string | null;
  route: string | null;
  status: PageStatus;
  sort_order: number;
}

export const Route = createFileRoute("/admin/paginas")({
  head: () => ({
    meta: [{ title: "Admin · Gestión de páginas" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminPages,
});

const STATUS_META: Record<PageStatus, { label: string; className: string; Icon: typeof Eye }> = {
  active: {
    label: "Activa",
    className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/40",
    Icon: Eye,
  },
  hidden: {
    label: "Oculta",
    className: "bg-red-500/15 text-red-400 border-red-500/40",
    Icon: EyeOff,
  },
  coming_soon: {
    label: "Próximamente",
    className: "bg-[#D4A017]/15 text-[#D4A017] border-[#D4A017]/40",
    Icon: Sparkles,
  },
};

function AdminPages() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [newRow, setNewRow] = useState({ slug: "", label: "", category: "", route: "" });

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("page_settings")
      .select("*")
      .order("category", { ascending: true, nullsFirst: false })
      .order("sort_order", { ascending: true });
    if (error) toast.error("Error cargando páginas");
    setRows((data ?? []) as Row[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const grouped = useMemo(() => {
    const g: Record<string, Row[]> = {};
    for (const r of rows) {
      const k = r.category || "Otras";
      g[k] = g[k] || [];
      g[k].push(r);
    }
    return g;
  }, [rows]);

  const updateStatus = async (row: Row, status: PageStatus) => {
    setSaving(row.id);
    const { error } = await supabase.from("page_settings").update({ status }).eq("id", row.id);
    setSaving(null);
    if (error) {
      toast.error("No se pudo actualizar");
      return;
    }
    setRows((rs) => rs.map((r) => (r.id === row.id ? { ...r, status } : r)));
    toast.success(`«${row.label}» → ${STATUS_META[status].label}`);
  };

  const remove = async (row: Row) => {
    if (!confirm(`¿Eliminar «${row.label}» de la gestión?`)) return;
    const { error } = await supabase.from("page_settings").delete().eq("id", row.id);
    if (error) return toast.error("Error al eliminar");
    setRows((rs) => rs.filter((r) => r.id !== row.id));
    toast.success("Eliminada");
  };

  const create = async () => {
    if (!newRow.slug || !newRow.label) return toast.error("Slug y etiqueta requeridos");
    const { data, error } = await supabase
      .from("page_settings")
      .insert({
        slug: newRow.slug.trim(),
        label: newRow.label.trim(),
        category: newRow.category.trim() || null,
        route: newRow.route.trim() || null,
        status: "active" as const,
        sort_order: rows.length + 1,
      })
      .select()
      .single();
    if (error) return toast.error(error.message);
    setRows((rs) => [...rs, data as Row]);
    setNewRow({ slug: "", label: "", category: "", route: "" });
    toast.success("Página añadida");
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl tracking-widest text-gold">GESTIÓN DE PÁGINAS</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Activa, oculta o marca como «Próximamente» cualquier página o sección de la web.
          Los cambios se aplican al menú, footer, enlaces internos y al acceso directo por URL.
        </p>
      </header>

      {loading ? (
        <p className="text-muted-foreground">Cargando…</p>
      ) : (
        Object.entries(grouped).map(([cat, list]) => (
          <section key={cat} className="border border-border bg-surface">
            <header className="border-b border-border bg-background/60 px-4 py-2">
              <h2 className="font-condensed text-xs font-bold uppercase tracking-widest text-gold">
                {cat}
              </h2>
            </header>
            <ul className="divide-y divide-border">
              {list.map((row) => (
                <li key={row.id} className="grid gap-3 px-4 py-3 md:grid-cols-[1fr_auto_auto] md:items-center">
                  <div>
                    <div className="font-semibold text-foreground">{row.label}</div>
                    <div className="font-mono text-[11px] text-muted-foreground">
                      {row.slug} {row.route ? `· ${row.route}` : ""}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {(Object.keys(STATUS_META) as PageStatus[]).map((s) => {
                      const meta = STATUS_META[s];
                      const Icon = meta.Icon;
                      const active = row.status === s;
                      return (
                        <button
                          key={s}
                          disabled={saving === row.id}
                          onClick={() => updateStatus(row, s)}
                          className={`inline-flex items-center gap-1 rounded border px-2 py-1 text-[11px] font-semibold uppercase tracking-wider transition-colors ${
                            active
                              ? meta.className
                              : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground"
                          }`}
                        >
                          <Icon className="h-3 w-3" />
                          {meta.label}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => remove(row)}
                    className="justify-self-end text-muted-foreground hover:text-red-400"
                    title="Eliminar"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}

      <section className="border border-border bg-surface p-4">
        <h2 className="font-condensed mb-3 text-xs font-bold uppercase tracking-widest text-gold">
          Añadir nueva página
        </h2>
        <div className="grid gap-2 md:grid-cols-4">
          <input
            className="border border-border bg-background px-2 py-1.5 text-sm"
            placeholder="slug (ej: rankings)"
            value={newRow.slug}
            onChange={(e) => setNewRow({ ...newRow, slug: e.target.value })}
          />
          <input
            className="border border-border bg-background px-2 py-1.5 text-sm"
            placeholder="Etiqueta visible"
            value={newRow.label}
            onChange={(e) => setNewRow({ ...newRow, label: e.target.value })}
          />
          <input
            className="border border-border bg-background px-2 py-1.5 text-sm"
            placeholder="Categoría"
            value={newRow.category}
            onChange={(e) => setNewRow({ ...newRow, category: e.target.value })}
          />
          <input
            className="border border-border bg-background px-2 py-1.5 text-sm"
            placeholder="/ruta (opcional)"
            value={newRow.route}
            onChange={(e) => setNewRow({ ...newRow, route: e.target.value })}
          />
        </div>
        <button
          onClick={create}
          className="font-condensed mt-3 inline-flex items-center gap-2 border border-gold bg-gold px-4 py-2 text-xs font-bold uppercase tracking-widest text-background hover:bg-gold-dark"
        >
          <Plus className="h-4 w-4" /> Añadir
        </button>
        <p className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground">
          <Save className="h-3 w-3" /> Cambios guardados al instante en base de datos.
        </p>
      </section>
    </div>
  );
}
