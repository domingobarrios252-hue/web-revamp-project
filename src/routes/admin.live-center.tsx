import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/live-center")({
  head: () => ({ meta: [{ title: "Admin · Live Center" }, { name: "robots", content: "noindex" }] }),
  component: AdminLiveCenter,
});

type Status = "upcoming" | "live" | "finished";
type Stream = { id: string; title: string; embed_url: string | null; is_active: boolean; autoplay: boolean };
type EventRow = { id: string; name: string; slug: string; status: Status };
type Race = { id: string; event_id: string; race_name: string; category: string | null; scheduled_time: string; status: Status };
type Result = { id: string; race_id: string; position: number; athlete_name: string; club: string | null; country: string | null; time: string | null; gap: string | null; is_highlighted: boolean };

const streamSchema = z.object({ title: z.string().trim().min(2), embed_url: z.string().trim().optional().or(z.literal("")), is_active: z.boolean(), autoplay: z.boolean() });
const raceSchema = z.object({ event_id: z.string().uuid(), race_name: z.string().trim().min(2), category: z.string().trim().optional().or(z.literal("")), scheduled_time: z.string().min(1), status: z.enum(["upcoming", "live", "finished"]) });
const resultSchema = z.object({ race_id: z.string().uuid(), position: z.number().int().min(1), athlete_name: z.string().trim().min(1), club: z.string().trim().optional().or(z.literal("")), country: z.string().trim().optional().or(z.literal("")), time: z.string().trim().optional().or(z.literal("")), gap: z.string().trim().optional().or(z.literal("")), is_highlighted: z.boolean() });

function AdminLiveCenter() {
  const client = supabase as any;
  const [streams, setStreams] = useState<Stream[]>([]);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [races, setRaces] = useState<Race[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("RollerZone LIVE CENTER");
  const [embedUrl, setEmbedUrl] = useState("");
  const [isActive, setIsActive] = useState(false);
  const [autoplay, setAutoplay] = useState(false);
  const activeStream = streams[0] ?? null;

  const liveEvent = events.find((e) => e.status === "live") ?? events[0];
  const currentRace = races.find((r) => r.status === "live") ?? races[0];
  const raceResults = useMemo(() => results.filter((r) => r.race_id === currentRace?.id).sort((a, b) => a.position - b.position), [results, currentRace]);

  const load = async () => {
    setLoading(true);
    const [{ data: streamData }, { data: eventData }, { data: raceData }, { data: resultData }] = await Promise.all([
      client.from("live_stream").select("*").order("updated_at", { ascending: false }),
      client.from("events").select("id, name, slug, status").order("start_date", { ascending: false }).limit(50),
      client.from("races").select("*").order("scheduled_time", { ascending: true }).limit(100),
      client.from("results").select("*").order("position", { ascending: true }).limit(250),
    ]);
    const nextStreams = (streamData as Stream[]) ?? [];
    setStreams(nextStreams);
    setEvents((eventData as EventRow[]) ?? []);
    setRaces((raceData as Race[]) ?? []);
    setResults((resultData as Result[]) ?? []);
    if (nextStreams[0]) {
      setTitle(nextStreams[0].title);
      setEmbedUrl(nextStreams[0].embed_url ?? "");
      setIsActive(nextStreams[0].is_active);
      setAutoplay(nextStreams[0].autoplay);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const saveStream = async () => {
    const parsed = streamSchema.safeParse({ title, embed_url: embedUrl, is_active: isActive, autoplay });
    if (!parsed.success) return toast.error("Revisa los datos del streaming");
    setSaving(true);
    if (parsed.data.is_active) await client.from("live_stream").update({ is_active: false }).neq("id", activeStream?.id ?? "00000000-0000-0000-0000-000000000000");
    const payload = { ...parsed.data, embed_url: parsed.data.embed_url || null };
    const { error } = activeStream ? await client.from("live_stream").update(payload).eq("id", activeStream.id) : await client.from("live_stream").insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Live stream guardado");
    load();
  };

  const setEventStatus = async (eventId: string, status: Status) => {
    if (status === "live") await client.from("events").update({ status: "upcoming" }).eq("status", "live").neq("id", eventId);
    const { error } = await client.from("events").update({ status }).eq("id", eventId);
    if (error) return toast.error(error.message);
    toast.success("Estado del evento actualizado");
    load();
  };

  if (loading) return <p className="text-muted-foreground">Cargando…</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl tracking-widest">LIVE CENTER</h1>
        <p className="text-sm text-muted-foreground">Control rápido del streaming, evento activo, carreras y resultados.</p>
      </div>

      <section className="rounded-lg border border-border bg-surface p-5">
        <h2 className="font-display mb-4 text-lg tracking-widest text-gold">Streaming activo</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <label><span className="admin-label">Título</span><input className="input" value={title} onChange={(e) => setTitle(e.target.value)} /></label>
          <label><span className="admin-label">URL YouTube, iframe o streaming externo</span><input className="input" value={embedUrl} onChange={(e) => setEmbedUrl(e.target.value)} /></label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} /> Activo</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={autoplay} onChange={(e) => setAutoplay(e.target.checked)} /> Autoplay</label>
        </div>
        <button onClick={saveStream} disabled={saving} className="font-condensed mt-4 inline-flex items-center gap-2 rounded-md bg-gold px-4 py-2 text-xs font-bold uppercase tracking-widest text-background hover:bg-gold-dark disabled:opacity-50"><Save className="h-4 w-4" /> Guardar emisión</button>
      </section>

      <section className="rounded-lg border border-border bg-surface p-5">
        <h2 className="font-display mb-4 text-lg tracking-widest text-gold">Evento activo</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm"><tbody className="divide-y divide-border">
            {events.map((event) => (
              <tr key={event.id}>
                <td className="px-3 py-2 font-semibold">{event.name}</td>
                <td className="px-3 py-2 text-muted-foreground">{event.status}</td>
                <td className="px-3 py-2 text-right">
                  <select className="input max-w-36" value={event.status} onChange={(e) => setEventStatus(event.id, e.target.value as Status)}>
                    <option value="upcoming">upcoming</option><option value="live">live</option><option value="finished">finished</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody></table>
        </div>
      </section>

      <RaceManager events={events} races={races} onSaved={load} />
      <ResultManager races={races} currentRace={currentRace} results={raceResults} onSaved={load} />
    </div>
  );
}

function RaceManager({ events, races, onSaved }: { events: EventRow[]; races: Race[]; onSaved: () => void }) {
  const client = supabase as any;
  const [eventId, setEventId] = useState(events.find((e) => e.status === "live")?.id ?? events[0]?.id ?? "");
  const [raceName, setRaceName] = useState("");
  const [category, setCategory] = useState("");
  const [scheduled, setScheduled] = useState(toLocalInput(new Date().toISOString()));
  const [status, setStatus] = useState<Status>("upcoming");

  const save = async () => {
    const parsed = raceSchema.safeParse({ event_id: eventId, race_name: raceName, category, scheduled_time: scheduled, status });
    if (!parsed.success) return toast.error("Revisa la carrera");
    if (status === "live") await client.from("races").update({ status: "finished" }).eq("event_id", eventId).eq("status", "live");
    const { error } = await client.from("races").insert({ ...parsed.data, category: parsed.data.category || null, scheduled_time: new Date(parsed.data.scheduled_time).toISOString() });
    if (error) return toast.error(error.message);
    setRaceName("");
    toast.success("Carrera creada");
    onSaved();
  };

  return (
    <section className="rounded-lg border border-border bg-surface p-5">
      <h2 className="font-display mb-4 text-lg tracking-widest text-gold">Carreras</h2>
      <div className="grid gap-3 md:grid-cols-5">
        <select className="input" value={eventId} onChange={(e) => setEventId(e.target.value)}>{events.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}</select>
        <input className="input" value={raceName} onChange={(e) => setRaceName(e.target.value)} placeholder="Carrera" />
        <input className="input" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Categoría" />
        <input className="input" type="datetime-local" value={scheduled} onChange={(e) => setScheduled(e.target.value)} />
        <select className="input" value={status} onChange={(e) => setStatus(e.target.value as Status)}><option value="upcoming">upcoming</option><option value="live">live</option><option value="finished">finished</option></select>
      </div>
      <button onClick={save} className="font-condensed mt-3 inline-flex items-center gap-2 rounded-md bg-gold px-4 py-2 text-xs font-bold uppercase tracking-widest text-background"><Plus className="h-4 w-4" /> Añadir carrera</button>
      <ul className="mt-4 divide-y divide-border">{races.slice(0, 12).map((r) => <li key={r.id} className="flex justify-between gap-3 py-2 text-sm"><span>{r.race_name} · {r.category ?? "—"}</span><span className="font-condensed uppercase tracking-widest text-muted-foreground">{r.status}</span></li>)}</ul>
    </section>
  );
}

function ResultManager({ races, currentRace, results, onSaved }: { races: Race[]; currentRace?: Race | null; results: Result[]; onSaved: () => void }) {
  const client = supabase as any;
  const [raceId, setRaceId] = useState(currentRace?.id ?? races[0]?.id ?? "");
  const [position, setPosition] = useState(1);
  const [athlete, setAthlete] = useState("");
  const [club, setClub] = useState("");
  const [country, setCountry] = useState("");
  const [time, setTime] = useState("");
  const [gap, setGap] = useState("");
  const [highlight, setHighlight] = useState(false);

  const save = async () => {
    const parsed = resultSchema.safeParse({ race_id: raceId, position, athlete_name: athlete, club, country, time, gap, is_highlighted: highlight });
    if (!parsed.success) return toast.error("Revisa el resultado");
    const { error } = await client.from("results").insert({ ...parsed.data, club: club || null, country: country || null, time: time || null, gap: gap || null });
    if (error) return toast.error(error.message);
    setPosition(position + 1); setAthlete(""); setClub(""); setCountry(""); setTime(""); setGap(""); setHighlight(false);
    toast.success("Resultado añadido");
    onSaved();
  };

  const remove = async (id: string) => {
    const { error } = await client.from("results").delete().eq("id", id);
    if (error) return toast.error(error.message);
    onSaved();
  };

  return (
    <section className="rounded-lg border border-border bg-surface p-5">
      <h2 className="font-display mb-4 text-lg tracking-widest text-gold">Resultados rápidos</h2>
      <div className="grid gap-3 md:grid-cols-4">
        <select className="input" value={raceId} onChange={(e) => setRaceId(e.target.value)}>{races.map((r) => <option key={r.id} value={r.id}>{r.race_name}</option>)}</select>
        <input className="input" type="number" value={position} onChange={(e) => setPosition(Number(e.target.value))} placeholder="Pos" />
        <input className="input" value={athlete} onChange={(e) => setAthlete(e.target.value)} placeholder="Atleta" />
        <input className="input" value={club} onChange={(e) => setClub(e.target.value)} placeholder="Club" />
        <input className="input" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="País" />
        <input className="input" value={time} onChange={(e) => setTime(e.target.value)} placeholder="Tiempo" />
        <input className="input" value={gap} onChange={(e) => setGap(e.target.value)} placeholder="Gap" />
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={highlight} onChange={(e) => setHighlight(e.target.checked)} /> Destacar</label>
      </div>
      <button onClick={save} className="font-condensed mt-3 inline-flex items-center gap-2 rounded-md bg-gold px-4 py-2 text-xs font-bold uppercase tracking-widest text-background"><Plus className="h-4 w-4" /> Añadir resultado</button>
      <div className="mt-4 overflow-x-auto"><table className="w-full text-sm"><tbody className="divide-y divide-border">{results.map((r) => <tr key={r.id}><td className="px-2 py-2 font-display text-gold">{r.position}</td><td className="px-2 py-2">{r.athlete_name}</td><td className="px-2 py-2 text-muted-foreground">{r.club ?? r.country ?? "—"}</td><td className="px-2 py-2 font-mono text-xs">{r.time ?? "—"}</td><td className="px-2 py-2 text-right"><button onClick={() => remove(r.id)} className="text-tv-red"><Trash2 className="h-4 w-4" /></button></td></tr>)}</tbody></table></div>
    </section>
  );
}

function toLocalInput(iso: string) {
  const d = new Date(iso);
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}