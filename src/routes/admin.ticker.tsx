import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X, Link2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";

type TickerItem = {
  id: string;
  text: string;
  link_url: string | null;
  active: boolean;
  sort_order: number;
};

export const Route = createFileRoute("/admin/ticker")({
  head: () => ({
    meta: [{ title: "Admin · Ticker" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminTicker,
});

function AdminTicker() {
  const { isAdmin } = useAuth();
  const [items, setItems] = useState<TickerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(true);
  const [editing, setEditing] = useState<TickerItem | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ text: "", link_url: "", sort_order: 0, active: true });

  const load = async () => {
    setLoading(true);
    const [itemsRes, settingRes] = await Promise.all([
      supabase.from("ticker_items").select("*").order("sort_order", { ascending: true }),
      supabase.from("site_settings").select("value").eq("key", "ticker_enabled").maybeSingle(),
    ]);
    setItems((itemsRes.data ?? []) as TickerItem[]);
    const v = settingRes.data?.value;
    setEnabled(v === true || v === "true" || v === undefined || v === null);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const toggleEnabled = async (next: boolean) => {
    setEnabled(next);
    const { error } = await supabase
      .from("site_settings")
      .upsert({ key: "ticker_enabled", value: next as unknown as never }, { onConflict: "key" });
    if (error) {
      toast.error("No se pudo guardar el estado del ticker");
      setEnabled(!next);
    } else {
      toast.success(next ? "Ticker activado" : "Ticker desactivado");
    }
  };

  const openNew = () => {
    setEditing(null);
    setForm({
      text: "",
      link_url: "",
      sort_order: (items[items.length - 1]?.sort_order ?? 0) + 1,
      active: true,
    });
    setShowForm(true);
  };

  const openEdit = (item: TickerItem) => {
    setEditing(item);
    setForm({
      text: item.text,
      link_url: item.link_url ?? "",
      sort_order: item.sort_order,
      active: item.active,
    });
    setShowForm(true);
  };

  const save = async () => {
    const text = form.text.trim();
    if (text.length < 2 || text.length > 280) {
      toast.error("El texto debe tener entre 2 y 280 caracteres");
      return;
    }
    const link_url = form.link_url.trim() || null;
    if (link_url && !/^(https?:\/\/|\/)/i.test(link_url)) {
      toast.error("El enlace debe empezar por '/' (interno) o 'http(s)://'");
      return;
    }
    if (editing) {
      const { error } = await supabase
        .from("ticker_items")
        .update({ text, link_url, sort_order: form.sort_order, active: form.active })
        .eq("id", editing.id);
      if (error) return toast.error(error.message);
      toast.success("Mensaje actualizado");
    } else {
      const { error } = await supabase
        .from("ticker_items")
        .insert({ text, link_url, sort_order: form.sort_order, active: form.active });
      if (error) return toast.error(error.message);
      toast.success("Mensaje creado");
    }
    setShowForm(false);
    load();
  };

  const toggleActive = async (item: TickerItem) => {
    const { error } = await supabase
      .from("ticker_items")
      .update({ active: !item.active })
      .eq("id", item.id);
    if (error) return toast.error(error.message);
    load();
  };

  const remove = async (item: TickerItem) => {
    if (!isAdmin) {
      toast.error("Solo los administradores pueden eliminar");
      return;
    }
    if (!confirm(`¿Eliminar "${item.text}"?`)) return;
    const { error } = await supabase.from("ticker_items").delete().eq("id", item.id);
    if (error) return toast.error(error.message);
    toast.success("Eliminado");
    load();
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl tracking-widest">TICKER EN VIVO</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gestiona los mensajes de la barra superior. Los cambios se reflejan al instante.
          </p>
        </div>
        <button
          onClick={openNew}
          className="font-condensed inline-flex items-center gap-2 bg-gold px-4 py-2 text-xs font-bold uppercase tracking-widest text-background hover:bg-gold-dark"
        >
          <Plus className="h-4 w-4" /> Nuevo mensaje
        </button>
      </div>

      <div className="mb-6 flex items-center justify-between border border-border bg-surface p-4">
        <div>
          <div className="font-condensed text-xs font-bold uppercase tracking-widest text-gold">
            Estado del ticker
          </div>
          <div className="mt-1 text-sm text-muted-foreground">
            {enabled ? "Visible en toda la web" : "Oculto en toda la web"}
          </div>
        </div>
        <Switch checked={enabled} onCheckedChange={toggleEnabled} />
      </div>

      {loading ? (
        <div className="text-muted-foreground">Cargando…</div>
      ) : items.length === 0 ? (
        <div className="border border-dashed border-border p-8 text-center text-muted-foreground">
          No hay mensajes. Crea el primero.
        </div>
      ) : (
        <div className="border border-border bg-surface">
          <table className="w-full">
            <thead className="border-b border-border bg-background/50">
              <tr className="font-condensed text-left text-[11px] uppercase tracking-widest text-muted-foreground">
                <th className="px-3 py-2 w-16">Orden</th>
                <th className="px-3 py-2">Texto</th>
                <th className="px-3 py-2 w-24">Activo</th>
                <th className="px-3 py-2 w-32 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.id} className="border-b border-border last:border-b-0">
                  <td className="px-3 py-2 text-sm text-muted-foreground">{it.sort_order}</td>
                  <td className="px-3 py-2 text-sm text-foreground">
                    <div className="flex items-center gap-2">
                      <span>{it.text}</span>
                      {it.link_url && (
                        <a
                          href={it.link_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-gold hover:underline"
                          title={it.link_url}
                        >
                          <Link2 className="h-3 w-3" />
                          enlace
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <Switch checked={it.active} onCheckedChange={() => toggleActive(it)} />
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      onClick={() => openEdit(it)}
                      className="mr-2 inline-flex items-center text-muted-foreground hover:text-gold"
                      aria-label="Editar"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => remove(it)}
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
          <div className="w-full max-w-lg border border-border bg-background p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-xl tracking-widest">
                {editing ? "EDITAR MENSAJE" : "NUEVO MENSAJE"}
              </h2>
              <button onClick={() => setShowForm(false)} aria-label="Cerrar">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="font-condensed mb-1 block text-xs uppercase tracking-widest text-muted-foreground">
                  Texto
                </label>
                <textarea
                  value={form.text}
                  onChange={(e) => setForm((f) => ({ ...f, text: e.target.value }))}
                  rows={3}
                  maxLength={280}
                  className="w-full border border-border bg-surface px-3 py-2 text-sm text-foreground"
                  placeholder="Ej: Liga Nacional · Jornada 5 este sábado"
                />
                <div className="mt-1 text-right text-[11px] text-muted-foreground">
                  {form.text.length}/280
                </div>
              </div>

              <div>
                <label className="font-condensed mb-1 block text-xs uppercase tracking-widest text-muted-foreground">
                  Enlace (opcional)
                </label>
                <input
                  type="text"
                  value={form.link_url}
                  onChange={(e) => setForm((f) => ({ ...f, link_url: e.target.value }))}
                  className="w-full border border-border bg-surface px-3 py-2 text-sm text-foreground"
                  placeholder="/noticias/articulo/mi-slug  ·  /eventos  ·  https://..."
                />
                <div className="mt-1 text-[11px] text-muted-foreground">
                  Usa una ruta interna que empiece por "/" o una URL completa con http(s)://
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-condensed mb-1 block text-xs uppercase tracking-widest text-muted-foreground">
                    Orden
                  </label>
                  <input
                    type="number"
                    value={form.sort_order}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))
                    }
                    className="w-full border border-border bg-surface px-3 py-2 text-sm text-foreground"
                  />
                </div>
                <div className="flex items-end gap-3">
                  <Switch
                    checked={form.active}
                    onCheckedChange={(v) => setForm((f) => ({ ...f, active: v }))}
                  />
                  <span className="font-condensed text-xs uppercase tracking-widest text-muted-foreground">
                    {form.active ? "Activo" : "Inactivo"}
                  </span>
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
