import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronDown, ChevronUp, ListOrdered, CalendarDays } from "lucide-react";
import { useLeagueSeasons, useLeagueStandings, useLeagueRounds } from "@/lib/hub/useLeague";
import { StandingsTable } from "@/components/hub/StandingsTable";
import { RoundsList } from "@/components/hub/RoundsList";

export const Route = createFileRoute("/hub/$country/competicion/liga-nacional/clasificaciones")({
  component: ClasificacionesPage,
});

function ClasificacionesPage() {
  const { country } = Route.useParams();
  const { seasons, current, loading: lSeasons } = useLeagueSeasons(country);
  const [seasonId, setSeasonId] = useState<string | null>(null);
  const active = seasonId ?? current?.id ?? null;
  const { standings, loading } = useLeagueStandings(active);
  const { rounds, loading: lRounds } = useLeagueRounds(active);
  const [detailOpen, setDetailOpen] = useState(false);

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-6 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <div className="font-ui text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4A017]">Liga Nacional</div>
          <h2 className="mt-1 font-display text-2xl md:text-3xl font-black text-[#F5F5F5]">Clasificaciones</h2>
          <p className="mt-1 text-sm text-[#888]">Vista simplificada por defecto. Abre el detalle para ver jornadas y pruebas.</p>
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

      <div className="mb-4 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#888]">
        <ListOrdered className="h-3 w-3 text-[#D4A017]" />
        Clasificación general
      </div>

      {(loading || lSeasons) ? (
        <div className="text-sm text-[#888]">Cargando…</div>
      ) : (
        <StandingsTable standings={standings} />
      )}

      <div className="mt-8">
        <button
          type="button"
          onClick={() => setDetailOpen((v) => !v)}
          className="font-condensed w-full rounded-[6px] border border-[#2A2A2A] bg-[#141414] px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-[#D4A017] hover:bg-[#1A1A1A] inline-flex items-center justify-center gap-2"
        >
          <CalendarDays className="h-4 w-4" />
          {detailOpen ? (
            <>Ocultar detalle por jornadas y pruebas <ChevronUp className="h-3 w-3" /></>
          ) : (
            <>Ver detalle por jornadas y pruebas <ChevronDown className="h-3 w-3" /></>
          )}
        </button>

        {detailOpen && (
          <div className="mt-4 space-y-4">
            <div className="flex items-center justify-between border-b border-[#2A2A2A] pb-2">
              <h3 className="font-display text-lg font-black uppercase tracking-wide text-[#F5F5F5]">
                Jornadas y pruebas
              </h3>
              <Link
                to="/hub/$country/competicion/liga-nacional/resultados"
                params={{ country }}
                className="text-[11px] uppercase tracking-widest text-[#D4A017] hover:underline"
              >
                Archivo completo
              </Link>
            </div>
            {lRounds ? (
              <div className="text-sm text-[#888]">Cargando jornadas…</div>
            ) : rounds.length === 0 ? (
              <div className="rounded-[6px] border border-dashed border-[#333] bg-[#141414] p-8 text-center text-sm text-[#888]">
                Aún no hay jornadas publicadas para esta temporada.
              </div>
            ) : (
              <RoundsList rounds={rounds} variant="calendar" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
