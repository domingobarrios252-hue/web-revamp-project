import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, X, ArrowUp, ArrowDown, Sparkles, Eraser } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";

// Slug reservado para datos de ejemplo. Cualquier resultado con este event_slug
// se considera "demo" y puede ser limpiado/resembrado sin tocar datos reales.
const DEMO_SLUG = "demo-ejemplo";
const DEMO_EVENT_NAME = "[DEMO] Campeonato Ejemplo 2026";
const DEMO_SCHEDULE_PREFIX = "[DEMO]";

export const Route = createFileRoute("/admin/live-results")({
  head: () => ({
    meta: [{ title: "Admin · Resultados en vivo" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminLiveResults,
});

const schema = z.object({
  event_name: z.string().trim().min(2).max(150),
  event_slug: z.string().trim().max(150).optional().or(z.literal("")),
  race: z.string().trim().max(80).optional().or(z.literal("")),
  category: z.string().trim().max(80).optional().or(z.literal("")),
  position: z.number().int().min(1).max(999),
  athlete_name: z.string().trim().min(1).max(150),
  club: z.string().trim().max(150).optional().or(z.literal("")),
  race_time: z.string().trim().max(40).optional().or(z.literal("")),
  points: z.number().nullable(),
  status: z.enum(["en_vivo", "finalizado", "proxima"]),
  published: z.boolean(),
  sort_order: z.number().int().min(0),
});

type Status = "en_vivo" | "finalizado" | "proxima";

type Row = {
  id: string;
  event_name: string;
  event_slug: string | null;
  race: string | null;
  category: string | null;
  position: number;
  athlete_name: string;
  club: string | null;
  race_time: string | null;
  points: number | null;
  status: Status;
  published: boolean;
  sort_order: number;
};

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 150);

function statusLabel(s: Status) {
  return s === "en_vivo" ? "Live" : s === "proxima" ? "Próxima" : "Final";
}
function statusClass(s: Status) {
  return s === "en_vivo"
    ? "bg-tv-red text-white"
    : s === "proxima"
      ? "bg-gold/20 text-gold"
      : "bg-emerald-500/20 text-emerald-400";
}

function AdminLiveResults() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Row | null>(null);
  const [open, setOpen] = useState(false);

  const [filterEvent, setFilterEvent] = useState("");
  const [filterRace, setFilterRace] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | Status>("all");

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("live_results")
      .select("*")
      .order("event_name", { ascending: true })
      .order("race", { ascending: true })
      .order("sort_order", { ascending: true })
      .order("position", { ascending: true });
    setRows((data as Row[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const events = useMemo(
    () => Array.from(new Set(rows.map((r) => r.event_name))).sort(),
    [rows],
  );
  const races = useMemo(
    () => Array.from(new Set(rows.map((r) => r.race).filter(Boolean) as string[])).sort(),
    [rows],
  );
  const categories = useMemo(
    () => Array.from(new Set(rows.map((r) => r.category).filter(Boolean) as string[])).sort(),
    [rows],
  );

  const filtered = rows.filter(
    (r) =>
      (!filterEvent || r.event_name === filterEvent) &&
      (!filterRace || r.race === filterRace) &&
      (!filterCategory || r.category === filterCategory) &&
      (filterStatus === "all" || r.status === filterStatus),
  );

  const onNew = () => {
    setEditing({
      id: "",
      event_name: filterEvent || "",
      event_slug: filterEvent ? slugify(filterEvent) : "",
      race: filterRace || "",
      category: filterCategory || "",
      position: (filtered[filtered.length - 1]?.position ?? 0) + 1,
      athlete_name: "",
      club: "",
      race_time: "",
      points: null,
      status: "en_vivo",
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
    if (!confirm("¿Eliminar este resultado?")) return;
    const { error } = await supabase.from("live_results").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Eliminado");
    load();
  };

  const onMove = async (r: Row, dir: -1 | 1) => {
    const newOrder = r.sort_order + dir;
    const { error } = await supabase
      .from("live_results")
      .update({ sort_order: newOrder })
      .eq("id", r.id);
    if (error) return toast.error(error.message);
    load();
  };

  // Cambio de estado en bloque para el evento+carrera+categoría filtrados
  const onBulkStatus = async (newStatus: Status) => {
    if (filtered.length === 0) return;
    if (
      !confirm(
        `¿Aplicar estado "${statusLabel(newStatus)}" a ${filtered.length} resultados filtrados?`,
      )
    )
      return;
    const ids = filtered.map((r) => r.id);
    const { error } = await supabase
      .from("live_results")
      .update({ status: newStatus })
      .in("id", ids);
    if (error) return toast.error(error.message);
    toast.success(`Actualizados ${ids.length} resultados`);
    load();
  };

  // ===== Modo "Datos de ejemplo" =====
  const demoCount = useMemo(
    () => rows.filter((r) => r.event_slug === DEMO_SLUG).length,
    [rows],
  );
  const [seeding, setSeeding] = useState(false);

  const onClearDemo = async () => {
    if (!confirm("¿Eliminar TODOS los datos de ejemplo? Tus datos reales no se verán afectados."))
      return;
    setSeeding(true);
    const { error: e1 } = await supabase
      .from("live_results")
      .delete()
      .eq("event_slug", DEMO_SLUG);
    const { error: e2 } = await supabase
      .from("schedule_items")
      .delete()
      .like("event_name", `${DEMO_SCHEDULE_PREFIX}%`);
    setSeeding(false);
    if (e1 || e2) return toast.error((e1 ?? e2)?.message ?? "Error");
    toast.success("Datos de ejemplo eliminados");
    load();
  };

  const onSeedDemo = async () => {
    setSeeding(true);
    await supabase.from("live_results").delete().eq("event_slug", DEMO_SLUG);
    await supabase
      .from("schedule_items")
      .delete()
      .like("event_name", `${DEMO_SCHEDULE_PREFIX}%`);

    const live500m: Array<[number, string, string, string, number]> = [
      [1, "Carlos Martínez", "CPV Barcelona", "00:41.235", 100],
      [2, "Diego Hernández", "Patín Madrid", "00:41.487", 85],
      [3, "Javier Ruiz", "Velocidad Valencia", "00:41.892", 70],
      [4, "Pablo Sánchez", "CPV Sevilla", "00:42.015", 60],
      [5, "Adrián Gómez", "Roller Bilbao", "00:42.348", 50],
      [6, "Marc Vidal", "CPV Barcelona", "00:42.701", 40],
    ];
    const live1000m: Array<[number, string, string, string, number]> = [
      [1, "Lucía Fernández", "Patín Madrid", "01:28.452", 100],
      [2, "María López", "CPV Barcelona", "01:28.987", 85],
      [3, "Andrea Torres", "Velocidad Valencia", "01:29.341", 70],
      [4, "Sara Jiménez", "CPV Sevilla", "01:29.876", 60],
      [5, "Elena Castro", "Roller Bilbao", "01:30.215", 50],
    ];
    const final500mJr: Array<[number, string, string, string, number]> = [
      [1, "Iván Moreno", "CPV Barcelona", "00:42.123", 100],
      [2, "Hugo Navarro", "Patín Madrid", "00:42.567", 85],
      [3, "Mario Díaz", "Velocidad Valencia", "00:42.890", 70],
      [4, "Álex Romero", "CPV Sevilla", "00:43.215", 60],
      [5, "Nicolás Ortiz", "Roller Bilbao", "00:43.654", 50],
      [6, "Bruno Castro", "CPV Barcelona", "00:44.012", 40],
    ];

    const make = (
      race: string,
      cat: string,
      st: Status,
      arr: Array<[number, string, string, string, number]>,
    ) =>
      arr.map(([pos, name, club, time, pts], i) => ({
        event_name: DEMO_EVENT_NAME,
        event_slug: DEMO_SLUG,
        race,
        category: cat,
        status: st,
        position: pos,
        athlete_name: name,
        club,
        race_time: time,
        points: pts,
        sort_order: i,
        published: true,
      }));

    const payload = [
      ...make("500m", "Senior Masculino", "en_vivo", live500m),
      ...make("1000m", "Senior Femenino", "en_vivo", live1000m),
      {
        event_name: DEMO_EVENT_NAME,
        event_slug: DEMO_SLUG,
        race: "Eliminación",
        category: "Junior Masculino",
        status: "proxima" as Status,
        position: 1,
        athlete_name: "—",
        club: "—",
        race_time: "—",
        points: null,
        sort_order: 0,
        published: true,
      },
      ...make("500m", "Junior Masculino", "finalizado", final500mJr),
    ];

    const { error: errLive } = await supabase.from("live_results").insert(payload);

    const now = new Date();
    const inHours = (h: number) => new Date(now.getTime() + h * 3600_000).toISOString();
    const schedulePayload = [
      {
        event_name: `${DEMO_SCHEDULE_PREFIX} Campeonato Ejemplo — 1500m Senior`,
        category: "Senior Mixto",
        scheduled_at: inHours(2),
        location: "Pista de Reus, Tarragona",
        status: "programada" as const,
        sort_order: 1,
        published: true,
      },
      {
        event_name: `${DEMO_SCHEDULE_PREFIX} Copa Ejemplo — Maratón`,
        category: "Open",
        scheduled_at: inHours(24),
        location: "Circuito de Barcelona",
        status: "programada" as const,
        sort_order: 2,
        published: true,
      },
      {
        event_name: `${DEMO_SCHEDULE_PREFIX} Trofeo Ejemplo — Eliminación`,
        category: "Junior",
        scheduled_at: inHours(72),
        location: "Polideportivo Vallehermoso, Madrid",
        status: "programada" as const,
        sort_order: 3,
        published: true,
      },
    ];
    const { error: errSched } = await supabase
      .from("schedule_items")
      .insert(schedulePayload);

    setSeeding(false);
    if (errLive || errSched)
      return toast.error((errLive ?? errSched)?.message ?? "Error sembrando datos");
    toast.success("Datos de ejemplo cargados");
    load();
  };

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="font-display text-2xl tracking-widest">Resultados en vivo</h1>
        <button
          onClick={onNew}
          className="font-condensed inline-flex items-center gap-2 bg-gold px-4 py-2 text-xs font-bold uppercase tracking-widest text-background hover:bg-gold-dark"
        >
          <Plus className="h-4 w-4" /> Nuevo resultado
        </button>
      </div>

      {/* Modo Datos de ejemplo */}
      <div className="mb-3 flex flex-wrap items-center gap-3 border border-gold/30 bg-gold/5 p-3">
        <Sparkles className="h-4 w-4 shrink-0 text-gold" />
        <div className="min-w-0 flex-1">
          <div className="font-condensed text-xs font-bold uppercase tracking-widest text-gold">
            Datos de ejemplo
          </div>
          <p className="text-xs text-muted-foreground">
            {demoCount > 0
              ? `Hay ${demoCount} resultados de ejemplo cargados (evento "${DEMO_EVENT_NAME}"). Tus datos reales no se ven afectados.`
              : "Carga datos de demostración para ver cómo queda la sección. Solo se sembrará el evento de ejemplo, sin tocar tus datos reales."}
          </p>
        </div>
        <button
          onClick={onSeedDemo}
          disabled={seeding}
          className="font-condensed inline-flex items-center gap-1.5 border border-gold/50 bg-gold/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest text-gold hover:bg-gold/20 disabled:opacity-50"
        >
          <Sparkles className="h-3.5 w-3.5" />
          {demoCount > 0 ? "Resembrar" : "Cargar ejemplos"}
        </button>
        {demoCount > 0 && (
          <button
            onClick={onClearDemo}
            disabled={seeding}
            className="font-condensed inline-flex items-center gap-1.5 border border-tv-red/50 bg-tv-red/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest text-tv-red hover:bg-tv-red hover:text-white disabled:opacity-50"
          >
            <Eraser className="h-3.5 w-3.5" />
            Limpiar ejemplos
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="mb-3 grid gap-2 border border-border bg-surface p-3 sm:grid-cols-2 lg:grid-cols-4">
        <select
          value={filterEvent}
          onChange={(e) => setFilterEvent(e.target.value)}
          className="input"
        >
          <option value="">Todos los eventos</option>
          {events.map((e) => (
            <option key={e} value={e}>
              {e}
            </option>
          ))}
        </select>
        <select
          value={filterRace}
          onChange={(e) => setFilterRace(e.target.value)}
          className="input"
        >
          <option value="">Todas las carreras</option>
          {races.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="input"
        >
          <option value="">Todas las categorías</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
          className="input"
        >
          <option value="all">Todos los estados</option>
          <option value="proxima">Próxima</option>
          <option value="en_vivo">Live</option>
          <option value="finalizado">Final</option>
        </select>
      </div>

      {/* Acciones rápidas (bulk) */}
      {(filterEvent || filterRace || filterCategory || filterStatus !== "all") &&
        filtered.length > 0 && (
          <div className="mb-4 flex flex-wrap items-center gap-2 border border-border bg-background/30 p-2.5">
            <span className="font-condensed text-[10px] uppercase tracking-widest text-muted-foreground">
              Cambiar estado de los {filtered.length} resultados filtrados:
            </span>
            <button
              onClick={() => onBulkStatus("proxima")}
              className="font-condensed inline-flex items-center gap-1 border border-gold/50 bg-gold/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-gold hover:bg-gold/20"
            >
              ⏳ Próxima
            </button>
            <button
              onClick={() => onBulkStatus("en_vivo")}
              className="font-condensed inline-flex items-center gap-1 border border-tv-red/50 bg-tv-red/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-tv-red hover:bg-tv-red hover:text-white"
            >
              🔴 Live
            </button>
            <button
              onClick={() => onBulkStatus("finalizado")}
              className="font-condensed inline-flex items-center gap-1 border border-emerald-500/50 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-emerald-400 hover:bg-emerald-500/20"
            >
              ✓ Final
            </button>
          </div>
        )}

      {loading ? (
        <p className="text-muted-foreground">Cargando…</p>
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground">Sin resultados con esos filtros.</p>
      ) : (
        <div className="overflow-x-auto border border-border bg-surface">
          <table className="w-full text-sm">
            <thead className="border-b border-border">
              <tr className="font-condensed text-left text-[10px] uppercase tracking-widest text-muted-foreground">
                <th className="px-3 py-2">#</th>
                <th className="px-3 py-2">Atleta</th>
                <th className="px-3 py-2">Club</th>
                <th className="px-3 py-2">Tiempo</th>
                <th className="px-3 py-2">Pts</th>
                <th className="px-3 py-2">Carrera</th>
                <th className="px-3 py-2">Cat.</th>
                <th className="px-3 py-2">Evento</th>
                <th className="px-3 py-2">Estado</th>
                <th className="px-3 py-2">Pub.</th>
                <th className="px-3 py-2">Orden</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-border last:border-0 hover:bg-background/50"
                >
                  <td className="px-3 py-2 font-mono text-xs">{r.position}</td>
                  <td className="px-3 py-2 font-medium">{r.athlete_name}</td>
                  <td className="px-3 py-2 text-muted-foreground">{r.club ?? "—"}</td>
                  <td className="px-3 py-2 font-mono text-gold">{r.race_time ?? "—"}</td>
                  <td className="px-3 py-2 font-mono text-xs">
                    {r.points !== null && r.points !== undefined ? r.points : "—"}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{r.race ?? "—"}</td>
                  <td className="px-3 py-2 text-muted-foreground">{r.category ?? "—"}</td>
                  <td className="px-3 py-2 text-muted-foreground">{r.event_name}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`font-condensed inline-block px-2 py-0.5 text-[10px] uppercase tracking-widest ${statusClass(r.status)}`}
                    >
                      {statusLabel(r.status)}
                    </span>
                  </td>
                  <td className="px-3 py-2">{r.published ? "✓" : "—"}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onMove(r, -1)}
                        className="text-muted-foreground hover:text-gold"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-6 text-center text-xs">{r.sort_order}</span>
                      <button
                        onClick={() => onMove(r, 1)}
                        className="text-muted-foreground hover:text-gold"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
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
        <EditDialog
          row={editing}
          onClose={() => setOpen(false)}
          onSaved={() => {
            setOpen(false);
            load();
          }}
        />
      )}
    </div>
  );
}

function EditDialog({
  row,
  onClose,
  onSaved,
}: {
  row: Row;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [eventName, setEventName] = useState(row.event_name);
  const [eventSlug, setEventSlug] = useState(row.event_slug ?? "");
  const [race, setRace] = useState(row.race ?? "");
  const [category, setCategory] = useState(row.category ?? "");
  const [position, setPosition] = useState(row.position);
  const [athleteName, setAthleteName] = useState(row.athlete_name);
  const [club, setClub] = useState(row.club ?? "");
  const [raceTime, setRaceTime] = useState(row.race_time ?? "");
  const [points, setPoints] = useState<string>(
    row.points !== null && row.points !== undefined ? String(row.points) : "",
  );
  const [status, setStatus] = useState<Status>(row.status);
  const [published, setPublished] = useState(row.published);
  const [sortOrder, setSortOrder] = useState(row.sort_order);
  const [saving, setSaving] = useState(false);

  // Auto-generar slug desde el nombre del evento si está vacío
  useEffect(() => {
    if (!eventSlug && eventName) setEventSlug(slugify(eventName));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventName]);

  const onSave = async () => {
    const pointsNumber = points.trim() === "" ? null : Number(points);
    if (pointsNumber !== null && Number.isNaN(pointsNumber)) {
      return toast.error("Puntos debe ser un número");
    }
    const parsed = schema.safeParse({
      event_name: eventName,
      event_slug: eventSlug,
      race,
      category,
      position,
      athlete_name: athleteName,
      club,
      race_time: raceTime,
      points: pointsNumber,
      status,
      published,
      sort_order: sortOrder,
    });
    if (!parsed.success)
      return toast.error(parsed.error.errors[0]?.message ?? "Datos inválidos");

    setSaving(true);
    const payload = {
      event_name: parsed.data.event_name,
      event_slug: parsed.data.event_slug || slugify(parsed.data.event_name),
      race: parsed.data.race || null,
      category: parsed.data.category || null,
      position: parsed.data.position,
      athlete_name: parsed.data.athlete_name,
      club: parsed.data.club || null,
      race_time: parsed.data.race_time || null,
      points: parsed.data.points,
      status: parsed.data.status,
      published: parsed.data.published,
      sort_order: parsed.data.sort_order,
    };
    const { error } = row.id
      ? await supabase.from("live_results").update(payload).eq("id", row.id)
      : await supabase.from("live_results").insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Guardado");
    onSaved();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto border border-border bg-surface p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg tracking-widest text-gold">
            {row.id ? "Editar resultado" : "Nuevo resultado"}
          </h2>
          <button onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Evento *">
              <input
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                className="input"
                placeholder="Ej: Campeonato España 2026"
              />
            </Field>
            <Field label="Slug del evento">
              <input
                value={eventSlug}
                onChange={(e) => setEventSlug(slugify(e.target.value))}
                className="input"
                placeholder="campeonato-espana-2026"
              />
            </Field>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Carrera">
              <input
                value={race}
                onChange={(e) => setRace(e.target.value)}
                className="input"
                placeholder="Ej: 500m / 1000m / Eliminación"
              />
            </Field>
            <Field label="Categoría">
              <input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="input"
                placeholder="Ej: Junior / Senior"
              />
            </Field>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Posición *">
              <input
                type="number"
                min={1}
                value={position}
                onChange={(e) => setPosition(parseInt(e.target.value || "1", 10))}
                className="input"
              />
            </Field>
            <Field label="Atleta *">
              <input
                value={athleteName}
                onChange={(e) => setAthleteName(e.target.value)}
                className="input"
              />
            </Field>
            <Field label="Tiempo">
              <input
                value={raceTime}
                onChange={(e) => setRaceTime(e.target.value)}
                className="input"
                placeholder="00:42.158"
              />
            </Field>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Club">
              <input
                value={club}
                onChange={(e) => setClub(e.target.value)}
                className="input"
              />
            </Field>
            <Field label="Puntos (opcional)">
              <input
                type="number"
                step="any"
                value={points}
                onChange={(e) => setPoints(e.target.value)}
                className="input"
                placeholder="Ej: 100"
              />
            </Field>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Estado">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Status)}
                className="input"
              >
                <option value="proxima">⏳ Próxima</option>
                <option value="en_vivo">🔴 Live</option>
                <option value="finalizado">✓ Final</option>
              </select>
            </Field>
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
              <span className="font-condensed mb-2 text-[11px] uppercase tracking-widest">
                Publicado
              </span>
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
            {saving ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="font-condensed mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}
