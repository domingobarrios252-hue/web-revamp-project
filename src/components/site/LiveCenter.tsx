import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CalendarClock, ExternalLink, Play, Radio, Timer, Trophy } from "lucide-react";
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

export function LiveCenter() {
  const [stream, setStream] = useState<StreamRow | null>(null);
  const [schedule, setSchedule] = useState<ScheduleRow[]>([]);
  const [results, setResults] = useState<ResultRow[]>([]);
  const [loading, setLoading] = useState(true);

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
          .neq("status", "finalizada")
          .order("scheduled_at", { ascending: true })
          .limit(5),
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

    return () => {
      cancelled = true;
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
    return Array.from(map.values()).sort((a, b) => statusPriority(a.rows) - statusPriority(b.rows))[0];
  }, [results]);

  if (!loading && !stream && schedule.length === 0 && results.length === 0) return null;

  const embed = getEmbedUrl(stream?.embed_url, stream?.autoplay);
  const eventSlug = featuredGroup?.slug;

  return (
    <section id="en-directo" className="border-y border-border bg-background">
      <div className="mx-auto max-w-7xl px-5 py-10 md:px-6 lg:py-12">
        <div className="mb-5 flex flex-col gap-3 border-b border-border pb-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="font-condensed inline-flex items-center gap-2 bg-tv-red px-2.5 py-1 text-[10px] font-bold uppercase tracking-[3px] text-foreground live-red-tag">
              <span className="live-dot h-1.5 w-1.5 rounded-full bg-foreground" /> En directo
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

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.45fr)_minmax(340px,0.75fr)]">
          <div className="min-w-0 border border-border bg-surface">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div className="font-condensed flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gold">
                <Radio className="h-4 w-4" /> Retransmisión
              </div>
              {stream?.is_active && <span className="font-condensed text-[10px] uppercase tracking-widest text-tv-red">Live</span>}
            </div>
            <div className="aspect-video bg-background">
              {embed?.type === "iframe" ? (
                <iframe src={embed.src} title="Retransmisión RollerZone" allow="autoplay; fullscreen; picture-in-picture" allowFullScreen className="h-full w-full" />
              ) : embed?.type === "link" ? (
                <a href={embed.href} target="_blank" rel="noopener noreferrer" className="flex h-full flex-col items-center justify-center gap-3 text-center text-muted-foreground transition-colors hover:text-gold">
                  <ExternalLink className="h-10 w-10" /> Abrir retransmisión externa
                </a>
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-muted-foreground">
                  <Play className="h-10 w-10 text-gold" /> Directo pendiente de activar
                </div>
              )}
            </div>
          </div>

          <aside className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
            <Panel title="Próximas pruebas" icon={<CalendarClock className="h-4 w-4" />}>
              {schedule.length === 0 ? (
                <Empty text="Sin pruebas programadas" />
              ) : (
                <div className="space-y-2">
                  {schedule.map((item) => (
                    <div key={item.id} className="border border-border bg-background p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-display truncate text-base uppercase tracking-wider">{item.event_name}</p>
                          <p className="font-condensed text-[11px] uppercase tracking-widest text-muted-foreground">{item.category || item.location || "Prueba"}</p>
                        </div>
                        <span className="font-mono text-xs text-gold">{formatTime(item.scheduled_at)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Panel>

            <Panel title="Clasificación" icon={<Trophy className="h-4 w-4" />}>
              {!featuredGroup ? (
                <Empty text="Sin clasificación publicada" />
              ) : (
                <div>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <h3 className="font-display truncate text-lg uppercase tracking-wider">{featuredGroup.title}</h3>
                    <span className="font-condensed text-[10px] uppercase tracking-widest text-muted-foreground">Top {Math.min(featuredGroup.rows.length, 6)}</span>
                  </div>
                  <div className="space-y-1.5">
                    {featuredGroup.rows.slice(0, 6).map((row) => (
                      <div key={row.id} className="grid grid-cols-[32px_1fr_auto] items-center gap-2 border-b border-border/60 pb-1.5 last:border-0">
                        <span className="font-mono text-sm text-gold">{row.position}</span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">{row.athlete_name}</p>
                          <p className="truncate text-[11px] text-muted-foreground">{row.club || "—"}</p>
                        </div>
                        <span className="font-mono text-xs text-foreground/80">{row.race_time || "—"}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Panel>
          </aside>
        </div>
      </div>
    </section>
  );
}

function Panel({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="border border-border bg-surface p-4">
      <div className="font-condensed mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gold">
        {icon} {title}
      </div>
      {children}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="font-condensed py-5 text-center text-[11px] uppercase tracking-widest text-muted-foreground">{text}</p>;
}

function getEmbedUrl(value: string | null | undefined, autoplay?: boolean): { type: "iframe"; src: string } | { type: "link"; href: string } | null {
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
      const parent = typeof window !== "undefined" ? window.location.hostname : "rollerzone.lovable.app";
      if (path[0] === "videos" && path[1]) return { type: "iframe", src: `https://player.twitch.tv/?video=${path[1]}&parent=${parent}` };
      if (path[0]) return { type: "iframe", src: `https://player.twitch.tv/?channel=${path[0]}&parent=${parent}` };
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
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 150);
}