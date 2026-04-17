import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Trophy, MapPin, Calendar, Award } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type PR = { event: string; time: string; date?: string; place?: string };

type SkaterDetail = {
  id: string;
  full_name: string;
  slug: string;
  photo_url: string | null;
  birth_year: number | null;
  category: string | null;
  gender: string | null;
  total_points: number;
  personal_records: PR[];
  bio: string | null;
  clubs: { name: string; logo_url: string | null; website: string | null } | null;
  regions: { name: string; code: string; flag_url: string | null } | null;
};

type Result = {
  id: string;
  event_name: string;
  category: string | null;
  position: number | null;
  points: number;
  result_time: string | null;
  notes: string | null;
  competitions: {
    name: string;
    slug: string;
    start_date: string;
    location: string | null;
    scope: string;
  } | null;
};

export const Route = createFileRoute("/ranking/$slug")({
  component: SkaterPage,
  errorComponent: ({ error }) => (
    <div className="mx-auto max-w-2xl px-6 py-16 text-center">
      <h1 className="font-display text-3xl tracking-widest">Error</h1>
      <p className="mt-3 text-muted-foreground">{error.message}</p>
      <Link to="/ranking" className="font-condensed mt-4 inline-block text-gold">
        ← Volver al ranking
      </Link>
    </div>
  ),
  notFoundComponent: () => (
    <div className="mx-auto max-w-2xl px-6 py-16 text-center">
      <h1 className="font-display text-3xl tracking-widest">Patinador no encontrado</h1>
      <Link to="/ranking" className="font-condensed mt-4 inline-block text-gold">
        ← Volver al ranking
      </Link>
    </div>
  ),
});

function SkaterPage() {
  const { slug } = Route.useParams();
  const [skater, setSkater] = useState<SkaterDetail | null>(null);
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      const { data: s, error: sErr } = await supabase
        .from("skaters")
        .select(
          "id, full_name, slug, photo_url, birth_year, category, gender, total_points, personal_records, bio, clubs(name, logo_url, website), regions(name, code, flag_url)"
        )
        .eq("slug", slug)
        .maybeSingle();
      if (cancelled) return;
      if (sErr) {
        setError(sErr.message);
        setLoading(false);
        return;
      }
      if (!s) {
        setLoading(false);
        throw notFound();
      }
      setSkater(s as unknown as SkaterDetail);

      const { data: r } = await supabase
        .from("competition_results")
        .select(
          "id, event_name, category, position, points, result_time, notes, competitions(name, slug, start_date, location, scope)"
        )
        .eq("skater_id", (s as { id: string }).id)
        .order("created_at", { ascending: false });
      if (!cancelled) {
        setResults((r as unknown as Result[]) ?? []);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (loading) {
    return <div className="mx-auto max-w-5xl px-6 py-16 text-muted-foreground">Cargando…</div>;
  }
  if (error) {
    return <div className="mx-auto max-w-5xl px-6 py-16 text-destructive">{error}</div>;
  }
  if (!skater) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16 text-center">
        <h1 className="font-display text-3xl tracking-widest">Patinador no encontrado</h1>
        <Link to="/ranking" className="font-condensed mt-4 inline-block text-gold">
          ← Volver al ranking
        </Link>
      </div>
    );
  }

  // Agrupar resultados por competición + año
  const byYear: Record<string, Result[]> = {};
  for (const r of results) {
    const y = r.competitions ? new Date(r.competitions.start_date).getFullYear().toString() : "Sin fecha";
    (byYear[y] ??= []).push(r);
  }
  const years = Object.keys(byYear).sort((a, b) => b.localeCompare(a));

  return (
    <article className="mx-auto max-w-5xl px-4 py-8 md:px-6">
      <Link
        to="/ranking"
        className="font-condensed mb-4 inline-flex items-center gap-1 text-xs uppercase tracking-widest text-muted-foreground hover:text-gold"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Ranking
      </Link>

      {/* Header ficha */}
      <div className="grid gap-6 border border-border bg-surface p-5 md:grid-cols-[180px_1fr] md:p-8">
        <div className="aspect-[3/4] overflow-hidden border border-border bg-surface-2">
          {skater.photo_url ? (
            <img
              src={skater.photo_url}
              alt={skater.full_name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="font-display flex h-full w-full items-center justify-center text-5xl tracking-widest text-gold/30">
              RZ
            </div>
          )}
        </div>
        <div className="min-w-0">
          <div className="font-condensed mb-1 flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-widest">
            {skater.category && (
              <span className="bg-gold/15 px-2 py-0.5 font-bold text-gold">
                {skater.category}
              </span>
            )}
            {skater.gender && (
              <span className="text-muted-foreground">{skater.gender}</span>
            )}
            {skater.birth_year && (
              <span className="text-muted-foreground">· {skater.birth_year}</span>
            )}
          </div>
          <h1 className="font-display text-3xl uppercase leading-tight tracking-wider md:text-5xl">
            {skater.full_name}
          </h1>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {/* Club */}
            <div className="flex items-center gap-3 border border-border bg-background p-3">
              {skater.clubs?.logo_url ? (
                <img
                  src={skater.clubs.logo_url}
                  alt={skater.clubs.name}
                  className="h-10 w-10 object-contain"
                />
              ) : (
                <div className="font-display flex h-10 w-10 items-center justify-center bg-surface text-xs text-gold/40">
                  C
                </div>
              )}
              <div className="min-w-0">
                <div className="font-condensed text-[10px] uppercase tracking-widest text-muted-foreground">
                  Club
                </div>
                <div className="font-display truncate text-sm uppercase tracking-wider">
                  {skater.clubs?.name ?? "Sin club"}
                </div>
              </div>
            </div>

            {/* Comunidad */}
            <div className="flex items-center gap-3 border border-border bg-background p-3">
              {skater.regions?.flag_url ? (
                <img
                  src={skater.regions.flag_url}
                  alt={skater.regions.name}
                  className="h-7 w-10 object-cover"
                />
              ) : (
                <div className="flex h-7 w-10 items-center justify-center bg-surface-2 text-[10px] font-bold text-muted-foreground">
                  {skater.regions?.code ?? "—"}
                </div>
              )}
              <div className="min-w-0">
                <div className="font-condensed flex items-center gap-1 text-[10px] uppercase tracking-widest text-muted-foreground">
                  <MapPin className="h-3 w-3" /> Comunidad
                </div>
                <div className="font-display truncate text-sm uppercase tracking-wider">
                  {skater.regions?.name ?? "—"}
                </div>
              </div>
            </div>
          </div>

          {/* Puntos */}
          <div className="mt-3 flex items-center justify-between border-2 border-gold bg-gold/5 px-4 py-3">
            <div className="font-condensed flex items-center gap-2 text-xs uppercase tracking-widest text-gold">
              <Trophy className="h-4 w-4" /> Puntos totales
            </div>
            <div className="font-display text-3xl text-gold">
              {Number(skater.total_points).toLocaleString("es-ES")}
            </div>
          </div>

          {skater.bio && (
            <p className="mt-4 text-sm text-foreground/80">{skater.bio}</p>
          )}
        </div>
      </div>

      {/* MARCAS PERSONALES */}
      {skater.personal_records?.length > 0 && (
        <section className="mt-8">
          <h2 className="font-display mb-3 flex items-center gap-2 border-b border-border pb-2 text-2xl tracking-widest">
            <Award className="h-5 w-5 text-gold" />
            Marcas <span className="text-gold">personales</span>
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {skater.personal_records.map((pr, i) => (
              <div
                key={i}
                className="border border-border bg-surface p-3 transition-colors hover:border-gold"
              >
                <div className="font-condensed text-[11px] uppercase tracking-widest text-muted-foreground">
                  {pr.event}
                </div>
                <div className="font-display mt-1 text-2xl tracking-wider text-gold">
                  {pr.time}
                </div>
                {(pr.date || pr.place) && (
                  <div className="font-condensed mt-1 text-[11px] uppercase tracking-wider text-muted-foreground">
                    {pr.place && <span>{pr.place}</span>}
                    {pr.place && pr.date && <span> · </span>}
                    {pr.date && (
                      <span>
                        {new Date(pr.date).toLocaleDateString("es-ES", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* HISTORIAL DE COMPETICIONES */}
      <section className="mt-10">
        <h2 className="font-display mb-3 flex items-center gap-2 border-b border-border pb-2 text-2xl tracking-widest">
          <Calendar className="h-5 w-5 text-gold" />
          Historial de <span className="text-gold">competiciones</span>
        </h2>
        {results.length === 0 ? (
          <p className="font-condensed text-muted-foreground">
            Sin resultados registrados aún.
          </p>
        ) : (
          <div className="space-y-6">
            {years.map((y) => (
              <div key={y}>
                <div className="font-display mb-2 text-lg tracking-widest text-gold">
                  Temporada {y}
                </div>
                <div className="overflow-hidden border border-border">
                  <table className="w-full">
                    <thead className="border-b border-border bg-surface">
                      <tr className="font-condensed text-[11px] uppercase tracking-widest text-muted-foreground">
                        <th className="px-3 py-2 text-left">Competición</th>
                        <th className="hidden px-3 py-2 text-left sm:table-cell">Prueba</th>
                        <th className="px-3 py-2 text-center">Pos.</th>
                        <th className="hidden px-3 py-2 text-left md:table-cell">Tiempo</th>
                        <th className="px-3 py-2 text-right">Pts</th>
                      </tr>
                    </thead>
                    <tbody>
                      {byYear[y].map((r) => (
                        <tr key={r.id} className="border-b border-border/60 last:border-0">
                          <td className="px-3 py-2">
                            <div className="font-display text-sm uppercase tracking-wider text-foreground">
                              {r.competitions?.name ?? "—"}
                            </div>
                            <div className="font-condensed text-[11px] uppercase tracking-wider text-muted-foreground">
                              {r.competitions?.location && <span>{r.competitions.location} · </span>}
                              {r.competitions &&
                                new Date(r.competitions.start_date).toLocaleDateString("es-ES", {
                                  day: "2-digit",
                                  month: "short",
                                })}
                            </div>
                            <div className="font-condensed text-[10px] uppercase tracking-wider text-muted-foreground sm:hidden">
                              {r.event_name}
                            </div>
                          </td>
                          <td className="hidden px-3 py-2 text-sm sm:table-cell">
                            <div className="text-foreground/80">{r.event_name}</div>
                            {r.category && (
                              <div className="font-condensed text-[10px] uppercase text-muted-foreground">
                                {r.category}
                              </div>
                            )}
                          </td>
                          <td className="px-3 py-2 text-center">
                            <span
                              className={`font-display text-lg ${
                                r.position === 1
                                  ? "text-gold"
                                  : r.position && r.position <= 3
                                    ? "text-gold/70"
                                    : "text-foreground"
                              }`}
                            >
                              {r.position ?? "—"}
                            </span>
                          </td>
                          <td className="hidden px-3 py-2 font-mono text-sm md:table-cell">
                            {r.result_time ?? "—"}
                          </td>
                          <td className="px-3 py-2 text-right">
                            <span className="font-display text-base text-gold">
                              {Number(r.points).toLocaleString("es-ES")}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </article>
  );
}
