import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { Trophy, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Skater = {
  id: string;
  full_name: string;
  slug: string;
  photo_url: string | null;
  category: string | null;
  gender: string | null;
  total_points: number;
  clubs: { name: string; logo_url: string | null } | null;
  regions: { name: string; code: string; flag_url: string | null } | null;
};

export const Route = createFileRoute("/ranking/")({
  head: () => ({
    meta: [
      { title: "Ranking de patinadores — RollerZone" },
      {
        name: "description",
        content:
          "Ranking nacional de patinaje de velocidad: ficha individual de cada patinador con club, marcas, puntos y comunidad autónoma.",
      },
      { property: "og:title", content: "Ranking — RollerZone" },
      {
        property: "og:description",
        content: "Clasificación de patinadores de velocidad con perfiles individuales.",
      },
    ],
  }),
  component: RankingPage,
});

function RankingPage() {
  const [skaters, setSkaters] = useState<Skater[] | null>(null);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState<string>("");
  const [region, setRegion] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("skaters")
      .select(
        "id, full_name, slug, photo_url, category, gender, total_points, clubs(name, logo_url), regions(name, code, flag_url)"
      )
      .eq("active", true)
      .order("total_points", { ascending: false })
      .limit(500)
      .then(({ data }) => {
        if (!cancelled) setSkaters((data as unknown as Skater[]) ?? []);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const categories = useMemo(
    () => Array.from(new Set((skaters ?? []).map((s) => s.category).filter(Boolean))) as string[],
    [skaters]
  );
  const regions = useMemo(
    () => Array.from(new Set((skaters ?? []).map((s) => s.regions?.name).filter(Boolean))) as string[],
    [skaters]
  );

  const filtered = (skaters ?? []).filter((s) => {
    if (q && !s.full_name.toLowerCase().includes(q.toLowerCase())) return false;
    if (category && s.category !== category) return false;
    if (region && s.regions?.name !== region) return false;
    return true;
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-8">
      <div className="mb-6 flex items-center gap-3 border-b border-border pb-4">
        <Trophy className="h-7 w-7 text-gold" />
        <h1 className="font-display text-3xl tracking-widest md:text-4xl">
          Ranking <span className="text-gold">patinadores</span>
        </h1>
      </div>

      {/* Filtros */}
      <div className="mb-6 grid gap-3 md:grid-cols-[1fr_180px_180px]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar patinador…"
            className="font-condensed h-10 w-full border border-border bg-surface pl-10 pr-3 text-sm uppercase tracking-wider text-foreground placeholder:text-muted-foreground focus:border-gold focus:outline-none"
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="font-condensed h-10 border border-border bg-surface px-3 text-xs uppercase tracking-wider text-foreground"
        >
          <option value="">Todas categorías</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          className="font-condensed h-10 border border-border bg-surface px-3 text-xs uppercase tracking-wider text-foreground"
        >
          <option value="">Todas comunidades</option>
          {regions.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      {skaters === null ? (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-32 animate-pulse bg-surface" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="font-condensed text-muted-foreground">
          No hay patinadores que coincidan con los filtros. Pide al admin que añada
          patinadores desde el panel.
        </p>
      ) : (
        <div className="overflow-hidden border border-border">
          <table className="w-full">
            <thead className="border-b border-border bg-surface">
              <tr className="font-condensed text-[11px] uppercase tracking-widest text-muted-foreground">
                <th className="w-16 px-3 py-3 text-left">Pos</th>
                <th className="px-3 py-3 text-left">Patinador</th>
                <th className="hidden px-3 py-3 text-left md:table-cell">Club</th>
                <th className="hidden px-3 py-3 text-left md:table-cell">CCAA</th>
                <th className="hidden px-3 py-3 text-left sm:table-cell">Cat.</th>
                <th className="px-3 py-3 text-right">Puntos</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, i) => (
                <tr
                  key={s.id}
                  className="border-b border-border/60 transition-colors last:border-0 hover:bg-surface/60"
                >
                  <td className="px-3 py-3">
                    <span
                      className={`font-display text-lg ${
                        i === 0
                          ? "text-gold"
                          : i < 3
                            ? "text-gold/70"
                            : "text-muted-foreground"
                      }`}
                    >
                      {i + 1}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <Link
                      to="/ranking/$slug"
                      params={{ slug: s.slug }}
                      className="group flex items-center gap-3"
                    >
                      <div className="h-10 w-10 shrink-0 overflow-hidden border border-border bg-surface-2">
                        {s.photo_url ? (
                          <img
                            src={s.photo_url}
                            alt={s.full_name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="font-display flex h-full w-full items-center justify-center text-xs text-gold/40">
                            RZ
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-display truncate text-sm uppercase tracking-wider group-hover:text-gold">
                          {s.full_name}
                        </div>
                        <div className="font-condensed text-[11px] uppercase tracking-wider text-muted-foreground md:hidden">
                          {s.clubs?.name ?? "—"}
                        </div>
                      </div>
                    </Link>
                  </td>
                  <td className="hidden px-3 py-3 md:table-cell">
                    <div className="flex items-center gap-2">
                      {s.clubs?.logo_url && (
                        <img
                          src={s.clubs.logo_url}
                          alt=""
                          className="h-6 w-6 object-contain"
                        />
                      )}
                      <span className="font-condensed text-sm text-foreground/80">
                        {s.clubs?.name ?? "—"}
                      </span>
                    </div>
                  </td>
                  <td className="hidden px-3 py-3 md:table-cell">
                    <div className="flex items-center gap-2">
                      {s.regions?.flag_url ? (
                        <img
                          src={s.regions.flag_url}
                          alt=""
                          className="h-4 w-6 object-cover"
                        />
                      ) : (
                        <span className="inline-flex h-4 w-6 items-center justify-center bg-surface-2 text-[9px] font-bold text-muted-foreground">
                          {s.regions?.code ?? "—"}
                        </span>
                      )}
                      <span className="font-condensed text-xs uppercase text-muted-foreground">
                        {s.regions?.name ?? "—"}
                      </span>
                    </div>
                  </td>
                  <td className="hidden px-3 py-3 sm:table-cell">
                    <span className="font-condensed text-xs uppercase text-muted-foreground">
                      {s.category ?? "—"}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right">
                    <span className="font-display text-lg text-gold">
                      {Number(s.total_points).toLocaleString("es-ES")}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
