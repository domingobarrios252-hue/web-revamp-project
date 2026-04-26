import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronsUpDown, CircleDot, Clipboard, Flag, ListPlus, Lock, Plus, RotateCcw, Sparkles, Trash2, Trophy, Zap } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/live-center")({
  head: () => ({ meta: [{ title: "Admin · Resultados en vivo" }, { name: "robots", content: "noindex" }] }),
  component: AdminLiveCenter,
});

type Status = "upcoming" | "live" | "finished";
type EventRow = { id: string; name: string; slug: string; status: Status };
type Race = { id: string; event_id: string; race_name: string; category: string | null; scheduled_time: string; status: Status };
type Result = { id: string; race_id: string; position: number; athlete_name: string; club: string | null; country: string | null; time: string | null; gap: string | null; is_highlighted: boolean };
type Skater = { full_name: string; club?: { name: string } | null; region?: { code: string } | null };
type GridRow = {
  localId: string;
  id?: string;
  position: number;
  athlete_name: string;
  club: string;
  country: string;
  time: string;
  gap: string;
  is_highlighted: boolean;
  dirty?: boolean;
  saving?: boolean;
  error?: boolean;
};

const EMPTY_ROWS = 8;
const COUNTRIES = ["ESP", "POR", "FRA", "ITA", "GER", "NED", "BEL", "COL", "MEX", "ARG", "CHI", "USA"];
const timePattern = /^\d{1,2}:\d{2}(?:[.,]\d{1,3})?$|^\d{1,2}[.,]\d{2,3}$/;

function AdminLiveCenter() {
  const client = supabase as any;
  const [events, setEvents] = useState<EventRow[]>([]);
  const [races, setRaces] = useState<Race[]>([]);
  const [skaters, setSkaters] = useState<Skater[]>([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [selectedRaceId, setSelectedRaceId] = useState("");
  const [rows, setRows] = useState<GridRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState("Listo");
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const selectedRace = races.find((race) => race.id === selectedRaceId) ?? null;
  const raceLocked = selectedRace?.status === "finished";
  const duplicateNames = useMemo(() => findDuplicates(rows), [rows]);

  const loadBase = useCallback(async () => {
    setLoading(true);
    const [{ data: eventData }, { data: raceData }, { data: skaterData }] = await Promise.all([
      client.from("events").select("id, name, slug, status").order("start_date", { ascending: false }).limit(80),
      client.from("races").select("id, event_id, race_name, category, scheduled_time, status").order("scheduled_time", { ascending: true }).limit(250),
      client.from("skaters").select("full_name, club:clubs(name), region:regions(code)").eq("active", true).order("full_name", { ascending: true }).limit(400),
    ]);
    const nextEvents = (eventData as EventRow[]) ?? [];
    const nextRaces = (raceData as Race[]) ?? [];
    setEvents(nextEvents);
    setRaces(nextRaces);
    setSkaters((skaterData as Skater[]) ?? []);
    setSelectedEventId((current) => current || nextEvents.find((event) => event.status === "live")?.id || nextEvents[0]?.id || "");
    setSelectedRaceId((current) => current || nextRaces.find((race) => race.status === "live")?.id || nextRaces[0]?.id || "");
    setLoading(false);
  }, [client]);

  const loadResults = useCallback(async (raceId: string) => {
    if (!raceId) {
      setRows(makeEmptyRows());
      return;
    }
    const { data, error } = await client
      .from("results")
      .select("id, race_id, position, athlete_name, club, country, time, gap, is_highlighted")
      .eq("race_id", raceId)
      .order("position", { ascending: true });
    if (error) {
      toast.error(error.message);
      return;
    }
    const nextRows = ((data as Result[]) ?? []).map(resultToGridRow);
    setRows(padRows(nextRows));
    setLastUpdate(new Date());
  }, [client]);

  useEffect(() => { loadBase(); }, [loadBase]);
  useEffect(() => { loadResults(selectedRaceId); }, [selectedRaceId, loadResults]);

  useEffect(() => {
    const channel = client
      .channel("admin-live-results-grid")
      .on("postgres_changes", { event: "*", schema: "public", table: "results" }, (payload: { new?: { race_id?: string }; old?: { race_id?: string } }) => {
        if (payload.new?.race_id === selectedRaceId || payload.old?.race_id === selectedRaceId) loadResults(selectedRaceId);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "races" }, loadBase)
      .subscribe();
    return () => client.removeChannel(channel);
  }, [client, loadBase, loadResults, selectedRaceId]);

  const scheduleSave = (row: GridRow) => {
    if (!selectedRaceId || raceLocked) return;
    const previous = timers.current.get(row.localId);
    if (previous) clearTimeout(previous);
    timers.current.set(row.localId, setTimeout(() => saveRow(row), 300));
  };

  const saveRow = async (row: GridRow) => {
    if (!selectedRaceId || isBlank(row)) return;
    setFeedback("Guardando…");
    setRows((current) => current.map((item) => item.localId === row.localId ? { ...item, saving: true, error: false } : item));
    const payload = {
      race_id: selectedRaceId,
      position: row.position || nextPosition(rows),
      athlete_name: row.athlete_name.trim(),
      club: row.club.trim() || null,
      country: row.country.trim() || null,
      time: formatTime(row.time),
      gap: row.gap.trim() || null,
      is_highlighted: row.is_highlighted,
    };
    const query = row.id
      ? await client.from("results").update(payload).eq("id", row.id).select("id").single()
      : await client.from("results").insert(payload).select("id").single();

    if (query.error) {
      setFeedback("Error al guardar");
      setRows((current) => current.map((item) => item.localId === row.localId ? { ...item, saving: false, error: true } : item));
      return;
    }

    setFeedback("✔ Guardado");
    setLastUpdate(new Date());
    setRows((current) => current.map((item) => item.localId === row.localId ? { ...item, id: item.id ?? query.data.id, time: payload.time ?? "", saving: false, dirty: false } : item));
  };

  const updateCell = (localId: string, field: keyof GridRow, value: string | number | boolean) => {
    let rowToSave: GridRow | null = null;
    setRows((current) => current.map((row) => {
      if (row.localId !== localId) return row;
      const nextRow = { ...row, [field]: field === "time" && typeof value === "string" ? value.replace(",", ".") : value, dirty: true } as GridRow;
      if (field === "athlete_name") {
        const match = skaters.find((skater) => normalize(skater.full_name) === normalize(String(value)));
        if (match) {
          nextRow.club = match.club?.name ?? nextRow.club;
          nextRow.country = match.region?.code ?? nextRow.country;
        }
      }
      rowToSave = nextRow;
      return nextRow;
    }));
    if (rowToSave) scheduleSave(rowToSave);
  };

  const addRow = () => setRows((current) => [...current, emptyRow(nextPosition(current))]);

  const autoSort = async () => {
    const sorted = rows.filter((row) => !isBlank(row)).sort((a, b) => Number(a.position) - Number(b.position));
    setRows(padRows(sorted));
    await Promise.all(sorted.map((row, index) => saveRow({ ...row, position: index + 1, is_highlighted: index === 0 || row.is_highlighted })));
    setFeedback("Tabla ordenada");
  };

  const clearTable = async () => {
    const ids = rows.map((row) => row.id).filter(Boolean);
    if (ids.length) {
      const { error } = await client.from("results").delete().in("id", ids);
      if (error) return toast.error(error.message);
    }
    setRows(makeEmptyRows());
    setFeedback("Tabla limpia");
  };

  const setRaceStatus = async (status: Status) => {
    if (!selectedRaceId) return;
    if (status === "live") await client.from("races").update({ status: "finished" }).eq("event_id", selectedEventId).eq("status", "live").neq("id", selectedRaceId);
    const { error } = await client.from("races").update({ status }).eq("id", selectedRaceId);
    if (error) return toast.error(error.message);
    setRaces((current) => current.map((race) => race.id === selectedRaceId ? { ...race, status } : race));
    setFeedback(status === "finished" ? "Prueba finalizada" : "Prueba en directo");
  };

  const finishRace = async () => {
    const highlighted = rows.map((row) => ({ ...row, is_highlighted: row.position === 1 || row.is_highlighted }));
    setRows(highlighted);
    await Promise.all(highlighted.filter((row) => !isBlank(row)).map(saveRow));
    await setRaceStatus("finished");
  };

  const createRace = async () => {
    if (!selectedEventId) return toast.error("Selecciona un evento");
    const label = `Nueva prueba ${new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}`;
    const { data, error } = await client.from("races").insert({ event_id: selectedEventId, race_name: label, scheduled_time: new Date().toISOString(), status: "upcoming" }).select("id, event_id, race_name, category, scheduled_time, status").single();
    if (error) return toast.error(error.message);
    setRaces((current) => [...current, data as Race]);
    setSelectedRaceId(data.id);
    setFeedback("Prueba creada");
  };

  const pasteRows = (event: React.ClipboardEvent<HTMLDivElement>) => {
    const text = event.clipboardData.getData("text");
    if (!text.trim()) return;
    event.preventDefault();
    const parsed = text.split(/\r?\n/).map(parsePastedRow).filter(Boolean) as Partial<GridRow>[];
    if (!parsed.length) return;
    const nextRows = parsed.map((row, index) => emptyRow(Number(row.position) || index + 1, row));
    setRows(padRows(nextRows));
    nextRows.forEach(scheduleSave);
    setFeedback(`${nextRows.length} filas pegadas`);
  };

  if (loading) return <p className="text-muted-foreground">Cargando mesa de resultados…</p>;

  const eventRaces = races.filter((race) => race.event_id === selectedEventId);

  return (
    <div className="min-h-screen space-y-4 pb-24">
      <header className="sticky top-0 z-30 -mx-4 border-b border-border bg-background/95 px-4 py-3 backdrop-blur md:mx-0 md:rounded-lg md:border md:bg-surface/95">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="font-condensed inline-flex items-center gap-2 rounded-md bg-tv-red px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-foreground">
              <CircleDot className="h-3 w-3 fill-current" /> Mesa rápida en vivo
            </div>
            <h1 className="font-display mt-2 text-2xl tracking-widest md:text-4xl">Carga de resultados</h1>
          </div>
          <div className="font-condensed sticky top-3 rounded-md border border-border bg-background px-3 py-2 text-xs font-bold uppercase tracking-widest text-gold md:static">
            {feedback} {lastUpdate && <span className="text-muted-foreground">· {lastUpdate.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>}
          </div>
        </div>

        <div className="grid gap-2 lg:grid-cols-[1fr_1fr_auto_auto]">
          <select className="input h-12 text-base" value={selectedEventId} onChange={(event) => { setSelectedEventId(event.target.value); setSelectedRaceId(races.find((race) => race.event_id === event.target.value)?.id ?? ""); }}>
            {events.map((event) => <option key={event.id} value={event.id}>{event.name}</option>)}
          </select>
          <select className="input h-12 text-base" value={selectedRaceId} onChange={(event) => setSelectedRaceId(event.target.value)}>
            {eventRaces.map((race) => <option key={race.id} value={race.id}>{race.race_name} {race.category ? `· ${race.category}` : ""}</option>)}
          </select>
          <div className="grid grid-cols-2 rounded-md border border-border p-1">
            <button onClick={() => setRaceStatus("live")} className={`font-condensed rounded px-4 py-2 text-xs font-bold uppercase tracking-widest ${selectedRace?.status === "live" ? "bg-tv-red text-foreground" : "text-muted-foreground"}`}>Live</button>
            <button onClick={finishRace} className={`font-condensed rounded px-4 py-2 text-xs font-bold uppercase tracking-widest ${selectedRace?.status === "finished" ? "bg-gold text-background" : "text-muted-foreground"}`}>Final</button>
          </div>
          <button onClick={createRace} className="font-condensed inline-flex h-12 items-center justify-center gap-2 rounded-md bg-gold px-4 text-xs font-bold uppercase tracking-widest text-background hover:bg-gold-dark">
            <Plus className="h-4 w-4" /> Nueva prueba
          </button>
        </div>
      </header>

      <section className="grid gap-2 md:grid-cols-5">
        <QuickButton icon={<ListPlus className="h-4 w-4" />} onClick={addRow}>Añadir fila</QuickButton>
        <QuickButton icon={<ChevronsUpDown className="h-4 w-4" />} onClick={autoSort}>Auto ordenar</QuickButton>
        <QuickButton icon={<Trash2 className="h-4 w-4" />} onClick={clearTable}>Limpiar tabla</QuickButton>
        <QuickButton icon={<Trophy className="h-4 w-4" />} onClick={finishRace}>Finalizar prueba</QuickButton>
        <QuickButton icon={<RotateCcw className="h-4 w-4" />} onClick={() => loadResults(selectedRaceId)}>Recargar</QuickButton>
      </section>

      <section className="grid gap-3 md:grid-cols-4">
        <Stat label="Prueba" value={selectedRace?.status === "finished" ? "FINAL" : selectedRace?.status === "live" ? "EN DIRECTO" : "PROGRAMADA"} icon={<Flag className="h-4 w-4" />} />
        <Stat label="Filas activas" value={String(rows.filter((row) => !isBlank(row)).length)} icon={<Zap className="h-4 w-4" />} />
        <Stat label="Duplicados" value={String(duplicateNames.size)} icon={<Sparkles className="h-4 w-4" />} />
        <Stat label="Edición" value={raceLocked ? "Bloqueada" : "Instantánea"} icon={raceLocked ? <Lock className="h-4 w-4" /> : <Check className="h-4 w-4" />} />
      </section>

      <EditableResultsGrid
        rows={rows}
        locked={raceLocked}
        duplicateNames={duplicateNames}
        skaters={skaters}
        onCellChange={updateCell}
        onPasteRows={pasteRows}
        onAddRow={addRow}
      />
    </div>
  );
}

function EditableResultsGrid({ rows, locked, duplicateNames, skaters, onCellChange, onPasteRows, onAddRow }: {
  rows: GridRow[];
  locked: boolean;
  duplicateNames: Set<string>;
  skaters: Skater[];
  onCellChange: (localId: string, field: keyof GridRow, value: string | number | boolean) => void;
  onPasteRows: (event: React.ClipboardEvent<HTMLDivElement>) => void;
  onAddRow: () => void;
}) {
  const refs = useRef<Record<string, HTMLInputElement | HTMLSelectElement | null>>({});
  const columns: (keyof GridRow)[] = ["position", "athlete_name", "club", "country", "time", "gap", "is_highlighted"];

  const focusNext = (rowIndex: number, columnIndex: number) => {
    const nextRowIndex = rowIndex + 1 >= rows.length ? rowIndex : rowIndex + 1;
    const key = `${rows[nextRowIndex]?.localId}-${String(columns[columnIndex])}`;
    refs.current[key]?.focus();
  };

  return (
    <div onPaste={onPasteRows} className="overflow-hidden rounded-lg border border-border bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-3 py-3">
        <div>
          <h2 className="font-display text-xl tracking-widest">Panel de entrada tipo Excel</h2>
          <p className="text-sm text-muted-foreground">Escribe, pulsa Enter y publica en directo. También puedes pegar varias filas desde el portapapeles.</p>
        </div>
        <div className="font-condensed inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
          <Clipboard className="h-4 w-4 text-gold" /> Pegar tabla activado
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] border-separate border-spacing-0 text-sm">
          <thead className="bg-background text-left font-condensed text-[11px] uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="w-20 px-2 py-2">Pos</th>
              <th className="px-2 py-2">Patinador</th>
              <th className="px-2 py-2">Club</th>
              <th className="w-32 px-2 py-2">País</th>
              <th className="w-36 px-2 py-2">Tiempo</th>
              <th className="w-32 px-2 py-2">Diferencia</th>
              <th className="w-24 px-2 py-2 text-center">⭐</th>
              <th className="w-24 px-2 py-2">Estado</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => {
              const isDuplicate = row.athlete_name && duplicateNames.has(normalize(row.athlete_name));
              return (
                <tr key={row.localId} className={`border-t border-border ${isDuplicate ? "bg-tv-red/10" : row.is_highlighted ? "bg-gold/10" : ""}`}>
                  <td className="border-t border-border p-1"><GridInput refValue={(node) => refs.current[`${row.localId}-position`] = node} type="number" value={row.position} locked={locked} inputMode="numeric" onChange={(value) => onCellChange(row.localId, "position", Number(value))} onEnter={() => focusNext(rowIndex, 0)} /></td>
                  <td className="border-t border-border p-1"><GridInput refValue={(node) => refs.current[`${row.localId}-athlete_name`] = node} value={row.athlete_name} locked={locked} list="skaters-list" onChange={(value) => onCellChange(row.localId, "athlete_name", value)} onEnter={() => focusNext(rowIndex, 1)} /></td>
                  <td className="border-t border-border p-1"><GridInput refValue={(node) => refs.current[`${row.localId}-club`] = node} value={row.club} locked={locked} onChange={(value) => onCellChange(row.localId, "club", value)} onEnter={() => focusNext(rowIndex, 2)} /></td>
                  <td className="border-t border-border p-1">
                    <select ref={(node) => refs.current[`${row.localId}-country`] = node} disabled={locked} className="input h-11 text-base" value={row.country} onChange={(event) => onCellChange(row.localId, "country", event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") focusNext(rowIndex, 3); }}>
                      <option value="">—</option>
                      {COUNTRIES.map((country) => <option key={country} value={country}>{country}</option>)}
                    </select>
                  </td>
                  <td className="border-t border-border p-1"><GridInput refValue={(node) => refs.current[`${row.localId}-time`] = node} value={row.time} locked={locked} inputMode="decimal" placeholder="00:42.31" onChange={(value) => onCellChange(row.localId, "time", value)} onEnter={() => focusNext(rowIndex, 4)} /></td>
                  <td className="border-t border-border p-1"><GridInput refValue={(node) => refs.current[`${row.localId}-gap`] = node} value={row.gap} locked={locked} inputMode="decimal" placeholder="+0.49" onChange={(value) => onCellChange(row.localId, "gap", value)} onEnter={() => focusNext(rowIndex, 5)} /></td>
                  <td className="border-t border-border p-1 text-center"><input ref={(node) => refs.current[`${row.localId}-is_highlighted`] = node} type="checkbox" disabled={locked} checked={row.is_highlighted} onChange={(event) => onCellChange(row.localId, "is_highlighted", event.target.checked)} className="h-6 w-6 accent-gold" /></td>
                  <td className="border-t border-border p-2 font-condensed text-[11px] uppercase tracking-widest">{row.saving ? "Guardando" : row.error ? "Error" : isDuplicate ? "Duplicado" : row.id ? "Publicado" : "Nuevo"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <datalist id="skaters-list">{skaters.map((skater) => <option key={skater.full_name} value={skater.full_name} />)}</datalist>
      </div>

      <button onClick={onAddRow} disabled={locked} className="font-condensed flex w-full items-center justify-center gap-2 border-t border-border px-4 py-4 text-xs font-bold uppercase tracking-widest text-gold hover:bg-background disabled:text-muted-foreground">
        <Plus className="h-4 w-4" /> Añadir otra fila rápida
      </button>
    </div>
  );
}

function GridInput({ value, locked, onChange, onEnter, refValue, type = "text", inputMode, placeholder, list }: {
  value: string | number;
  locked: boolean;
  onChange: (value: string) => void;
  onEnter: () => void;
  refValue: (node: HTMLInputElement | null) => void;
  type?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  placeholder?: string;
  list?: string;
}) {
  return (
    <input
      ref={refValue}
      type={type}
      inputMode={inputMode}
      list={list}
      disabled={locked}
      value={value}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
      onKeyDown={(event) => { if (event.key === "Enter") onEnter(); }}
      className="input h-11 min-w-0 text-base focus:bg-background focus:ring-1 focus:ring-gold disabled:opacity-60"
    />
  );
}

function QuickButton({ children, icon, onClick }: { children: React.ReactNode; icon: React.ReactNode; onClick: () => void }) {
  return <button onClick={onClick} className="font-condensed inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-border bg-surface px-3 text-xs font-bold uppercase tracking-widest text-foreground hover:border-gold hover:text-gold">{icon}{children}</button>;
}

function Stat({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return <div className="rounded-lg border border-border bg-surface p-3"><div className="mb-1 flex items-center gap-2 text-gold">{icon}<span className="font-condensed text-[10px] uppercase tracking-widest text-muted-foreground">{label}</span></div><div className="font-display text-2xl tracking-widest">{value}</div></div>;
}

function makeEmptyRows() {
  return Array.from({ length: EMPTY_ROWS }, (_, index) => emptyRow(index + 1));
}

function emptyRow(position: number, partial: Partial<GridRow> = {}): GridRow {
  return { localId: crypto.randomUUID(), position, athlete_name: "", club: "", country: "", time: "", gap: "", is_highlighted: false, ...partial };
}

function resultToGridRow(result: Result): GridRow {
  return { localId: result.id, id: result.id, position: result.position, athlete_name: result.athlete_name, club: result.club ?? "", country: result.country ?? "", time: result.time ?? "", gap: result.gap ?? "", is_highlighted: result.is_highlighted };
}

function padRows(rows: GridRow[]) {
  const next = [...rows].sort((a, b) => Number(a.position) - Number(b.position));
  while (next.length < EMPTY_ROWS) next.push(emptyRow(nextPosition(next)));
  return next;
}

function nextPosition(rows: GridRow[]) {
  return Math.max(0, ...rows.map((row) => Number(row.position) || 0)) + 1;
}

function isBlank(row: GridRow) {
  return !row.athlete_name.trim() && !row.club.trim() && !row.country.trim() && !row.time.trim() && !row.gap.trim();
}

function normalize(value: string) {
  return value.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function findDuplicates(rows: GridRow[]) {
  const counts = new Map<string, number>();
  rows.forEach((row) => {
    const key = normalize(row.athlete_name);
    if (key) counts.set(key, (counts.get(key) ?? 0) + 1);
  });
  return new Set([...counts.entries()].filter(([, count]) => count > 1).map(([key]) => key));
}

function formatTime(value: string) {
  const clean = value.trim().replace(",", ".");
  if (!clean) return null;
  if (/^\d{1,2}\.\d{2,3}$/.test(clean)) return `00:${clean.padStart(5, "0")}`;
  return clean;
}

function parsePastedRow(line: string): Partial<GridRow> | null {
  const trimmed = line.trim();
  if (!trimmed) return null;
  const tabParts = trimmed.split("\t").map((part) => part.trim());
  if (tabParts.length >= 4) {
    return { position: Number(tabParts[0]) || 1, athlete_name: tabParts[1] ?? "", club: tabParts[2] ?? "", country: tabParts[3]?.length <= 3 ? tabParts[3] : "", time: tabParts[3]?.length > 3 ? tabParts[3] : tabParts[4] ?? "", gap: tabParts[5] ?? "" };
  }
  const parts = trimmed.split(/\s+/);
  const position = Number(parts.shift()) || 1;
  const timeIndex = parts.findIndex((part) => timePattern.test(part));
  const beforeTime = timeIndex >= 0 ? parts.slice(0, timeIndex) : parts;
  const afterTime = timeIndex >= 0 ? parts.slice(timeIndex + 1) : [];
  return {
    position,
    athlete_name: beforeTime.slice(0, 2).join(" "),
    club: beforeTime.slice(2).join(" "),
    time: timeIndex >= 0 ? formatTime(parts[timeIndex]) ?? "" : "",
    gap: afterTime[0] ?? "",
  };
}
