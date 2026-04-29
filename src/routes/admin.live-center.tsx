import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { CalendarClock, FileSpreadsheet, Plus, Radio, Save, Trash2, Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";

export const Route = createFileRoute("/admin/live-center")({
  head: () => ({ meta: [{ title: "Admin · Live Center" }, { name: "robots", content: "noindex" }] }),
  component: AdminLiveCenter,
});

type StreamRow = { id: string; title: string; embed_url: string | null; is_active: boolean; autoplay: boolean };
type ScheduleRow = { id: string; event_name: string; category: string | null; location: string | null; scheduled_at: string; status: "programada" | "en_curso" | "finalizada"; published: boolean; sort_order: number };
type ResultRow = { id: string; event_name: string; event_slug: string | null; race: string | null; category: string | null; position: number; athlete_name: string; club: string | null; race_time: string | null; points: number | null; status: "en_vivo" | "finalizado" | "proxima"; published: boolean; sort_order: number };

const streamSchema = z.object({ title: z.string().trim().min(2).max(150), embed_url: z.string().trim().max(2000).optional().or(z.literal("")), is_active: z.boolean(), autoplay: z.boolean() });
const scheduleSchema = z.object({ event_name: z.string().trim().min(2).max(150), category: z.string().trim().max(80).optional().or(z.literal("")), location: z.string().trim().max(150).optional().or(z.literal("")), scheduled_at: z.string().min(1), status: z.enum(["programada", "en_curso", "finalizada"]), published: z.boolean(), sort_order: z.number().int().min(0) });
const resultSchema = z.object({ event_name: z.string().trim().min(2).max(150), event_slug: z.string().trim().min(1).max(150), race: z.string().trim().max(80).optional().or(z.literal("")), category: z.string().trim().max(80).optional().or(z.literal("")), position: z.number().int().min(1).max(999), athlete_name: z.string().trim().min(1).max(150), club: z.string().trim().max(150).optional().or(z.literal("")), race_time: z.string().trim().max(40).optional().or(z.literal("")), status: z.enum(["en_vivo", "finalizado", "proxima"]), published: z.boolean(), sort_order: z.number().int().min(0) });

function AdminLiveCenter() {
  const [stream, setStream] = useState<StreamRow | null>(null);
  const [schedule, setSchedule] = useState<ScheduleRow[]>([]);
  const [results, setResults] = useState<ResultRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("RollerZone Live Center");
  const [streamUrl, setStreamUrl] = useState("");
  const [active, setActive] = useState(true);
  const [autoplay, setAutoplay] = useState(false);

  const [eventName, setEventName] = useState("");
  const [eventSlug, setEventSlug] = useState("");
  const [race, setRace] = useState("");
  const [category, setCategory] = useState("");
  const [csv, setCsv] = useState("");
  const [replaceExisting, setReplaceExisting] = useState(true);
  const [scheduleName, setScheduleName] = useState("");
  const [scheduleCategory, setScheduleCategory] = useState("");
  const [scheduleAt, setScheduleAt] = useState(toLocalInput(new Date().toISOString()));

  const load = async () => {
    setLoading(true);
    const [streamRes, scheduleRes, resultsRes] = await Promise.all([
      supabase.from("live_stream").select("*").order("updated_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("schedule_items").select("*").order("scheduled_at", { ascending: true }).limit(20),
      supabase.from("live_results").select("*").order("updated_at", { ascending: false }).limit(120),
    ]);
    const s = streamRes.data as StreamRow | null;
    setStream(s);
    setTitle(s?.title ?? "RollerZone Live Center");
    setStreamUrl(s?.embed_url ?? "");
    setActive(s?.is_active ?? true);
    setAutoplay(s?.autoplay ?? false);
    setSchedule((scheduleRes.data as ScheduleRow[]) ?? []);
    setResults((resultsRes.data as ResultRow[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const events = useMemo(() => Array.from(new Set(results.map((r) => r.event_name))).sort(), [results]);

  const saveStream = async () => {
    const parsed = streamSchema.safeParse({ title, embed_url: streamUrl, is_active: active, autoplay });
    if (!parsed.success) return toast.error(parsed.error.errors[0]?.message ?? "Datos inválidos");
    setSaving(true);
    const payload = { title: parsed.data.title, embed_url: parsed.data.embed_url || null, is_active: parsed.data.is_active, autoplay: parsed.data.autoplay };
    const { error } = stream ? await supabase.from("live_stream").update(payload).eq("id", stream.id) : await supabase.from("live_stream").insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Directo guardado");
    load();
  };

  const addSchedule = async () => {
    const parsed = scheduleSchema.safeParse({ event_name: scheduleName || race || eventName, category: scheduleCategory || category, location: "", scheduled_at: scheduleAt, status: "programada", published: true, sort_order: schedule.length });
    if (!parsed.success) return toast.error(parsed.error.errors[0]?.message ?? "Datos inválidos");
    const { error } = await supabase.from("schedule_items").insert({ ...parsed.data, category: parsed.data.category || null, location: null });
    if (error) return toast.error(error.message);
    toast.success("Prueba añadida");
    setScheduleName("");
    setScheduleCategory("");
    load();
  };

  const importCsv = async () => {
    const cleanEvent = eventName.trim();
    const cleanSlug = eventSlug.trim() || slugify(cleanEvent);
    if (!cleanEvent || !cleanSlug) return toast.error("Indica evento y slug");
    const rows = parseCsv(csv);
    if (rows.length === 0) return toast.error("Pega un CSV con posición, patinador, club y tiempo");
    const payload = rows.map((row, index) => {
      const parsed = resultSchema.parse({ event_name: cleanEvent, event_slug: cleanSlug, race, category, position: row.position, athlete_name: row.athlete_name, club: row.club, race_time: row.race_time, status: "en_vivo", published: true, sort_order: index });
      return { ...parsed, race: parsed.race || null, category: parsed.category || null, club: parsed.club || null, race_time: parsed.race_time || null, points: null };
    });
    if (replaceExisting) {
      let query = supabase.from("live_results").delete().eq("event_slug", cleanSlug);
      query = race.trim() ? query.eq("race", race.trim()) : query.is("race", null);
      query = category.trim() ? query.eq("category", category.trim()) : query.is("category", null);
      const { error: deleteError } = await query;
      if (deleteError) return toast.error(deleteError.message);
    }
    const { error } = await supabase.from("live_results").insert(payload);
    if (error) return toast.error(error.message);
    toast.success(`${payload.length} clasificaciones importadas`);
    setCsv("");
    load();
  };

  const deleteResult = async (id: string) => {
    const { error } = await supabase.from("live_results").delete().eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  if (loading) return <p className="text-muted-foreground">Cargando…</p>;

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl uppercase tracking-widest">Live Center</h1>
          <p className="text-sm text-muted-foreground">Controla el directo, próximas pruebas y clasificaciones rápidas.</p>
        </div>
      </header>

      <section className="grid gap-5 lg:grid-cols-[1fr_0.8fr]">
        <Panel title="Retransmisión" icon={<Radio className="h-4 w-4" />}>
          <div className="grid gap-3">
            <Field label="Título del directo"><input value={title} onChange={(e) => setTitle(e.target.value)} className="input" /></Field>
            <Field label="URL YouTube, Twitch, embed o enlace externo"><textarea value={streamUrl} onChange={(e) => setStreamUrl(e.target.value)} className="input min-h-24" placeholder="Pega aquí el enlace o el iframe embed" /></Field>
            <div className="flex flex-wrap gap-4">
              <Check label="Mostrar sección en directo" checked={active} onChange={setActive} />
              <Check label="Autoplay si es posible" checked={autoplay} onChange={setAutoplay} />
            </div>
            <button onClick={saveStream} disabled={saving} className="font-condensed inline-flex w-fit items-center gap-2 bg-gold px-5 py-2 text-xs font-bold uppercase tracking-widest text-background hover:bg-gold-dark disabled:opacity-50"><Save className="h-4 w-4" /> Guardar directo</button>
          </div>
        </Panel>

        <Panel title="Próximas pruebas" icon={<CalendarClock className="h-4 w-4" />}>
          <div className="mb-3 grid gap-2">
            <Field label="Nombre prueba"><input value={scheduleName} onChange={(e) => setScheduleName(e.target.value)} className="input" placeholder="500m Sprint" /></Field>
            <div className="grid gap-2 sm:grid-cols-2">
              <Field label="Categoría"><input value={scheduleCategory} onChange={(e) => setScheduleCategory(e.target.value)} className="input" placeholder="Senior masculino" /></Field>
              <Field label="Hora"><input type="datetime-local" value={scheduleAt} onChange={(e) => setScheduleAt(e.target.value)} className="input" /></Field>
            </div>
            <button onClick={addSchedule} className="font-condensed inline-flex w-fit items-center gap-2 border border-border px-3 py-2 text-xs font-bold uppercase tracking-widest text-gold hover:bg-background"><Plus className="h-4 w-4" /> Añadir prueba</button>
          </div>
          <div className="space-y-2">
            {schedule.slice(0, 6).map((item) => <div key={item.id} className="border border-border bg-background p-3 text-sm"><div className="font-semibold">{item.event_name}</div><div className="text-xs text-muted-foreground">{item.category || "—"} · {new Date(item.scheduled_at).toLocaleString("es-ES")}</div></div>)}
          </div>
        </Panel>
      </section>

      <Panel title="Importar clasificación desde CSV" icon={<FileSpreadsheet className="h-4 w-4" />}>
        <div className="grid gap-3 lg:grid-cols-4">
          <Field label="Evento"><input value={eventName} onChange={(e) => { setEventName(e.target.value); if (!eventSlug) setEventSlug(slugify(e.target.value)); }} list="live-events" className="input" placeholder="Campeonato..." /></Field>
          <datalist id="live-events">{events.map((event) => <option key={event} value={event} />)}</datalist>
          <Field label="Slug resultados"><input value={eventSlug} onChange={(e) => setEventSlug(slugify(e.target.value))} className="input" placeholder="campeonato-2026" /></Field>
          <Field label="Prueba"><input value={race} onChange={(e) => setRace(e.target.value)} className="input" placeholder="500m" /></Field>
          <Field label="Categoría"><input value={category} onChange={(e) => setCategory(e.target.value)} className="input" placeholder="Senior femenino" /></Field>
        </div>
        <Field label="CSV: posición, patinador, club, tiempo">
          <textarea value={csv} onChange={(e) => setCsv(e.target.value)} className="input mt-2 min-h-40 font-mono text-xs" placeholder={'posición,patinador,club,tiempo\n1,Ana Pérez,Club Madrid,00:42.120\n2,Laura Gómez,CPV Barcelona,00:42.510'} />
        </Field>
        <button onClick={importCsv} className="font-condensed mt-3 inline-flex items-center gap-2 bg-gold px-5 py-2 text-xs font-bold uppercase tracking-widest text-background hover:bg-gold-dark"><Trophy className="h-4 w-4" /> Importar clasificación</button>
      </Panel>

      <Panel title="Últimas clasificaciones" icon={<Trophy className="h-4 w-4" />}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="border-b border-border text-left font-condensed text-[10px] uppercase tracking-widest text-muted-foreground"><tr><th className="px-2 py-2">#</th><th>Patinador</th><th>Club</th><th>Tiempo</th><th>Prueba</th><th>Evento</th><th></th></tr></thead>
            <tbody>{results.slice(0, 30).map((row) => <tr key={row.id} className="border-b border-border/70 last:border-0"><td className="px-2 py-2 font-mono text-gold">{row.position}</td><td>{row.athlete_name}</td><td className="text-muted-foreground">{row.club || "—"}</td><td className="font-mono">{row.race_time || "—"}</td><td className="text-muted-foreground">{row.race || "—"}</td><td className="text-muted-foreground">{row.event_name}</td><td className="text-right"><button onClick={() => deleteResult(row.id)} className="text-tv-red hover:opacity-80"><Trash2 className="h-4 w-4" /></button></td></tr>)}</tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

function Panel({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) { return <section className="border border-border bg-surface p-4"><h2 className="font-display mb-4 flex items-center gap-2 text-lg uppercase tracking-widest text-gold">{icon} {title}</h2>{children}</section>; }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block"><span className="font-condensed mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">{label}</span>{children}</label>; }
function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) { return <label className="font-condensed flex items-center gap-2 text-[11px] uppercase tracking-widest"><input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />{label}</label>; }
function slugify(value: string) { return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 150); }
function parseCsv(text: string) { return text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).filter((line, i) => !(i === 0 && /pos|patinador|athlete/i.test(line))).map((line) => line.split(",").map((cell) => cell.trim())).map(([position, athlete_name, club, race_time]) => ({ position: Number(position), athlete_name, club: club || "", race_time: race_time || "" })).filter((row) => Number.isInteger(row.position) && row.position > 0 && row.athlete_name); }