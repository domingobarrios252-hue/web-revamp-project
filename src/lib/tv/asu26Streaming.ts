/**
 * Configuración central del broadcast hub ASU26 en Rollerzone TV.
 *
 * Los valores por defecto viven aquí (una sola fuente en código) y pueden
 * sobrescribirse desde Admin → Rollerzone TV, que los guarda en
 * site_settings (clave ASU26_SETTINGS_KEY). Ningún componente debe
 * repetir URLs, estados o textos: todo se lee de este objeto.
 */
import { supabase } from "@/integrations/supabase/client";

export const ASU26_SETTINGS_KEY = "asu26_streaming";

/** Evento ASU26 existente (calendario + resultados). */
export const ASU26_RESULT_EVENT_ID = "8af85269-de02-4b16-b98f-8a4e7b7df6ee";
/** Especial ASU26 publicado (las piezas enlazan aquí). */
export const ASU26_SPECIAL_SLUG = "world-skate-games-asu26-patinaje-velocidad-copia-vmrz";
export const ASU26_TZ = "America/Asuncion";
export const ASU26_PATH = "/rollerzone-tv/world-skate-games-asu26";

export type Asu26StreamKey = "track" | "road" | "sprint100" | "marathon";
export type Asu26StreamStatus = "upcoming" | "live" | "finished";

export type Asu26StreamingConfig = {
  trackUrl: string;
  roadUrl: string;
  sprint100Url: string;
  marathonUrl: string;
  showTrack: boolean;
  showRoad: boolean;
  show100m: boolean;
  showMarathon: boolean;
  defaultStream: Asu26StreamKey;
  /** Estado manual: nunca se activa solo por la hora. */
  streamStatus: Asu26StreamStatus;
  /** ISO; hora prevista del próximo directo (opcional). */
  expectedStart: string | null;
  title: string;
  subtitle: string;
  preStreamMessage: string;
  /** Hero ASU26 en lugar del reproductor de la portada de TV (temporal). */
  tvPromoActive: boolean;
  /** VeloPro: desactivado hasta tener la integración. */
  veloproEnabled: boolean;
  /** iframe/widget de VeloPro (https) cuando exista. */
  veloproEmbedUrl: string;
  /** Logos oficiales (URLs subidas desde el panel). Vacío → texto. */
  logoAsu26Url: string;
  logoWorldSkateUrl: string;
  logoVeloproUrl: string;
  logoPoweredByVeloproUrl: string;
  /** Enlaces del especial (slug de pieza o URL completa). */
  links: Record<"calendario" | "resultados" | "espana" | "medallero" | "noticias" | "galeria", string>;
};

export const ASU26_DEFAULTS: Asu26StreamingConfig = {
  trackUrl: "https://players.cdn.enetres.net/live/A217BCEBB2594BDF8FE2E65131DBF663022841",
  roadUrl: "https://players.cdn.enetres.net/live/A217BCEBB2594BDF8FE2E65131DBF663022842",
  sprint100Url: "https://players.cdn.enetres.net/live/A217BCEBB2594BDF8FE2E65131DBF663022843",
  // Hoy World Skate facilita el mismo enlace para 100 m y Marathon.
  marathonUrl: "https://players.cdn.enetres.net/live/A217BCEBB2594BDF8FE2E65131DBF663022843",
  showTrack: true,
  showRoad: true,
  show100m: true,
  showMarathon: true,
  defaultStream: "track",
  streamStatus: "upcoming",
  expectedStart: null,
  title: "En directo",
  subtitle: "World Skate Games ASU26 · Patinaje de Velocidad",
  preStreamMessage: "La señal oficial se activará al comienzo de cada sesión de competición.",
  tvPromoActive: true,
  veloproEnabled: false,
  veloproEmbedUrl: "",
  logoAsu26Url: "",
  logoWorldSkateUrl: "",
  logoVeloproUrl: "",
  logoPoweredByVeloproUrl: "",
  links: {
    calendario: "calendario-competicion",
    resultados: "resultados",
    espana: "seleccion-espanola",
    medallero: "medallero",
    noticias: "noticias-y-cronicas",
    galeria: "galeria-asu26",
  },
};

export const STREAM_TABS: { key: Asu26StreamKey; label: string; url: keyof Asu26StreamingConfig; show: keyof Asu26StreamingConfig }[] = [
  { key: "track", label: "Track", url: "trackUrl", show: "showTrack" },
  { key: "road", label: "Road", url: "roadUrl", show: "showRoad" },
  { key: "sprint100", label: "100 M", url: "sprint100Url", show: "show100m" },
  { key: "marathon", label: "Marathon", url: "marathonUrl", show: "showMarathon" },
];

/** Solo https: cualquier otro valor se descarta. */
export function httpsOnly(u: string | null | undefined): string {
  const v = (u ?? "").trim();
  if (!v) return "";
  const m = /src\s*=\s*["']([^"']+)["']/i.exec(v);
  try {
    const url = new URL(m ? m[1] : v);
    return url.protocol === "https:" ? url.toString() : "";
  } catch {
    return "";
  }
}

export function mergeAsu26(raw: unknown): Asu26StreamingConfig {
  const o = raw && typeof raw === "object" ? (raw as Partial<Asu26StreamingConfig>) : {};
  return {
    ...ASU26_DEFAULTS,
    ...o,
    links: { ...ASU26_DEFAULTS.links, ...(o.links ?? {}) },
  };
}

export async function loadAsu26Config(): Promise<Asu26StreamingConfig> {
  const { data } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", ASU26_SETTINGS_KEY)
    .maybeSingle();
  return mergeAsu26(data?.value);
}

/** Pieza del especial → ruta; una URL completa se respeta tal cual. */
export function specialLink(v: string): string {
  if (/^https?:\/\//i.test(v) || v.startsWith("/")) return v;
  return `/especiales/${ASU26_SPECIAL_SLUG}/${v}`;
}
