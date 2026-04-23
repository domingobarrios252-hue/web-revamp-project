import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Save, Trash2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";

export const Route = createFileRoute("/admin/schedule")({
  head: () => ({ meta: [{ title: "Admin · Pruebas programadas" }, { name: "robots", content: "noindex" }] }),
  component: AdminSchedule,
});

const schema = z.object({
  event_name: z.string().trim().min(2).max(150),
  category: z.string().trim().max(80).optional().or(z.literal("")),
  location: z.string().trim().max(150).optional().or(z.literal("")),
  scheduled_at: z.string().min(1, "Fecha y hora requeridas"),
  status: z.enum(["programada", "en_curso", "finalizada"]),
  published: z.boolean(),
  sort_order: z.number().int().min(0),
});

type Row = {
  id: string;
  event_name: string;
  category: string | null;
  location: string | null;
  scheduled_at: string;
  status: "programada" | "en_curso" | "finalizada";
  published: boolean;
  sort_order: number;
};

function AdminSchedule() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Row | null>(null);
  const [open, setOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("schedule_items")
      .select("*")
      .order("scheduled_at", { ascending: true });
    setRows((data as Row[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const onNew = () => {
    setEditing({
      id: "",
      event_name: "",
      category: "",
      location: "",
      scheduled_at: new Date().toISOString(),
      status: "programada",
      published: true,
      sort_order: 0,
    });
    setOpen(true);
  };

  const onEdit = (r: Row) => {
    setEditing(r);
    setOpen(true);
  };

  const onDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta prueba?")) return;
    const { error } = await supabase.from("schedule_items").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Eliminada");
    load();
  };

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="font-display text-2xl tracking-widest">Pruebas programadas</h1>
        <button
          onClick={onNew}
          className="font-condensed inline-flex items-center gap-2 bg-gold px-4 py-2 text-xs font-bold uppercase tracking-widest text-background hover:bg-gold-dark"
        >
          <Plus className="h-4 w-4" /> Nueva prueba
        </button>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Cargando…</p>
      ) : rows.length === 0 ? (
        <p className="text-muted-foreground">Sin pruebas. Crea la primera.</p>
      ) : (
        <div className="overflow-x-auto border border-border bg-surface">
          <table className="w-full text-sm">
            <thead className="border-b border-border">
              <tr className="font-condensed text-left text-[10px] uppercase tracking-widest text-muted-foreground">
                <th className="px-3 py-2">Hora</th>
                <th className="px-3 py-2">Prueba</th>
                <th className="px-3 py-2">Lugar</th>
                <th className="px-3 py-2">Categoría</th>
                <th className="px-3 py-2">Estado</th>
                <th className="px-3 py-2">Pub.</th>
                <th className="px-3 py-2">Orden</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-border last:border-0 hover:bg-background/50">
                  <td className="px-3 py-2 font-mono text-xs">
                    {new Date(r.scheduled_at).toLocaleString("es-ES", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-3 py-2 font-medium">{r.event_name}</td>
                  <td className="px-3 py-2 text-muted-foreground">{r.location ?? "—"}</td>
                  <td className="px-3 py-2 text-muted-foreground">{r.category ?? "—"}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`font-condensed inline-block px-2 py-0.5 text-[10px] uppercase tracking-widest ${
                        r.status === "en_curso"
                          ? "bg-tv-red text-white"
                          : r.status === "finalizada"
                            ? "bg-muted text-muted-foreground"
                            : "bg-gold/20 text-gold"
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="px-3 py-2">{r.published ? "✓" : "—"}</td>
                  <td className="px-3 py-2">{r.sort_order}</td>
                  <td className="px-3 py-2">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => onEdit(r)}
                        className="font-condensed text-[11px] uppercase tracking-widest text-gold hover:underline"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => onDelete(r.id)}
                        className="text-tv-red hover:opacity-80"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {open && editing && (
        <EditDialog row={editing} onClose={() => setOpen(false)} onSaved={() => { setOpen(false); load(); }} />
      )}
    </div>
  );
}

function EditDialog({ row, onClose, onSaved }: { row: Row; onClose: () => void; onSaved: () => void }) {
  const [eventName, setEventName] = useState(row.event_name);
  const [category, setCategory] = useState(row.category ?? "");
  const [location, setLocation] = useState(row.location ?? "");
  const [scheduledAt, setScheduledAt] = useState(toLocalInput(row.scheduled_at));
  const [status, setStatus] = useState<Row["status"]>(row.status);
  const [published, setPublished] = useState(row.published);
  const [sortOrder, setSortOrder] = useState(row.sort_order);
  const [saving, setSaving] = useState(false);

  const onSave = async () => {
    const parsed = schema.safeParse({
      event_name: eventName,
      category,
      location,
      scheduled_at: scheduledAt,
      status,
      published,
      sort_order: sortOrder,
    });
    if (!parsed.success) return toast.error(parsed.error.errors[0]?.message ?? "Datos inválidos");

    setSaving(true);
    const payload = {
      event_name: parsed.data.event_name,
      category: parsed.data.category || null,
      location: parsed.data.location || null,
      scheduled_at: new Date(parsed.data.scheduled_at).toISOString(),
      status: parsed.data.status,
      published: parsed.data.published,
      sort_order: parsed.data.sort_order,
    };
    const { error } = row.id
      ? await supabase.from("schedule_items").update(payload).eq("id", row.id)
      : await supabase.from("schedule_items").insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Guardado");
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className="w-full max-w-lg border border-border bg-surface p-6" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg tracking-widest text-gold">
            {row.id ? "Editar prueba" : "Nueva prueba"}
          </h2>
          <button onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3">
          <Field label="Nombre de la prueba *">
            <input value={eventName} onChange={(e) => setEventName(e.target.value)} className="input" />
          </Field>
          <Field label="Categoría">
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="input"
              placeholder="Ej: Senior femenino · 500m"
            />
          </Field>
          <Field label="Fecha y hora *">
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="input"
            />
          </Field>
          <Field label="Estado">
            <select value={status} onChange={(e) => setStatus(e.target.value as Row["status"])} className="input">
              <option value="programada">Programada</option>
              <option value="en_curso">En curso</option>
              <option value="finalizada">Finalizada</option>
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Orden">
              <input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(parseInt(e.target.value || "0", 10))}
                className="input"
              />
            </Field>
            <label className="flex items-end gap-2">
              <input
                type="checkbox"
                checked={published}
                onChange={(e) => setPublished(e.target.checked)}
                className="mb-2 h-4 w-4"
              />
              <span className="font-condensed mb-2 text-[11px] uppercase tracking-widest">Publicada</span>
            </label>
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="font-condensed border border-border px-4 py-2 text-xs font-bold uppercase tracking-widest"
          >
            Cancelar
          </button>
          <button
            onClick={onSave}
            disabled={saving}
            className="font-condensed inline-flex items-center gap-2 bg-gold px-4 py-2 text-xs font-bold uppercase tracking-widest text-background hover:bg-gold-dark disabled:opacity-50"
          >
            <Save className="h-4 w-4" /> {saving ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="font-condensed mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

function toLocalInput(iso: string) {
  const d = new Date(iso);
  const tz = d.getTimezoneOffset();
  const local = new Date(d.getTime() - tz * 60000);
  return local.toISOString().slice(0, 16);
}
