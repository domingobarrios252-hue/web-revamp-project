import { Link } from "@tanstack/react-router";
import { CalendarClock, ExternalLink, Flag, RefreshCw, Trophy } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type Status = "upcoming" | "live" | "finished";

type LiveEvent = {
  id: string;
  name: string;
  slug: string;
  status: Status;
};

type Race = {
  id: string;
  event_id: string;
  race_name: string;
  category: string | null;
  scheduled_time: string;
  status: Status;
};

type Result = {
  id: string;
  race_id: string;
  position: number;
  athlete_name: string;
  club: string | null;
  country: string | null;
  time: string | null;
  gap: string | null;
  is_highlighted: boolean;
  updated_at: string;
};

const REFRESH_MS = 15_000;

export function LiveCenter() {
  const [event, setEvent] = useState<LiveEvent | null>(null);
  const [currentRace, setCurrentRace] = useState<Race | null>(null);
  const [results, setResults] = useState<Result[]>([]);
  const [upcoming, setUpcoming] = useState<Race[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setRefreshing(true);
      const client = supabase as any;
      const { data: eventData } = await client
        .from("events")
        .select("id, name, slug, status")
        .eq("status", "live")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const activeEvent = (eventData as LiveEvent | null) ?? null;
      let raceData: Race | null = null;
      let resultData: Result[] = [];
      let upcomingData: Race[] = [];

      if (activeEvent) {
        const [{ data: liveRace }, { data: nextRaces }] = await Promise.all([
          client
            .from("races")
            .select("id, event_id, race_name, category, scheduled_time, status")
            .eq("event_id", activeEvent.id)
            .eq("status", "live")
            .order("scheduled_time", { ascending: true })
            .limit(1)
            .maybeSingle(),
          client
            .from("races")
            .select("id, event_id, race_name, category, scheduled_time, status")
            .eq("event_id", activeEvent.id)
            .eq("status", "upcoming")
            .order("scheduled_time", { ascending: true })
            .limit(6),
        ]);
        raceData = (liveRace as Race | null) ?? null;
        upcomingData = (nextRaces as Race[]) ?? [];

        if (raceData) {
          const { data } = await client
            .from("results")
            .select("id, race_id, position, athlete_name, club, country, time, gap, is_highlighted, updated_at")
            .eq("race_id", raceData.id)
            .order("position", { ascending: true })
            .limit(80);
          resultData = (data as Result[]) ?? [];
        }
      }

      if (!cancelled) {
        setEvent(activeEvent);
        setCurrentRace(raceData);
        setResults(resultData);
        setUpcoming(upcomingData);
        setLoaded(true);
        setLastUpdated(new Date());
        setRefreshing(false);
      }
    };

    load();
    const interval = setInterval(load, REFRESH_MS);
    const channel = (supabase as any)
      .channel("live-center-home")
      .on("postgres_changes", { event: "*", schema: "public", table: "events" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "races" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "results" }, load)
      .subscribe();

    return () => {
      cancelled = true;
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);

  if (!loaded) return null;

  return (
    <section className="border-y border-tv-red/50 bg-background">
      <div className="mx-auto max-w-7xl px-5 py-8 md:px-6 md:py-10">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3 border-b border-border pb-3">
          <div>
            <div className="live-red-tag font-condensed mb-2 inline-flex items-center gap-2 rounded-md bg-tv-red px-3 py-1 text-[11px] font-bold uppercase tracking-[3px] text-foreground">
              <span className="live-dot h-1.5 w-1.5 rounded-full bg-foreground" /> Resultados en vivo
            </div>
            <h2 className="font-display text-3xl uppercase tracking-widest md:text-5xl">
              Centro de <span className="text-gold">competición</span>
            </h2>
            <p className="font-condensed mt-1 text-xs uppercase tracking-widest text-muted-foreground">
              {event?.name ?? "Clasificaciones, prueba actual y próximas salidas"}
            </p>
          </div>
          <div className="font-condensed flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground">
            <RefreshCw className={`h-3.5 w-3.5 text-gold ${refreshing ? "animate-spin" : ""}`} />
            {lastUpdated ? `Actualizado ${lastUpdated.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}` : "Actualizando"}
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[minmax(360px,2fr)_minmax(0,3fr)]">
          <LiveRaceCard race={currentRace} event={event} />
          <div className="grid gap-4">
            <LiveResultsPanel race={currentRace} results={results} />
            <UpcomingRacesList races={upcoming} />
            {event && (
              <Link
                to="/eventos/$slug"
                params={{ slug: event.slug }}
                className="font-condensed inline-flex items-center justify-center gap-2 rounded-md border border-gold/60 px-4 py-2 text-xs font-bold uppercase tracking-widest text-gold transition-colors hover:bg-gold hover:text-background"
              >
                Ver resultados completos <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function LiveRaceCard({ race, event }: { race: Race | null; event: LiveEvent | null }) {
  const countdown = useCountdown(race?.status === "upcoming" ? race.scheduled_time : null);

  return (
    <article className="rounded-lg border border-border bg-surface p-5 shadow-lg">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="font-display text-xl uppercase tracking-widest">Prueba actual</h3>
        <StatusBadge status={race?.status ?? event?.status ?? "upcoming"} />
      </div>
      <p className="font-display text-4xl uppercase leading-none tracking-wider text-gold md:text-5xl">
        {race?.race_name ?? "Sin prueba activa"}
      </p>
      <div className="font-condensed mt-4 grid gap-2 text-xs uppercase tracking-widest text-muted-foreground">
        <span className="inline-flex items-center gap-2"><Flag className="h-4 w-4 text-gold" />{race?.category ?? "Categoría por confirmar"}</span>
        <span>{event?.name ?? "Evento pendiente"}</span>
        {countdown && <span className="text-gold">Inicio en {countdown}</span>}
      </div>
    </article>
  );
}

function LiveResultsPanel({ race, results }: { race: Race | null; results: Result[] }) {
  const latestId = results.reduce<string | null>((acc, row) => {
    if (!acc) return row.id;
    const current = results.find((r) => r.id === acc);
    return current && new Date(current.updated_at) > new Date(row.updated_at) ? acc : row.id;
  }, null);

  return (
    <article className="overflow-hidden rounded-lg border border-border bg-surface shadow-lg">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h3 className="font-display text-lg uppercase tracking-widest">Resultados en vivo</h3>
        <div className="font-condensed inline-flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground">
          {race?.status === "live" ? <span className="live-dot h-2 w-2 rounded-full bg-tv-red" /> : null}
          {race?.status === "finished" ? "FINAL" : "EN VIVO"}
        </div>
      </div>
      {results.length === 0 ? (
        <div className="p-5 text-sm text-muted-foreground">Sin resultados cargados para la prueba actual.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="font-condensed bg-background/60 text-[10px] uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="px-3 py-2">Pos</th>
                <th className="px-3 py-2">Patinador</th>
                <th className="px-3 py-2">Club / País</th>
                <th className="px-3 py-2">Tiempo</th>
                <th className="px-3 py-2">Dif.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {results.map((row) => (
                <tr key={row.id} className={`${row.id === latestId || row.is_highlighted ? "bg-gold/10" : ""}`}>
                  <td className={`font-display px-3 py-2 text-base ${row.position <= 3 ? "text-gold" : "text-foreground"}`}>
                    {medal(row.position)} {row.position}
                  </td>
                  <td className="px-3 py-2 font-semibold leading-tight">{row.athlete_name}</td>
                  <td className="font-condensed px-3 py-2 text-xs uppercase tracking-wide text-muted-foreground">
                    {row.club ?? "—"} {row.country ? `· ${row.country}` : ""}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">{row.time ?? "—"}</td>
                  <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{row.gap ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </article>
  );
}

function UpcomingRacesList({ races }: { races: Race[] }) {
  return (
    <article className="rounded-lg border border-border bg-surface p-4 shadow-lg">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="font-display text-lg uppercase tracking-widest">Próximas pruebas</h3>
        <CalendarClock className="h-4 w-4 text-gold" />
      </div>
      {races.length === 0 ? (
        <p className="text-sm text-muted-foreground">No hay próximas pruebas en este evento.</p>
      ) : (
        <ul className="divide-y divide-border">
          {races.map((race) => (
            <li key={race.id} className="flex items-center justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <p className="font-semibold leading-tight">{race.race_name}</p>
                <p className="font-condensed text-[10px] uppercase tracking-widest text-muted-foreground">{race.category ?? "Categoría"}</p>
              </div>
              <time className="font-mono shrink-0 text-xs text-gold">
                {new Date(race.scheduled_time).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
              </time>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

function StatusBadge({ status }: { status: Status }) {
  const label = status === "live" ? "EN VIVO" : status === "finished" ? "FINAL" : "PRÓXIMA";
  return (
    <span className={`font-condensed inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-widest ${status === "live" ? "bg-tv-red text-foreground" : status === "finished" ? "bg-muted text-muted-foreground" : "bg-gold/20 text-gold"}`}>
      {status === "live" ? <span className="live-dot h-1.5 w-1.5 rounded-full bg-foreground" /> : null}
      {label}
    </span>
  );
}

function medal(position: number) {
  if (position === 1) return "🥇";
  if (position === 2) return "🥈";
  if (position === 3) return "🥉";
  return "";
}

function useCountdown(iso: string | null | undefined) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);
  if (!iso) return null;
  const diff = new Date(iso).getTime() - Date.now();
  if (diff <= 0) return null;
  const minutes = Math.floor(diff / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}
