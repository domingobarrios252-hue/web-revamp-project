/**
 * Importación de clasificaciones Vensport (autorizada por VeloPro). Solo servidor.
 * Respeta Crawl-delay 30 s, la parada de emergencia y la parada de seguridad de results_sync_state.
 */
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  VENSPORT_BASE, VENSPORT_MIN_DELAY_MS, VENSPORT_UA,
  matchLink, parseFinalRanking, parseHomeSections, parseRaceTitle, parseSectionRaces, rankingToRows, type VensportLink,
} from "@/lib/results/vensportSource";

// ───────────── Sincronización automática (1 página por aviso, avisos cada 30 s) ─────────────

const MAX_FAILURES = 5;
const HOME_EVERY_MS = 60 * 60_000; // portada y apartados: 1 vez por hora
const INCOMPLETE_EVERY_MS = 5 * 60_000; // pruebas sin clasificación completa
const COMPLETE_EVERY_MS = 10 * 60_000; // clasificaciones completas (correcciones)
const asuDay = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Asuncion" }).format(d);

type Page = { division_id: string; title: string; section: string; is_section: boolean; source_competition_id: string | null; competition_date: string | null; complete: boolean; last_fetched_at: string | null };
export type TickOutcome = { ok: boolean; skipped?: string; page?: string; rows?: number; complete?: boolean; retired?: number; error?: string; halted?: boolean };

function pickPage(pages: Page[], now: number): Page | null {
  const today = asuDay(new Date(now));
  const yesterday = asuDay(new Date(now - 86400_000));
  const age = (p: Page) => now - (p.last_fetched_at ? Date.parse(p.last_fetched_at) : 0);
  const races = pages.filter((p) => p.source_competition_id && p.competition_date && p.competition_date <= today && p.competition_date >= yesterday);
  const inc = races.filter((p) => !p.complete && age(p) >= INCOMPLETE_EVERY_MS).sort((a, b) => age(b) - age(a));
  if (inc.length) return inc[0];
  const done = races.filter((p) => p.complete && p.competition_date === today && age(p) >= COMPLETE_EVERY_MS).sort((a, b) => age(b) - age(a));
  if (done.length) return done[0];
  const secs = pages.filter((p) => p.is_section && age(p) >= HOME_EVERY_MS).sort((a, b) => age(b) - age(a));
  return secs[0] ?? null;
}

export async function runVensportTick(key: string, mode: "scheduled" | "manual" = "scheduled"): Promise<TickOutcome> {
  const { data: st } = await supabaseAdmin.from("results_sync_state").select("*").eq("key", key).maybeSingle();
  if (!st) return { ok: false, error: "Configuración no encontrada" };
  if (st.emergency_stop) return { ok: true, skipped: "Interruptor de emergencia activo" };
  if (st.halted) return { ok: true, skipped: "Sincronización detenida: requiere reactivación en Admin" };
  const now = new Date();
  if (mode === "scheduled") {
    if (!st.enabled) return { ok: true, skipped: "Automatización desactivada" };
    const day = asuDay(now);
    if (day < st.active_from || day > st.active_to) return { ok: true, skipped: "Fuera de jornada" };
  }

  // Reserva atómica: nunca menos de 30 s entre consultas a Vensport.
  const cutoff = new Date(now.getTime() - VENSPORT_MIN_DELAY_MS + 1000).toISOString();
  const { data: got } = await supabaseAdmin
    .from("results_sync_state")
    .update({ vensport_last_fetch_at: now.toISOString(), last_attempt_at: now.toISOString() } as never)
    .eq("key", key).eq("emergency_stop", false).eq("halted", false)
    .or(`vensport_last_fetch_at.is.null,vensport_last_fetch_at.lt.${cutoff}`)
    .select("key");
  if (!got || got.length === 0) return { ok: true, skipped: "Menos de 30 s desde la última consulta" };

  try {
    const out = await tickCore(key, st as never, now, mode);
    await supabaseAdmin.from("results_sync_state").update({ last_success_at: new Date().toISOString(), last_error: null, consecutive_failures: 0, ...(out.rows !== undefined ? { last_rows: out.rows } : {}) } as never).eq("key", key);
    return out;
  } catch (e) {
    const hard = e instanceof SourceBlock;
    const failures = ((st as { consecutive_failures?: number }).consecutive_failures ?? 0) + 1;
    const halt = hard || failures >= MAX_FAILURES;
    const msg = (e as Error).message || "Error interno";
    await supabaseAdmin.from("results_sync_state").update({
      last_error: `Vensport: ${msg}`.slice(0, 500), consecutive_failures: failures,
      ...(halt ? { halted: true, halted_at: new Date().toISOString(), halt_reason: hard ? `Vensport: ${msg}` : `${failures} errores consecutivos (Vensport)` } : {}),
    } as never).eq("key", key);
    return { ok: false, error: msg, halted: halt };
  }
}

class SourceBlock extends Error {}

async function vget(path: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch(`${VENSPORT_BASE}${path}`, { headers: { "User-Agent": VENSPORT_UA }, signal: AbortSignal.timeout(20000) });
  } catch (e) {
    throw new Error(`sin conexión (${(e as Error).message})`);
  }
  if (res.status === 429 || res.status === 401 || res.status === 403) throw new SourceBlock(`respondió ${res.status}`);
  if (!res.ok) throw new Error(`respondió ${res.status}`);
  return res.text();
}

async function tickCore(key: string, st: { target_result_event_id: string; vensport_home_fetched_at: string | null }, now: Date, mode: "scheduled" | "manual" = "scheduled"): Promise<TickOutcome> {
  const homeAge = now.getTime() - (st.vensport_home_fetched_at ? Date.parse(st.vensport_home_fetched_at) : 0);
  const { data: pagesData } = await supabaseAdmin.from("vensport_pages").select("*").eq("sync_key", key);
  const pages = (pagesData ?? []) as Page[];
  const { data: linksData } = await supabaseAdmin.from("asu26_results_links").select("source_competition_id,label,schedule_item_id,link_status,competition_date").eq("sync_key", key);
  const links = (linksData ?? []) as (VensportLink & { competition_date: string | null })[];

  if (homeAge >= HOME_EVERY_MS || !pages.some((p) => p.is_section)) {
    const html = await vget("/");
    const secs = parseHomeSections(html);
    if (!secs.length) throw new Error("portada sin apartados (formato inesperado)");
    const known = new Map(pages.map((p) => [p.division_id, p]));
    const up = secs.map((s) => ({ division_id: s.divisionId, sync_key: key, section: s.label, is_section: true, title: known.get(s.divisionId)?.title ?? s.label }));
    await supabaseAdmin.from("vensport_pages").upsert(up as never, { onConflict: "division_id" });
    await supabaseAdmin.from("results_sync_state").update({ vensport_home_fetched_at: now.toISOString() } as never).eq("key", key);
    return { ok: true, page: "portada", rows: 0 };
  }

  // «Sincronizar ahora»: lee ya la prueba más prioritaria aunque no le toque por tiempo.
  const page = pickPage(pages, now.getTime()) ?? (mode === "manual" ? pickPage(pages, now.getTime() + COMPLETE_EVERY_MS + HOME_EVERY_MS) : null);
  if (!page) return { ok: true, skipped: "Nada pendiente" };
  const html = await vget(`/divisions/${page.division_id}`);

  // Pruebas hermanas listadas en la página (descubre nuevas clasificaciones).
  const section = page.section;
  const races = parseSectionRaces(html, section);
  const known = new Map(pages.map((p) => [p.division_id, p]));
  const up = races.map((r) => {
    const link = matchLink(r, links);
    const prev = known.get(r.divisionId);
    return { division_id: r.divisionId, sync_key: key, title: r.title, section: prev?.section || section, is_section: prev?.is_section ?? false, source_competition_id: link?.source_competition_id ?? null, competition_date: link ? (links.find((l) => l.source_competition_id === link.source_competition_id)?.competition_date ?? null) : null };
  });
  if (up.length) await supabaseAdmin.from("vensport_pages").upsert(up as never, { onConflict: "division_id" });

  const me = races.find((r) => r.divisionId === page.division_id) ?? parseRaceTitle(page.division_id, page.title, section);
  const rk = parseFinalRanking(html, me);
  const link = matchLink(me, links);
  const rows = link ? rankingToRows(rk, link, st.target_result_event_id) : [];
  let diff: Record<string, unknown> | null = null;
  let retired = 0;
  if (rows.length && link) {
    // Diferencias con lo guardado (solo con clasificación completa; nunca ante lecturas incompletas).
    const { data: cur } = await supabaseAdmin
      .from("live_results")
      .select("id,source_result_id,bib,athlete_name,position,race_time,points,published,source_missing_passes")
      .eq("result_event_id", st.target_result_event_id).eq("source", "vensport").eq("source_competition_id", link.source_competition_id);
    const current = cur ?? [];
    const newIds = new Set(rows.map((r) => r.source_result_id));
    const curIds = new Set(current.map((r) => r.source_result_id as string));
    const byName = new Map(current.map((r) => [String(r.athlete_name).toLowerCase(), r]));
    const added = rows.filter((r) => !curIds.has(r.source_result_id));
    const missing = current.filter((r) => !newIds.has(r.source_result_id as string));
    const bibChanged = added.filter((r) => byName.has(r.athlete_name.toLowerCase())).map((r) => ({ name: r.athlete_name, from: byName.get(r.athlete_name.toLowerCase())!.bib, to: r.bib }));
    const changed = rows.filter((r) => { const c = current.find((x) => x.source_result_id === r.source_result_id); return c && (c.position !== r.position || (c.race_time ?? null) !== r.race_time || (c.points ?? null) !== r.points); }).length;
    // Seguridad: si desaparece más de la mitad de golpe, se considera lectura dudosa y no se retira nada.
    const suspicious = current.length > 0 && missing.length > current.length / 2;
    const { error } = await supabaseAdmin.from("live_results").upsert(rows as never, { onConflict: "result_event_id,source_result_id" });
    if (error) throw new Error(`no se pudieron guardar: ${error.message}`);
    if (!suspicious) {
      for (const m of missing) {
        const passes = (m.source_missing_passes ?? 0) + 1;
        // Retirada solo tras 2 lecturas completas consecutivas sin la fila (oculta, nunca borra).
        await supabaseAdmin.from("live_results").update((passes >= 2 ? { source_missing_passes: passes, published: false } : { source_missing_passes: passes }) as never).eq("id", m.id);
        if (passes >= 2 && m.published) retired++;
      }
    }
    if (added.length || missing.length || changed) {
      diff = { at: now.toISOString(), added: added.length, missing: missing.map((m) => ({ name: m.athlete_name, bib: m.bib, passes: (m.source_missing_passes ?? 0) + 1 })), bibChanged, changed, retired, suspicious };
    }
  }
  await supabaseAdmin.from("vensport_pages").update({ complete: rk.complete, row_count: rows.length, last_fetched_at: now.toISOString(), last_status: link ? (rk.complete ? "completa" : "sin clasificación completa") : "sin equivalencia", ...(diff ? { last_diff: diff } : {}) } as never).eq("division_id", page.division_id);
  return { ok: true, page: me.title, rows: rows.length, complete: rk.complete, ...(retired ? { retired } : {}) };
}
