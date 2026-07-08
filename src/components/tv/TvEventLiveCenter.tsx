import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Radio, Trophy, Clock, ChevronRight, MapPin, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type ResultEvent = {
  id: string;
  slug: string;
  name: string;
  city: string | null;
  venue: string | null;
  status: string | null;
  event_date: string | null;
};

type LiveResultRow = {
  id: string;
  race: string | null;
  category: string | null;
  position: number;
  athlete_name: string;
  club: string | null;
  race_time: string | null;
  status: string | null;
};

type ScheduleRow = {
  id: string;
  event_name: string;
  category: string | null;
  scheduled_at: string;
  status: string;
};

export function TvEventLiveCenter({
  eventSlug,
  layout,
  showFullResultsButton,
}: {
  eventSlug: string;
  layout: "right" | "bottom";
  showFullResultsButton: boolean;
}) {
  const [ev, setEv] = useState<ResultEvent | null>(null);
  const [results, setResults] = useState<LiveResultRow[]>([]);
  const [schedule, setSchedule] = useState<ScheduleRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const [evRes, resRes, schRes] = await Promise.all([
        supabase
          .from("result_events")
          .select("id, slug, name, city, venue, status, event_date")
          .eq("slug", eventSlug)
          .maybeSingle(),
        supabase
          .from("live_results")
          .select("id, race, category, position, athlete_name, club, race_time, status")
          .eq("event_slug", eventSlug)
          .eq("published", true)
          .order("sort_order", { ascending: true })
          .order("position", { ascending: true })
          .limit(60),
        supabase
          .from("schedule_items")
          .select("id, event_name, category, scheduled_at, status")
          .eq("published", true)
          .order("scheduled_at", { ascending: true })
          .limit(20),
      ]);
      if (cancelled) return;
      setEv((evRes.data as ResultEvent | null) ?? null);
      setResults((resRes.data as LiveResultRow[]) ?? []);
      setSchedule((schRes.data as ScheduleRow[]) ?? []);
      setLoading(false);
    };
    load();
    const ch = supabase
      .channel(`tv-live-center-${eventSlug}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "live_results" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "schedule_items" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "result_events" }, load)
      .subscribe();
    const interval = window.setInterval(load, 30_000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
      supabase.removeChannel(ch);
    };
  }, [eventSlug]);

  if (loading) {
    return (
      <div className="border border-gold/30 bg-surface p-4">
        <p className="font-condensed text-[11px] uppercase tracking-widest text-muted-foreground">
          Cargando Live Center…
        </p>
      </div>
    );
  }

  if (!ev) return null;

  // Group results by race
  const races = new Map<string, LiveResultRow[]>();
  for (const r of results) {
    const key = [r.race, r.category].filter(Boolean).join(" · ") || "General";
    if (!races.has(key)) races.set(key, []);
    races.get(key)!.push(r);
  }
  const raceEntries = Array.from(races.entries());
  const liveRace = raceEntries.find(([, rows]) => rows.some((r) => r.status === "en_vivo"));
  const currentRace = liveRace ?? raceEntries[0];

  const upcoming = schedule.filter((s) => s.status === "programada").slice(0, 5);
  const latestFinished = raceEntries
    .filter(([, rows]) => rows.some((r) => r.status === "finalizado"))
    .slice(0, 3);

  const statusBadge = (() => {
    const s = ev.status || "";
    if (s === "en_vivo") return { label: "EN DIRECTO", cls: "bg-tv-red text-white" };
    if (s === "finalizado") return { label: "FINALIZADO", cls: "bg-surface text-muted-foreground border border-border" };
    return { label: "PRÓXIMAMENTE", cls: "border border-gold/60 bg-gold/10 text-gold" };
  })();

  const containerCls = layout === "bottom" ? "mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3" : "flex flex-col gap-4";

  return (
    <div className="border border-gold/30 bg-surface/60 p-4 backdrop-blur">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between gap-3 border-b border-border pb-3">
        <div className="min-w-0">
          <p className="font-condensed text-[10px] uppercase tracking-[3px] text-gold">Live Center</p>
          <p className="font-display truncate text-sm uppercase tracking-widest text-foreground">
            {ev.name}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
            {(ev.city || ev.venue) && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3 w-3 text-gold" /> {[ev.venue, ev.city].filter(Boolean).join(" · ")}
              </span>
            )}
            {ev.event_date && (
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3 w-3 text-gold" />
                {new Date(ev.event_date).toLocaleDateString("es-ES", { day: "2-digit", month: "short" })}
              </span>
            )}
          </div>
        </div>
        <span className={`font-condensed px-2 py-1 text-[10px] font-bold uppercase tracking-widest ${statusBadge.cls}`}>
          {statusBadge.label}
        </span>
      </div>

      <div className={containerCls}>
        {/* Prueba en curso */}
        <Section title="Prueba en directo" icon={<Radio className="h-3 w-3" />}>
          {currentRace ? (
            <div>
              <p className="font-condensed mb-2 text-[11px] uppercase tracking-widest text-foreground">
                {currentRace[0]}
              </p>
              <ul className="space-y-1">
                {currentRace[1].slice(0, 5).map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-2 text-xs">
                    <span className="flex items-center gap-2 truncate">
                      <span
                        className={`inline-flex h-5 w-5 shrink-0 items-center justify-center text-[10px] font-bold ${
                          r.position === 1
                            ? "bg-gold text-primary-foreground"
                            : r.position <= 3
                            ? "border border-gold/60 text-gold"
                            : "border border-border text-muted-foreground"
                        }`}
                      >
                        {r.position}
                      </span>
                      <span className="truncate text-foreground">{r.athlete_name}</span>
                      {r.club && <span className="truncate text-muted-foreground">· {r.club}</span>}
                    </span>
                    {r.race_time && (
                      <span className="font-mono text-[11px] text-gold">{r.race_time}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Sin pruebas activas.</p>
          )}
        </Section>

        {/* Próximas pruebas */}
        <Section title="Próximas pruebas" icon={<Clock className="h-3 w-3" />}>
          {upcoming.length === 0 ? (
            <p className="text-xs text-muted-foreground">Sin próximas pruebas.</p>
          ) : (
            <ul className="space-y-1.5">
              {upcoming.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-2 text-xs">
                  <span className="truncate text-foreground">
                    {s.event_name}
                    {s.category && <span className="text-muted-foreground"> · {s.category}</span>}
                  </span>
                  <span className="font-condensed shrink-0 text-[10px] uppercase text-gold">
                    {new Date(s.scheduled_at).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Section>

        {/* Últimos resultados */}
        <Section title="Últimos resultados" icon={<Trophy className="h-3 w-3" />}>
          {latestFinished.length === 0 ? (
            <p className="text-xs text-muted-foreground">Aún sin resultados finalizados.</p>
          ) : (
            <ul className="space-y-2">
              {latestFinished.map(([race, rows]) => {
                const top = rows.slice().sort((a, b) => a.position - b.position).slice(0, 3);
                return (
                  <li key={race}>
                    <p className="font-condensed mb-1 text-[10px] uppercase tracking-widest text-muted-foreground">
                      {race}
                    </p>
                    <ul className="space-y-0.5">
                      {top.map((r) => (
                        <li key={r.id} className="flex items-center gap-2 text-xs">
                          <span className="font-mono w-4 text-gold">{r.position}</span>
                          <span className="truncate text-foreground">{r.athlete_name}</span>
                        </li>
                      ))}
                    </ul>
                  </li>
                );
              })}
            </ul>
          )}
        </Section>
      </div>

      {showFullResultsButton && (
        <Link
          to="/resultados/$evento"
          params={{ evento: ev.slug }}
          className="font-condensed mt-4 inline-flex w-full items-center justify-center gap-2 border border-gold bg-gold px-4 py-2.5 text-[11px] font-bold uppercase tracking-widest text-primary-foreground hover:bg-gold-dark"
        >
          Ver resultados completos <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="border border-border bg-background/60 p-3">
      <p className="font-condensed mb-2 flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-gold">
        {icon} {title}
      </p>
      {children}
    </div>
  );
}
