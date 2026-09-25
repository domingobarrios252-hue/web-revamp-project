/**
 * Utilidades compartidas del "Live Event Hub" de especiales editoriales.
 * Genérico: sirve para cualquier especial vinculado a un evento (ASU26,
 * Mundiales, Europeos…). Nada específico de un evento concreto.
 */

export type SpecialCta = { label: string; url: string; visible: boolean };

export type LiveSpecial = {
  id?: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  cover_url: string;
  hero_image_url: string;
  hero_image_mobile_url?: string | null;
  hero_image_alt?: string | null;
  hero_image_mobile_alt?: string | null;
  location?: string | null;
  start_date: string | null;
  end_date: string | null;
  ctas?: SpecialCta[] | null;
  event_id?: string | null;
  result_event_id?: string | null;
  event_mode_active?: boolean;
};

export type LinkedEvent = {
  id: string;
  name: string;
  status: string | null;
  location: string | null;
  city: string | null;
  start_date: string | null;
  end_date: string | null;
};

export type LivePiece = { slug: string; kicker?: string | null; category?: string | null; title?: string };

const MONTHS = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];

function parse(d: string | null | undefined) {
  if (!d) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(d);
  if (!m) return null;
  return { y: +m[1], mo: +m[2] - 1, d: +m[3] };
}

/** "10–18 OCT 2026" · "28 SEP – 3 OCT 2026" · "10 OCT 2026" */
export function formatEventRange(start?: string | null, end?: string | null): string {
  const a = parse(start);
  const b = parse(end);
  if (!a) return "";
  if (!b || (a.y === b.y && a.mo === b.mo && a.d === b.d)) return `${a.d} ${MONTHS[a.mo]} ${a.y}`;
  if (a.y === b.y && a.mo === b.mo) return `${a.d}–${b.d} ${MONTHS[a.mo]} ${a.y}`;
  if (a.y === b.y) return `${a.d} ${MONTHS[a.mo]} – ${b.d} ${MONTHS[b.mo]} ${a.y}`;
  return `${a.d} ${MONTHS[a.mo]} ${a.y} – ${b.d} ${MONTHS[b.mo]} ${b.y}`;
}

/** El indicador EN DIRECTO solo se basa en el estado real del evento vinculado. */
export function isEventLive(ev: LinkedEvent | null | undefined) {
  return ev?.status === "live";
}

export type NavKey = "hoy" | "directo" | "calendario" | "espana" | "resultados" | "medallero" | "noticias" | "galeria";

const NAV: { key: NavKey; label: string; match: RegExp | null }[] = [
  { key: "hoy", label: "Hoy", match: null },
  { key: "directo", label: "Directo", match: /directo|stream|tv|live/i },
  { key: "calendario", label: "Calendario", match: /calendario|horario|programa/i },
  { key: "espana", label: "España", match: /espa|seleccion/i },
  { key: "resultados", label: "Resultados", match: /resultado/i },
  { key: "medallero", label: "Medallero", match: /medall/i },
  { key: "noticias", label: "Noticias", match: /noticia|cronica|crónica/i },
  { key: "galeria", label: "Galería", match: /galer|foto/i },
];

export type NavItem = { key: NavKey; label: string; pieceSlug: string | null; anchor?: string };

/**
 * Navegación LIVE: cada acceso apunta a la pieza existente que corresponde.
 * Los accesos sin destino se ocultan (nunca mostramos módulos vacíos).
 * "Hoy" siempre apunta al bloque de piezas de la portada del especial.
 */
export function buildLiveNav(pieces: LivePiece[], opts: { hasSchedule?: boolean } = {}): NavItem[] {
  const used = new Set<string>();
  const out: NavItem[] = [];
  for (const n of NAV) {
    if (n.key === "calendario" && opts.hasSchedule) {
      out.push({ key: n.key, label: n.label, pieceSlug: null, anchor: "#calendario" });
      continue;
    }
    if (!n.match) {
      out.push({ key: n.key, label: n.label, pieceSlug: null });
      continue;
    }
    const p = pieces.find(
      (x) => !used.has(x.slug) && n.match!.test(`${x.slug} ${x.kicker ?? ""} ${x.category ?? ""}`),
    );
    if (p) {
      used.add(p.slug);
      out.push({ key: n.key, label: n.label, pieceSlug: p.slug });
    }
  }
  return out;
}

export function specialPath(slug: string) {
  return `/especiales/${slug}`;
}

/**
 * CTAs del hero/home. Si el admin no ha configurado ninguno, se generan los
 * accesos por defecto (Entrar · Resultados · Directo) hacia piezas existentes.
 */
export function resolveCtas(special: LiveSpecial, pieces: LivePiece[]): SpecialCta[] {
  const configured = Array.isArray(special.ctas) ? special.ctas.filter((c) => c && c.label?.trim()) : [];
  if (configured.length > 0) return configured.filter((c) => c.visible !== false && c.url?.trim());
  const nav = buildLiveNav(pieces);
  const base = specialPath(special.slug);
  const res = nav.find((n) => n.key === "resultados");
  const dir = nav.find((n) => n.key === "directo");
  const out: SpecialCta[] = [{ label: "Entrar al especial", url: base, visible: true }];
  if (res?.pieceSlug) out.push({ label: "Resultados", url: `${base}/${res.pieceSlug}`, visible: true });
  if (dir?.pieceSlug) out.push({ label: "Directo", url: `${base}/${dir.pieceSlug}`, visible: true });
  return out;
}

/**
 * Carga el evento vinculado a un especial. Prioriza el evento real del
 * Gestor de Resultados (result_events); si no, usa el evento de calendario.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function loadLinkedEvent(sb: any, sp: { result_event_id?: string | null; event_id?: string | null }): Promise<LinkedEvent | null> {
  if (sp.result_event_id) {
    const { data } = await sb
      .from("result_events")
      .select("id,name,status,venue,city,event_date,end_date")
      .eq("id", sp.result_event_id)
      .maybeSingle();
    if (data)
      return {
        id: data.id,
        name: data.name,
        status: data.status === "en_vivo" ? "live" : data.status === "finalizado" ? "finished" : "upcoming",
        location: data.venue ?? null,
        city: data.city ?? null,
        start_date: data.event_date ?? null,
        end_date: data.end_date ?? null,
      };
  }
  if (sp.event_id) {
    const { data } = await sb
      .from("events")
      .select("id,name,status,location,city,start_date,end_date")
      .eq("id", sp.event_id)
      .maybeSingle();
    return (data ?? null) as LinkedEvent | null;
  }
  return null;
}

// ---- Calendario de pruebas (schedule_items) ----------------------------------

export type ScheduleStatus = "programada" | "en_curso" | "finalizada" | "aplazada" | "cancelada";

export type ScheduleItem = {
  id: string;
  event_name: string;
  event_name_en: string | null;
  category: string | null;
  gender: string | null;
  phase: string | null;
  discipline: string | null;
  venue_type: string | null;
  location: string | null;
  scheduled_at: string;
  status: ScheduleStatus;
  featured: boolean;
  sort_order: number;
};

export const SCHEDULE_STATUS_LABEL: Record<ScheduleStatus, string> = {
  programada: "Próximamente",
  en_curso: "En directo",
  finalizada: "Finalizada",
  aplazada: "Aplazada",
  cancelada: "Cancelada",
};

/** Zona horaria de la sede según el país del evento (hora local mostrada). */
export function venueTimeZone(country?: string | null): string {
  const c = (country ?? "").toLowerCase();
  if (c.includes("paraguay")) return "America/Asuncion";
  if (c.includes("colombia")) return "America/Bogota";
  if (c.includes("portugal")) return "Europe/Lisbon";
  if (c.includes("miami") || c.includes("estados unidos") || c.includes("usa")) return "America/New_York";
  return "Europe/Madrid";
}

function parts(d: Date, tz: string) {
  const f = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  });
  const o: Record<string, string> = {};
  for (const p of f.formatToParts(d)) o[p.type] = p.value;
  return o;
}

/** "YYYY-MM-DD" en la hora local de la sede. */
export function dayInTz(iso: string | Date, tz: string) {
  const o = parts(new Date(iso), tz);
  return `${o.year}-${o.month}-${o.day}`;
}

/** "HH:MM" en la hora local de la sede. */
export function timeInTz(iso: string, tz: string) {
  const o = parts(new Date(iso), tz);
  return `${o.hour}:${o.minute}`;
}

/** Convierte "YYYY-MM-DDTHH:MM" (hora local de la sede) a ISO UTC. */
export function localToUtcIso(local: string, tz: string) {
  const guess = new Date(`${local}:00Z`);
  const o = parts(guess, tz);
  const asUtc = Date.UTC(+o.year, +o.month - 1, +o.day, +o.hour, +o.minute);
  return new Date(guess.getTime() - (asUtc - guess.getTime())).toISOString();
}

/** ISO UTC → "YYYY-MM-DDTHH:MM" en la hora local de la sede (para inputs). */
export function utcToLocalInput(iso: string, tz: string) {
  const o = parts(new Date(iso), tz);
  return `${o.year}-${o.month}-${o.day}T${o.hour}:${o.minute}`;
}

/** Lista de días "YYYY-MM-DD" entre dos fechas (incluidas). */
export function dayRange(start?: string | null, end?: string | null): string[] {
  if (!start) return [];
  const out: string[] = [];
  const a = new Date(`${start.slice(0, 10)}T12:00:00Z`);
  const b = new Date(`${(end || start).slice(0, 10)}T12:00:00Z`);
  for (let d = a; d <= b && out.length < 60; d = new Date(d.getTime() + 86400000)) out.push(d.toISOString().slice(0, 10));
  return out;
}

export function dayChipLabel(day: string) {
  const [, m, d] = day.split("-");
  return `${+d} ${MONTHS[+m - 1]}`;
}
