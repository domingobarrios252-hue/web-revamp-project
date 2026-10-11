/**
 * Lector de clasificaciones de Vensport (worldskatespeed.vensport.com), autorizado por VeloPro.
 * Solo análisis de HTML: sin dependencias de navegador, apto para el servidor.
 * PREPARADO, NO ACTIVO: todavía no lo usa la sincronización programada.
 *
 * Reglas de acceso de Vensport (robots.txt): Crawl-delay 30 s; prohibido /api, /pdf, *.pdf.
 * Estado: Vensport NO publica marca oficial/provisional. Nunca se deduce: el llamador decide.
 */

export const VENSPORT_BASE = "https://worldskatespeed.vensport.com";
export const VENSPORT_MIN_DELAY_MS = 30_000;
export const VENSPORT_UA = "RollerzoneBot/1.0 (+https://rollerzone.es; resultados autorizados por VeloPro)";

/** ISO-2 de la bandera de Vensport → código de país World Skate/COI que usa la web. */
const ISO2_TO_IOC: Record<string, string> = {
  ar: "ARG", at: "AUT", au: "AUS", be: "BEL", bj: "BEN", bo: "BOL", br: "BRA", ca: "CAN", ch: "SUI", cl: "CHI",
  cn: "CHN", co: "COL", cr: "CRC", cu: "CUB", cz: "CZE", de: "GER", dk: "DEN", do: "DOM", ec: "ECU", eg: "EGY",
  es: "ESP", fr: "FRA", gb: "GBR", gt: "GUA", hk: "HKG", hu: "HUN", in: "IND", id: "INA", ie: "IRL", il: "ISR",
  ir: "IRI", it: "ITA", jp: "JPN", kr: "KOR", lv: "LAT", mx: "MEX", my: "MAS", nl: "NED", nz: "NZL", pa: "PAN",
  pe: "PER", ph: "PHI", pl: "POL", pr: "PUR", pt: "POR", py: "PAR", ru: "RUS", sv: "ESA", se: "SWE", sk: "SVK",
  cd: "COD", pk: "PAK", sn: "SEN", tw: "TPE", ua: "UKR", us: "USA", uy: "URU", ve: "VEN", za: "RSA", hn: "HON", ni: "NCA", gr: "GRE", tr: "TUR",
};

export type VensportRace = { divisionId: string; title: string; modality: "Track" | "Road" | "Marathon" | null; category: string | null; gender: string | null };
export type VensportRow = { position: number | null; bib: string | null; name: string; countryName: string | null; country: string | null; mark: string | null; markKind: "time" | "points" | null; sanction: string | null; progress: string | null };
export type VensportRanking = { race: VensportRace; complete: boolean; rows: VensportRow[] };

const decode = (t: string) =>
  t.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\s+/g, " ").trim();

/** Interpreta «junior Women 200m Dual TT», «senior Men Relay race», «… Marathon …». */
export function parseRaceTitle(divisionId: string, raw: string, sectionLabel = ""): VensportRace {
  const title = raw.replace(/\s+\d{2}\/\d{2}\/\d{4}.*$/, "").trim();
  const t = `${sectionLabel} ${title}`.toLowerCase();
  const category = /\bmaster/.test(t) ? "MASTER" : /\bpro\b/.test(t) ? "Pro" : /\bjunior|\bjr\b/.test(t) ? "Junior" : /\bsenior|\bsr\b/.test(t) ? "Senior" : null;
  const gender = /\bwomen|\bladies|\bfemale/.test(t) ? "Femenino" : /\bmen\b|\bmale/.test(t) ? "Masculino" : null;
  const modality = /marat/.test(t) ? "Marathon" : /\broad\b/.test(t) ? "Road" : /\btrack\b/.test(t) ? "Track" : null;
  return { divisionId, title, modality, category, gender };
}

/** Enlaces a pruebas desde una página de apartado («Jr women track»…). */
export function parseSectionRaces(html: string, sectionLabel: string): VensportRace[] {
  const out = new Map<string, VensportRace>();
  for (const m of html.matchAll(/<a[^>]+href="\/divisions\/(\d+)"[^>]*>([\s\S]*?)<\/a>/g)) {
    const text = decode(m[2]);
    if (!text || text === "Overview" || /^(jr|sr)\s/i.test(text) || out.has(m[1])) continue;
    if (!/(women|men)/i.test(text)) continue;
    out.set(m[1], parseRaceTitle(m[1], text, sectionLabel));
  }
  return [...out.values()];
}

/** Apartados de la portada (enlaces /divisions/N con texto «Jr women track», etc.). */
export function parseHomeSections(html: string): { divisionId: string; label: string }[] {
  const out = new Map<string, string>();
  for (const m of html.matchAll(/<a[^>]+href="\/divisions\/(\d+)"[^>]*>([\s\S]*?)<\/a>/g)) {
    const text = decode(m[2]);
    if (text && !out.has(m[1])) out.set(m[1], text);
  }
  return [...out].map(([divisionId, label]) => ({ divisionId, label }));
}

/** Filas de una tabla race-standings-table (común a la clasificación final y a cada serie). */
function parseStandingsTable(tblHtml: string): (VensportRow & { qualified: string | null })[] {
  const markHead = decode(tblHtml.match(/<th[^>]*race-col-score[^>]*>([\s\S]*?)<\/th>/)?.[1] ?? "").toLowerCase();
  const markKind: VensportRow["markKind"] = /point|pts/.test(markHead) ? "points" : markHead ? "time" : null;
  const rows: (VensportRow & { qualified: string | null })[] = [];
  for (const tr of tblHtml.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)) {
    const cell = (cls: string) => tr[1].match(new RegExp(`<td[^>]*class='[^']*race-col-${cls}[^']*'[^>]*>([\\s\\S]*?)<\\/td>`))?.[1] ?? null;
    const nameHtml = cell("name");
    if (nameHtml === null) continue;
    const flag = nameHtml.match(/country_flags\/flags\/([a-z]{2})\./i)?.[1]?.toLowerCase();
    const txt = (cls: string) => { const c = cell(cls); return c === null ? null : decode(c) || null; };
    const pos = Number(txt("placement"));
    rows.push({
      position: Number.isFinite(pos) && pos > 0 ? pos : null,
      bib: txt("race-number"),
      name: decode(nameHtml) || "—",
      countryName: txt("club"),
      country: flag ? (ISO2_TO_IOC[flag] ?? flag.toUpperCase()) : null,
      mark: txt("score"),
      markKind,
      sanction: txt("sanction"),
      progress: txt("progression"),
      qualified: txt("qualified"),
    });
  }
  return rows;
}

/** «Final Rankings»: primera tabla race-standings-table de la página de la prueba. */
export function parseFinalRanking(html: string, race: VensportRace): VensportRanking {
  const tbl = html.match(/<table[^>]*race-standings-table[^>]*>([\s\S]*?)<\/table>/);
  if (!tbl) return { race, complete: false, rows: [] };
  const rows: VensportRow[] = parseStandingsTable(tbl[1]).map(({ qualified: _q, ...r }) => r);
  // Completa = todas las filas tienen puesto. Sin puestos = clasificación aún sin cerrar (no se publica).
  const complete = rows.length > 0 && rows.every((r) => r.position !== null);
  return { race, complete, rows };
}

// ───────────── Fases (series, cuartos, semifinales, final) ─────────────

export type VensportPhase = { rawLabel: string; label: string; complete: boolean; rows: (VensportRow & { qualified: string | null })[] };

const ROUND_ES: [RegExp, string][] = [
  [/quarter/i, "Cuartos de final"],
  [/semi/i, "Semifinal"],
  [/repech/i, "Repesca"],
  [/qualif|prelim/i, "Clasificatoria"],
  [/final/i, "Final"],
];

/** «Qualification - Heat 1» → «Clasificatoria · Serie 1»; «Final - Final» → «Final». Desconocido: texto original. */
export function phaseLabel(raw: string): string {
  const [round, ...rest] = raw.split(/\s+-\s+/);
  const r = ROUND_ES.find(([re]) => re.test(round))?.[1] ?? round.trim();
  const heatRaw = rest.join(" - ").trim();
  const heat = heatRaw.replace(/^heat\s*/i, "Serie ").replace(/^group\s*/i, "Grupo ").trim();
  if (!heat || heat.toLowerCase() === round.trim().toLowerCase() || (r === "Final" && /^final$/i.test(heatRaw))) return r;
  return `${r} · ${heat}`;
}

/** Orden de presentación: Final → Semifinal → Cuartos → Repesca → Clasificatoria; después nº de serie. */
export function phaseOrder(label: string | null | undefined): number {
  if (!label) return 0; // clasificación final
  const base = label.split(" · ")[0];
  const i = ["Final", "Semifinal", "Cuartos de final", "Repesca", "Clasificatoria"].indexOf(base);
  const n = Number(label.match(/(\d+)\s*$/)?.[1] ?? 0);
  return (i < 0 ? 6 : i + 1) * 100 + n;
}

/** Todas las tablas de la página salvo «Final Rankings», cada una con su encabezado. Misma página: sin consultas extra. */
export function parsePhases(html: string): VensportPhase[] {
  const out: VensportPhase[] = [];
  for (const m of html.matchAll(/<div class='small-bottom'>\s*<b>([\s\S]*?)<\/b>\s*<\/div>\s*<table[^>]*race-standings-table[^>]*>([\s\S]*?)<\/table>/g)) {
    const rawLabel = decode(m[1]);
    if (!rawLabel || /final rankings/i.test(rawLabel)) continue;
    const rows = parseStandingsTable(m[2]);
    // Completa = hay puestos y cada fila tiene puesto o sanción (DNS/DSQ…). Si no, no se publica.
    const complete = rows.length > 0 && rows.some((r) => r.position !== null) && rows.every((r) => r.position !== null || !!r.sanction);
    out.push({ rawLabel, label: phaseLabel(rawLabel), complete, rows });
  }
  return out;
}

/** Filas de fase para live_results: origen propio (vensport_phase), id propio; nunca tocan la clasificación final. */
export function phaseToRows(ph: VensportPhase, race: VensportRace, link: VensportLink, resultEventId: string, publish: boolean) {
  if (!ph.complete) return [];
  const visible = publish && !!link.schedule_item_id && (link.link_status === "confirmed" || link.link_status === "auto");
  const parts = link.label.split(" · ");
  const slug = norm(ph.rawLabel);
  const seen = new Set<string>();
  return ph.rows.map((r, i) => {
    let id = `vensport:${race.divisionId}:ph:${slug}:${r.bib ?? norm(r.name)}`;
    while (seen.has(id)) id += "+";
    seen.add(id);
    return {
      source: "vensport_phase",
      source_result_id: id,
      source_competition_id: link.source_competition_id,
      source_missing_passes: 0,
      result_event_id: resultEventId,
      schedule_item_id: link.schedule_item_id,
      published: visible,
      event_name: "World Skate Games ASU26",
      race: parts.slice(0, parts.length - 2).join(" · ") || race.title,
      category: race.category,
      gender: race.gender,
      round: ph.label,
      position: r.position ?? 0,
      bib: r.bib,
      athlete_name: r.name,
      club: null,
      country: r.country,
      race_time: r.markKind === "time" ? r.mark : null,
      points: r.markKind === "points" && r.mark ? Number(r.mark) || null : null,
      notes: [r.sanction, r.qualified].filter(Boolean).join(" · ") || null,
      result_status: "unconfirmed",
      status: "finalizado",
      sort_order: i,
    };
  });
}

const norm = (t: string | null | undefined) => (t ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
/** Clave de prueba común a Vensport y a nuestras 44 equivalencias. */
export function raceKey(text: string): string | null {
  const t = norm(text).replace(/\.(?=\d)/g, "");
  if (/200m?dual/.test(t)) return "200dual";
  if (/5000m?points/.test(t)) return "5000points";
  if (/10000m?elimin/.test(t)) return "10000elim";
  if (/500m?d?sprint/.test(t)) return "500dsprint";
  if (/1000m?sprint/.test(t)) return "1000sprint";
  if (/relay/.test(t)) return "relay";
  if (/1lap|onelap/.test(t)) return "1lap";
  if (/10000m?points/.test(t)) return "10000points";
  if (/15000m?elimin/.test(t)) return "15000elim";
  if (/100m?sprint/.test(t)) return "100sprint";
  if (/marat/.test(t)) return "marathon";
  return null;
}

export type VensportLink = { source_competition_id: string; label: string; schedule_item_id: string | null; link_status: string };

const linkCategory = (l: string) => (/MASTER/.test(l) ? "MASTER" : /\bPro\b/.test(l) ? "Pro" : /Junior/.test(l) ? "Junior" : /Senior/.test(l) ? "Senior" : null);
const linkGender = (l: string) => (/Femenino/.test(l) ? "Femenino" : /Masculino/.test(l) ? "Masculino" : null);

/** Equivalencia inequívoca: misma prueba, categoría y género; exactamente una. */
export function matchLink(race: VensportRace, links: VensportLink[]): VensportLink | null {
  const k = raceKey(race.title);
  if (!k || !race.category || !race.gender) return null;
  const m = links.filter((l) => raceKey(l.label) === k && linkCategory(l.label) === race.category && linkGender(l.label) === race.gender);
  return m.length === 1 ? m[0] : null;
}

/** Filas para live_results. Solo clasificaciones completas; sin estado oficial/provisional (unconfirmed). */
export function rankingToRows(rk: VensportRanking, link: VensportLink, resultEventId: string) {
  if (!rk.complete) return [];
  const visible = !!link.schedule_item_id && (link.link_status === "confirmed" || link.link_status === "auto");
  const parts = link.label.split(" · ");
  const seen = new Set<string>();
  return rk.rows.map((r, i) => {
    let id = `vensport:${rk.race.divisionId}:${r.bib ?? norm(r.name)}`;
    while (seen.has(id)) id += "+";
    seen.add(id);
    return {
      source: "vensport",
      source_result_id: id,
      source_competition_id: link.source_competition_id,
      source_missing_passes: 0,
      result_event_id: resultEventId,
      schedule_item_id: visible ? link.schedule_item_id : null,
      published: visible,
      event_name: "World Skate Games ASU26",
      race: parts.slice(0, parts.length - 2).join(" · ") || rk.race.title,
      category: rk.race.category,
      gender: rk.race.gender,
      position: r.position ?? 0,
      bib: r.bib,
      athlete_name: r.name,
      club: null,
      country: r.country,
      race_time: r.markKind === "time" ? r.mark : null,
      points: r.markKind === "points" && r.mark ? Number(r.mark) || null : null,
      notes: r.sanction,
      result_status: "unconfirmed",
      status: "finalizado",
      sort_order: i,
    };
  });
}
