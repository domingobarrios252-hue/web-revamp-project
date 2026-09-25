/**
 * ResultsProvider — capa interna que entrega resultados NORMALIZADOS al frontend,
 * vengan de donde vengan. Hoy solo existe MANUAL (resultados manuales + CSV).
 * Los proveedores VeloPro están declarados pero NO implementados: no hacen
 * llamadas externas y siempre vuelven a MANUAL como respaldo.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

export type ResultsProviderKey = "manual" | "velopro_api" | "velopro_widget" | "velopro_embed";
export type ResultState = "upcoming" | "in_progress" | "provisional" | "official";

export type NormalizedResult = {
  id: string;
  scheduleItemId: string | null;
  race: string | null;
  category: string | null;
  gender: string | null;
  phase: string | null;
  position: number | null;
  bib: string | null;
  athlete: string;
  country: string | null;
  club: string | null;
  federation: string | null;
  time: string | null;
  gap: string | null;
  points: number | null;
  record: string | null;
  notes: string | null;
  state: ResultState;
  /** Fecha/hora de la prueba vinculada (para el filtro por día). */
  scheduledAt: string | null;
  sort: number;
};

export const RESULT_STATE_LABEL: Record<ResultState, string> = {
  upcoming: "Próximamente",
  in_progress: "En curso",
  provisional: "Provisional",
  official: "Oficial",
};

type ManualRow = {
  id: string;
  schedule_item_id: string | null;
  race: string | null;
  distance: string | null;
  category: string | null;
  gender: string | null;
  round: string | null;
  position: number | null;
  bib: string | null;
  athlete_name: string;
  country: string | null;
  club: string | null;
  federation: string | null;
  race_time: string | null;
  gap: string | null;
  points: number | null;
  record_mark: string | null;
  notes: string | null;
  result_status: string | null;
  status: string | null;
  sort_order: number | null;
};

function toState(r: ManualRow): ResultState {
  const s = r.result_status;
  if (s === "upcoming" || s === "in_progress" || s === "provisional" || s === "official") {
    // Una carrera aún en vivo nunca se presenta como oficial.
    if (r.status === "en_vivo" && s === "official") return "in_progress";
    return s;
  }
  return r.status === "en_vivo" ? "in_progress" : r.status === "proxima" ? "upcoming" : "official";
}

async function loadManual(
  sb: SupabaseClient,
  resultEventId: string,
  scheduleTimes: Map<string, string>,
): Promise<NormalizedResult[]> {
  const { data, error } = await sb
    .from("live_results")
    .select(
      "id,schedule_item_id,race,distance,category,gender,round,position,bib,athlete_name,country,club,federation,race_time,gap,points,record_mark,notes,result_status,status,sort_order",
    )
    .eq("result_event_id", resultEventId)
    .eq("published", true)
    .order("sort_order", { ascending: true })
    .limit(2000);
  if (error || !data) return [];
  return (data as ManualRow[]).map((r) => ({
    id: r.id,
    scheduleItemId: r.schedule_item_id,
    race: r.race || r.distance,
    category: r.category,
    gender: r.gender,
    phase: r.round,
    position: r.position,
    bib: r.bib,
    athlete: r.athlete_name,
    country: r.country,
    club: r.club,
    federation: r.federation,
    time: r.race_time,
    gap: r.gap,
    points: r.points,
    record: r.record_mark,
    notes: r.notes,
    state: toState(r),
    scheduledAt: r.schedule_item_id ? (scheduleTimes.get(r.schedule_item_id) ?? null) : null,
    sort: r.sort_order ?? 0,
  }));
}

/**
 * Punto único de lectura. Para cualquier proveedor VeloPro (aún sin
 * documentación ni autorización) se usa MANUAL: la página nunca depende de
 * un servicio externo. Cualquier clave futura irá solo en el servidor.
 */
export async function loadEventResults(
  sb: SupabaseClient,
  resultEventId: string,
  _provider: ResultsProviderKey | null | undefined,
  scheduleTimes: Map<string, string>,
): Promise<NormalizedResult[]> {
  return loadManual(sb, resultEventId, scheduleTimes);
}
