import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Calendar, MapPin, Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { formatDate } from "@/lib/i18n/format";

type ResultEvent = {
  id: string;
  slug: string;
  name: string;
  event_date: string | null;
  country: string | null;
  banner_url: string | null;
  status: "en_vivo" | "finalizado" | "proxima";
  sort_order: number;
};

export const Route = createFileRoute("/resultados/")({
  head: () => ({
    meta: [
      { title: "Resultados — RollerZone" },
      { name: "description", content: "Resultados oficiales de patinaje de velocidad — clasificaciones por evento y categoría." },
      { property: "og:title", content: "Resultados — RollerZone" },
      { property: "og:description", content: "Clasificaciones oficiales de patinaje de velocidad." },
    ],
  }),
  component: ResultadosIndex,
});

function ResultadosIndex() {
  const { t, lang } = useLanguage();
  const [events, setEvents] = useState<ResultEvent[] | null>(null);
  const [legacy, setLegacy] = useState<{ slug: string; name: string }[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [{ data }, { data: legacyData }] = await Promise.all([
        supabase
          .from("result_events")
          .select("id, slug, name, event_date, country, banner_url, status, sort_order")
          .eq("published", true)
          .order("sort_order", { ascending: true })
          .order("event_date", { ascending: false }),
        supabase
          .from("live_results")
          .select("event_slug, event_name")
          .eq("published", true)
          .not("event_slug", "is", null)
          .limit(500),
      ]);
      if (cancelled) return;
      setEvents((data as ResultEvent[]) ?? []);
      // legacy events not in result_events
      const seen = new Set((data ?? []).map((e: { slug: string }) => e.slug));
      const map = new Map<string, string>();
      (legacyData ?? []).forEach((r: { event_slug: string | null; event_name: string }) => {
        if (r.event_slug && !seen.has(r.event_slug) && !map.has(r.event_slug)) {
          map.set(r.event_slug, r.event_name);
        }
      });
      setLegacy(Array.from(map, ([slug, name]) => ({ slug, name })));
    })();
    return () => { cancelled = true; };
  }, []);

  const all: ResultEvent[] = [
    ...(events ?? []),
    ...legacy.map((l) => ({
      id: `legacy-${l.slug}`,
      slug: l.slug,
      name: l.name,
      event_date: null,
      country: null,
      banner_url: null,
      status: "finalizado" as const,
      sort_order: 999,
    })),
  ];

  return (
    <main className="mx-auto max-w-7xl px-5 py-10 md:px-6">
      <header className="border-b border-border pb-6">
        <div className="font-condensed inline-flex items-center gap-2 bg-gold px-2.5 py-1 text-[10px] font-bold uppercase tracking-[3px] text-background">
          <Trophy className="h-3.5 w-3.5" /> {t("results.headerTag")}
        </div>
        <h1 className="font-display mt-3 text-4xl uppercase leading-none tracking-widest md:text-6xl">
          {t("results.indexTitle")}
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">{t("results.indexLead")}</p>
      </header>

      {events === null ? (
        <p className="mt-10 text-muted-foreground">{t("common.loading")}</p>
      ) : all.length === 0 ? (
        <p className="mt-10 text-muted-foreground">{t("results.empty")}</p>
      ) : (
        <section className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {all.map((e) => (
            <Link
              key={e.id}
              to="/resultados/$evento"
              params={{ evento: e.slug }}
              className="group block overflow-hidden rounded-xl border border-border bg-surface transition-all hover:border-gold hover:shadow-xl"
            >
              <div className="relative aspect-[16/9] overflow-hidden bg-surface-2">
                {e.banner_url ? (
                  <img src={e.banner_url} alt={e.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                ) : (
                  <div className="hero-grid-bg flex h-full w-full items-center justify-center">
                    <Trophy className="h-12 w-12 text-gold/30" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute left-3 top-3">
                  <StatusBadge status={e.status} t={t} />
                </div>
              </div>
              <div className="p-5">
                <h2 className="font-display clamp-2 text-lg uppercase tracking-wider text-foreground group-hover:text-gold">
                  {e.name}
                </h2>
                <div className="font-condensed mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] uppercase tracking-widest text-muted-foreground">
                  {e.event_date && (
                    <span className="flex items-center gap-1.5"><Calendar className="h-3 w-3" /> {formatDate(e.event_date, lang)}</span>
                  )}
                  {e.country && (
                    <span className="flex items-center gap-1.5"><MapPin className="h-3 w-3" /> {e.country}</span>
                  )}
                </div>
                <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gold transition-transform group-hover:translate-x-1">
                  {t("results.viewResults")} <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </section>
      )}
    </main>
  );
}

function StatusBadge({ status, t }: { status: ResultEvent["status"]; t: (k: string) => string }) {
  if (status === "en_vivo") {
    return (
      <span className="font-condensed inline-flex items-center gap-1 bg-tv-red px-2 py-0.5 text-[10px] font-bold uppercase tracking-[2px] text-foreground live-red-tag">
        <span className="live-dot h-1.5 w-1.5 rounded-full bg-foreground" /> {t("common.live")}
      </span>
    );
  }
  if (status === "proxima") {
    return (
      <span className="font-condensed border border-gold/60 bg-gold/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[2px] text-gold">
        {t("common.upcoming")}
      </span>
    );
  }
  return (
    <span className="font-condensed border border-border bg-background/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[2px] text-muted-foreground">
      {t("common.finished")}
    </span>
  );
}
