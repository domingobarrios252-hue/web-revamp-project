import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { Trophy, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useMvpRanking, type RankingRow } from "@/lib/hub/useMvpRanking";

const TIER_LABEL: Record<string, string> = {
  elite: "Élite",
  estrella: "Estrella",
  promesa: "Promesa",
};
const GENDER_LABEL: Record<string, string> = {
  masculino: "Masculino",
  femenino: "Femenino",
};
const TIER_ORDER: Array<"elite" | "estrella" | "promesa"> = ["elite", "estrella", "promesa"];
const GENDER_ORDER: Array<"masculino" | "femenino"> = ["masculino", "femenino"];

export function MvpRanking({ country }: { country: string }) {
  const { seasons, rows, loading, activeSeasonId, setActiveSeasonId } = useMvpRanking(country);

  const grouped = useMemo(() => {
    const map = new Map<string, RankingRow[]>();
    for (const r of rows) {
      const key = `${r.tier}::${r.gender}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    }
    for (const list of map.values()) list.sort((a, b) => (b.points ?? 0) - (a.points ?? 0));
    return map;
  }, [rows]);

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-6 py-8 md:py-12 space-y-10">
      <header className="space-y-3">
        <div className="font-ui text-[11px] font-bold uppercase tracking-[0.2em] text-[#D4A017]">
          MVP · {country.toUpperCase()}
        </div>
        <h1 className="font-display text-4xl md:text-5xl font-black text-[#F5F5F5]">
          Ranking MVP de la temporada
        </h1>
        <p className="max-w-2xl text-sm text-[#B5B5B5]">
          Clasificación dinámica por puntos en seis categorías: Élite, Estrella y Promesa, en masculino y femenino.
        </p>

        {seasons.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {seasons.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSeasonId(s.id)}
                className={`font-ui px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest rounded-[4px] ${
                  s.id === activeSeasonId
                    ? "bg-[#D4A017] text-[#1A1A1A]"
                    : "border border-[#333] text-[#B5B5B5] hover:text-[#D4A017]"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        )}
      </header>

      {loading ? (
        <p className="text-sm text-[#888]">Cargando ranking…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-[#888]">No hay clasificaciones publicadas para esta temporada.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {TIER_ORDER.flatMap((tier) =>
            GENDER_ORDER.map((gender) => {
              const list = grouped.get(`${tier}::${gender}`) ?? [];
              if (list.length === 0) return null;
              return (
                <RankingCard
                  key={`${tier}-${gender}`}
                  title={`${TIER_LABEL[tier]} · ${GENDER_LABEL[gender]}`}
                  rows={list}
                />
              );
            }),
          )}
        </div>
      )}
    </div>
  );
}

function RankingCard({ title, rows }: { title: string; rows: RankingRow[] }) {
  return (
    <section className="border border-[#2A2A2A] bg-[#161616] rounded-[8px] overflow-hidden">
      <header className="flex items-center gap-2 border-b border-[#2A2A2A] bg-[#1B1B1B] px-4 py-3">
        <Trophy className="h-4 w-4 text-[#D4A017]" />
        <h2 className="font-display text-base uppercase tracking-widest text-[#F5F5F5]">{title}</h2>
      </header>
      <ol className="divide-y divide-[#222]">
        {rows.map((r, idx) => {
          const pos = idx + 1;
          const trend =
            r.previous_position == null
              ? "new"
              : r.previous_position > pos
                ? "up"
                : r.previous_position < pos
                  ? "down"
                  : "same";
          return (
            <li key={r.id} className="flex items-center gap-3 px-4 py-3">
              <span
                className={`font-display w-8 text-center text-lg ${
                  pos === 1 ? "text-[#D4A017]" : "text-[#888]"
                }`}
              >
                {pos}
              </span>
              {r.photo_url ? (
                <img loading="lazy" decoding="async"
                  src={r.photo_url}
                  alt={r.full_name}
                  className="h-10 w-10 rounded-full object-cover border border-[#2A2A2A]"
                />
              ) : (
                <div className="h-10 w-10 rounded-full bg-[#222]" />
              )}
              <div className="flex-1 min-w-0">
                {r.skater_id ? (
                  <Link
                    to="/patinadores/$slug"
                    params={{ slug: r.skater_id }}
                    className="font-display text-sm text-[#F5F5F5] hover:text-[#D4A017] truncate block"
                  >
                    {r.full_name}
                  </Link>
                ) : (
                  <p className="font-display text-sm text-[#F5F5F5] truncate">{r.full_name}</p>
                )}
                <p className="text-[11px] text-[#888] truncate">
                  {[r.club, r.region].filter(Boolean).join(" · ") || "—"}
                </p>
              </div>
              <div className="text-right">
                <div className="font-display text-lg text-[#D4A017]">{r.points ?? 0}</div>
                <TrendBadge trend={trend} />
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function TrendBadge({ trend }: { trend: "up" | "down" | "same" | "new" }) {
  if (trend === "new")
    return <span className="font-ui text-[9px] uppercase tracking-widest text-[#D4A017]">Nuevo</span>;
  if (trend === "up")
    return (
      <span className="inline-flex items-center gap-0.5 text-[10px] text-green-500">
        <TrendingUp className="h-3 w-3" />
      </span>
    );
  if (trend === "down")
    return (
      <span className="inline-flex items-center gap-0.5 text-[10px] text-red-500">
        <TrendingDown className="h-3 w-3" />
      </span>
    );
  return (
    <span className="inline-flex items-center gap-0.5 text-[10px] text-[#666]">
      <Minus className="h-3 w-3" />
    </span>
  );
}
