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
  tw: "TPE", ua: "UKR", us: "USA", uy: "URU", ve: "VEN", za: "RSA", hn: "HON", ni: "NCA", gr: "GRE", tr: "TUR",
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

/** «Final Rankings»: primera tabla race-standings-table de la página de la prueba. */
export function parseFinalRanking(html: string, race: VensportRace): VensportRanking {
  const tbl = html.match(/<table[^>]*race-standings-table[^>]*>([\s\S]*?)<\/table>/);
  if (!tbl) return { race, complete: false, rows: [] };
  const heads = [...tbl[1].matchAll(/<th[^>]*>([\s\S]*?)<\/th>/g)].map((h) => decode(h[1]).toLowerCase());
  const col = (n: string) => heads.indexOf(n);
  const iPlace = col("place"), iBid = col("bid"), iName = col("name"), iCountry = col("country"), iSanc = col("sanc"), iProg = col("progress");
  const iTime = col("time"), iPts = col("points");
  const iMark = iTime >= 0 ? iTime : iPts;
  const markKind = iTime >= 0 ? "time" : iPts >= 0 ? "points" : null;
  const rows: VensportRow[] = [];
  for (const tr of tbl[1].matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)) {
    const cells = [...tr[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((c) => c[1]);
    if (cells.length < 3) continue;
    const txt = cells.map(decode);
    const flag = (iCountry >= 0 ? cells[iCountry] : tr[1]).match(/country_flags\/flags\/([a-z]{2})\./i)?.[1]?.toLowerCase();
    const pos = Number(txt[iPlace]);
    rows.push({
      position: Number.isFinite(pos) && pos > 0 ? pos : null,
      bib: txt[iBid] || null,
      name: txt[iName] || "—",
      countryName: iCountry >= 0 ? txt[iCountry] || null : null,
      country: flag ? (ISO2_TO_IOC[flag] ?? flag.toUpperCase()) : null,
      mark: iMark >= 0 ? txt[iMark] || null : null,
      markKind,
      sanction: iSanc >= 0 ? txt[iSanc] || null : null,
      progress: iProg >= 0 ? txt[iProg] || null : null,
    });
  }
  // Completa = todas las filas tienen puesto. Sin puestos = clasificación aún sin cerrar (no se publica).
  const complete = rows.length > 0 && rows.every((r) => r.position !== null);
  return { race, complete, rows };
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
