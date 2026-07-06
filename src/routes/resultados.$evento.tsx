import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowDown, ArrowUp, ArrowUpDown, Calendar, MapPin, Search, Star, Trophy, FileDown, FileSpreadsheet, FileText, PlayCircle, Share2, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { formatDate } from "@/lib/i18n/format";
import { exportCsv, exportPdf, exportXlsx, type ExportRow } from "@/lib/resultsExport";
import { toast } from "sonner";


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
  round: string | null;
  federation: string | null;
  notes: string | null;
  is_highlighted: boolean;
  status: "en_vivo" | "finalizado" | "proxima";
  sort_order: number;
};

type EventMeta = {
  name: string;
  event_date: string | null;
  end_date: string | null;
  country: string | null;
  banner_url: string | null;
  poster_url: string | null;
  pdf_url: string | null;
  stream_url: string | null;
  city: string | null;
  venue: string | null;
  organizer: string | null;
  season: string | null;
  competition_type: string | null;
  status: "en_vivo" | "finalizado" | "proxima";
};


type SearchParams = {
  prueba?: string;
  categoria?: string;
  sexo?: string;
  ronda?: string;
  club?: string;
  federacion?: string;
};

function pickString(v: unknown): string | undefined {
  return typeof v === "string" && v.trim() !== "" ? v : undefined;
}

export const Route = createFileRoute("/resultados/$evento")({
  validateSearch: (s: Record<string, unknown>): SearchParams => ({
    prueba: pickString(s.prueba),
    categoria: pickString(s.categoria),
    sexo: pickString(s.sexo),
    ronda: pickString(s.ronda),
    club: pickString(s.club),
    federacion: pickString(s.federacion),
  }),
  loader: async ({ params }) => {
    const [{ data: meta }, { data: rows, error }] = await Promise.all([
      supabase
        .from("result_events")
        .select("name, event_date, end_date, country, banner_url, poster_url, pdf_url, stream_url, city, venue, organizer, season, competition_type, status")
        .eq("slug", params.evento)
        .maybeSingle(),

      supabase
        .from("live_results")
        .select("id, event_name, event_slug, race, category, position, athlete_name, club, country, race_time, gap, points, distance, gender, round, federation, notes, is_highlighted, status, sort_order")
        .eq("event_slug", params.evento)
        .eq("published", true)
        .order("sort_order", { ascending: true })
        .order("position", { ascending: true }),
    ]);
    if (error) throw error;
    if (!meta && (!rows || rows.length === 0)) throw notFound();
    return {
      rows: (rows ?? []) as ResultRow[],
      evento: params.evento,
      meta: (meta as EventMeta | null) ?? null,
    };
  },
  head: ({ loaderData, params }) => {
    const title = loaderData?.meta?.name ?? loaderData?.rows?.[0]?.event_name ?? "Resultados";
    const url = `https://rollerzone.lovable.app/resultados/${params.evento}`;
    const desc = `Clasificaciones completas de ${title} en RollerZone.`;
    const status = "https://schema.org/EventScheduled";
    const scripts: { type: "application/ld+json"; children: string }[] = [];
    if (loaderData?.meta) {
      const m = loaderData.meta;
      const eventLd = {
        "@context": "https://schema.org",
        "@type": "SportsEvent",
        name: m.name,
        startDate: m.event_date,
        eventStatus: status,
        eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
        url,
        ...(m.banner_url ? { image: [m.banner_url] } : {}),
        ...(m.country
          ? { location: { "@type": "Place", name: m.country, address: m.country } }
          : {}),
      };
      scripts.push({ type: "application/ld+json", children: JSON.stringify(eventLd) });
    }
    // Podium / top 3 as ItemList
    const podium = (loaderData?.rows ?? [])
      .filter((r) => typeof r.position === "number" && r.position! <= 3)
      .slice(0, 10);
    if (podium.length > 0) {
      const listLd = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: `Podio — ${title}`,
        itemListElement: podium.map((r) => ({
          "@type": "ListItem",
          position: r.position,
          name: r.athlete_name,
          ...(r.club ? { description: r.club } : {}),
        })),
      };
      scripts.push({ type: "application/ld+json", children: JSON.stringify(listLd) });
    }
    return {
      meta: [
        { title: `${title} — Resultados RollerZone` },
        { name: "description", content: desc },
        { property: "og:title", content: `${title} — Resultados RollerZone` },
        { property: "og:description", content: desc },
        { property: "og:url", content: url },
        ...(loaderData?.meta?.banner_url
          ? [
              { property: "og:image" as const, content: loaderData.meta.banner_url },
              { name: "twitter:image" as const, content: loaderData.meta.banner_url },
            ]
          : []),
      ],
      links: [{ rel: "canonical", href: url }],
      scripts,
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
  const search = Route.useSearch();
  const rows: ResultRow[] = data.rows;
  const meta = data.meta;
  const { t, lang } = useLanguage();
  const eventName = meta?.name ?? rows[0]?.event_name ?? "Resultados";

  const [fRace, setFRace] = useState(search.prueba ?? "");
  const [fCat, setFCat] = useState(search.categoria ?? "");
  const [fGender, setFGender] = useState(search.sexo ?? "");
  const [fRound, setFRound] = useState(search.ronda ?? "");
  const [fClub, setFClub] = useState(search.club ?? "");
  const [fFed, setFFed] = useState(search.federacion ?? "");
  const [fCountry, setFCountry] = useState("");
  const [q, setQ] = useState("");
  const [sortKey, setSortKey] = useState<"position" | "athlete_name" | "club" | "country" | "race_time" | "points">("position");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    setFRace(search.prueba ?? "");
    setFCat(search.categoria ?? "");
    setFGender(search.sexo ?? "");
    setFRound(search.ronda ?? "");
    setFClub(search.club ?? "");
    setFFed(search.federacion ?? "");
  }, [search.prueba, search.categoria, search.sexo, search.ronda, search.club, search.federacion]);

  const opts = useMemo(() => ({
    races: uniq(rows.map((r: ResultRow) => r.race ?? r.distance)),
    categories: uniq(rows.map((r: ResultRow) => r.category)),
    genders: uniq(rows.map((r: ResultRow) => r.gender)),
    rounds: uniq(rows.map((r: ResultRow) => r.round)),
    clubs: uniq(rows.map((r: ResultRow) => r.club)),
    federations: uniq(rows.map((r: ResultRow) => r.federation)),
    countries: uniq(rows.map((r: ResultRow) => r.country)),
  }), [rows]);

  const qLower = q.trim().toLowerCase();
  const filtered = rows.filter((r: ResultRow) =>
    (!fRace || (r.race ?? r.distance) === fRace) &&
    (!fCat || r.category === fCat) &&
    (!fGender || r.gender === fGender) &&
    (!fRound || r.round === fRound) &&
    (!fClub || r.club === fClub) &&
    (!fFed || r.federation === fFed) &&
    (!fCountry || r.country === fCountry) &&
    (!qLower || r.athlete_name.toLowerCase().includes(qLower) || (r.club ?? "").toLowerCase().includes(qLower)),
  );

  const groups = groupRows(filtered, sortKey, sortDir);
  const isLive = (meta?.status ?? rows[0]?.status) === "en_vivo";
  const clearFilters = () => { setFRace(""); setFCat(""); setFGender(""); setFRound(""); setFClub(""); setFFed(""); setFCountry(""); setQ(""); };
  const anyFilter = fRace || fCat || fGender || fRound || fClub || fFed || fCountry || q;

  const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  };
  const sortIcon = (key: typeof sortKey) =>
    sortKey !== key ? <ArrowUpDown className="h-3 w-3 opacity-50" /> : sortDir === "asc" ? <ArrowUp className="h-3 w-3 text-gold" /> : <ArrowDown className="h-3 w-3 text-gold" />;

  return (
    <main className="mx-auto max-w-7xl px-5 py-10 md:px-6">
      <Link to="/resultados" className="font-condensed mb-6 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-gold">
        <ArrowLeft className="h-4 w-4" /> {t("common.backTo")} {t("results.title")}
      </Link>

      {/* Hero with banner */}
      <header className="relative overflow-hidden rounded-2xl border border-border bg-surface">
        {meta?.banner_url && (
          <div className="absolute inset-0">
            <img loading="lazy" decoding="async" src={meta.banner_url} alt={eventName} className="h-full w-full object-cover opacity-40" />
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
            <span className="flex items-center gap-1.5">📋 {rows.length} resultados · {groups.length} pruebas</span>
          </div>
        </div>
      </header>

      {/* Filters */}
      <section className="sticky top-0 z-20 mt-6 rounded-xl border border-border bg-surface/95 p-3 backdrop-blur">
        <label className="mb-2 flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2">
          <Search className="h-4 w-4 text-muted-foreground" aria-hidden />
          <span className="sr-only">Buscar por patinador o club</span>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar patinador o club…"
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
        </label>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-8">
          <FilterSelect value={fRace} onChange={setFRace} placeholder="Prueba" options={opts.races} />
          <FilterSelect value={fCat} onChange={setFCat} placeholder="Categoría" options={opts.categories} />
          <FilterSelect value={fGender} onChange={setFGender} placeholder="Género" options={opts.genders} />
          <FilterSelect value={fRound} onChange={setFRound} placeholder="Ronda" options={opts.rounds} />
          <FilterSelect value={fClub} onChange={setFClub} placeholder="Club" options={opts.clubs} />
          <FilterSelect value={fFed} onChange={setFFed} placeholder="Federación" options={opts.federations} />
          <FilterSelect value={fCountry} onChange={setFCountry} placeholder="País" options={opts.countries} />
          <button
            type="button"
            onClick={clearFilters}
            disabled={!anyFilter}
            className="font-condensed rounded-md border border-border bg-background px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:border-gold hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold disabled:opacity-40"
          >
            Limpiar
          </button>
        </div>
      </section>

      {/* Tables */}
      <section className="mt-6 grid gap-5">
        {rows.length === 0 ? (
          <div className="rounded-xl border border-border bg-surface p-10 text-center text-muted-foreground">
            Aún no hay resultados publicados para este evento.
          </div>
        ) : groups.length === 0 ? (
          <p className="text-muted-foreground">{t("results.noRows")}</p>
        ) : groups.map((group) => {
          const podium = group.rows.slice(0, 3);
          const rest = group.rows.slice(3);
          return (
          <article key={group.key} className="overflow-hidden rounded-xl border border-border bg-surface">
            <div className="flex flex-col gap-2 border-b border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-display text-2xl uppercase tracking-wider">{group.title}</h2>
                <p className="font-condensed text-[11px] uppercase tracking-widest text-muted-foreground">
                  {[group.category, group.gender, group.round].filter(Boolean).join(" · ") || "—"}
                </p>
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
                    <SortableTh label={t("results.cols.position")} k="position" current={sortKey} dir={sortDir} onClick={toggleSort} icon={sortIcon} widthClass="w-12" />
                    <SortableTh label={t("results.cols.athlete")} k="athlete_name" current={sortKey} dir={sortDir} onClick={toggleSort} icon={sortIcon} />
                    <SortableTh label={t("results.cols.club")} k="club" current={sortKey} dir={sortDir} onClick={toggleSort} icon={sortIcon} />
                    <th className="px-4 py-2">Fed.</th>
                    <SortableTh label={t("results.cols.country")} k="country" current={sortKey} dir={sortDir} onClick={toggleSort} icon={sortIcon} />
                    <SortableTh label={t("results.cols.time")} k="race_time" current={sortKey} dir={sortDir} onClick={toggleSort} icon={sortIcon} />
                    <th className="px-4 py-2">{t("results.cols.gap")}</th>
                    <SortableTh label={t("results.cols.points")} k="points" current={sortKey} dir={sortDir} onClick={toggleSort} icon={sortIcon} />
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
                      <td className="px-4 py-3 text-muted-foreground">{row.federation || "—"}</td>
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
    <select value={value} onChange={(e) => onChange(e.target.value)} aria-label={placeholder} className="font-condensed rounded-md border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-gold focus:outline-none focus-visible:ring-2 focus-visible:ring-gold">
      <option value="">Todas · {placeholder}</option>
      {options.map((o) => (<option key={o} value={o}>{o}</option>))}
    </select>
  );
}

function SortableTh({ label, k, current, dir, onClick, icon, widthClass }: {
  label: string; k: SortKey; current: SortKey; dir: "asc" | "desc";
  onClick: (k: SortKey) => void; icon: (k: SortKey) => React.ReactNode; widthClass?: string;
}) {
  const isActive = current === k;
  return (
    <th className={`px-4 py-2 ${widthClass ?? ""}`} aria-sort={isActive ? (dir === "asc" ? "ascending" : "descending") : "none"}>
      <button
        type="button"
        onClick={() => onClick(k)}
        className="inline-flex items-center gap-1 font-condensed uppercase tracking-widest hover:text-gold focus-visible:outline-none focus-visible:text-gold"
      >
        <span>{label}</span>
        {icon(k)}
      </button>
    </th>
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

type SortKey = "position" | "athlete_name" | "club" | "country" | "race_time" | "points";

function groupRows(rows: ResultRow[], sortKey: SortKey = "position", sortDir: "asc" | "desc" = "asc") {
  const map = new Map<string, { key: string; title: string; category: string; gender: string; round: string; rows: ResultRow[] }>();
  for (const row of rows) {
    const key = `${row.race ?? "General"}::${row.category ?? ""}::${row.gender ?? ""}::${row.round ?? ""}`;
    if (!map.has(key)) map.set(key, {
      key,
      title: row.race || "General",
      category: row.category || "",
      gender: row.gender || "",
      round: row.round || "",
      rows: [],
    });
    map.get(key)!.rows.push(row);
  }
  const cmp = (a: ResultRow, b: ResultRow) => {
    const va = a[sortKey] ?? "";
    const vb = b[sortKey] ?? "";
    if (typeof va === "number" && typeof vb === "number") return va - vb;
    return String(va).localeCompare(String(vb), undefined, { numeric: true });
  };
  return Array.from(map.values()).map((g) => ({
    ...g,
    rows: g.rows.sort((a, b) => (sortDir === "asc" ? cmp(a, b) : -cmp(a, b))),
  }));
}
