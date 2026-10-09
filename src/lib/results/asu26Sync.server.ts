/**
 * Sincronización de resultados oficiales ASU26 (datos.asu26.org.py, autorizado por VeloPro).
 * Solo servidor. Lectura pública de solo lectura; nunca la consultan los visitantes.
 * Seguridad: parada total ante 429/401/403 o 5 fallos seguidos; interruptor de emergencia;
 * reactivación únicamente desde Admin (results_sync_control).
 */
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// Clave pública (anon) publicada por la propia web oficial en su código de navegador.
const SOURCE_PUBLIC_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9manZ5c3RlaGprb2ZnZXhhcWF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyNTE2NDQsImV4cCI6MjA5NzgyNzY0NH0.lcjWafyAyDhNfKNt5PA0Qu8FVhrnylFKuYteuFQfiTw";

const MAX_FAILURES = 5;
const LOCK_SECONDS = 120;
const PAGE = 1000;

type State = {
  key: string;
  source_base_url: string;
  modalidad_slug: string;
  target_result_event_id: string;
  enabled: boolean;
  emergency_stop: boolean;
  halted: boolean;
  active_from: string;
  active_to: string;
  off_window_mode: string;
  last_attempt_at: string | null;
  consecutive_failures: number;
};

export type SyncOutcome =
  | { ok: true; skipped?: string; rows?: number; inserted?: number; updated?: number; retired?: number }
  | { ok: false; error: string; halted: boolean };

class SourceError extends Error {
  constructor(message: string, public hardStop: boolean) {
    super(message);
  }
}

async function sourceGet(base: string, path: string, range?: [number, number]): Promise<unknown> {
  const headers: Record<string, string> = { apikey: SOURCE_PUBLIC_KEY, Authorization: `Bearer ${SOURCE_PUBLIC_KEY}`, Accept: "application/json" };
  if (range) headers.Range = `${range[0]}-${range[1]}`;
  let res: Response;
  try {
    res = await fetch(`${base}/${path}`, { headers, signal: AbortSignal.timeout(20000) });
  } catch (e) {
    throw new SourceError(`Sin conexión con la fuente oficial (${(e as Error).message})`, false);
  }
  if (res.status === 429) throw new SourceError("La fuente oficial respondió 429 (demasiadas consultas)", true);
  if (res.status === 401 || res.status === 403) throw new SourceError(`La fuente oficial negó el acceso (${res.status})`, true);
  if (!res.ok) throw new SourceError(`La fuente oficial respondió ${res.status}`, false);
  try {
    return await res.json();
  } catch {
    throw new SourceError("Respuesta de la fuente oficial con formato inesperado", false);
  }
}

function asArray(v: unknown, what: string): Record<string, unknown>[] {
  if (!Array.isArray(v)) throw new SourceError(`Formato inesperado en ${what}`, false);
  return v as Record<string, unknown>[];
}

const s = (v: unknown) => (v === null || v === undefined || v === "" ? null : String(v));
const GENDER: Record<string, string> = { M: "Masculino", W: "Femenino", F: "Femenino", X: "Mixto" };

function inWindow(st: State, now = new Date()): boolean {
  const day = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Asuncion" }).format(now);
  return day >= st.active_from && day <= st.active_to;
}

/** Decide si el aviso programado debe consultar ahora. */
export function shouldRunScheduled(st: State, now = new Date()): string | null {
  if (st.emergency_stop) return "Interruptor de emergencia activo";
  if (st.halted) return "Sincronización detenida: requiere reactivación en Admin";
  if (!st.enabled) return "Automatización desactivada";
  if (inWindow(st, now)) return null;
  if (st.off_window_mode === "every6h") {
    const last = st.last_attempt_at ? Date.parse(st.last_attempt_at) : 0;
    return now.getTime() - last >= 6 * 3600_000 ? null : "Fuera de jornada (cada 6 h)";
  }
  return "Fuera de jornada: en pausa";
}

async function loadState(key: string): Promise<State | null> {
  const { data } = await supabaseAdmin.from("results_sync_state").select("*").eq("key", key).maybeSingle();
  return (data as State | null) ?? null;
}

export async function runResultsSync(key: string, mode: "scheduled" | "manual"): Promise<SyncOutcome> {
  const st = await loadState(key);
  if (!st) return { ok: false, error: "Configuración no encontrada", halted: false };

  // Bloqueos de seguridad: aplican también a «Sincronizar ahora».
  if (st.emergency_stop) return { ok: true, skipped: "Interruptor de emergencia activo" };
  if (st.halted) return { ok: true, skipped: "Sincronización detenida: requiere reactivación en Admin" };
  if (mode === "scheduled") {
    const why = shouldRunScheduled(st);
    if (why) return { ok: true, skipped: why };
  }

  // Bloqueo anti-solapamiento.
  const now = new Date();
  const { data: locked } = await supabaseAdmin
    .from("results_sync_state")
    .update({ lock_until: new Date(now.getTime() + LOCK_SECONDS * 1000).toISOString(), last_attempt_at: now.toISOString() })
    .eq("key", key)
    .eq("emergency_stop", false)
    .eq("halted", false)
    .or(`lock_until.is.null,lock_until.lt.${now.toISOString()}`)
    .select("key");
  if (!locked || locked.length === 0) return { ok: true, skipped: "Otra sincronización en curso o bloqueada" };

  try {
    const r = await syncCore(st);
    await supabaseAdmin
      .from("results_sync_state")
      .update({ last_success_at: new Date().toISOString(), last_rows: r.rows, last_error: null, consecutive_failures: 0, lock_until: null })
      .eq("key", key);
    return { ok: true, ...r };
  } catch (e) {
    const err = e instanceof SourceError ? e : new SourceError((e as Error).message || "Error interno", false);
    const failures = (st.consecutive_failures ?? 0) + 1;
    const halt = err.hardStop || failures >= MAX_FAILURES;
    await supabaseAdmin
      .from("results_sync_state")
      .update({
        last_error: err.message.slice(0, 500),
        consecutive_failures: failures,
        lock_until: null,
        ...(halt
          ? { halted: true, halted_at: new Date().toISOString(), halt_reason: err.hardStop ? err.message : `${failures} errores consecutivos` }
          : {}),
      })
      .eq("key", key);
    return { ok: false, error: err.message, halted: halt };
  }
}

async function fetchAllResults(base: string, modalidadId: string) {
  const out: Record<string, unknown>[] = [];
  for (let from = 0; from < 20000; from += PAGE) {
    const page = asArray(
      await sourceGet(base, `wsg_resultados_publicados?select=*&modalidad_id=eq.${modalidadId}&order=resultado_id`, [from, from + PAGE - 1]),
      "resultados",
    );
    out.push(...page);
    if (page.length < PAGE) break;
  }
  return out;
}

async function syncCore(st: State) {
  const base = st.source_base_url.replace(/\/$/, "");
  const mods = asArray(await sourceGet(base, `wsg_resumen_modalidades?select=modalidad_id,slug&slug=eq.${encodeURIComponent(st.modalidad_slug)}`), "modalidades");
  const modalidadId = s(mods[0]?.modalidad_id);
  if (!modalidadId) throw new SourceError(`Modalidad «${st.modalidad_slug}» no encontrada en la fuente`, false);

  const comps = asArray(
    await sourceGet(
      base,
      `wsg_competencias?select=id,fecha,estado,wsg_disciplinas!inner(nombre,sub_disciplina,modalidad_id),wsg_categorias(genero,nivel)&wsg_disciplinas.modalidad_id=eq.${modalidadId}`,
    ),
    "competiciones",
  );
  const results = await fetchAllResults(base, modalidadId);
  for (const r of results.slice(0, 3)) {
    if (!("resultado_id" in r) || !("competencia_id" in r)) throw new SourceError("La fuente cambió el formato de resultados", false);
  }

  // 1) Equivalencias con el calendario.
  const { data: existingLinks } = await supabaseAdmin.from("asu26_results_links").select("*").eq("sync_key", st.key);
  const linkMap = new Map((existingLinks ?? []).map((l) => [l.source_competition_id, l]));
  const { data: sched } = await supabaseAdmin
    .from("schedule_items")
    .select("id,event_name,category,gender,phase,scheduled_at,venue_type")
    .eq("result_event_id", st.target_result_event_id);

  const compInfo = new Map<string, { label: string; race: string; category: string | null; gender: string | null; estado: string | null }>();
  const newLinks: Record<string, unknown>[] = [];
  for (const c of comps) {
    const id = String(c.id);
    const d = (c.wsg_disciplinas ?? {}) as Record<string, unknown>;
    const cat = (c.wsg_categorias ?? {}) as Record<string, unknown>;
    const race = [s(d.nombre), s(d.sub_disciplina)].filter(Boolean).join(" · ");
    const category = s(cat.nivel);
    const gender = cat.genero ? (GENDER[String(cat.genero)] ?? String(cat.genero)) : null;
    const label = [race, category, gender].filter(Boolean).join(" · ");
    compInfo.set(id, { label, race, category, gender, estado: s(c.estado) });
    const prev = linkMap.get(id);
    let schedule_item_id = prev?.schedule_item_id ?? null;
    let link_status = prev?.link_status ?? "pending";
    if (!prev || (prev.link_status === "pending" && !prev.schedule_item_id)) {
      const cand = autoMatch(sched ?? [], s(c.fecha), s(d.nombre), s(d.sub_disciplina), category);
      if (cand) {
        schedule_item_id = cand;
        link_status = "auto";
      }
    }
    newLinks.push({
      sync_key: st.key,
      source_competition_id: id,
      label,
      competition_date: s(c.fecha),
      source_state: s(c.estado),
      schedule_item_id,
      link_status,
      priority: prev?.priority ?? null,
    });
  }
  if (newLinks.length) {
    const { error } = await supabaseAdmin.from("asu26_results_links").upsert(newLinks as never, { onConflict: "sync_key,source_competition_id" });
    if (error) throw new Error(`No se pudieron guardar las equivalencias: ${error.message}`);
  }
  const linkByComp = new Map(newLinks.map((l) => [String(l.source_competition_id), l]));

  // 2) Resultados. Respuesta vacía => no se toca nada.
  if (results.length === 0) return { rows: 0, inserted: 0, updated: 0, retired: 0 };

  const { data: current } = await supabaseAdmin
    .from("live_results")
    .select("id,source_result_id,source_missing_passes,published")
    .eq("result_event_id", st.target_result_event_id)
    .eq("source", "official");
  const currentMap = new Map((current ?? []).map((r) => [r.source_result_id as string, r]));

  const seen = new Set<string>();
  const rows = results.map((r, i) => {
    const rid = String(r.resultado_id);
    seen.add(rid);
    const cid = String(r.competencia_id);
    const info = compInfo.get(cid);
    const link = linkByComp.get(cid);
    const v = (r.valores ?? {}) as Record<string, unknown>;
    const visible = !!link && (link.link_status === "auto" || link.link_status === "confirmed") && !!link.schedule_item_id;
    const estado = s(r.estado_competencia) ?? info?.estado ?? null;
    const team = s(r.nombre_equipo) ?? s(v.equipo);
    const person = [s(r.atleta), s(r.atleta_apellido)].filter(Boolean).join(" ");
    return {
      source: "official",
      source_result_id: rid,
      source_competition_id: cid,
      source_missing_passes: 0,
      result_event_id: st.target_result_event_id,
      schedule_item_id: visible ? (link!.schedule_item_id as string) : null,
      published: visible,
      event_name: "World Skate Games ASU26",
      race: info?.race || [s(r.disciplina), s(r.sub_disciplina)].filter(Boolean).join(" · ") || null,
      category: info?.category ?? s(r.nivel),
      gender: info?.gender ?? (r.genero ? (GENDER[String(r.genero)] ?? String(r.genero)) : null),
      position: typeof r.puesto === "number" ? r.puesto : r.puesto ? Number(r.puesto) || null : null,
      bib: s(r.dorsal) ?? s(v.bib),
      athlete_name: team && !person ? team : person || team || "—",
      club: team && person ? team : null,
      country: s(r.pais),
      race_time: s(v.final_time),
      points: v.total !== undefined && v.total !== null && v.total !== "" ? Number(v.total) || null : null,
      notes: s(v.remark),
      result_status: estado === "finalizada" ? "official" : "provisional",
      status: estado === "finalizada" ? "finalizado" : "en_vivo",
      sort_order: i,
    };
  });

  let inserted = 0;
  for (let i = 0; i < rows.length; i += 500) {
    const chunk = rows.slice(i, i + 500);
    inserted += chunk.filter((r) => !currentMap.has(r.source_result_id)).length;
    const { error } = await supabaseAdmin.from("live_results").upsert(chunk as never, { onConflict: "result_event_id,source_result_id" });
    if (error) throw new Error(`No se pudieron guardar los resultados: ${error.message}`);
  }

  // 3) Retirada prudente: solo tras 2 pasadas correctas sin la fila.
  let retired = 0;
  for (const [rid, row] of currentMap) {
    if (seen.has(rid)) continue;
    const passes = (row.source_missing_passes ?? 0) + 1;
    await supabaseAdmin
      .from("live_results")
      .update(passes >= 2 ? { source_missing_passes: passes, published: false } : { source_missing_passes: passes })
      .eq("id", row.id);
    if (passes >= 2 && row.published) retired++;
  }

  return { rows: rows.length, inserted, updated: rows.length - inserted, retired };
}

const norm = (t: string | null | undefined) => (t ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
const distance = (t: string | null) => (t ?? "").toLowerCase().match(/\d+\s*m\b|\d+m/)?.[0]?.replace(/\s/g, "") ?? "";

/** Propuesta automática: solo si hay UNA coincidencia clara (fecha + tipo + distancia + categoría compatible). */
function autoMatch(
  sched: { id: string; event_name: string | null; category: string | null; scheduled_at: string | null; venue_type: string | null; phase: string | null }[],
  fecha: string | null,
  venue: string | null,
  sub: string | null,
  category: string | null,
): string | null {
  if (!fecha || !sub) return null;
  const dist = distance(sub);
  const kind = norm(sub).replace(/\d+m?/g, "").slice(0, 6);
  const cands = sched.filter((x) => {
    if (!x.scheduled_at) return false;
    const day = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Asuncion" }).format(new Date(x.scheduled_at));
    if (day !== fecha) return false;
    if (venue && x.venue_type && norm(x.venue_type) !== norm(venue)) return false;
    if (/award|ceremon/i.test(x.event_name ?? "")) return false;
    if (dist && distance(x.event_name) !== dist) return false;
    if (kind && !norm(x.event_name).includes(kind.slice(0, 4))) return false;
    if (category && x.category && norm(x.category) !== norm(category)) return false;
    if (!/final/i.test(x.phase ?? "") || /semi|quarter/i.test(x.phase ?? "")) return false;
    return true;
  });
  return cands.length === 1 ? cands[0].id : null;
}
