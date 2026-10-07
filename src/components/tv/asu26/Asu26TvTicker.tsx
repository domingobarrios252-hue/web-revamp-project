import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { dayInTz } from "@/lib/specials/liveEvent";
import { ASU26_PATH, ASU26_RESULT_EVENT_ID, ASU26_TZ } from "@/lib/tv/asu26Streaming";

type Row = { id: string; event_name: string; category: string | null; gender: string | null; scheduled_at: string; status: string };

/**
 * Jornadas ASU26 Speed fuera de competición (textos editables aquí).
 * Los días de competición NO se listan: las pruebas salen del calendario (schedule_items).
 */
export const ASU26_TICKER_DAYS: Record<string, { label: string; items: string[] }> = {
  "2026-10-07": { label: "ASU26 · Hoy", items: ["Jornada de entrenamientos", "Las selecciones preparan el inicio del Mundial de patinaje de velocidad", "La competición comienza el 10 de octubre", "Síguelo en Rollerzone.TV"] },
  "2026-10-08": { label: "ASU26 · Hoy", items: ["Cuenta atrás para el Mundial", "Entrenamientos y preparación de las selecciones", "Patinaje de velocidad del 10 al 18 de octubre", "Streaming en Rollerzone.TV"] },
  "2026-10-09": { label: "ASU26 · Hoy", items: ["Cuenta atrás para el Mundial", "Entrenamientos y preparación de las selecciones", "Patinaje de velocidad del 10 al 18 de octubre", "Streaming en Rollerzone.TV"] },
  "2026-10-13": { label: "ASU26 · Hoy", items: ["Jornada sin competición de patinaje de velocidad", "La acción regresa mañana con las pruebas de circuito", "Sigue toda la información en Rollerzone.es"] },
  "2026-10-16": { label: "ASU26 · Hoy", items: ["Jornada sin competición de patinaje de velocidad", "El Mundial continúa mañana", "Calendario, resultados y noticias en Rollerzone.es"] },
};
const FIRST = "2026-10-07";
const LAST = "2026-10-18";

const live = (s: string) => ["en_curso", "live", "en_directo"].includes(s);
const done = (s: string) => ["finalizada", "finished", "finalizado", "cerrada", "cancelada"].includes(s);
const raceName = (r: Row) => [r.event_name, r.category, r.gender].filter(Boolean).join(" ");

/** Banda tipo news ticker bajo la cabecera ASU26 de /tv. Jornada según la fecha de Asunción. */
export function Asu26TvTicker() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const load = () =>
      supabase
        .from("schedule_items")
        .select("id,event_name,category,gender,scheduled_at,status")
        .eq("result_event_id", ASU26_RESULT_EVENT_ID)
        .eq("published", true)
        .order("scheduled_at")
        .then(({ data }) => setRows((data as Row[]) ?? []));
    load();
    const t = setInterval(() => {
      setNow(new Date());
      load();
    }, 60_000);
    return () => clearInterval(t);
  }, []);

  const view = useMemo(() => {
    if (!rows) return null;
    const day = dayInTz(now, ASU26_TZ);
    if (day < FIRST || day > LAST) return null;
    const todays = rows.filter((r) => dayInTz(r.scheduled_at, ASU26_TZ) === day);
    if (todays.length === 0) {
      const d = ASU26_TICKER_DAYS[day];
      return d ? { label: d.label, items: d.items, pulse: false } : null;
    }
    const running = todays.filter((r) => live(r.status));
    if (running.length)
      return {
        label: "En directo ahora",
        items: ["World Skate Games ASU26", ...running.map(raceName), "Mira la carrera en Rollerzone.TV", "Resultados oficiales VeloPro"],
        pulse: true,
      };
    if (todays.every((r) => done(r.status)))
      return { label: "Jornada finalizada", items: [...todays.map((r) => r.event_name), "Resultados completos en Rollerzone.es"], pulse: false };
    const names = [...new Set(todays.map((r) => r.event_name))];
    return {
      label: "Hoy en ASU26",
      items: ["Patinaje de velocidad", ...names, "Horarios de Asunción 🇵🇾", "Streaming en directo en Rollerzone.TV", "Resultados oficiales VeloPro"],
      pulse: true,
    };
  }, [rows, now]);

  if (!view) return null;
  const seq = [...view.items, ...view.items];
  const dur = Math.max(22, seq.join(" ").length * 0.22);
  const Run = ({ hidden }: { hidden?: boolean }) => (
    <span aria-hidden={hidden || undefined} className="flex shrink-0 items-center">
      {seq.map((t, i) => (
        <span key={i} className="flex items-center">
          <span className={i === 0 ? "text-gold" : "text-asu-cream"}>{t}</span>
          <span className="px-4 text-[0.6em] text-asu-light" aria-hidden="true">◆</span>
        </span>
      ))}
    </span>
  );
  return (
    <Link
      to={ASU26_PATH}
      hash="directo"
      aria-label={`${view.label}: ${seq.join(" · ")}`}
      className="asu-ticker group relative flex h-10 w-full min-w-0 cursor-pointer items-stretch overflow-hidden border-y border-asu-cream/10 bg-asu-deep md:h-12"
    >
      <span className="font-condensed relative z-10 flex shrink-0 items-center gap-2 bg-asu px-3 text-[11px] font-bold uppercase tracking-[2px] text-asu-cream shadow-[8px_0_14px_-6px_oklch(0.17_0.035_160)] md:px-5 md:text-xs">
        <span className={`h-2 w-2 rounded-full ${view.label === "En directo ahora" ? "bg-tv-red" : "bg-gold"} ${view.pulse ? "animate-pulse" : ""}`} aria-hidden="true" />
        {view.label}
      </span>
      <span className="font-condensed relative flex min-w-0 flex-1 items-center overflow-hidden text-xs font-bold uppercase tracking-[2px] transition-colors group-hover:bg-asu-cream/[0.03] md:text-sm">
        <span className="asu-ticker-track" style={{ ["--asu-ticker-dur" as string]: `${dur}s` }}>
          <Run />
          <Run hidden />
        </span>
      </span>
    </Link>
  );
}
