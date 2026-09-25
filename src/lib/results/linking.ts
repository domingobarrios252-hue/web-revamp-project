import { supabase } from "@/integrations/supabase/client";

/** ID real del evento del Gestor de Resultados a partir de su dirección (compatibilidad). */
export async function resolveResultEventId(slug: string | null | undefined): Promise<string | null> {
  const s = (slug ?? "").trim();
  if (!s) return null;
  const { data } = await supabase.from("result_events").select("id").eq("slug", s).maybeSingle();
  return (data as { id: string } | null)?.id ?? null;
}

/** La prueba vinculada debe pertenecer al mismo evento. Devuelve un mensaje de error o null. */
export async function checkScheduleLink(scheduleItemId: string | null, resultEventId: string | null) {
  if (!scheduleItemId) return null;
  if (!resultEventId) return "Para vincular una prueba del calendario, el resultado debe pertenecer a un evento del Gestor de Resultados.";
  const { data } = await supabase.from("schedule_items").select("result_event_id").eq("id", scheduleItemId).maybeSingle();
  const ev = (data as { result_event_id: string | null } | null)?.result_event_id ?? null;
  return ev === resultEventId ? null : "La prueba del calendario elegida pertenece a otro evento.";
}

export const RESULT_STATUS_OPTIONS = [
  { value: "", label: "— Sin definir —" },
  { value: "upcoming", label: "Próximamente" },
  { value: "in_progress", label: "En curso" },
  { value: "provisional", label: "Provisional" },
  { value: "official", label: "Oficial" },
] as const;
