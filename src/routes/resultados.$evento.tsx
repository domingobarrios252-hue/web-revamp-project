import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, Medal, Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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
  points: number | null;
  status: "en_vivo" | "finalizado" | "proxima";
  sort_order: number;
};

export const Route = createFileRoute("/resultados/$evento")({
  loader: async ({ params }) => {
    const { data, error } = await supabase
      .from("live_results")
      .select("id, event_name, event_slug, race, category, position, athlete_name, club, race_time, points, status, sort_order")
      .eq("event_slug", params.evento)
      .eq("published", true)
      .order("sort_order", { ascending: true })
      .order("position", { ascending: true });
    if (error) throw error;
    if (!data || data.length === 0) throw notFound();
    return { rows: data as ResultRow[], evento: params.evento };
  },
  head: ({ loaderData }) => {
    const title = loaderData?.rows?.[0]?.event_name ?? "Resultados";
    return {
      meta: [
        { title: `${title} — Resultados RollerZone` },
        { name: "description", content: `Clasificaciones completas de ${title} en RollerZone.` },
      ],
    };
  },
  notFoundComponent: () => (
    <div className="mx-auto max-w-3xl px-5 py-20 text-center">
      <h1 className="font-display text-3xl uppercase tracking-widest">Resultados no encontrados</h1>
      <p className="mt-3 text-muted-foreground">No hay clasificaciones publicadas para este evento.</p>
      <Link to="/" className="font-condensed mt-6 inline-flex items-center gap-2 border border-border px-5 py-2 text-xs font-bold uppercase tracking-widest text-gold hover:bg-surface">
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
  const { rows } = Route.useLoaderData();
  const eventName = rows[0]?.event_name ?? "Resultados";
  const groups = groupRows(rows);

  return (
    <main className="mx-auto max-w-7xl px-5 py-10 md:px-6">
      <Link to="/" className="font-condensed mb-6 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-gold">
        <ArrowLeft className="h-4 w-4" /> Volver a RollerZone
      </Link>

      <header className="border-b border-border pb-6">
        <div className="font-condensed inline-flex items-center gap-2 bg-tv-red px-2.5 py-1 text-[10px] font-bold uppercase tracking-[3px] text-foreground">
          <Trophy className="h-3.5 w-3.5" /> Resultados oficiales
        </div>
        <h1 className="font-display mt-3 text-4xl uppercase leading-none tracking-widest md:text-6xl">{eventName}</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">Clasificaciones completas por prueba, categoría y estado de carrera.</p>
      </header>

      <section className="mt-8 grid gap-5">
        {groups.map((group) => (
          <article key={group.key} className="border border-border bg-surface">
            <div className="flex flex-col gap-2 border-b border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-display text-2xl uppercase tracking-wider">{group.title}</h2>
                <p className="font-condensed text-[11px] uppercase tracking-widest text-muted-foreground">{group.category || "Clasificación general"}</p>
              </div>
              <StatusBadge status={group.rows[0]?.status ?? "finalizado"} />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-sm">
                <thead className="border-b border-border bg-background/60">
                  <tr className="font-condensed text-left text-[10px] uppercase tracking-widest text-muted-foreground">
                    <th className="px-4 py-2">Pos</th>
                    <th className="px-4 py-2">Patinador</th>
                    <th className="px-4 py-2">Club</th>
                    <th className="px-4 py-2">Tiempo</th>
                    <th className="px-4 py-2">Puntos</th>
                  </tr>
                </thead>
                <tbody>
                  {group.rows.map((row) => (
                    <tr key={row.id} className="border-b border-border/70 last:border-0">
                      <td className="px-4 py-3"><span className="font-mono text-gold">{row.position}</span></td>
                      <td className="px-4 py-3 font-semibold">{row.athlete_name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{row.club || "—"}</td>
                      <td className="px-4 py-3 font-mono">{row.race_time || "—"}</td>
                      <td className="px-4 py-3 font-mono text-muted-foreground">{row.points ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}

function StatusBadge({ status }: { status: ResultRow["status"] }) {
  const label = status === "en_vivo" ? "En directo" : status === "proxima" ? "Próxima" : "Finalizada";
  return <span className="font-condensed inline-flex items-center gap-1.5 border border-border px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-gold"><Medal className="h-3.5 w-3.5" /> {label}</span>;
}

function groupRows(rows: ResultRow[]) {
  const map = new Map<string, { key: string; title: string; category: string; rows: ResultRow[] }>();
  for (const row of rows) {
    const key = `${row.race ?? "General"}::${row.category ?? ""}`;
    if (!map.has(key)) map.set(key, { key, title: row.race || "General", category: row.category || "", rows: [] });
    map.get(key)!.rows.push(row);
  }
  return Array.from(map.values()).map((group) => ({ ...group, rows: group.rows.sort((a, b) => a.position - b.position) }));
}