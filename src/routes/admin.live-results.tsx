import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Plus, Save, Trash2, X, ArrowUp, ArrowDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";

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
  status: z.enum(["en_vivo", "finalizado"]),
  published: z.boolean(),
  sort_order: z.number().int().min(0),
});

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
  status: "en_vivo" | "finalizado";
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

function AdminLiveResults() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Row | null>(null);
  const [open, setOpen] = useState(false);

  const [filterEvent, setFilterEvent] = useState("");
  const [filterRace, setFilterRace] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "en_vivo" | "finalizado">("all");

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

      {/* Filtros */}
      <div className="mb-4 grid gap-2 border border-border bg-surface p-3 sm:grid-cols-2 lg:grid-cols-4">
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
          <option value="en_vivo">Live</option>
          <option value="finalizado">Finished</option>
        </select>
      </div>

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
                  <td className="px-3 py-2 text-muted-foreground">{r.race ?? "—"}</td>
                  <td className="px-3 py-2 text-muted-foreground">{r.category ?? "—"}</td>
                  <td className="px-3 py-2 text-muted-foreground">{r.event_name}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`font-condensed inline-block px-2 py-0.5 text-[10px] uppercase tracking-widest ${
                        r.status === "en_vivo"
                          ? "bg-tv-red text-white"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {r.status === "en_vivo" ? "Live" : "Finished"}
                    </span>
                  </td>
                  <td className="px-3 py-2">{r.published ? "✓" : "—"}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1">
                      <button onClick={() => onMove(r, -1)} className="text-muted-foreground hover:text-gold">
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-6 text-center text-xs">{r.sort_order}</span>
                      <button onClick={() => onMove(r, 1)} className="text-muted-foreground hover:text-gold">
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
  const [status, setStatus] = useState<Row["status"]>(row.status);
  const [published, setPublished] = useState(row.published);
  const [sortOrder, setSortOrder] = useState(row.sort_order);
  const [saving, setSaving] = useState(false);

  // Auto-generar slug desde el nombre del evento si está vacío
  useEffect(() => {
    if (!eventSlug && eventName) setEventSlug(slugify(eventName));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventName]);

  const onSave = async () => {
    const parsed = schema.safeParse({
      event_name: eventName,
      event_slug: eventSlug,
      race,
      category,
      position,
      athlete_name: athleteName,
      club,
      race_time: raceTime,
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
                placeholder="Ej: 500m"
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

          <Field label="Club">
            <input value={club} onChange={(e) => setClub(e.target.value)} className="input" />
          </Field>

          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Estado">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Row["status"])}
                className="input"
              >
                <option value="en_vivo">Live</option>
                <option value="finalizado">Finished</option>
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
