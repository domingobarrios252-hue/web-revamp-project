/**
 * Importación de clasificaciones Vensport (autorizada por VeloPro). Solo servidor.
 * Respeta Crawl-delay 30 s, la parada de emergencia y la parada de seguridad de results_sync_state.
 * Aún NO está conectada al aviso programado: solo importación controlada por pruebas concretas.
 */
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  VENSPORT_BASE, VENSPORT_MIN_DELAY_MS, VENSPORT_UA,
  matchLink, parseFinalRanking, parseRaceTitle, rankingToRows, type VensportLink,
} from "@/lib/results/vensportSource";

type Item = { divisionId: string; title: string; section: string };
export type VensportImportReport = { ok: boolean; error?: string; races: { title: string; link: string | null; complete: boolean; rows: number }[] };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function runVensportImport(key: string, items: Item[]): Promise<VensportImportReport> {
  const { data: st } = await supabaseAdmin.from("results_sync_state").select("emergency_stop,halted,target_result_event_id").eq("key", key).maybeSingle();
  if (!st) return { ok: false, error: "Configuración no encontrada", races: [] };
  if (st.emergency_stop) return { ok: false, error: "Interruptor de emergencia activo", races: [] };
  if (st.halted) return { ok: false, error: "Sincronización detenida", races: [] };
  const { data: links } = await supabaseAdmin.from("asu26_results_links").select("source_competition_id,label,schedule_item_id,link_status").eq("sync_key", key);
  const report: VensportImportReport = { ok: true, races: [] };
  for (const [i, it] of items.slice(0, 8).entries()) {
    if (i) await sleep(VENSPORT_MIN_DELAY_MS + 1000);
    const res = await fetch(`${VENSPORT_BASE}/divisions/${it.divisionId}`, { headers: { "User-Agent": VENSPORT_UA }, signal: AbortSignal.timeout(20000) });
    if (res.status === 429 || res.status === 401 || res.status === 403) {
      await supabaseAdmin.from("results_sync_state").update({ halted: true, halted_at: new Date().toISOString(), halt_reason: `Vensport respondió ${res.status}` }).eq("key", key);
      return { ...report, ok: false, error: `Vensport respondió ${res.status}: sincronización detenida` };
    }
    if (!res.ok) return { ...report, ok: false, error: `Vensport respondió ${res.status}` };
    const race = parseRaceTitle(it.divisionId, it.title, it.section);
    const rk = parseFinalRanking(await res.text(), race);
    const link = matchLink(race, (links ?? []) as VensportLink[]);
    const rows = link ? rankingToRows(rk, link, st.target_result_event_id) : [];
    if (rows.length) {
      const { error } = await supabaseAdmin.from("live_results").upsert(rows as never, { onConflict: "result_event_id,source_result_id" });
      if (error) return { ...report, ok: false, error: `No se pudieron guardar: ${error.message}` };
    }
    report.races.push({ title: race.title, link: link?.label ?? null, complete: rk.complete, rows: rows.length });
  }
  return report;
}
