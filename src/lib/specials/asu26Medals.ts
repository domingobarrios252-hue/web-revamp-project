/**
 * Medallero manual del Especial ASU26 (editable en Admin → Medallero → ASU26).
 * Se guarda en site_settings (clave ASU26_MEDALS_KEY); el orden y el total
 * se calculan siempre aquí, nunca se escriben a mano.
 */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const ASU26_MEDALS_KEY = "asu26_medals";
export const ASU26_OFFICIAL_MEDALS_URL = "https://datos.asu26.org.py/medallero";

export type Asu26MedalStatus = "soon" | "updating" | "updated" | "final";
export const MEDAL_STATUS_LABEL: Record<Asu26MedalStatus, string> = {
  soon: "Próximamente",
  updating: "En actualización",
  updated: "Actualizado",
  final: "Medallero final",
};

export type Asu26MedalCountry = {
  id: string;
  name: string;
  iso: string;
  flagUrl: string;
  gold: number;
  silver: number;
  bronze: number;
};

export type Asu26Medals = {
  status: Asu26MedalStatus;
  updatedAt: string | null;
  countries: Asu26MedalCountry[];
};

export const ASU26_MEDALS_DEFAULTS: Asu26Medals = { status: "soon", updatedAt: null, countries: [] };

const n = (v: unknown) => Math.max(0, Math.floor(Number(v) || 0));

export function mergeMedals(raw: unknown): Asu26Medals {
  const o = (raw && typeof raw === "object" ? raw : {}) as Partial<Asu26Medals>;
  const status = (["soon", "updating", "updated", "final"] as const).includes(o.status as Asu26MedalStatus)
    ? (o.status as Asu26MedalStatus)
    : "soon";
  const countries = Array.isArray(o.countries)
    ? o.countries.map((c) => ({
        id: String(c?.id ?? crypto.randomUUID()),
        name: String(c?.name ?? ""),
        iso: String(c?.iso ?? "").toUpperCase(),
        flagUrl: String(c?.flagUrl ?? ""),
        gold: n(c?.gold),
        silver: n(c?.silver),
        bronze: n(c?.bronze),
      }))
    : [];
  return { status, updatedAt: typeof o.updatedAt === "string" ? o.updatedAt : null, countries };
}

export async function loadAsu26Medals(): Promise<Asu26Medals> {
  const { data } = await supabase.from("site_settings").select("value").eq("key", ASU26_MEDALS_KEY).maybeSingle();
  return mergeMedals(data?.value);
}

export async function saveAsu26Medals(m: Asu26Medals) {
  return supabase
    .from("site_settings")
    .upsert([{ key: ASU26_MEDALS_KEY, value: m as unknown as Record<string, unknown> }] as never, { onConflict: "key" });
}

export type RankedCountry = Asu26MedalCountry & { total: number; pos: number };

/** Oro → plata → bronce; empates comparten posición. */
export function rankMedals(list: Asu26MedalCountry[]): RankedCountry[] {
  const sorted = [...list]
    .map((c) => ({ ...c, total: c.gold + c.silver + c.bronze, pos: 0 }))
    .sort((a, b) => b.gold - a.gold || b.silver - a.silver || b.bronze - a.bronze || a.name.localeCompare(b.name, "es"));
  sorted.forEach((c, i) => {
    const p = sorted[i - 1];
    c.pos = p && p.gold === c.gold && p.silver === c.silver && p.bronze === c.bronze ? p.pos : i + 1;
  });
  return sorted;
}

const ISO3: Record<string, string> = {
  ESP: "ES", COL: "CO", ITA: "IT", FRA: "FR", POR: "PT", PRT: "PT", BEL: "BE", NED: "NL", NLD: "NL", GER: "DE", DEU: "DE",
  SUI: "CH", CHE: "CH", AUT: "AT", GBR: "GB", IRL: "IE", POL: "PL", CZE: "CZ", SVK: "SK", HUN: "HU", DEN: "DK", DNK: "DK",
  SWE: "SE", NOR: "NO", FIN: "FI", EST: "EE", LAT: "LV", LVA: "LV", LTU: "LT", UKR: "UA", ISR: "IL", TUR: "TR", GRE: "GR",
  USA: "US", CAN: "CA", MEX: "MX", GUA: "GT", GTM: "GT", CRC: "CR", CRI: "CR", PAN: "PA", PUR: "PR", PRI: "PR", DOM: "DO",
  CUB: "CU", VEN: "VE", ECU: "EC", PER: "PE", CHI: "CL", CHL: "CL", ARG: "AR", URU: "UY", URY: "UY", PAR: "PY", PRY: "PY",
  BOL: "BO", BRA: "BR", ESA: "SV", SLV: "SV", HON: "HN", HND: "HN", NCA: "NI", NIC: "NI", TPE: "TW", TWN: "TW", KOR: "KR",
  JPN: "JP", CHN: "CN", HKG: "HK", IND: "IN", INA: "ID", IDN: "ID", PHI: "PH", PHL: "PH", MAS: "MY", MYS: "MY", SGP: "SG",
  THA: "TH", VIE: "VN", VNM: "VN", AUS: "AU", NZL: "NZ", RSA: "ZA", ZAF: "ZA", EGY: "EG", MAR: "MA", ALG: "DZ", DZA: "DZ",
  KAZ: "KZ", IRI: "IR", IRN: "IR", PAK: "PK", UAE: "AE", ARE: "AE", SRB: "RS", CRO: "HR", HRV: "HR", SLO: "SI", SVN: "SI",
  ROU: "RO", BUL: "BG", BGR: "BG",
};

export function iso2(code: string): string {
  const c = code.trim().toUpperCase();
  if (/^[A-Z]{2}$/.test(c)) return c;
  return ISO3[c] ?? "";
}

export function flagFor(code: string): string {
  const c = iso2(code);
  return c ? String.fromCodePoint(...[...c].map((ch) => 0x1f1e6 + ch.charCodeAt(0) - 65)) : "";
}

export function isSpainCountry(c: Pick<Asu26MedalCountry, "iso" | "name">) {
  return iso2(c.iso) === "ES" || /^(españa|spain)$/i.test(c.name.trim());
}

export function formatUpdated(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const date = new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Madrid" }).format(d);
  const time = new Intl.DateTimeFormat("es-ES", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Madrid" }).format(d);
  return `${date} · ${time}`;
}

/** Bandera automática (imagen) a partir del código ISO; funciona en todos los sistemas. */
export function flagUrlFor(code: string): string {
  const c = iso2(code).toLowerCase();
  return c ? `https://flagcdn.com/w40/${c}.png` : "";
}

/** Lectura compartida (página y tarjeta): se refresca cada minuto y al volver a la pestaña. */
export function useAsu26Medals(): Asu26Medals | null {
  const [m, setM] = useState<Asu26Medals | null>(null);
  useEffect(() => {
    let off = false;
    const load = () => loadAsu26Medals().then((v) => !off && setM(v)).catch(() => {});
    load();
    const t = setInterval(load, 60_000);
    const onVis = () => document.visibilityState === "visible" && load();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      off = true;
      clearInterval(t);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);
  return m;
}
