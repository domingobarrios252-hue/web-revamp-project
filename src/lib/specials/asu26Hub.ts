import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { loadEventResults, type NormalizedResult } from "@/lib/results/provider";
import {
  ASU26_DEFAULTS,
  ASU26_RESULT_EVENT_ID,
  ASU26_SPECIAL_SLUG,
  loadAsu26Config,
  type Asu26StreamingConfig,
} from "@/lib/tv/asu26Streaming";

/**
 * Datos compartidos entre Rollerzone TV ASU26 y el Especial ASU26.
 * Una sola fuente: schedule_items, loadEventResults, site_settings y news.special_slug.
 */
export type HubScheduleItem = {
  id: string;
  event_name: string;
  category: string | null;
  gender: string | null;
  phase: string | null;
  discipline: string | null;
  scheduled_at: string;
  status: string;
};

export type HubNews = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  image_url: string | null;
  published_at: string | null;
  content_kind: string | null;
};

export type ItemState = "upcoming" | "live" | "finished";

export function itemState(s: string | null | undefined): ItemState {
  const v = (s ?? "").toLowerCase();
  if (["en_curso", "live", "en_directo"].includes(v)) return "live";
  if (["finalizada", "finished", "finalizado", "cerrada"].includes(v)) return "finished";
  return "upcoming";
}

export const STATE_LABEL: Record<ItemState, string> = {
  upcoming: "Próximamente",
  live: "En directo",
  finished: "Finalizada",
};

export const KIND_LABEL: Record<string, string> = {
  noticia: "Noticia",
  previa: "Previa",
  cronica: "Crónica",
  entrevista: "Entrevista",
  ultima_hora: "Última hora",
};

export type Modality = "track" | "road" | "100m" | "marathon";
export function modalityOf(i: Pick<HubScheduleItem, "event_name" | "discipline">): Modality {
  const n = `${i.event_name} ${i.discipline ?? ""}`.toLowerCase();
  if (/\b100\s?m\b|100 metros/.test(n)) return "100m";
  if (/marat/.test(n)) return "marathon";
  if (/road|ruta|circuit/.test(n)) return "road";
  return "track";
}
export const MODALITY_LABEL: Record<Modality, string> = { track: "Track", road: "Road", "100m": "100 m", marathon: "Marathon" };

export type MedalCountry = { country: string; oro: number; plata: number; bronce: number; total: number };

/** Medallero calculado de los resultados (posiciones 1-3 por prueba). */
export function medalTable(results: NormalizedResult[]): MedalCountry[] {
  const m = new Map<string, MedalCountry>();
  for (const r of results) {
    if (!r.country || !r.position || r.position > 3) continue;
    const c = m.get(r.country) ?? { country: r.country, oro: 0, plata: 0, bronce: 0, total: 0 };
    if (r.position === 1) c.oro++;
    else if (r.position === 2) c.plata++;
    else c.bronce++;
    c.total++;
    m.set(r.country, c);
  }
  return [...m.values()].sort((a, b) => b.oro - a.oro || b.plata - a.plata || b.bronce - a.bronce || a.country.localeCompare(b.country));
}

export function isSpain(c: string) {
  return /^(esp|es|españa|spain)$/i.test(c.trim());
}

export type Asu26HubData = {
  loading: boolean;
  schedule: HubScheduleItem[];
  results: NormalizedResult[];
  news: HubNews[];
  cfg: Asu26StreamingConfig;
  members: { junior: number; senior: number; total: number };
};

const EMPTY: Asu26HubData = {
  loading: true,
  schedule: [],
  results: [],
  news: [],
  cfg: ASU26_DEFAULTS,
  members: { junior: 0, senior: 0, total: 0 },
};

let cache: Promise<Omit<Asu26HubData, "loading">> | null = null;

async function load(): Promise<Omit<Asu26HubData, "loading">> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;
  const [si, cfg, nw, mem] = await Promise.all([
    sb
      .from("schedule_items")
      .select("id,event_name,category,gender,phase,discipline,scheduled_at,status")
      .eq("result_event_id", ASU26_RESULT_EVENT_ID)
      .eq("published", true)
      .order("scheduled_at", { ascending: true }),
    loadAsu26Config().catch(() => ASU26_DEFAULTS),
    sb
      .from("news")
      .select("id,slug,title,excerpt,image_url,published_at,content_kind")
      .eq("special_slug", ASU26_SPECIAL_SLUG)
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(13),
    sb
      .from("special_pieces")
      .select("id")
      .eq("special_slug", ASU26_SPECIAL_SLUG)
      .eq("slug", "seleccion-espanola")
      .maybeSingle(),
  ]);
  const schedule = (si.data ?? []) as HubScheduleItem[];
  const times = new Map(schedule.map((x) => [x.id, x.scheduled_at] as [string, string]));
  const results = await loadEventResults(sb, ASU26_RESULT_EVENT_ID, "manual", times).catch(() => []);
  let members = { junior: 0, senior: 0, total: 0 };
  if (mem.data?.id) {
    const { data } = await sb.from("special_piece_members").select("category").eq("piece_id", mem.data.id).eq("published", true);
    const rows = (data ?? []) as { category: string | null }[];
    members = {
      junior: rows.filter((r) => /junior/i.test(r.category ?? "")).length,
      senior: rows.filter((r) => /senior/i.test(r.category ?? "")).length,
      total: rows.length,
    };
  }
  return { schedule, results, news: (nw.data ?? []) as HubNews[], cfg, members };
}

export function useAsu26Hub(): Asu26HubData {
  const [d, setD] = useState<Asu26HubData>(EMPTY);
  useEffect(() => {
    let off = false;
    cache ??= load().catch((e) => {
      cache = null;
      throw e;
    });
    cache.then((v) => !off && setD({ ...v, loading: false })).catch(() => !off && setD({ ...EMPTY, loading: false }));
    return () => {
      off = true;
    };
  }, []);
  return d;
}

export function nextItem(schedule: HubScheduleItem[]): HubScheduleItem | null {
  const now = Date.now();
  return (
    schedule.find((x) => itemState(x.status) === "live") ??
    schedule.find((x) => itemState(x.status) === "upcoming" && new Date(x.scheduled_at).getTime() >= now - 3600_000) ??
    null
  );
}

export const ES_TZ = "Europe/Madrid";
export function fmtDay(iso: string, tz: string) {
  return new Intl.DateTimeFormat("es-ES", { timeZone: tz, day: "2-digit", month: "short" }).format(new Date(iso)).replace(".", "").toUpperCase();
}
export function fmtLongDay(iso: string, tz: string) {
  return new Intl.DateTimeFormat("es-ES", { timeZone: tz, weekday: "long", day: "numeric", month: "long" }).format(new Date(iso));
}
