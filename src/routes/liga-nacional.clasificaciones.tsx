import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/liga-nacional/clasificaciones")({
  head: () => ({
    meta: [
      { title: "Liga Nacional — Clasificaciones completas | RollerZone" },
      {
        name: "description",
        content:
          "Clasificaciones completas de la Liga Nacional de patinaje de velocidad por grupo y división.",
      },
      { property: "og:title", content: "Liga Nacional — Clasificaciones completas" },
      {
        property: "og:description",
        content:
          "Consulta todas las clasificaciones de la Liga Nacional por grupo y división en RollerZone.es.",
      },
    ],
  }),
  component: LigaNacionalClasificaciones,
});

type Group = {
  id: string;
  competition_group: string;
  division_name: string;
  season: string;
  display_order: number;
  visible: boolean;
};

type Row = {
  id: string;
  group_id: string;
  position: number;
  club_name: string;
  club_logo: string | null;
  points: number;
};

type GroupWithRows = Group & { rows: Row[] };

function LigaNacionalClasificaciones() {
  const [groups, setGroups] = useState<GroupWithRows[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const sb = supabase as any;
      const { data: g } = await sb
        .from("home_standings_groups")
        .select("*")
        .eq("visible", true)
        .order("display_order", { ascending: true });
      if (!g || cancelled) {
        if (!cancelled) setGroups([]);
        return;
      }
      const ids = g.map((x: Group) => x.id);
      const { data: r } = ids.length
        ? await sb
            .from("home_standings_rows")
            .select("*")
            .in("group_id", ids)
            .order("position", { ascending: true })
        : { data: [] };
      if (cancelled) return;
      const byGroup = new Map<string, Row[]>();
      (r ?? []).forEach((row: Row) => {
        const arr = byGroup.get(row.group_id) ?? [];
        arr.push(row);
        byGroup.set(row.group_id, arr);
      });
      setGroups(g.map((x: Group) => ({ ...x, rows: byGroup.get(x.id) ?? [] })));
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-5 py-10 md:px-6 md:py-14">
      <div className="mb-8 border-b border-border pb-4">
        <Link
          to="/"
          className="font-condensed inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground hover:text-gold"
        >
          <ArrowLeft className="h-3 w-3" /> Volver a la Home
        </Link>
        <div className="mt-3 flex items-center gap-3">
          <Trophy className="h-6 w-6 text-gold" />
          <h1 className="font-display text-3xl uppercase tracking-widest md:text-4xl">
            Liga Nacional — Clasificaciones completas
          </h1>
        </div>
        <div className="mt-2 h-[3px] w-24 bg-gold" aria-hidden="true" />
        <p className="mt-3 text-sm text-muted-foreground">
          Todas las clasificaciones publicadas por grupo y división.
        </p>
      </div>

      {groups === null ? (
        <div className="text-sm text-muted-foreground">Cargando clasificaciones…</div>
      ) : groups.length === 0 ? (
        <div className="rounded-md border border-border bg-surface p-8 text-center text-sm text-muted-foreground">
          Aún no hay clasificaciones publicadas.
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {groups.map((g) => (
            <section
              key={g.id}
              id={g.id}
              className="overflow-hidden rounded-xl border border-border bg-gradient-to-b from-surface to-surface-2/40"
            >
              <div className="border-b border-border bg-black/30 px-4 py-3">
                <div className="font-condensed text-[10px] font-bold uppercase tracking-[2.5px] text-gold">
                  {g.competition_group}
                </div>
                <h2 className="font-display mt-1 text-lg uppercase leading-tight tracking-wide text-foreground">
                  {g.division_name}
                </h2>
                <div className="font-condensed mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">
                  {g.season}
                </div>
              </div>
              <div className="px-2 py-3">
                <div className="font-condensed grid grid-cols-[36px_1fr_60px] gap-2 px-2 pb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  <span>Pos</span>
                  <span>Club</span>
                  <span className="text-right">Pts</span>
                </div>
                {g.rows.length === 0 ? (
                  <div className="px-2 py-6 text-center text-xs text-muted-foreground">
                    Sin datos
                  </div>
                ) : (
                  <ul className="divide-y divide-border/60">
                    {g.rows.map((r) => (
                      <li
                        key={r.id}
                        className="grid grid-cols-[36px_1fr_60px] items-center gap-2 px-2 py-2"
                      >
                        <span
                          className={
                            "font-display text-sm font-black " +
                            (r.position <= 3 ? "text-gold" : "text-muted-foreground")
                          }
                        >
                          {r.position}
                        </span>
                        <span className="flex min-w-0 items-center gap-2">
                          {r.club_logo ? (
                            <img
                              src={r.club_logo}
                              alt=""
                              className="h-6 w-6 shrink-0 rounded-sm bg-black/40 object-contain"
                              loading="lazy"
                            />
                          ) : (
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm bg-black/40 text-[9px] font-bold text-gold/70">
                              {r.club_name.slice(0, 2).toUpperCase()}
                            </span>
                          )}
                          <span className="truncate text-[13px] font-semibold text-foreground">
                            {r.club_name}
                          </span>
                        </span>
                        <span className="font-display text-right text-sm font-black text-gold">
                          {Number(r.points).toFixed(0)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
