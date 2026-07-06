import { useMemo, useState } from "react";
import { Trophy, Filter, ChevronDown, ChevronUp } from "lucide-react";
import type { LeagueStanding } from "@/lib/hub/useLeague";

export function StandingsTable({ standings, compact = false, defaultDetailOpen = false }: { standings: LeagueStanding[]; compact?: boolean; defaultDetailOpen?: boolean }) {
  const [detailOpen, setDetailOpen] = useState(defaultDetailOpen);
  const showDetail = compact ? false : detailOpen;

  const categories = useMemo(
    () => Array.from(new Set(standings.map((s) => s.category).filter(Boolean))) as string[],
    [standings],
  );
  const genders = useMemo(
    () => Array.from(new Set(standings.map((s) => s.gender).filter(Boolean))) as string[],
    [standings],
  );

  const [category, setCategory] = useState<string>(categories[0] ?? "");
  const [gender, setGender] = useState<string>(genders[0] ?? "");

  const filtered = useMemo(
    () =>
      standings
        .filter((s) => (category ? s.category === category : true))
        .filter((s) => (gender ? s.gender === gender : true))
        .sort((a, b) => a.position - b.position),
    [standings, category, gender],
  );

  return (
    <div className="rounded-[6px] border border-[#2A2A2A] bg-[#141414] overflow-hidden">
      {!compact && (
        <div className="flex flex-wrap items-center gap-3 border-b border-[#2A2A2A] bg-[#1A1A1A] px-4 py-3">
          <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#888]">
            <Filter className="h-3 w-3" /> Filtros
          </span>
          {categories.length > 0 && (
            <Pill label="Categoría" value={category} setValue={setCategory} options={categories} />
          )}
          {genders.length > 0 && (
            <Pill
              label="Sexo"
              value={gender}
              setValue={setGender}
              options={genders}
              labelMap={{ M: "Masculino", F: "Femenino" }}
            />
          )}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-sm">
          <thead className="bg-[#1A1A1A]">
            <tr className="text-left text-[10px] uppercase tracking-widest text-[#888]">
              <th className="px-3 py-2.5 w-10">#</th>
              <th className="px-3 py-2.5">Club / Atleta</th>
              <th className="px-3 py-2.5 text-right">Pts</th>
              {showDetail && <th className="px-3 py-2.5 text-right">J</th>}
              {showDetail && <th className="px-3 py-2.5 text-right">V</th>}
              {showDetail && <th className="px-3 py-2.5 text-right">Pod</th>}
              {showDetail && <th className="px-3 py-2.5 text-right">Dif</th>}
            </tr>
          </thead>

          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={showDetail ? 7 : 3} className="px-3 py-8 text-center text-[#888]">
                  Sin datos para esta selección
                </td>
              </tr>
            )}
            {filtered.map((s, idx) => (
              <tr
                key={s.id}
                className={`border-t border-[#222] text-[#F5F5F5] ${idx < 3 ? "bg-[#D4A017]/[0.04]" : ""}`}
              >
                <td className="px-3 py-2.5 font-display font-black">
                  {idx < 3 ? (
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#D4A017] text-[#1A1A1A] text-[11px]">
                      {s.position}
                    </span>
                  ) : (
                    <span className="text-[#888]">{s.position}</span>
                  )}
                </td>
                <td className="px-3 py-2.5">
                  <div className="font-bold inline-flex items-center gap-2">
                    {idx === 0 && <Trophy className="h-3.5 w-3.5 text-[#D4A017]" />}
                    {s.club ?? s.athlete_name ?? "—"}
                  </div>
                </td>
                <td className="px-3 py-2.5 text-right font-display font-black text-[#D4A017]">
                  {s.points.toFixed(1)}
                </td>
                {showDetail && <td className="px-3 py-2.5 text-right text-[#B5B5B5]">{s.rounds_played}</td>}
                {showDetail && <td className="px-3 py-2.5 text-right text-[#B5B5B5]">{s.wins}</td>}
                {showDetail && <td className="px-3 py-2.5 text-right text-[#B5B5B5]">{s.podiums}</td>}
                {showDetail && (
                  <td className="px-3 py-2.5 text-right text-[#888]">
                    {s.point_diff != null ? s.point_diff.toFixed(1) : "—"}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!compact && filtered.length > 0 && (
        <button
          type="button"
          onClick={() => setDetailOpen((v) => !v)}
          className="font-condensed w-full border-t border-[#2A2A2A] bg-[#1A1A1A] px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-[#D4A017] hover:bg-[#212121] inline-flex items-center justify-center gap-2"
        >
          {showDetail ? (<><ChevronUp className="h-3 w-3" /> Ocultar detalle por jornadas y pruebas</>) : (<><ChevronDown className="h-3 w-3" /> Ver detalle por jornadas y pruebas</>)}
        </button>
      )}
    </div>
  );
}


function Pill({
  label,
  value,
  setValue,
  options,
  labelMap,
}: {
  label: string;
  value: string;
  setValue: (v: string) => void;
  options: string[];
  labelMap?: Record<string, string>;
}) {
  return (
    <label className="inline-flex items-center gap-2">
      <span className="text-[10px] uppercase tracking-widest text-[#888]">{label}</span>
      <select
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="bg-[#0d0d0d] border border-[#2A2A2A] rounded px-2 py-1 text-xs text-[#F5F5F5] focus:outline-none focus:border-[#D4A017]"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {labelMap?.[o] ?? o}
          </option>
        ))}
      </select>
    </label>
  );
}
