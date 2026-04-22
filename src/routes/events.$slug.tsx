import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/events/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `Resultados — ${params.slug} · RollerZone` },
      {
        name: "description",
        content: `Clasificación final del evento ${params.slug} en RollerZone.`,
      },
    ],
  }),
  component: EventResultsPage,
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <div className="mx-auto max-w-2xl px-6 py-16 text-center">
        <h1 className="font-display text-2xl tracking-widest">Error cargando resultados</h1>
        <p className="mt-3 text-muted-foreground">{error.message}</p>
        <button
          onClick={() => {
            router.invalidate();
            reset();
          }}
          className="font-condensed mt-5 inline-flex items-center gap-2 bg-gold px-4 py-2 text-xs font-bold uppercase tracking-widest text-background"
        >
          Reintentar
        </button>
      </div>
    );
  },
  notFoundComponent: () => (
    <div className="mx-auto max-w-2xl px-6 py-16 text-center">
      <h1 className="font-display text-2xl tracking-widest">Evento no encontrado</h1>
      <Link to="/" className="mt-5 inline-block text-gold hover:underline">
        Volver al inicio
      </Link>
    </div>
  ),
});

type Row = {
  id: string;
  event_name: string;
  event_slug: string | null;
  race: string | null;
  category: string | null;
  position: number;
  athlete_name: string;
  club: string | null;
  race_time: string | null;
  status: "en_vivo" | "finalizado";
  sort_order: number;
};

function EventResultsPage() {
  const { slug } = Route.useParams();
  const [rows, setRows] = useState<Row[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fetchRows = async () => {
      const { data } = await supabase
        .from("live_results")
        .select(
          "id, event_name, event_slug, race, category, position, athlete_name, club, race_time, status, sort_order",
        )
        .eq("published", true)
        .eq("event_slug", slug)
        .eq("status", "finalizado")
        .order("race", { ascending: true })
        .order("category", { ascending: true })
        .order("position", { ascending: true });
      if (!cancelled) setRows((data as Row[]) ?? []);
    };
    fetchRows();

    const channel = supabase
      .channel(`event-results-${slug}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "live_results", filter: `event_slug=eq.${slug}` },
        () => fetchRows(),
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [slug]);

  const groups = useMemo(() => {
    if (!rows) return [];
    const map = new Map<string, { race: string | null; category: string | null; rows: Row[] }>();
    for (const r of rows) {
      const key = `${r.race ?? ""}::${r.category ?? ""}`;
      if (!map.has(key)) {
        map.set(key, { race: r.race, category: r.category, rows: [] });
      }
      map.get(key)!.rows.push(r);
    }
    return Array.from(map.values());
  }, [rows]);

  const eventName = rows?.[0]?.event_name ?? slug;

  return (
    <main className="mx-auto max-w-5xl px-5 py-10 md:px-6 md:py-14">
      <Link
        to="/"
        className="font-condensed mb-5 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground hover:text-gold"
      >
        <ArrowLeft className="h-3 w-3" /> Inicio
      </Link>

      <div className="mb-8 border-b border-border pb-4">
        <div className="font-condensed mb-2 inline-flex items-center gap-2 bg-gold/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[3px] text-gold">
          <Trophy className="h-3 w-3" /> Clasificación final
        </div>
        <h1 className="font-display text-3xl uppercase tracking-widest md:text-5xl">
          {eventName}
        </h1>
      </div>

      {rows === null ? (
        <div className="h-40 animate-pulse bg-surface" />
      ) : groups.length === 0 ? (
        <div className="border border-border bg-surface p-8 text-center">
          <p className="font-condensed text-sm uppercase tracking-widest text-muted-foreground">
            Aún no hay resultados finalizados para este evento.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {groups.map((g) => (
            <section
              key={`${g.race}-${g.category}`}
              className="border border-border bg-surface/60"
            >
              <div className="border-b border-border bg-background/60 px-4 py-3">
                <h2 className="font-display text-lg uppercase tracking-widest text-gold">
                  {g.race ?? "Carrera"}
                </h2>
                {g.category && (
                  <span className="font-condensed text-[10px] uppercase tracking-widest text-muted-foreground">
                    {g.category}
                  </span>
                )}
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="font-condensed border-b border-border bg-background/30 text-left text-[10px] uppercase tracking-widest text-muted-foreground">
                    <th className="px-3 py-2 text-center">#</th>
                    <th className="px-3 py-2">Atleta</th>
                    <th className="hidden px-3 py-2 sm:table-cell">Club</th>
                    <th className="px-3 py-2 text-right">Tiempo</th>
                  </tr>
                </thead>
                <tbody>
                  {g.rows.map((r) => (
                    <tr
                      key={r.id}
                      className="border-b border-border last:border-0 hover:bg-background/40"
                    >
                      <td className="px-3 py-2.5 text-center">
                        <span
                          className={`font-display inline-flex h-6 w-6 items-center justify-center text-[11px] ${
                            r.position === 1
                              ? "bg-gold text-background"
                              : r.position === 2
                                ? "bg-foreground/30 text-background"
                                : r.position === 3
                                  ? "bg-amber-700/70 text-background"
                                  : "text-muted-foreground"
                          }`}
                        >
                          {r.position}
                        </span>
                      </td>
                      <td className="font-display px-3 py-2.5 uppercase tracking-wider">
                        {r.athlete_name}
                      </td>
                      <td className="hidden px-3 py-2.5 text-xs text-muted-foreground sm:table-cell">
                        {r.club ?? "—"}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-xs text-gold">
                        {r.race_time ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
