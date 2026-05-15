import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, Calendar, MapPin, Star, Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { formatDate } from "@/lib/i18n/format";

type ResultRow = {
  id: string;
  event_name: string;
  event_slug: string | null;
  race: string | null;
  category: string | null;
  position: number;
  athlete_name: string;
  club: string | null;
  country: string | null;
  race_time: string | null;
  gap: string | null;
  points: number | null;
  distance: string | null;
  gender: string | null;
  is_highlighted: boolean;
  status: "en_vivo" | "finalizado" | "proxima";
  sort_order: number;
};

type EventMeta = {
  name: string;
  event_date: string | null;
  country: string | null;
  banner_url: string | null;
  status: "en_vivo" | "finalizado" | "proxima";
};

export const Route = createFileRoute("/resultados/$evento")({
  loader: async ({ params }) => {
    const [{ data: rows, error }, { data: meta }] = await Promise.all([
      supabase
        .from("live_results")
        .select("id, event_name, event_slug, race, category, position, athlete_name, club, country, race_time, gap, points, distance, gender, is_highlighted, status, sort_order")
        .eq("event_slug", params.evento)
        .eq("published", true)
        .order("sort_order", { ascending: true })
        .order("position", { ascending: true }),
      supabase
        .from("result_events")
        .select("name, event_date, country, banner_url, status")
        .eq("slug", params.evento)
        .maybeSingle(),
    ]);
    if (error) throw error;
    if (!rows || rows.length === 0) throw notFound();
    return {
      rows: rows as ResultRow[],
      evento: params.evento,
      meta: (meta as EventMeta | null) ?? null,
    };
  },
  head: ({ loaderData }) => {
    const title = loaderData?.meta?.name ?? loaderData?.rows?.[0]?.event_name ?? "Resultados";
    return {
      meta: [
        { title: `${title} — Resultados RollerZone` },
        { name: "description", content: `Clasificaciones completas de ${title} en RollerZone.` },
        { property: "og:title", content: `${title} — Resultados RollerZone` },
        ...(loaderData?.meta?.banner_url
          ? [{ property: "og:image" as const, content: loaderData.meta.banner_url }]
          : []),
      ],
    };
  },
  notFoundComponent: () => (
    <div className="mx-auto max-w-3xl px-5 py-20 text-center">
      <h1 className="font-display text-3xl uppercase tracking-widest">Resultados no encontrados</h1>
      <Link to="/resultados" className="font-condensed mt-6 inline-flex items-center gap-2 border border-border px-5 py-2 text-xs font-bold uppercase tracking-widest text-gold hover:bg-surface">
        <ArrowLeft className="h-4 w-4" /> Volver
      </Link>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="mx-auto max-w-3xl px-5 py-20 text-center text-destructive">Error: {error.message}</div>
  ),
  component: ResultadosEventoPage,
});

function ResultadosEventoPage() {
  const data = Route.useLoaderData();
  const rows: ResultRow[] = data.rows;
  const meta = data.meta;
  const { t, lang } = useLanguage();
  const eventName = meta?.name ?? rows[0]?.event_name ?? "Resultados";

  const [fCat, setFCat] = useState("");
  const [fDist, setFDist] = useState("");
  const [fGender, setFGender] = useState("");
  const [fClub, setFClub] = useState("");
  const [fCountry, setFCountry] = useState("");

  const opts = useMemo(() => ({
    categories: uniq(rows.map((r: ResultRow) => r.category)),
    distances: uniq(rows.map((r: ResultRow) => r.distance ?? r.race)),
    genders: uniq(rows.map((r: ResultRow) => r.gender)),
    clubs: uniq(rows.map((r: ResultRow) => r.club)),
    countries: uniq(rows.map((r: ResultRow) => r.country)),
  }), [rows]);

  const filtered = rows.filter((r: ResultRow) =>
    (!fCat || r.category === fCat) &&
    (!fDist || (r.distance ?? r.race) === fDist) &&
    (!fGender || r.gender === fGender) &&
    (!fClub || r.club === fClub) &&
    (!fCountry || r.country === fCountry),
  );

  const groups = groupRows(filtered);
  const isLive = (meta?.status ?? rows[0]?.status) === "en_vivo";

  return (
    <main className="mx-auto max-w-7xl px-5 py-10 md:px-6">
      <Link to="/resultados" className="font-condensed mb-6 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-gold">
        <ArrowLeft className="h-4 w-4" /> {t("common.backTo")} {t("results.title")}
      </Link>

      {/* Hero with banner */}
      <header className="relative overflow-hidden rounded-2xl border border-border bg-surface">
        {meta?.banner_url && (
          <div className="absolute inset-0">
            <img src={meta.banner_url} alt={eventName} className="h-full w-full object-cover opacity-40" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/40" />
          </div>
        )}
        <div className="relative p-6 md:p-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-condensed inline-flex items-center gap-2 bg-gold px-2.5 py-1 text-[10px] font-bold uppercase tracking-[3px] text-background">
              <Trophy className="h-3.5 w-3.5" /> {t("results.headerTag")}
            </span>
            {isLive && (
              <span className="font-condensed inline-flex items-center gap-1 bg-tv-red px-2 py-0.5 text-[10px] font-bold uppercase tracking-[2px] text-foreground live-red-tag">
                <span className="live-dot h-1.5 w-1.5 rounded-full bg-foreground" /> {t("common.live")}
              </span>
            )}
          </div>
          <h1 className="font-display mt-3 text-3xl uppercase leading-none tracking-widest md:text-5xl">{eventName}</h1>
          <div className="font-condensed mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[11px] uppercase tracking-widest text-muted-foreground">
            {meta?.event_date && (<span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> {formatDate(meta.event_date, lang)}</span>)}
            {meta?.country && (<span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {meta.country}</span>)}
          </div>
        </div>
      </header>

      {/* Filters */}
      <section className="mt-6 grid gap-2 rounded-xl border border-border bg-surface p-3 sm:grid-cols-2 lg:grid-cols-5">
        <FilterSelect value={fCat} onChange={setFCat} placeholder={t("results.allCategories")} options={opts.categories} />
        <FilterSelect value={fDist} onChange={setFDist} placeholder={t("results.allDistances")} options={opts.distances} />
        <FilterSelect value={fGender} onChange={setFGender} placeholder={t("results.allGenders")} options={opts.genders} />
        <FilterSelect value={fClub} onChange={setFClub} placeholder={t("results.allClubs")} options={opts.clubs} />
        <FilterSelect value={fCountry} onChange={setFCountry} placeholder={t("results.allCountries")} options={opts.countries} />
      </section>

      {/* Tables */}
      <section className="mt-6 grid gap-5">
        {groups.length === 0 ? (
          <p className="text-muted-foreground">{t("results.noRows")}</p>
        ) : groups.map((group) => {
          const podium = group.rows.slice(0, 3);
          const rest = group.rows.slice(3);
          return (
          <article key={group.key} className="overflow-hidden rounded-xl border border-border bg-surface">
            <div className="flex flex-col gap-2 border-b border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-display text-2xl uppercase tracking-wider">{group.title}</h2>
                <p className="font-condensed text-[11px] uppercase tracking-widest text-muted-foreground">{group.category || "—"}</p>
              </div>
              <StatusPill status={group.rows[0]?.status ?? "finalizado"} t={t} />
            </div>

            {/* Visual Podium Top 3 */}
            {podium.length > 0 && (
              <div className="border-b border-border bg-gradient-to-b from-gold/5 to-transparent px-4 py-6">
                <div className="mx-auto grid max-w-3xl grid-cols-3 items-end gap-3 sm:gap-5">
                  {[1, 0, 2].map((idx) => {
                    const row = podium[idx];
                    if (!row) return <div key={idx} />;
                    const place = row.position;
                    const medal = ["🥇", "🥈", "🥉"][place - 1] ?? "🏅";
                    const heightCls = place === 1 ? "h-44 sm:h-52" : place === 2 ? "h-36 sm:h-44" : "h-32 sm:h-40";
                    const accent = place === 1
                      ? "border-gold bg-gradient-to-b from-gold/30 via-gold/10 to-transparent shadow-[0_18px_40px_-15px_rgba(212,160,23,0.5)]"
                      : place === 2
                      ? "border-foreground/40 bg-gradient-to-b from-foreground/15 via-foreground/5 to-transparent"
                      : "border-amber-700/50 bg-gradient-to-b from-amber-700/25 via-amber-700/5 to-transparent";
                    return (
                      <div
                        key={row.id}
                        className={`relative flex flex-col items-center justify-end overflow-hidden rounded-xl border p-3 text-center transition-transform hover:-translate-y-1 ${accent} ${heightCls}`}
                      >
                        <div className="absolute right-2 top-2 text-xl sm:text-2xl">{medal}</div>
                        <div className={`font-display leading-none text-foreground ${place === 1 ? "text-5xl sm:text-6xl" : "text-4xl sm:text-5xl"}`}>
                          #{place}
                        </div>
                        <div className="mt-2 font-display line-clamp-2 text-xs uppercase tracking-wider text-foreground sm:text-sm">
                          {row.athlete_name}
                        </div>
                        {row.club && (
                          <div className="font-condensed mt-0.5 line-clamp-1 text-[9px] uppercase tracking-widest text-muted-foreground sm:text-[10px]">
                            {row.club}
                          </div>
                        )}
                        <div className="mt-1.5 font-mono text-xs font-bold text-gold sm:text-sm">
                          {row.race_time || (row.points !== null ? `${row.points} pts` : "—")}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {rest.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead className="border-b border-border bg-background/60">
                  <tr className="font-condensed text-left text-[10px] uppercase tracking-widest text-muted-foreground">
                    <th className="px-4 py-2 w-12">{t("results.cols.position")}</th>
                    <th className="px-4 py-2">{t("results.cols.athlete")}</th>
                    <th className="px-4 py-2">{t("results.cols.club")}</th>
                    <th className="px-4 py-2">{t("results.cols.country")}</th>
                    <th className="px-4 py-2">{t("results.cols.time")}</th>
                    <th className="px-4 py-2">{t("results.cols.gap")}</th>
                    <th className="px-4 py-2">{t("results.cols.points")}</th>
                  </tr>
                </thead>
                <tbody>
                  {rest.map((row) => (
                    <tr key={row.id} className={"border-b border-border/70 transition-colors last:border-0 hover:bg-background/40 " + (row.is_highlighted ? "bg-gold/5" : "")}>
                      <td className="px-4 py-3">
                        <span className="font-mono font-bold text-foreground/70">{row.position}</span>
                      </td>
                      <td className="px-4 py-3 font-semibold">
                        <span className="inline-flex items-center gap-2">
                          {row.is_highlighted && <Star className="h-3.5 w-3.5 fill-gold text-gold" />}
                          {row.athlete_name}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{row.club || "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{row.country || "—"}</td>
                      <td className="px-4 py-3 font-mono">{row.race_time || "—"}</td>
                      <td className="px-4 py-3 font-mono text-muted-foreground">{row.gap || "—"}</td>
                      <td className="px-4 py-3 font-mono text-muted-foreground">{row.points ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            )}
          </article>
          );
        })}
      </section>
    </main>
  );
}

function FilterSelect({ value, onChange, placeholder, options }: { value: string; onChange: (v: string) => void; placeholder: string; options: string[] }) {
  if (options.length === 0) return null;
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="font-condensed rounded-md border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-gold focus:outline-none">
      <option value="">{placeholder}</option>
      {options.map((o) => (<option key={o} value={o}>{o}</option>))}
    </select>
  );
}

function StatusPill({ status, t }: { status: ResultRow["status"]; t: (k: string) => string }) {
  const label = status === "en_vivo" ? t("common.live") : status === "proxima" ? t("common.upcoming") : t("common.finished");
  const cls = status === "en_vivo" ? "bg-tv-red text-foreground live-red-tag" : status === "proxima" ? "border border-gold/50 bg-gold/10 text-gold" : "border border-border bg-background text-muted-foreground";
  return <span className={`font-condensed inline-flex items-center px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest ${cls}`}>{label}</span>;
}

function uniq(arr: (string | null | undefined)[]): string[] {
  return Array.from(new Set(arr.filter((x): x is string => !!x && x.trim() !== ""))).sort();
}

function groupRows(rows: ResultRow[]) {
  const map = new Map<string, { key: string; title: string; category: string; rows: ResultRow[] }>();
  for (const row of rows) {
    const key = `${row.race ?? "General"}::${row.category ?? ""}`;
    if (!map.has(key)) map.set(key, { key, title: row.race || "General", category: row.category || "", rows: [] });
    map.get(key)!.rows.push(row);
  }
  return Array.from(map.values()).map((g) => ({ ...g, rows: g.rows.sort((a, b) => a.position - b.position) }));
}
