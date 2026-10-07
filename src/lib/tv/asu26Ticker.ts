/**
 * Mensajes especiales del ticker ASU26 de /tv (editables en Admin → Especiales → ASU26).
 * Se guardan en site_settings (clave ASU26_TICKER_KEY). Las carreras NUNCA se guardan
 * aquí: salen siempre del calendario (schedule_items).
 */
import { supabase } from "@/integrations/supabase/client";

export const ASU26_TICKER_KEY = "asu26_ticker";

export type TickerMsgType = "entrenamientos" | "cuenta_atras" | "sin_competicion" | "especial" | "finalizada";
export const TICKER_TYPE_LABEL: Record<TickerMsgType, string> = {
  entrenamientos: "Entrenamientos",
  cuenta_atras: "Cuenta atrás",
  sin_competicion: "Sin competición",
  especial: "Mensaje especial",
  finalizada: "Jornada finalizada",
};

export type TickerMsg = { id: string; date: string; type: TickerMsgType; text: string; active: boolean };

/** Valores iniciales (los textos que ya mostraba el ticker). */
export const ASU26_TICKER_DEFAULTS: TickerMsg[] = [
  { id: "d07", date: "2026-10-07", type: "entrenamientos", active: true, text: "Jornada de entrenamientos · Las selecciones preparan el inicio del Mundial de patinaje de velocidad · La competición comienza el 10 de octubre · Síguelo en Rollerzone.TV" },
  { id: "d08", date: "2026-10-08", type: "cuenta_atras", active: true, text: "Cuenta atrás para el Mundial · Entrenamientos y preparación de las selecciones · Patinaje de velocidad del 10 al 18 de octubre · Streaming en Rollerzone.TV" },
  { id: "d09", date: "2026-10-09", type: "cuenta_atras", active: true, text: "Cuenta atrás para el Mundial · Entrenamientos y preparación de las selecciones · Patinaje de velocidad del 10 al 18 de octubre · Streaming en Rollerzone.TV" },
  { id: "d13", date: "2026-10-13", type: "sin_competicion", active: true, text: "Jornada sin competición de patinaje de velocidad · La acción regresa mañana con las pruebas de circuito · Sigue toda la información en Rollerzone.es" },
  { id: "d16", date: "2026-10-16", type: "sin_competicion", active: true, text: "Jornada sin competición de patinaje de velocidad · El Mundial continúa mañana · Calendario, resultados y noticias en Rollerzone.es" },
];

const TYPES = Object.keys(TICKER_TYPE_LABEL) as TickerMsgType[];

export function mergeTicker(raw: unknown): TickerMsg[] {
  const list = (raw as { messages?: unknown } | null)?.messages;
  if (!Array.isArray(list)) return ASU26_TICKER_DEFAULTS;
  return list
    .map((m) => ({
      id: String(m?.id ?? crypto.randomUUID()),
      date: String(m?.date ?? ""),
      type: (TYPES.includes(m?.type) ? m.type : "especial") as TickerMsgType,
      text: String(m?.text ?? ""),
      active: m?.active !== false,
    }))
    .filter((m) => /^\d{4}-\d{2}-\d{2}$/.test(m.date));
}

export async function loadAsu26Ticker(): Promise<TickerMsg[]> {
  const { data } = await supabase.from("site_settings").select("value").eq("key", ASU26_TICKER_KEY).maybeSingle();
  return mergeTicker(data?.value);
}

export async function saveAsu26Ticker(messages: TickerMsg[]) {
  return supabase
    .from("site_settings")
    .upsert([{ key: ASU26_TICKER_KEY, value: { messages } as unknown as Record<string, unknown> }] as never, { onConflict: "key" });
}

/** "a · b · c" → ["a","b","c"] (el ticker pone los rombos entre partes). */
export const splitTicker = (t: string) => t.split(/\s*[·•●◆]\s*/).map((s) => s.trim()).filter(Boolean);
