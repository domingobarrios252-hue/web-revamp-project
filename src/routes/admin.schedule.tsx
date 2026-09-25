import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Plus, Save, Trash2, X, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import {
  SCHEDULE_STATUS_LABEL,
  localToUtcIso,
  timeInTz,
  dayInTz,
  utcToLocalInput,
  venueTimeZone,
  type ScheduleStatus,
} from "@/lib/specials/liveEvent";

export const Route = createFileRoute("/admin/schedule")({
  head: () => ({ meta: [{ title: "Admin · Pruebas programadas" }, { name: "robots", content: "noindex" }] }),
  component: AdminSchedule,
});

const STATUSES: ScheduleStatus[] = ["programada", "en_curso", "finalizada", "aplazada", "cancelada"];

const schema = z.object({
  event_name: z.string().trim().min(2, "Nombre obligatorio").max(150),
  event_name_en: z.string().trim().max(150),
  category: z.string().trim().max(80),
  gender: z.string().trim().max(40),
  phase: z.string().trim().max(80),
  discipline: z.string().trim().max(60),
  venue_type: z.string().trim().max(60),
  location: z.string().trim().max(150),
  scheduled_at: z.string().min(1, "Fecha y hora requeridas"),
  status: z.enum(["programada", "en_curso", "finalizada", "aplazada", "cancelada"]),
  published: z.boolean(),
  featured: z.boolean(),
  sort_order: z.number().int().min(0),
  country_code: z.string().min(2).max(3),
});

type Row = {
  id: string;
  event_name: string;
  event_name_en: string | null;
  category: string | null;
  gender: string | null;
  phase: string | null;
  discipline: string | null;
  venue_type: string | null;
  location: string | null;
  scheduled_at: string;
  status: ScheduleStatus;
  published: boolean;
  featured: boolean;
  sort_order: number;
  country_code: string;
  result_event_id: string | null;
};

type Ev = { id: string; name: string; country: string | null; event_date: string | null };

const BROWSER_TZ = Intl.DateTimeFormat().resolvedOptions().timeZone;

export function AdminSchedule() {
  const [rows, setRows] = useState<Row[]>([]);
  const [events, setEvents] = useState<Ev[]>([]);
  const [eventFilter, setEventFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Row | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const load = async () => {
    setLoading(true);
    const { data } = await db.from("schedule_items").select("*").order("scheduled_at", { ascending: true });
    setRows((data as Row[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    db.from("result_events")
      .select("id,name,country,event_date")
      .order("event_date", { ascending: false, nullsFirst: false })
      .then(({ data }: { data: Ev[] | null }) => setEvents(data ?? []));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const evById = useMemo(() => new Map(events.map((e) => [e.id, e])), [events]);
  const tzFor = (r: { result_event_id: string | null }) =>
    r.result_event_id ? venueTimeZone(evById.get(r.result_event_id)?.country) : BROWSER_TZ;

  const visible = rows.filter((r) =>
    eventFilter === "all" ? true : eventFilter === "none" ? !r.result_event_id : r.result_event_id === eventFilter,
  );

  const onNew = () =>
    setEditing({
      id: "",
      event_name: "",
      event_name_en: "",
      category: "",
      gender: "",
      phase: "",
      discipline: "",
      venue_type: "",
      location: "",
      scheduled_at: new Date().toISOString(),
      status: "programada",
      published: true,
      featured: false,
      sort_order: 0,
      country_code: "es",
      result_event_id: eventFilter !== "all" && eventFilter !== "none" ? eventFilter : null,
    });

  const onDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta prueba?")) return;
    const { error } = await db.from("schedule_items").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Eliminada");
    load();
  };

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl tracking-widest">Pruebas programadas</h1>
        <div className="flex flex-wrap items-center gap-2">
          <select value={eventFilter} onChange={(e) => setEventFilter(e.target.value)} className="input !w-auto text-xs">
            <option value="all">Todas las pruebas</option>
            <option value="none">Sin evento</option>
            {events.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
          <button
            onClick={onNew}
            className="font-condensed inline-flex items-center gap-2 bg-gold px-4 py-2 text-xs font-bold uppercase tracking-widest text-background hover:bg-gold-dark"
          >
            <Plus className="h-4 w-4" /> Nueva prueba
          </button>
        </div>
      </div>
      <p className="mb-4 text-xs text-muted-foreground">
        Las pruebas vinculadas a un evento aparecen en su especial (Hoy + Calendario). La hora se introduce y se muestra en
        hora local de la sede.
      </p>

      {loading ? (
        <p className="text-muted-foreground">Cargando…</p>
      ) : visible.length === 0 ? (
        <p className="text-muted-foreground">Sin pruebas. Crea la primera.</p>
      ) : (
        <div className="overflow-x-auto border border-border bg-surface">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="border-b border-border">
              <tr className="font-condensed text-left text-[10px] uppercase tracking-widest text-muted-foreground">
                <th className="px-3 py-2">Día · hora local</th>
                <th className="px-3 py-2">Prueba</th>
                <th className="px-3 py-2">Fase</th>
                <th className="px-3 py-2">Categoría</th>
                <th className="px-3 py-2">Evento</th>
                <th className="px-3 py-2">Estado</th>
                <th className="px-3 py-2">Pub.</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {visible.map((r) => {
                const tz = tzFor(r);
                return (
                  <tr key={r.id} className="border-b border-border last:border-0 hover:bg-background/50">
                    <td className="px-3 py-2 font-mono text-xs">
                      {dayInTz(r.scheduled_at, tz).slice(5)} · {timeInTz(r.scheduled_at, tz)}
                    </td>
                    <td className="px-3 py-2 font-medium">
                      {r.featured && <Star className="mr-1 inline h-3 w-3 text-gold" />}
                      {r.event_name}
                      {r.venue_type && <span className="ml-1 text-xs text-muted-foreground">· {r.venue_type}</span>}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">{r.phase || "—"}</td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {[r.category, r.gender].filter(Boolean).join(" · ") || "—"}
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">
                      {r.result_event_id ? evById.get(r.result_event_id)?.name ?? "—" : "—"}
                    </td>
                    <td className="px-3 py-2">
                      <span className="font-condensed inline-block bg-gold/20 px-2 py-0.5 text-[10px] uppercase tracking-widest text-gold">
                        {SCHEDULE_STATUS_LABEL[r.status]}
                      </span>
                    </td>
                    <td className="px-3 py-2">{r.published ? "✓" : "—"}</td>
                    <td className="px-3 py-2">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setEditing(r)}
                          className="font-condensed text-[11px] uppercase tracking-widest text-gold hover:underline"
                        >
                          Editar
                        </button>
                        <button onClick={() => onDelete(r.id)} className="text-tv-red hover:opacity-80">
                          <Trash2 className="h-4 w-4" />
                        </button>
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
        <EditDialog
          row={editing}
          events={events}
          tzFor={tzFor}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
      )}
    </div>
  );
}

function EditDialog({
  row,
  events,
  tzFor,
  onClose,
  onSaved,
}: {
  row: Row;
  events: Ev[];
  tzFor: (r: { result_event_id: string | null }) => string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [f, setF] = useState({
    ...row,
    event_name_en: row.event_name_en ?? "",
    category: row.category ?? "",
    gender: row.gender ?? "",
    phase: row.phase ?? "",
    discipline: row.discipline ?? "",
    venue_type: row.venue_type ?? "",
    location: row.location ?? "",
  });
  const [local, setLocal] = useState(utcToLocalInput(row.scheduled_at, tzFor(row)));
  const [saving, setSaving] = useState(false);
  const tz = tzFor(f);
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((p) => ({ ...p, [k]: v }));

  const onSave = async () => {
    const parsed = schema.safeParse({ ...f, scheduled_at: local });
    if (!parsed.success) return toast.error(parsed.error.errors[0]?.message ?? "Datos inválidos");
    const d = parsed.data;
    setSaving(true);
    const payload = {
      event_name: d.event_name,
      event_name_en: d.event_name_en || null,
      category: d.category || null,
      gender: d.gender || null,
      phase: d.phase || null,
      discipline: d.discipline || null,
      venue_type: d.venue_type || null,
      location: d.location || null,
      scheduled_at: localToUtcIso(local, tz),
      status: d.status,
      published: d.published,
      featured: d.featured,
      sort_order: d.sort_order,
      country_code: d.country_code,
      result_event_id: f.result_event_id || null,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;
    const { error } = row.id
      ? await db.from("schedule_items").update(payload).eq("id", row.id)
      : await db.from("schedule_items").insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Guardado");
    onSaved();
  };

  const text = (k: "event_name" | "event_name_en" | "category" | "gender" | "phase" | "discipline" | "venue_type" | "location", label: string, ph = "") => (
    <Field label={label}>
      <input value={f[k]} onChange={(e) => set(k, e.target.value)} className="input" placeholder={ph} />
    </Field>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto border border-border bg-surface p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg tracking-widest text-gold">{row.id ? "Editar prueba" : "Nueva prueba"}</h2>
          <button onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="md:col-span-2">
            <Field label="Evento (Gestor de Resultados)">
              <select
                value={f.result_event_id ?? ""}
                onChange={(e) => set("result_event_id", e.target.value || null)}
                className="input"
              >
                <option value="">— Sin evento —</option>
                {events.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          {text("event_name", "Prueba (ES) *", "1000 m sprint")}
          {text("event_name_en", "Prueba (EN)", "1000 m sprint")}
          {text("phase", "Fase", "Clasificación, semifinal, final…")}
          {text("category", "Categoría", "Senior, Junior…")}
          {text("gender", "Género", "Femenino, Masculino, Mixto")}
          {text("discipline", "Disciplina", "Velocidad")}
          {text("venue_type", "Tipo de sede", "Pista / Track, Ruta / Road")}
          {text("location", "Ubicación", "Circuito…")}
          <Field label={`Fecha y hora (hora local · ${tz})`}>
            <input type="datetime-local" value={local} onChange={(e) => setLocal(e.target.value)} className="input" />
          </Field>
          <Field label="Estado">
            <select value={f.status} onChange={(e) => set("status", e.target.value as ScheduleStatus)} className="input">
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {SCHEDULE_STATUS_LABEL[s]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Orden">
            <input
              type="number"
              value={f.sort_order}
              onChange={(e) => set("sort_order", parseInt(e.target.value || "0", 10))}
              className="input"
            />
          </Field>
          <div className="flex items-end gap-4">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={f.published} onChange={(e) => set("published", e.target.checked)} className="h-4 w-4" />
              <span className="font-condensed text-[11px] uppercase tracking-widest">Publicada</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={f.featured} onChange={(e) => set("featured", e.target.checked)} className="h-4 w-4" />
              <span className="font-condensed text-[11px] uppercase tracking-widest">Destacada</span>
            </label>
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="font-condensed border border-border px-4 py-2 text-xs font-bold uppercase tracking-widest">
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
      <span className="font-condensed mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
