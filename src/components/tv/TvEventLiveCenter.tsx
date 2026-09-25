import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Radio, Trophy, Clock, ChevronRight } from "lucide-react";
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
  phase: string | null;
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
      const [evRes, resRes, _unused] = await Promise.all([
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
        Promise.resolve(null),
      ]);
      // Programación SOLO del evento vinculado (antes mezclaba pruebas de cualquier evento).
      const evId = (evRes.data as { id?: string } | null)?.id;
      const schRes = evId
        ? await supabase
            .from("schedule_items")
            .select("id, event_name, category, phase, scheduled_at, status")
            .eq("published", true)
            .eq("result_event_id", evId)
            .order("scheduled_at", { ascending: true })
            .limit(20)
        : { data: [] };
      void _unused;
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

  if (!ev) {
    return (
      <div className="border border-gold/30 bg-surface/60 p-4">
        <p className="font-condensed text-[10px] uppercase tracking-[3px] text-gold">Live Center</p>
        <p className="mt-2 text-xs text-muted-foreground">
          El evento asociado a esta emisión no está disponible. Selecciona un evento válido en el
          panel de TV.
        </p>
        <Link
          to="/resultados"
          className="font-condensed mt-3 inline-flex min-h-[44px] items-center gap-2 border border-gold px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-gold hover:bg-gold hover:text-primary-foreground"
        >
          Ver resultados <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    );
  }


  // AHORA: solo si realmente hay una prueba en directo (resultado o prueba marcada en curso en Admin).
  const races = new Map<string, LiveResultRow[]>();
  for (const r of results) {
    const key = [r.race, r.category].filter(Boolean).join(" · ") || "General";
    if (!races.has(key)) races.set(key, []);
    races.get(key)!.push(r);
  }
  const raceEntries = Array.from(races.entries());
  const liveRace = raceEntries.find(([, rows]) => rows.some((r) => r.status === "en_vivo"));
  const liveSchedule = schedule.find((s) => LIVE_STATUSES.includes(s.status));
  const hasNow = !!(liveRace || liveSchedule);

  const nowMs = Date.now();
  const upcoming = schedule
    .filter((s) => s.status === "programada" && new Date(s.scheduled_at).getTime() >= nowMs - 30 * 60_000)
    .slice(0, 5);
  const latestFinished = raceEntries
    .filter(([, rows]) => rows.some((r) => r.status === "finalizado"))
    .slice(0, 3);

  const statusBadge = (() => {
    const s = ev.status || "";
    if (s === "en_vivo") return { label: "EN DIRECTO", cls: "bg-tv-red text-white" };
    if (s === "finalizado") return { label: "FINALIZADO", cls: "bg-surface text-muted-foreground border border-border" };
    return { label: "PRÓXIMAMENTE", cls: "border border-gold/60 bg-gold/10 text-gold" };
  })();

  const blocks = [hasNow, upcoming.length > 0, latestFinished.length > 0].filter(Boolean).length;
  const gridCls =
    layout === "bottom" && blocks > 1
      ? `grid gap-3 md:gap-4 ${blocks === 3 ? "lg:grid-cols-3" : "md:grid-cols-2"}`
      : "flex flex-col gap-3";

  return (
    <div className="border border-gold/30 bg-surface/60 p-3 md:p-4">
      <div className="mb-3 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 border-b border-border pb-3">
        <div className="min-w-0">
          <p className="font-display flex items-center gap-2 text-base tracking-[3px] text-gold">
            <span className={`h-2 w-2 rounded-full ${hasNow ? "live-dot bg-destructive" : "bg-gold/50"}`} aria-hidden="true" />
            LIVE CENTER
          </p>
          <p className="font-condensed mt-0.5 truncate text-[11px] uppercase tracking-widest text-muted-foreground">
            {ev.name}
            {ev.city ? ` · ${ev.city}` : ""}
          </p>
        </div>
        <span className={`font-condensed shrink-0 px-2 py-1 text-[10px] font-bold uppercase tracking-widest ${statusBadge.cls}`}>
          {statusBadge.label}
        </span>
      </div>

      {blocks === 0 ? (
        <p className="text-xs text-muted-foreground">Sin pruebas programadas por ahora.</p>
      ) : (
        <div className={gridCls}>
          {hasNow && (
            <Section title="Ahora" icon={<Radio className="h-3 w-3" />} tone="live">
              {liveRace ? (
                <div>
                  <p className="font-condensed mb-2 text-xs font-bold uppercase tracking-widest text-foreground">
                    {liveRace[0]}
                  </p>
                  <ul className="space-y-1">
                    {liveRace[1].slice(0, 5).map((r) => (
                      <li key={r.id} className="grid grid-cols-[1.25rem_minmax(0,1fr)_auto] items-center gap-2 text-xs">
                        <span className="font-mono text-gold">{r.position}</span>
                        <span className="truncate text-foreground">{r.athlete_name}</span>
                        {r.race_time && <span className="font-mono text-[11px] text-gold">{r.race_time}</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : liveSchedule ? (
                <ScheduleCard s={liveSchedule} live />
              ) : null}
            </Section>
          )}

          {upcoming.length > 0 && (
            <Section title="A continuación" icon={<Clock className="h-3 w-3" />}>
              <ul className="divide-y divide-border">
                {upcoming.map((s) => (
                  <li key={s.id} className="py-2 first:pt-0 last:pb-0">
                    <ScheduleCard s={s} />
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {latestFinished.length > 0 && (
            <Section title="Últimos resultados" icon={<Trophy className="h-3 w-3" />}>
              <ul className="space-y-3">
                {latestFinished.map(([race, rows]) => {
                  const top = rows.slice().sort((a, b) => a.position - b.position).slice(0, 3);
                  return (
                    <li key={race}>
                      <p className="font-condensed mb-1 text-[10px] uppercase tracking-widest text-muted-foreground">{race}</p>
                      <ul className="space-y-0.5">
                        {top.map((r) => (
                          <li key={r.id} className="grid grid-cols-[1.25rem_minmax(0,1fr)_auto] items-center gap-2 text-xs">
                            <span className="font-mono text-gold">{r.position}</span>
                            <span className="truncate text-foreground">{r.athlete_name}</span>
                            {r.race_time && <span className="font-mono text-[11px] text-muted-foreground">{r.race_time}</span>}
                          </li>
                        ))}
                      </ul>
                    </li>
                  );
                })}
              </ul>
            </Section>
          )}
        </div>
      )}

      {showFullResultsButton && latestFinished.length > 0 && (
        <Link
          to="/resultados/$evento"
          params={{ evento: ev.slug }}
          className="font-condensed mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 border border-gold bg-gold px-4 text-[11px] font-bold uppercase tracking-widest text-primary-foreground hover:bg-gold-dark"
        >
          Ver resultados completos <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  );
}

const LIVE_STATUSES = ["en_curso", "en_vivo", "live"];

function ScheduleCard({ s, live }: { s: ScheduleRow; live?: boolean }) {
  const d = new Date(s.scheduled_at);
  const day = d.toLocaleDateString("es-ES", { day: "2-digit", month: "short" }).replace(".", "");
  const time = d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
  const sub = [s.category, s.phase].filter(Boolean).join(" · ");
  return (
    <div className="grid grid-cols-[3.25rem_minmax(0,1fr)_auto] items-center gap-3">
      <div className="text-center leading-tight">
        <p className="font-display text-sm text-gold">{time}</p>
        <p className="font-condensed text-[9px] uppercase tracking-widest text-muted-foreground">{day}</p>
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-foreground">{s.event_name}</p>
        {sub && <p className="font-condensed truncate text-[10px] uppercase tracking-widest text-muted-foreground">{sub}</p>}
      </div>
      <span
        className={`font-condensed shrink-0 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest ${
          live ? "bg-tv-red text-white" : "border border-border text-muted-foreground"
        }`}
      >
        {live ? "En directo" : "Próximamente"}
      </span>
    </div>
  );
}

function Section({
  title,
  icon,
  children,
  tone,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  tone?: "live";
}) {
  return (
    <div className={`border bg-background/60 p-3 ${tone === "live" ? "border-destructive/60" : "border-border"}`}>
      <p
        className={`font-condensed mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[2px] ${
          tone === "live" ? "text-destructive" : "text-gold"
        }`}
      >
        {icon} {title}
      </p>
      {children}
    </div>
  );
}
