import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CalendarClock, ExternalLink, Play, Radio, Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { youTubeEmbedUrl } from "@/lib/youtube";

type StreamRow = {
  title: string;
  embed_url: string | null;
  is_active: boolean;
  autoplay: boolean;
};

type ScheduleRow = {
  id: string;
  event_name: string;
  category: string | null;
  location: string | null;
  scheduled_at: string;
  status: "programada" | "en_curso" | "finalizada";
};

type ResultRow = {
  id: string;
  event_name: string;
  event_slug: string | null;
  race: string | null;
  category: string | null;
  position: number;
  athlete_name: string;
  club: string | null;
  race_time: string | null;
  status: "en_vivo" | "finalizado" | "proxima";
  sort_order: number;
};

const FALLBACK_TITLE = "RollerZone Live Center";
type TabKey = "live" | "schedule" | "results";

export function LiveCenter() {
  const [stream, setStream] = useState<StreamRow | null>(null);
  const [schedule, setSchedule] = useState<ScheduleRow[]>([]);
  const [results, setResults] = useState<ResultRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabKey>("live");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const [streamRes, scheduleRes, resultsRes] = await Promise.all([
        supabase
          .from("live_stream")
          .select("title, embed_url, is_active, autoplay")
          .eq("is_active", true)
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("schedule_items")
          .select("id, event_name, category, location, scheduled_at, status")
          .eq("published", true)
          .order("scheduled_at", { ascending: true })
          .limit(20),
        supabase
          .from("live_results")
          .select("id, event_name, event_slug, race, category, position, athlete_name, club, race_time, status, sort_order")
          .eq("published", true)
          .order("sort_order", { ascending: true })
          .order("position", { ascending: true })
          .limit(80),
      ]);
      if (cancelled) return;
      setStream((streamRes.data as StreamRow | null) ?? null);
      setSchedule((scheduleRes.data as ScheduleRow[]) ?? []);
      setResults((resultsRes.data as ResultRow[]) ?? []);
      setLoading(false);
    };

    load();
    const channel = supabase
      .channel("rollerzone-live-center")
      .on("postgres_changes", { event: "*", schema: "public", table: "live_results" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "schedule_items" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "live_stream" }, load)
      .subscribe();
    const interval = window.setInterval(load, 15_000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);

  const featuredGroup = useMemo(() => {
    const map = new Map<string, { title: string; slug: string; rows: ResultRow[] }>();
    for (const row of results) {
      const key = `${row.event_name}::${row.race ?? "General"}::${row.category ?? ""}`;
      if (!map.has(key)) {
        map.set(key, {
          title: [row.race, row.category].filter(Boolean).join(" · ") || row.event_name,
          slug: row.event_slug || slugify(row.event_name),
          rows: [],
        });
      }
      map.get(key)!.rows.push(row);
    }
    return Array.from(map.values()).sort((a, b) => statusPriority(a.rows) - statusPriority(b.rows));
  }, [results]);

  const upcoming = schedule.filter((s) => s.status !== "finalizada");
  const isLive = !!stream?.is_active;

  if (!loading && !stream && schedule.length === 0 && results.length === 0) return null;

  const embed = getEmbedUrl(stream?.embed_url, stream?.autoplay);
  const eventSlug = featuredGroup[0]?.slug;

  const tabs: { key: TabKey; label: string; icon: React.ReactNode; live?: boolean }[] = [
    { key: "live", label: "En directo", icon: <Radio className="h-3.5 w-3.5" />, live: isLive },
    { key: "schedule", label: "Próximas pruebas", icon: <CalendarClock className="h-3.5 w-3.5" /> },
    { key: "results", label: "Resultados", icon: <Trophy className="h-3.5 w-3.5" /> },
  ];

  return (
    <section
      id="en-directo"
      className="border-b border-border border-t-2 border-t-gold"
      style={{ backgroundColor: "#0F0F0F" }}
    >
      <div className="mx-auto max-w-7xl px-5 py-10 md:px-6 lg:py-12">
        {/* Scoreboard header */}
        <div className="mb-6 flex flex-col gap-3 border-b border-border pb-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div
              className={
                "font-condensed inline-flex items-center gap-2 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[3px] " +
                (isLive
                  ? "bg-tv-red text-foreground live-red-tag"
                  : "border border-border bg-background text-muted-foreground")
              }
            >
              <span
                className={
                  "h-1.5 w-1.5 rounded-full " +
                  (isLive ? "bg-foreground live-dot" : "bg-muted-foreground")
                }
              />
              {isLive ? "En directo" : "Sin emisión"}
            </div>
            <h2 className="font-display mt-3 text-3xl uppercase tracking-widest md:text-4xl">
              {stream?.title || FALLBACK_TITLE}
            </h2>
          </div>
          {eventSlug && (
            <Link
              to="/resultados/$evento"
              params={{ evento: eventSlug }}
              className="font-condensed inline-flex items-center justify-center gap-2 border border-gold px-4 py-2 text-xs font-bold uppercase tracking-widest text-gold transition-colors hover:bg-gold hover:text-background"
            >
              Resultados completos <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>

        {/* Tabs */}
        <div
          role="tablist"
          aria-label="Live center"
          className="hide-scrollbar -mx-1 mb-5 flex gap-2 overflow-x-auto px-1"
        >
          {tabs.map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                role="tab"
                aria-selected={active}
                onClick={() => setTab(t.key)}
                className={
                  "font-condensed relative inline-flex shrink-0 items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-[2.5px] transition-colors " +
                  (active
                    ? "border border-gold bg-gold text-background"
                    : "border border-border bg-background text-muted-foreground hover:border-gold hover:text-gold")
                }
              >
                {t.icon}
                {t.label}
                {t.live && (
                  <span className="ml-1 inline-flex items-center gap-1 rounded-sm bg-tv-red px-1.5 py-0.5 text-[9px] tracking-wider text-foreground">
                    <span className="live-dot h-1 w-1 rounded-full bg-foreground" />
                    LIVE
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <div className="border border-border bg-surface">
          {tab === "live" && (
            <div className="aspect-video bg-background">
              {embed?.type === "iframe" ? (
                <iframe
                  src={embed.src}
                  title="Retransmisión RollerZone"
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                  className="h-full w-full"
                />
              ) : embed?.type === "link" ? (
                <a
                  href={embed.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-full flex-col items-center justify-center gap-3 text-center text-muted-foreground transition-colors hover:text-gold"
                >
                  <ExternalLink className="h-10 w-10" /> Abrir retransmisión externa
                </a>
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center text-muted-foreground">
                  <Play className="h-10 w-10 text-gold" />
                  <p className="font-condensed text-xs uppercase tracking-widest">
                    Sin retransmisión activa
                  </p>
                  <p className="text-xs text-muted-foreground/80">
                    Volveremos en directo durante la próxima prueba programada.
                  </p>
                </div>
              )}
            </div>
          )}

          {tab === "schedule" && (
            <div className="overflow-x-auto p-4">
              {loading ? (
                <ScheduleSkeleton />
              ) : upcoming.length === 0 ? (
                <EmptyState
                  icon={<CalendarClock className="h-8 w-8 text-gold" />}
                  title="Sin pruebas programadas"
                  text="No hay pruebas próximas publicadas. Vuelve pronto."
                />
              ) : (
                <table className="w-full min-w-[640px] border-separate border-spacing-y-1">
                  <thead>
                    <tr className="font-condensed text-[10px] uppercase tracking-[2.5px] text-muted-foreground">
                      <th className="w-20 px-3 py-2 text-left">Hora</th>
                      <th className="px-3 py-2 text-left">Evento</th>
                      <th className="px-3 py-2 text-left">Prueba / Categoría</th>
                      <th className="w-28 px-3 py-2 text-right">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {upcoming.map((item) => (
                      <tr key={item.id} className="bg-background">
                        <td className="px-3 py-3 align-middle font-mono text-sm font-bold text-gold">
                          {formatTime(item.scheduled_at)}
                        </td>
                        <td className="px-3 py-3 align-middle">
                          <div className="font-display text-base uppercase tracking-wider text-foreground">
                            {item.event_name}
                          </div>
                          {item.location && (
                            <div className="font-condensed text-[11px] uppercase tracking-widest text-muted-foreground">
                              {item.location}
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-3 align-middle">
                          <span className="font-condensed text-xs uppercase tracking-wider text-foreground/80">
                            {item.category || "—"}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-right align-middle">
                          <ScheduleStatusBadge status={item.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {tab === "results" && (
            <div className="overflow-x-auto p-4">
              {loading ? (
                <ResultsSkeleton />
              ) : featuredGroup.length === 0 ? (
                <EmptyState
                  icon={<Trophy className="h-8 w-8 text-gold" />}
                  title="Sin clasificaciones"
                  text="Aún no se han publicado resultados."
                />
              ) : (
                <div className="space-y-6">
                  {featuredGroup.slice(0, 3).map((g) => {
                    const isLiveGroup = g.rows.some((r) => r.status === "en_vivo");
                    return (
                      <div key={g.title}>
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <h3 className="font-display truncate text-lg uppercase tracking-wider">
                            {g.title}
                          </h3>
                          {isLiveGroup ? (
                            <span className="font-condensed inline-flex items-center gap-1 bg-tv-red px-2 py-0.5 text-[10px] font-bold uppercase tracking-[2px] text-foreground">
                              <span className="live-dot h-1.5 w-1.5 rounded-full bg-foreground" />
                              Live
                            </span>
                          ) : (
                            <span className="font-condensed text-[10px] uppercase tracking-widest text-muted-foreground">
                              Final
                            </span>
                          )}
                        </div>
                        <table className="w-full min-w-[560px] border-separate border-spacing-y-1">
                          <thead>
                            <tr className="font-condensed text-[10px] uppercase tracking-[2.5px] text-muted-foreground">
                              <th className="w-12 px-3 py-2 text-left">Pos</th>
                              <th className="px-3 py-2 text-left">Atleta</th>
                              <th className="px-3 py-2 text-left">Club</th>
                              <th className="w-28 px-3 py-2 text-right">Tiempo</th>
                            </tr>
                          </thead>
                          <tbody>
                            {g.rows.slice(0, 8).map((row) => {
                              const podium = row.position <= 3;
                              return (
                                <tr key={row.id} className="bg-background">
                                  <td className="px-3 py-2.5 align-middle">
                                    <span
                                      className={
                                        "font-mono text-sm font-bold " +
                                        (podium ? "text-gold" : "text-foreground/70")
                                      }
                                    >
                                      {row.position}
                                    </span>
                                  </td>
                                  <td className="px-3 py-2.5 align-middle text-sm font-semibold text-foreground">
                                    {row.athlete_name}
                                  </td>
                                  <td className="px-3 py-2.5 align-middle text-xs text-muted-foreground">
                                    {row.club || "—"}
                                  </td>
                                  <td className="px-3 py-2.5 text-right align-middle font-mono text-xs text-foreground/80">
                                    {row.race_time || "—"}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function ScheduleStatusBadge({ status }: { status: ScheduleRow["status"] }) {
  if (status === "en_curso") {
    return (
      <span className="font-condensed inline-flex items-center gap-1 bg-tv-red px-2 py-0.5 text-[10px] font-bold uppercase tracking-[2px] text-foreground live-red-tag">
        <span className="live-dot h-1.5 w-1.5 rounded-full bg-foreground" /> Live
      </span>
    );
  }
  if (status === "finalizada") {
    return (
      <span className="font-condensed border border-border bg-background px-2 py-0.5 text-[10px] font-bold uppercase tracking-[2px] text-muted-foreground">
        Final
      </span>
    );
  }
  return (
    <span className="font-condensed border border-gold/50 bg-gold/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[2px] text-gold">
      Próxima
    </span>
  );
}

function ScheduleSkeleton() {
  return (
    <div className="space-y-2">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-3 border border-border bg-background p-3">
          <div className="h-4 w-12 animate-pulse bg-surface-2" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-2/3 animate-pulse bg-surface-2" />
            <div className="h-2.5 w-1/3 animate-pulse bg-surface-2" />
          </div>
          <div className="h-4 w-16 animate-pulse bg-surface-2" />
        </div>
      ))}
    </div>
  );
}

function ResultsSkeleton() {
  return (
    <div className="space-y-1.5">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="grid grid-cols-[40px_1fr_1fr_80px] items-center gap-2 border border-border bg-background p-3"
        >
          <div className="h-4 w-6 animate-pulse bg-surface-2" />
          <div className="h-3 w-3/4 animate-pulse bg-surface-2" />
          <div className="h-3 w-1/2 animate-pulse bg-surface-2" />
          <div className="h-3 w-12 animate-pulse bg-surface-2" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full border border-gold/40 bg-background">
        {icon}
      </div>
      <h3 className="font-display text-lg uppercase tracking-widest text-foreground">{title}</h3>
      <p className="font-condensed mt-1 max-w-sm text-xs uppercase tracking-wider text-muted-foreground">
        {text}
      </p>
    </div>
  );
}

function getEmbedUrl(
  value: string | null | undefined,
  autoplay?: boolean,
): { type: "iframe"; src: string } | { type: "link"; href: string } | null {
  if (!value?.trim()) return null;
  const raw = value.trim();
  const iframeSrc = raw.match(/src=["']([^"']+)["']/i)?.[1];
  const source = iframeSrc || raw;
  const youtube = youTubeEmbedUrl(source, { autoplay });
  if (youtube) return { type: "iframe", src: youtube };
  try {
    const url = new URL(source);
    if (url.hostname.includes("twitch.tv")) {
      const path = url.pathname.split("/").filter(Boolean);
      const parent =
        typeof window !== "undefined" ? window.location.hostname : "rollerzone.lovable.app";
      if (path[0] === "videos" && path[1])
        return { type: "iframe", src: `https://player.twitch.tv/?video=${path[1]}&parent=${parent}` };
      if (path[0])
        return { type: "iframe", src: `https://player.twitch.tv/?channel=${path[0]}&parent=${parent}` };
    }
    if (url.pathname.includes("/embed") || iframeSrc) return { type: "iframe", src: source };
    return { type: "link", href: source };
  } catch {
    return null;
  }
}

function statusPriority(rows: ResultRow[]) {
  if (rows.some((row) => row.status === "en_vivo")) return 0;
  if (rows.some((row) => row.status === "proxima")) return 1;
  return 2;
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 150);
}
