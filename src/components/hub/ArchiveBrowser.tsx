import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Search, Calendar, Trophy, Mic, Newspaper, Crown, X } from "lucide-react";
import { cropObjectPosition, type ImageCrops } from "@/lib/imageCrops";

type NewsRow = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string | null;
  image_url: string | null;
  image_crops: ImageCrops | null;
  published_at: string | null;
};
type EventRow = {
  id: string;
  slug: string;
  name: string;
  start_date: string | null;
  location: string | null;
  cover_url: string | null;
};
type InterviewRow = {
  id: string;
  slug: string;
  title: string;
  interviewee_name: string | null;
  cover_url: string | null;
  created_at: string | null;
};
type LegendRow = {
  id: string;
  slug: string;
  full_name: string;
  photo_url: string | null;
  category: string | null;
};
type FilterOption = { id: string; label: string };

export function ArchiveBrowser({ country }: { country: string }) {
  const [tab, setTab] = useState("noticias");
  const [search, setSearch] = useState("");
  const [year, setYear] = useState<string>("");
  const [skaterFilter, setSkaterFilter] = useState<string>("");
  const [clubFilter, setClubFilter] = useState<string>("");
  const [eventFilter, setEventFilter] = useState<string>("");

  const [news, setNews] = useState<NewsRow[]>([]);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [interviews, setInterviews] = useState<InterviewRow[]>([]);
  const [legends, setLegends] = useState<LegendRow[]>([]);
  const [skaterOpts, setSkaterOpts] = useState<FilterOption[]>([]);
  const [clubOpts, setClubOpts] = useState<FilterOption[]>([]);
  const [eventOpts, setEventOpts] = useState<FilterOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      const [n, e, i, l, sk, cl] = await Promise.all([
        supabase
          .from("news")
          .select("id,slug,title,excerpt,content,image_url,image_crops,published_at")
          .eq("published", true)
          .eq("country_code", country)
          .order("published_at", { ascending: false })
          .limit(300),
        supabase
          .from("events")
          .select("id,slug,name,start_date,location,cover_url")
          .eq("published", true)
          .eq("country_code", country)
          .lt("start_date", new Date().toISOString().slice(0, 10))
          .order("start_date", { ascending: false })
          .limit(300),
        supabase
          .from("interviews")
          .select("id,slug,title,interviewee_name,cover_url,created_at")
          .eq("published", true)
          .or(`hub_countries.cs.{${country}},country_code.eq.${country}`)
          .order("created_at", { ascending: false })
          .limit(200),
        supabase
          .from("skaters")
          .select("id,slug,full_name,photo_url,category")
          .eq("country_code", country)
          .eq("is_legend", true)
          .order("full_name", { ascending: true })
          .limit(100),
        supabase
          .from("skaters")
          .select("id,full_name")
          .eq("country_code", country)
          .order("full_name", { ascending: true })
          .limit(500),
        supabase
          .from("clubs")
          .select("id,name")
          .eq("country_code", country)
          .eq("published", true)
          .order("name", { ascending: true })
          .limit(500),
      ]);
      if (cancelled) return;
      setNews((n.data as NewsRow[]) ?? []);
      const evList = (e.data as EventRow[]) ?? [];
      setEvents(evList);
      setInterviews((i.data as InterviewRow[]) ?? []);
      setLegends((l.data as LegendRow[]) ?? []);
      setSkaterOpts(
        ((sk.data as { id: string; full_name: string }[]) ?? []).map((s) => ({
          id: s.id,
          label: s.full_name,
        }))
      );
      setClubOpts(
        ((cl.data as { id: string; name: string }[]) ?? []).map((c) => ({
          id: c.id,
          label: c.name,
        }))
      );
      setEventOpts(evList.map((ev) => ({ id: ev.id, label: ev.name })));
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [country]);

  const years = useMemo(() => {
    const set = new Set<string>();
    news.forEach((n) => n.published_at && set.add(n.published_at.slice(0, 4)));
    events.forEach((ev) => ev.start_date && set.add(ev.start_date.slice(0, 4)));
    interviews.forEach((it) => it.created_at && set.add(it.created_at.slice(0, 4)));
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [news, events, interviews]);

  const skaterName = skaterFilter
    ? skaterOpts.find((s) => s.id === skaterFilter)?.label ?? ""
    : "";
  const clubName = clubFilter
    ? clubOpts.find((c) => c.id === clubFilter)?.label ?? ""
    : "";
  const eventName = eventFilter
    ? eventOpts.find((e) => e.id === eventFilter)?.label ?? ""
    : "";

  const fSearch = search.trim().toLowerCase();
  const matchesYear = (date: string | null) =>
    !year || (date && date.startsWith(year));
  const matchesSearch = (txt: string) =>
    !fSearch || txt.toLowerCase().includes(fSearch);
  const matchesEntity = (txt: string) => {
    const t = txt.toLowerCase();
    if (skaterName && !t.includes(skaterName.toLowerCase())) return false;
    if (clubName && !t.includes(clubName.toLowerCase())) return false;
    if (eventName && !t.includes(eventName.toLowerCase())) return false;
    return true;
  };

  const filteredNews = news.filter((n) => {
    const blob = `${n.title} ${n.excerpt ?? ""} ${n.content ?? ""}`;
    return matchesYear(n.published_at) && matchesSearch(blob) && matchesEntity(blob);
  });
  const filteredEvents = events.filter((e) => {
    const blob = `${e.name} ${e.location ?? ""}`;
    const eventOk = !eventFilter || e.id === eventFilter;
    const restOk =
      (!skaterName || blob.toLowerCase().includes(skaterName.toLowerCase())) &&
      (!clubName || blob.toLowerCase().includes(clubName.toLowerCase()));
    return matchesYear(e.start_date) && matchesSearch(blob) && eventOk && restOk;
  });
  const filteredInterviews = interviews.filter((i) => {
    const blob = `${i.title} ${i.interviewee_name ?? ""}`;
    return matchesYear(i.created_at) && matchesSearch(blob) && matchesEntity(blob);
  });
  const filteredLegends = legends.filter((l) => {
    const blob = `${l.full_name} ${l.category ?? ""}`;
    const skaterOk = !skaterFilter || l.id === skaterFilter;
    return matchesSearch(blob) && skaterOk;
  });

  const hasFilters =
    !!year || !!skaterFilter || !!clubFilter || !!eventFilter || !!fSearch;
  const clearAll = () => {
    setYear("");
    setSkaterFilter("");
    setClubFilter("");
    setEventFilter("");
    setSearch("");
  };

  return (
    <div className="bg-[#111] text-white">
      <div className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-14">
        <header className="mb-6">
          <p className="font-condensed text-xs uppercase tracking-[0.3em] text-[#888]">
            Archivo histórico
          </p>
          <h1 className="font-display mt-1 text-3xl tracking-widest md:text-5xl">
            Memoria del patinaje
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-[#aaa] md:text-base">
            Navega por años, atletas, clubes y eventos. Cada ficha enlaza con noticias y resultados.
          </p>
        </header>

        {/* Year timeline */}
        {years.length > 0 && (
          <div className="mb-5 -mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
            <div className="flex min-w-max items-center gap-2 border-b border-[#222] pb-3">
              <button
                onClick={() => setYear("")}
                className={`font-condensed px-3 py-1.5 text-[11px] uppercase tracking-widest transition-colors ${
                  year === ""
                    ? "bg-gold text-[#111]"
                    : "border border-[#333] text-[#aaa] hover:border-gold/60 hover:text-white"
                }`}
              >
                Todos
              </button>
              {years.map((y) => (
                <button
                  key={y}
                  onClick={() => setYear(y)}
                  className={`font-display px-3 py-1.5 text-sm tracking-wider transition-colors ${
                    year === y
                      ? "bg-gold text-[#111]"
                      : "border border-[#333] text-[#ccc] hover:border-gold/60 hover:text-white"
                  }`}
                >
                  {y}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="mb-4 grid gap-3 md:grid-cols-4">
          <div className="relative md:col-span-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#666]" />
            <Input
              placeholder="Buscar…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border-[#333] bg-[#0e0e0e] pl-9"
            />
          </div>
          <FilterSelect
            label="Atleta"
            value={skaterFilter}
            onChange={setSkaterFilter}
            options={skaterOpts}
          />
          <FilterSelect
            label="Club"
            value={clubFilter}
            onChange={setClubFilter}
            options={clubOpts}
          />
          <FilterSelect
            label="Evento"
            value={eventFilter}
            onChange={setEventFilter}
            options={eventOpts}
          />
        </div>

        {hasFilters && (
          <div className="mb-6 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-[#888]">Filtros activos:</span>
            {year && <Chip label={year} onClear={() => setYear("")} />}
            {skaterName && (
              <Chip label={`Atleta: ${skaterName}`} onClear={() => setSkaterFilter("")} />
            )}
            {clubName && <Chip label={`Club: ${clubName}`} onClear={() => setClubFilter("")} />}
            {eventName && (
              <Chip label={`Evento: ${eventName}`} onClear={() => setEventFilter("")} />
            )}
            {fSearch && <Chip label={`"${fSearch}"`} onClear={() => setSearch("")} />}
            <button
              onClick={clearAll}
              className="font-condensed ml-2 text-[10px] uppercase tracking-widest text-gold hover:underline"
            >
              Limpiar todo
            </button>
          </div>
        )}

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="flex h-auto w-full flex-wrap justify-start bg-[#1a1a1a]">
            <TabsTrigger value="noticias">
              <Newspaper className="mr-2 h-4 w-4" /> Noticias ({filteredNews.length})
            </TabsTrigger>
            <TabsTrigger value="resultados">
              <Trophy className="mr-2 h-4 w-4" /> Resultados ({filteredEvents.length})
            </TabsTrigger>
            <TabsTrigger value="entrevistas">
              <Mic className="mr-2 h-4 w-4" /> Entrevistas ({filteredInterviews.length})
            </TabsTrigger>
            <TabsTrigger value="leyendas">
              <Crown className="mr-2 h-4 w-4" /> Leyendas ({filteredLegends.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="noticias" className="mt-6">
            {loading ? (
              <p className="text-sm text-[#888]">Cargando…</p>
            ) : filteredNews.length === 0 ? (
              <EmptyState text="Sin resultados" />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredNews.map((n) => (
                  <Link
                    key={n.id}
                    to="/noticias/articulo/$slug"
                    params={{ slug: n.slug }}
                    className="group block overflow-hidden border border-[#222] bg-[#161616] transition-colors hover:border-gold/60"
                  >
                    {n.image_url ? (
                      <div className="aspect-video overflow-hidden">
                        <img
                          src={n.image_url}
                          alt={n.title}
                          loading="lazy"
                          style={{ objectPosition: cropObjectPosition(n.image_crops, "card") }}
                          className="h-full w-full object-cover transition-transform group-hover:scale-105"
                        />
                      </div>
                    ) : null}

                    <div className="p-4">
                      <p className="font-condensed text-[10px] uppercase tracking-widest text-gold">
                        {n.published_at?.slice(0, 10)}
                      </p>
                      <h3 className="font-display mt-1 line-clamp-2 text-base tracking-wide">
                        {n.title}
                      </h3>
                      {n.excerpt ? (
                        <p className="mt-2 line-clamp-2 text-xs text-[#999]">{n.excerpt}</p>
                      ) : null}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="resultados" className="mt-6">
            {loading ? (
              <p className="text-sm text-[#888]">Cargando…</p>
            ) : filteredEvents.length === 0 ? (
              <EmptyState text="Sin eventos finalizados" />
            ) : (
              <div className="grid gap-3">
                {filteredEvents.map((ev) => (
                  <Link
                    key={ev.id}
                    to="/resultados/$evento"
                    params={{ evento: ev.slug }}
                    className="flex items-center gap-4 border border-[#222] bg-[#161616] p-3 transition-colors hover:border-gold/60"
                  >
                    {ev.cover_url ? (
                      <img
                        src={ev.cover_url}
                        alt={ev.name}
                        loading="lazy"
                        className="h-16 w-24 flex-shrink-0 object-cover"
                      />
                    ) : (
                      <div className="flex h-16 w-24 flex-shrink-0 items-center justify-center bg-[#0a0a0a] text-[#444]">
                        <Calendar className="h-6 w-6" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-condensed text-[10px] uppercase tracking-widest text-gold">
                        {ev.start_date}
                      </p>
                      <h3 className="font-display truncate text-base tracking-wide">
                        {ev.name}
                      </h3>
                      {ev.location ? (
                        <p className="text-xs text-[#888]">{ev.location}</p>
                      ) : null}
                    </div>
                    <span className="font-condensed hidden text-[10px] uppercase tracking-widest text-[#888] md:inline">
                      Ver resultados →
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="entrevistas" className="mt-6">
            {loading ? (
              <p className="text-sm text-[#888]">Cargando…</p>
            ) : filteredInterviews.length === 0 ? (
              <EmptyState text="Sin entrevistas" />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredInterviews.map((it) => (
                  <Link
                    key={it.id}
                    to="/entrevistas/$slug"
                    params={{ slug: it.slug }}
                    className="group block overflow-hidden border border-[#222] bg-[#161616] transition-colors hover:border-gold/60"
                  >
                    {it.cover_url ? (
                      <div className="aspect-video overflow-hidden">
                        <img
                          src={it.cover_url}
                          alt={it.title}
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform group-hover:scale-105"
                        />
                      </div>
                    ) : null}
                    <div className="p-4">
                      <p className="font-condensed text-[10px] uppercase tracking-widest text-gold">
                        {it.interviewee_name}
                      </p>
                      <h3 className="font-display mt-1 line-clamp-2 text-base tracking-wide">
                        {it.title}
                      </h3>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="leyendas" className="mt-6">
            {loading ? (
              <p className="text-sm text-[#888]">Cargando…</p>
            ) : filteredLegends.length === 0 ? (
              <EmptyState text="Aún no hay leyendas registradas" />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {filteredLegends.map((s) => (
                  <Link
                    key={s.id}
                    to="/hub/$country/patinadores/$slug"
                    params={{ country, slug: s.slug }}
                    className="group block overflow-hidden border border-gold/30 bg-gradient-to-b from-[#1a1505] to-[#161616] transition-all hover:border-gold"
                  >
                    {s.photo_url ? (
                      <div className="aspect-square overflow-hidden">
                        <img
                          src={s.photo_url}
                          alt={s.full_name}
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform group-hover:scale-105"
                        />
                      </div>
                    ) : (
                      <div className="flex aspect-square items-center justify-center bg-[#0a0a0a]">
                        <Crown className="h-12 w-12 text-gold/40" />
                      </div>
                    )}
                    <div className="p-3 text-center">
                      <Crown className="mx-auto mb-1 h-4 w-4 text-gold" />
                      <h3 className="font-display text-sm tracking-wide">{s.full_name}</h3>
                      {s.category ? (
                        <p className="font-condensed mt-1 text-[10px] uppercase tracking-widest text-[#888]">
                          {s.category}
                        </p>
                      ) : null}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: FilterOption[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full border border-[#333] bg-[#0e0e0e] px-3 py-2 text-sm text-white focus:border-gold focus:outline-none"
    >
      <option value="">Todos los {label.toLowerCase()}s</option>
      {options.map((o) => (
        <option key={o.id} value={o.id}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function Chip({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 border border-gold/40 bg-gold/10 px-2 py-1 text-[11px] text-gold">
      {label}
      <button
        onClick={onClear}
        aria-label={`Quitar ${label}`}
        className="text-gold hover:text-white"
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <Card className="border-[#222] bg-[#161616] p-8 text-center text-sm text-[#888]">
      {text}
    </Card>
  );
}
