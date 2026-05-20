import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useLeagueSeasons, useLeagueRounds } from "@/lib/hub/useLeague";
import { RoundsList } from "@/components/hub/RoundsList";

export const Route = createFileRoute("/hub/$country/competicion/liga-nacional/resultados")({
  component: ResultadosLigaPage,
});

function ResultadosLigaPage() {
  const { country } = Route.useParams();
  const { seasons, current } = useLeagueSeasons(country);
  const [seasonId, setSeasonId] = useState<string | null>(null);
  const active = seasonId ?? current?.id ?? null;
  const { rounds, loading } = useLeagueRounds(active);

  const finished = rounds.filter((r) => r.status === "finished").reverse();

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-6 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <div className="font-ui text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4A017]">Liga Nacional</div>
          <h2 className="mt-1 font-display text-2xl md:text-3xl font-black text-[#F5F5F5]">Archivo de resultados</h2>
          <p className="mt-1 text-sm text-[#888]">Cada jornada con PDF, galería, vídeos y crónica RollerZone.</p>
        </div>
        {seasons.length > 0 && (
          <label className="inline-flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-widest text-[#888]">Temporada</span>
            <select
              value={active ?? ""}
              onChange={(e) => setSeasonId(e.target.value || null)}
              className="bg-[#0d0d0d] border border-[#2A2A2A] rounded px-3 py-2 text-sm text-[#F5F5F5] focus:outline-none focus:border-[#D4A017]"
            >
              {seasons.map((s) => (
                <option key={s.id} value={s.id}>{s.year_label ?? s.name}</option>
              ))}
            </select>
          </label>
        )}
      </div>

      {loading ? (
        <div className="text-sm text-[#888]">Cargando…</div>
      ) : finished.length === 0 ? (
        <div className="rounded-[6px] border border-dashed border-[#333] bg-[#141414] p-8 text-center text-sm text-[#888]">
          Aún no hay jornadas finalizadas en esta temporada.
        </div>
      ) : (
        <RoundsList rounds={finished} variant="results" />
      )}
    </div>
  );
}
