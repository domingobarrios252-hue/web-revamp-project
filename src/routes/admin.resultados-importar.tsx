import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import Papa from "papaparse";
import { Upload, Save, Trash2, FileText, Check, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

import { ResultadosHubTabs } from "@/components/admin/ResultadosHubTabs";

export const Route = createFileRoute("/admin/resultados-importar")({
  head: () => ({
    meta: [{ title: "Admin · Importar resultados CSV" }, { name: "robots", content: "noindex" }],
  }),
  component: () => (<><ResultadosHubTabs active="csv" /><AdminResultsImport /></>),
});

// Target fields available in live_results
const TARGET_FIELDS: ReadonlyArray<{ key: string; label: string; required?: boolean; kind: "int" | "text" | "number" }> = [
  { key: "position", label: "Posición *", required: true, kind: "int" },
  { key: "athlete_name", label: "Atleta *", required: true, kind: "text" },
  { key: "club", label: "Club", kind: "text" },
  { key: "country", label: "País", kind: "text" },
  { key: "category", label: "Categoría", kind: "text" },
  { key: "gender", label: "Género", kind: "text" },
  { key: "race", label: "Prueba", kind: "text" },
  { key: "round", label: "Ronda", kind: "text" },
  { key: "race_time", label: "Tiempo", kind: "text" },
  { key: "gap", label: "Diferencia", kind: "text" },
  { key: "points", label: "Puntos", kind: "number" },
  { key: "federation", label: "Federación", kind: "text" },
  { key: "notes", label: "Notas", kind: "text" },
] as const;

type TargetKey = "position" | "athlete_name" | "club" | "country" | "category" | "gender" | "race" | "round" | "race_time" | "gap" | "points" | "federation" | "notes";

type EventOption = { id: string; slug: string; name: string };
type Mapping = Partial<Record<TargetKey, string>>; // target -> csv column header
type Defaults = {
  event_slug: string;
  event_name: string;
  status: "en_vivo" | "finalizado" | "proxima";
  published: boolean;
};
type SavedMapping = {
  id: string;
  name: string;
  mapping: Mapping;
  defaults: Partial<Defaults>;
};

const REQUIRED_KEYS: TargetKey[] = TARGET_FIELDS.filter((f) => f.required).map((f) => f.key as TargetKey);

function autoGuess(headers: string[]): Mapping {
  const lower = headers.map((h) => h.toLowerCase().trim());
  const find = (...needles: string[]) => {
    for (const n of needles) {
      const i = lower.findIndex((h) => h === n || h.includes(n));
      if (i >= 0) return headers[i];
    }
    return undefined;
  };
  return {
    position: find("posicion", "posición", "pos", "rank", "puesto"),
    athlete_name: find("atleta", "patinador", "skater", "nombre", "name"),
    club: find("club", "equipo", "team"),
    country: find("pais", "país", "country", "nacion"),
    category: find("categoria", "categoría", "category", "cat"),
    gender: find("genero", "género", "sexo", "gender"),
    race: find("prueba", "race", "distancia", "distance"),
    round: find("ronda", "round", "fase"),
    race_time: find("tiempo", "time", "marca"),
    gap: find("diferencia", "gap", "dif"),
    points: find("puntos", "points", "pts"),
    federation: find("federacion", "federación", "federation", "fed"),
    notes: find("notas", "notes", "observaciones"),
  };
}

function AdminResultsImport() {
  const [events, setEvents] = useState<EventOption[]>([]);
  const [csvName, setCsvName] = useState<string>("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<Mapping>({});
  const [defaults, setDefaults] = useState<Defaults>({
    event_slug: "",
    event_name: "",
    status: "finalizado",
    published: true,
  });
  const [saved, setSaved] = useState<SavedMapping[]>([]);
  const [selectedSaved, setSelectedSaved] = useState<string>("");
  const [presetName, setPresetName] = useState("");
  const [importing, setImporting] = useState(false);
  const [parsing, setParsing] = useState(false);

  useEffect(() => {
    void supabase
      .from("result_events")
      .select("id, slug, name")
      .order("event_date", { ascending: false })
      .limit(200)
      .then(({ data }) => setEvents((data ?? []) as EventOption[]));
    void loadSavedMappings();
  }, []);

  const loadSavedMappings = async () => {
    const { data, error } = await supabase
      .from("result_csv_mappings")
      .select("id, name, mapping, defaults")
      .order("updated_at", { ascending: false });
    if (error) {
      toast.error("No se pudieron cargar las plantillas: " + error.message);
      return;
    }
    setSaved((data ?? []) as SavedMapping[]);
  };

  const onFile = (file: File) => {
    setParsing(true);
    setCsvName(file.name);
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        const hdrs = res.meta.fields ?? [];
        setHeaders(hdrs);
        setRows(res.data);
        setMapping((m) => (Object.keys(m).length ? m : autoGuess(hdrs)));
        setParsing(false);
        toast.success(`CSV cargado: ${res.data.length} filas, ${hdrs.length} columnas`);
      },
      error: (err) => {
        setParsing(false);
        toast.error("Error al leer el CSV: " + err.message);
      },
    });
  };

  const applySaved = (id: string) => {
    setSelectedSaved(id);
    const preset = saved.find((s) => s.id === id);
    if (!preset) return;
    setMapping(preset.mapping ?? {});
    setDefaults((d) => ({ ...d, ...(preset.defaults ?? {}) }));
    setPresetName(preset.name);
    toast.success(`Plantilla «${preset.name}» aplicada`);
  };

  const savePreset = async () => {
    const name = presetName.trim();
    if (!name) {
      toast.error("Indica un nombre para la plantilla");
      return;
    }
    const payload = { name, mapping, defaults };
    if (selectedSaved) {
      const { error } = await supabase
        .from("result_csv_mappings")
        .update(payload)
        .eq("id", selectedSaved);
      if (error) return toast.error(error.message);
      toast.success("Plantilla actualizada");
    } else {
      const { data, error } = await supabase
        .from("result_csv_mappings")
        .insert(payload)
        .select("id")
        .single();
      if (error) return toast.error(error.message);
      setSelectedSaved((data as { id: string }).id);
      toast.success("Plantilla guardada");
    }
    void loadSavedMappings();
  };

  const deletePreset = async () => {
    if (!selectedSaved) return;
    if (!confirm("¿Eliminar plantilla?")) return;
    const { error } = await supabase.from("result_csv_mappings").delete().eq("id", selectedSaved);
    if (error) return toast.error(error.message);
    setSelectedSaved("");
    setPresetName("");
    toast.success("Plantilla eliminada");
    void loadSavedMappings();
  };

  const missingRequired = REQUIRED_KEYS.filter((k) => !mapping[k]);
  const eventReady = defaults.event_slug.trim().length > 0 && defaults.event_name.trim().length > 0;

  const preview = useMemo(() => {
    return rows.slice(0, 5).map((r) => projectRow(r, mapping, defaults));
  }, [rows, mapping, defaults]);

  const doImport = async () => {
    if (missingRequired.length > 0) return toast.error("Mapea los campos obligatorios");
    if (!eventReady) return toast.error("Selecciona el evento destino");
    setImporting(true);
    const payload = rows.map((r, idx) => ({
      ...projectRow(r, mapping, defaults),
      sort_order: idx,
    }));
    const CHUNK = 500;
    let inserted = 0;
    for (let i = 0; i < payload.length; i += CHUNK) {
      const slice = payload.slice(i, i + CHUNK);
      const { error } = await supabase.from("live_results").insert(slice);
      if (error) {
        setImporting(false);
        return toast.error(`Error en lote ${i / CHUNK + 1}: ${error.message}`);
      }
      inserted += slice.length;
    }
    setImporting(false);
    toast.success(`Importadas ${inserted} filas en «${defaults.event_name}»`);
  };

  const pickEvent = (id: string) => {
    const ev = events.find((e) => e.id === id);
    if (!ev) return;
    setDefaults((d) => ({ ...d, event_slug: ev.slug, event_name: ev.name }));
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <header>
        <h1 className="font-display text-2xl uppercase tracking-widest text-foreground md:text-3xl">
          Importar resultados desde CSV
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sube un CSV, mapea las columnas a los campos de resultados, guarda la configuración si vas a reutilizarla y vuélcala al evento.
        </p>
      </header>

      {/* Paso 1 — archivo */}
      <section className="rounded-xl border border-border bg-surface p-4">
        <h2 className="font-display text-sm uppercase tracking-widest text-gold">1 · Archivo CSV</h2>
        <label className="mt-3 flex cursor-pointer items-center gap-3 rounded-md border border-dashed border-border bg-background px-4 py-6 text-sm hover:border-gold focus-within:ring-2 focus-within:ring-gold">
          <Upload className="h-5 w-5 text-gold" aria-hidden />
          <span className="flex-1">
            {csvName ? (
              <>
                <span className="font-semibold text-foreground">{csvName}</span> · {rows.length} filas, {headers.length} columnas
              </>
            ) : (
              "Selecciona o suelta un archivo .csv"
            )}
          </span>
          {parsing && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          <input
            type="file"
            accept=".csv,text/csv"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onFile(f);
            }}
          />
        </label>
      </section>

      {/* Paso 2 — evento destino + defaults */}
      <section className="rounded-xl border border-border bg-surface p-4">
        <h2 className="font-display text-sm uppercase tracking-widest text-gold">2 · Evento destino</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block text-xs">
            <span className="font-condensed uppercase tracking-widest text-muted-foreground">Evento existente</span>
            <select
              className="mt-1 w-full rounded-md border border-border bg-background px-2 py-2 text-sm focus:border-gold focus:outline-none"
              onChange={(e) => pickEvent(e.target.value)}
              value={events.find((e) => e.slug === defaults.event_slug)?.id ?? ""}
            >
              <option value="">— Elegir evento —</option>
              {events.map((e) => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>
          </label>
          <label className="block text-xs">
            <span className="font-condensed uppercase tracking-widest text-muted-foreground">Slug del evento *</span>
            <input
              type="text"
              value={defaults.event_slug}
              onChange={(e) => setDefaults((d) => ({ ...d, event_slug: e.target.value }))}
              className="mt-1 w-full rounded-md border border-border bg-background px-2 py-2 text-sm focus:border-gold focus:outline-none"
            />
          </label>
          <label className="block text-xs">
            <span className="font-condensed uppercase tracking-widest text-muted-foreground">Nombre del evento *</span>
            <input
              type="text"
              value={defaults.event_name}
              onChange={(e) => setDefaults((d) => ({ ...d, event_name: e.target.value }))}
              className="mt-1 w-full rounded-md border border-border bg-background px-2 py-2 text-sm focus:border-gold focus:outline-none"
            />
          </label>
          <label className="block text-xs">
            <span className="font-condensed uppercase tracking-widest text-muted-foreground">Estado</span>
            <select
              value={defaults.status}
              onChange={(e) => setDefaults((d) => ({ ...d, status: e.target.value as Defaults["status"] }))}
              className="mt-1 w-full rounded-md border border-border bg-background px-2 py-2 text-sm focus:border-gold focus:outline-none"
            >
              <option value="finalizado">Finalizado</option>
              <option value="en_vivo">En vivo</option>
              <option value="proxima">Próxima</option>
            </select>
          </label>
        </div>
        <label className="mt-3 inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={defaults.published}
            onChange={(e) => setDefaults((d) => ({ ...d, published: e.target.checked }))}
            className="h-4 w-4 accent-gold"
          />
          Publicar inmediatamente
        </label>
      </section>

      {/* Paso 3 — mapping */}
      {headers.length > 0 && (
        <section className="rounded-xl border border-border bg-surface p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-sm uppercase tracking-widest text-gold">3 · Mapeo de columnas</h2>
            <button
              type="button"
              onClick={() => setMapping(autoGuess(headers))}
              className="font-condensed rounded-md border border-border px-3 py-1 text-[11px] font-bold uppercase tracking-widest hover:border-gold hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            >
              Auto-detectar
            </button>
          </div>
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            {TARGET_FIELDS.map((f) => (
              <label key={f.key} className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm">
                <span className={`w-40 shrink-0 text-xs ${f.required && !mapping[f.key as TargetKey] ? "text-destructive" : "text-muted-foreground"}`}>
                  {f.label}
                </span>
                <select
                  value={mapping[f.key as TargetKey] ?? ""}
                  onChange={(e) =>
                    setMapping((m) => ({ ...m, [f.key]: e.target.value || undefined }))
                  }
                  aria-label={`Columna CSV para ${f.label}`}
                  className="flex-1 rounded border border-border bg-surface px-2 py-1 text-xs focus:border-gold focus:outline-none"
                >
                  <option value="">— sin mapear —</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </label>
            ))}
          </div>
          {missingRequired.length > 0 && (
            <p className="mt-3 inline-flex items-center gap-2 text-xs text-destructive">
              <AlertTriangle className="h-3 w-3" /> Falta mapear: {missingRequired.join(", ")}
            </p>
          )}
        </section>
      )}

      {/* Paso 4 — plantillas */}
      <section className="rounded-xl border border-border bg-surface p-4">
        <h2 className="font-display text-sm uppercase tracking-widest text-gold">4 · Plantillas guardadas</h2>
        <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_auto_auto_auto]">
          <select
            value={selectedSaved}
            onChange={(e) => (e.target.value ? applySaved(e.target.value) : setSelectedSaved(""))}
            aria-label="Plantilla guardada"
            className="rounded-md border border-border bg-background px-2 py-2 text-sm focus:border-gold focus:outline-none"
          >
            <option value="">— Cargar plantilla —</option>
            {saved.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <input
            type="text"
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
            placeholder="Nombre de plantilla"
            aria-label="Nombre de la plantilla"
            className="rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-gold focus:outline-none"
          />
          <button
            type="button"
            onClick={savePreset}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-gold px-3 py-2 text-xs font-bold uppercase tracking-widest text-background hover:bg-gold-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <Save className="h-3.5 w-3.5" /> {selectedSaved ? "Actualizar" : "Guardar"}
          </button>
          <button
            type="button"
            onClick={deletePreset}
            disabled={!selectedSaved}
            className="inline-flex items-center justify-center gap-2 rounded-md border border-border px-3 py-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:border-destructive hover:text-destructive disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" /> Borrar
          </button>
        </div>
      </section>

      {/* Paso 5 — preview + import */}
      {preview.length > 0 && (
        <section className="rounded-xl border border-border bg-surface p-4">
          <h2 className="font-display text-sm uppercase tracking-widest text-gold">5 · Vista previa (5 primeras)</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[640px] text-xs">
              <thead className="border-b border-border bg-background/50">
                <tr className="text-left text-[10px] uppercase tracking-widest text-muted-foreground">
                  <th className="px-2 py-1">#</th>
                  <th className="px-2 py-1">Atleta</th>
                  <th className="px-2 py-1">Club</th>
                  <th className="px-2 py-1">País</th>
                  <th className="px-2 py-1">Categoría</th>
                  <th className="px-2 py-1">Género</th>
                  <th className="px-2 py-1">Tiempo</th>
                  <th className="px-2 py-1">Puntos</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((r, i) => (
                  <tr key={i} className="border-b border-border/50">
                    <td className="px-2 py-1 font-mono">{r.position ?? "—"}</td>
                    <td className="px-2 py-1 font-semibold">{r.athlete_name ?? "—"}</td>
                    <td className="px-2 py-1">{r.club ?? "—"}</td>
                    <td className="px-2 py-1">{r.country ?? "—"}</td>
                    <td className="px-2 py-1">{r.category ?? "—"}</td>
                    <td className="px-2 py-1">{r.gender ?? "—"}</td>
                    <td className="px-2 py-1 font-mono">{r.race_time ?? "—"}</td>
                    <td className="px-2 py-1 font-mono">{r.points ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            type="button"
            onClick={doImport}
            disabled={importing || missingRequired.length > 0 || !eventReady}
            className="mt-4 inline-flex items-center gap-2 rounded-md bg-gold px-4 py-2 text-xs font-bold uppercase tracking-widest text-background hover:bg-gold-dark disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            {importing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            Importar {rows.length} filas
          </button>
          <span className="ml-3 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
            <FileText className="h-3 w-3" /> Se insertan en «live_results» con el evento seleccionado.
          </span>
        </section>
      )}
    </div>
  );
}

function projectRow(raw: Record<string, string>, mapping: Mapping, defaults: Defaults) {
  const get = (k: TargetKey): string | undefined => {
    const col = mapping[k];
    if (!col) return undefined;
    const v = raw[col];
    return typeof v === "string" ? v.trim() : v;
  };
  const intOrNull = (v: string | undefined) => {
    if (v == null || v === "") return null;
    const n = parseInt(v, 10);
    return Number.isFinite(n) ? n : null;
  };
  const numOrNull = (v: string | undefined) => {
    if (v == null || v === "") return null;
    const n = parseFloat(v.replace(",", "."));
    return Number.isFinite(n) ? n : null;
  };
  return {
    event_name: defaults.event_name,
    event_slug: defaults.event_slug,
    status: defaults.status,
    published: defaults.published,
    position: intOrNull(get("position")) ?? 0,
    athlete_name: get("athlete_name") ?? "",
    club: get("club") ?? null,
    country: get("country") ?? null,
    category: get("category") ?? null,
    gender: get("gender") ?? null,
    race: get("race") ?? null,
    round: get("round") ?? null,
    race_time: get("race_time") ?? null,
    gap: get("gap") ?? null,
    points: numOrNull(get("points")),
    federation: get("federation") ?? null,
    notes: get("notes") ?? null,
  };
}
