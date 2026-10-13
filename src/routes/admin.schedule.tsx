import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Plus, Save, Trash2, X, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { computeHints, HINT_LABEL, type Hint, type HintPage } from "@/lib/specials/finalizationHints";
import { ResultadosHubTabs } from "@/components/admin/ResultadosHubTabs";
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

const STATUSES: ScheduleStatus[] = ["programada", "en_curso", "finalizada", "aplazada", "suspendida", "cancelada"];

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
  status: z.enum(["programada", "en_curso", "finalizada", "aplazada", "cancelada", "suspendida"]),
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
  pending_scheduled_at?: string | null;
  reschedule_note?: string | null;
  original_scheduled_at?: string | null;
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

  const [pages, setPages] = useState<HintPage[]>([]);
  const [counter, setCounter] = useState<CounterId | null>(null);

  const load = async () => {
    setLoading(true);
    // Dos lecturas ligeras en paralelo: calendario + resumen de páginas VeloPro ya guardadas (sin consultar VeloPro).
    const [{ data }, { data: links }, { data: vp }] = await Promise.all([
      db.from("schedule_items").select("*").order("scheduled_at", { ascending: true }),
      db.from("asu26_results_links").select("schedule_item_id,source_competition_id").not("schedule_item_id", "is", null),
      db.from("vensport_pages").select("source_competition_id,title,complete,row_count,is_section").eq("is_section", false),
    ]);
    setRows((data as Row[]) ?? []);
    const byComp = new Map<string, { title: string; complete: boolean; row_count: number | null }[]>();
    for (const p of (vp ?? []) as { source_competition_id: string; title: string; complete: boolean; row_count: number | null }[]) {
      const l = byComp.get(p.source_competition_id) ?? [];
      l.push(p);
      byComp.set(p.source_competition_id, l);
    }
    setPages(
      ((links ?? []) as { schedule_item_id: string; source_competition_id: string }[]).flatMap((l) =>
        (byComp.get(l.source_competition_id) ?? []).map((p) => ({ schedule_item_id: l.schedule_item_id, title: p.title, complete: p.complete, row_count: p.row_count })),
      ),
    );
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

  const hints = useMemo(
    () => computeHints(rows, pages, (it) => tzFor(it as unknown as Row)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rows, pages, evById],
  );

  const visible = rows.filter(
    (r) =>
      (eventFilter === "all" ? true : eventFilter === "none" ? !r.result_event_id : r.result_event_id === eventFilter) &&
      (!counter || matchesCounter(counter, r, hints.get(r.id))),
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
      <ResultadosHubTabs active="calendario" />
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

      <div className="mb-4 grid grid-cols-2 gap-2 md:grid-cols-4">
        {COUNTERS.map((c) => {
          const n = rows.filter((r) => matchesCounter(c.id, r, hints.get(r.id))).length;
          const on = counter === c.id;
          return (
            <button
              key={c.id}
              onClick={() => setCounter(on ? null : c.id)}
              aria-pressed={on}
              className={`border px-3 py-2 text-left transition-colors ${on ? "border-gold bg-gold/10" : "border-border bg-surface hover:border-gold/60"}`}
            >
              <span className="font-display block text-2xl text-foreground">{n}</span>
              <span className="font-condensed text-[10px] uppercase tracking-widest text-muted-foreground">{c.label}</span>
            </button>
          );
        })}
      </div>
      <p className="mb-4 text-[11px] text-muted-foreground">
        Indicadores informativos calculados con las clasificaciones VeloPro ya guardadas. Nunca cambian el estado: la
        finalización se confirma a mano en «Editar → Revisar resultados». Una prueba puede haberse disputado aunque sus
        resultados estén incompletos.
      </p>

      {loading ? (
        <p className="text-muted-foreground">Cargando…</p>
      ) : visible.length === 0 ? (
        <p className="text-muted-foreground">Sin pruebas para este filtro.</p>
      ) : (
        <div className="overflow-x-auto border border-border bg-surface">
          <table className="w-full min-w-[920px] text-sm">
            <thead className="border-b border-border">
              <tr className="font-condensed text-left text-[10px] uppercase tracking-widest text-muted-foreground">
                <th className="px-3 py-2">Día · hora local</th>
                <th className="px-3 py-2">Prueba</th>
                <th className="px-3 py-2">Fase</th>
                <th className="px-3 py-2">Categoría</th>
                <th className="px-3 py-2">Evento</th>
                <th className="px-3 py-2">Estado</th>
                <th className="px-3 py-2">Indicador</th>
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
                      {r.pending_scheduled_at && (
                        <span className="mt-1 block font-mono text-[10px] text-tv-red">
                          Pendiente: {dayInTz(r.pending_scheduled_at, tz).slice(5)} · {timeInTz(r.pending_scheduled_at, tz)}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {hints.get(r.id) && <HintBadge hint={hints.get(r.id)!} />}
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
          hint={hints.get(editing.id)}
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
  hint,
  onClose,
  onSaved,
}: {
  row: Row;
  events: Ev[];
  tzFor: (r: { result_event_id: string | null }) => string;
  hint?: Hint;
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

        {row.id && hint && <ReviewResults row={row} hint={hint} tz={tz} onDone={onSaved} />}

        {row.id && <Reschedule row={row} tz={tz} onDone={onSaved} />}

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

/** Reprogramación en dos pasos: el nuevo horario no es público hasta «Confirmar horario oficial». El id no cambia. */
function Reschedule({ row, tz, onDone }: { row: Row; tz: string; onDone: () => void }) {
  const [when, setWhen] = useState(row.pending_scheduled_at ? utcToLocalInput(row.pending_scheduled_at, tz) : "");
  const [note, setNote] = useState(row.reschedule_note ?? "");
  const [pending, setPending] = useState<string | null>(row.pending_scheduled_at ?? null);
  const [busy, setBusy] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const run = async (payload: Record<string, unknown>, msg: string, close: boolean) => {
    setBusy(true);
    const { error } = await db.from("schedule_items").update(payload).eq("id", row.id);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return false;
    }
    toast.success(msg);
    if (close) onDone();
    return true;
  };
  const savePending = async () => {
    if (!when) return toast.error("Indica la nueva fecha y hora");
    const iso = localToUtcIso(when, tz);
    // La ventana permanece abierta: aparecen al momento «Confirmar» y «Descartar».
    if (await run({ pending_scheduled_at: iso, reschedule_note: note.trim() || null }, "Nuevo horario pendiente de confirmación", false))
      setPending(iso);
  };
  const confirmOfficial = () => {
    if (!pending) return;
    if (!confirm("¿Confirmar y publicar el nuevo horario oficial?")) return;
    run({
      original_scheduled_at: row.original_scheduled_at ?? row.scheduled_at,
      scheduled_at: pending,
      pending_scheduled_at: null,
      rescheduled_at: new Date().toISOString(),
      status: row.status === "aplazada" || row.status === "suspendida" ? "programada" : row.status,
    }, "Horario oficial publicado", true);
  };
  const discard = () => run({ pending_scheduled_at: null, reschedule_note: null }, "Cambio pendiente descartado", true);
  const btn = "font-condensed border px-3 py-2 text-[11px] font-bold uppercase tracking-widest disabled:opacity-50";
  return (
    <div className="mt-5 border border-gold/40 p-4">
      <h3 className="font-condensed text-xs font-bold uppercase tracking-[2px] text-gold">Reprogramar</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        El nuevo horario queda pendiente y la web muestra «Horario en revisión» hasta confirmarlo. Resultados y vínculos VeloPro no cambian.
        {row.original_scheduled_at && <> Horario original: {dayInTz(row.original_scheduled_at, tz).slice(5)} · {timeInTz(row.original_scheduled_at, tz)}.</>}
      </p>
      {pending && (
        <div role="status" className="mt-3 border border-tv-red/60 bg-tv-red/10 px-3 py-2 text-xs text-foreground">
          <strong className="font-condensed uppercase tracking-widest text-tv-red">Horario pendiente de confirmación:</strong>{" "}
          {dayInTz(pending, tz).slice(5)} · {timeInTz(pending, tz)} (hora local de la sede). La web sigue mostrando el horario actual
          con «Horario en revisión» hasta que pulses «Confirmar horario oficial».
        </div>
      )}
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <Field label={`Nuevo horario (hora local · ${tz})`}>
          <input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} className="input" />
        </Field>
        <Field label="Motivo (interno)">
          <input value={note} onChange={(e) => setNote(e.target.value)} className="input" placeholder="Lluvia, decisión del jurado…" />
        </Field>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button disabled={busy} onClick={savePending} className={`${btn} border-gold text-gold`}>
          {pending ? "Actualizar pendiente" : "Guardar como pendiente"}
        </button>
        {pending && (
          <>
            <button disabled={busy} onClick={confirmOfficial} className={`${btn} border-gold bg-gold text-background`}>Confirmar horario oficial</button>
            <button disabled={busy} onClick={discard} className={`${btn} border-border`}>Descartar cambio</button>
          </>
        )}
      </div>
    </div>
  );
}

type CounterId = "finalizadas" | "programadas" | "detenidas" | "revisar";
const COUNTERS: { id: CounterId; label: string }[] = [
  { id: "finalizadas", label: "Finalizadas" },
  { id: "programadas", label: "Programadas" },
  { id: "detenidas", label: "Suspendidas o aplazadas" },
  { id: "revisar", label: "Resultados por revisar" },
];
function matchesCounter(id: CounterId, r: Row, h: Hint | undefined) {
  if (id === "finalizadas") return r.status === "finalizada";
  if (id === "programadas") return r.status === "programada" || r.status === "en_curso";
  if (id === "detenidas") return r.status === "suspendida" || r.status === "aplazada" || r.status === "cancelada";
  return !!h && (h.kind === "sugerida" || h.kind === "incompleta" || h.kind === "revisar");
}

const HINT_CLASS: Record<Hint["kind"], string> = {
  sugerida: "border-gold bg-gold/15 text-gold",
  incompleta: "border-border bg-background text-foreground",
  revisar: "border-tv-red/70 bg-tv-red/10 text-tv-red",
  ok: "border-border text-muted-foreground",
};

function HintBadge({ hint }: { hint: Hint }) {
  return (
    <span title={hint.warnings.join(" · ") || undefined} className="inline-block">
      <span className={`font-condensed inline-block border px-2 py-0.5 text-[10px] uppercase tracking-widest ${HINT_CLASS[hint.kind]}`}>
        {HINT_LABEL[hint.kind]}
      </span>
      {hint.warnings.length > 0 && <span className="mt-1 block max-w-[220px] text-[10px] leading-tight text-muted-foreground">{hint.warnings[0]}</span>}
    </span>
  );
}

/** Revisión manual: muestra las clasificaciones guardadas y permite marcar «Finalizada» tras confirmar. */
function ReviewResults({ row, hint, tz, onDone }: { row: Row; hint: Hint; tz: string; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const incomplete = hint.pages.filter((p) => !p.complete);
  const canFinalize = row.status !== "finalizada" && !["aplazada", "suspendida", "cancelada"].includes(row.status);
  const finalize = async () => {
    const extra = incomplete.length ? `\n\nAtención: ${incomplete.length} clasificación(es) siguen incompletas en VeloPro.` : "";
    if (!confirm(`¿Marcar «${row.event_name}${row.phase ? " · " + row.phase : ""}» como FINALIZADA?\nSolo cambia el estado; horario, resultados e identificadores no se modifican.${extra}`)) return;
    setBusy(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from("schedule_items").update({ status: "finalizada" }).eq("id", row.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Prueba marcada como finalizada");
    onDone();
  };
  return (
    <div className="mt-5 border border-border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-condensed text-xs font-bold uppercase tracking-[2px] text-gold">Finalización</h3>
          <HintBadge hint={{ ...hint, warnings: [] }} />
        </div>
        <button onClick={() => setOpen((v) => !v)} className="font-condensed border border-gold px-3 py-2 text-[11px] font-bold uppercase tracking-widest text-gold">
          {open ? "Ocultar resultados" : "Revisar resultados"}
        </button>
      </div>
      {open && (
        <div className="mt-3 space-y-3 text-xs">
          <p className="text-muted-foreground">
            {row.event_name}{row.phase ? ` · ${row.phase}` : ""} — {dayInTz(row.scheduled_at, tz).slice(5)} · {timeInTz(row.scheduled_at, tz)} ·
            Estado: <span className="text-foreground">{SCHEDULE_STATUS_LABEL[row.status]}</span>
          </p>
          {hint.warnings.length > 0 && (
            <ul className="list-disc space-y-1 pl-5 text-tv-red">
              {hint.warnings.map((w) => <li key={w}>{w}</li>)}
            </ul>
          )}
          {hint.pages.length === 0 ? (
            <p className="text-muted-foreground">No hay clasificaciones VeloPro guardadas para esta prueba.</p>
          ) : (
            <>
              {hint.source === "final" && <p className="text-muted-foreground">Fase previa: se muestran las clasificaciones de la final de esta prueba.</p>}
              <ul className="divide-y divide-border border border-border">
                {hint.pages.map((p) => (
                  <li key={p.title} className="flex items-center justify-between gap-2 px-3 py-2">
                    <span className="capitalize">{p.title}</span>
                    <span className={p.complete ? "text-gold" : "text-tv-red"}>
                      {p.complete ? "Completa" : "Incompleta"} · {p.row_count ?? 0} filas
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
          <div className="flex flex-wrap gap-2">
            <a href="/rollerzone-tv/world-skate-games-asu26/resultados" target="_blank" rel="noreferrer" className="font-condensed border border-border px-3 py-2 text-[11px] font-bold uppercase tracking-widest hover:border-gold">
              Ver clasificaciones
            </a>
            {canFinalize && (
              <button disabled={busy} onClick={finalize} className="font-condensed border border-gold bg-gold px-3 py-2 text-[11px] font-bold uppercase tracking-widest text-background disabled:opacity-50">
                Marcar como finalizada
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
