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

export type NavItem = { key: NavKey; label: string; pieceSlug: string | null };

/**
 * Navegación LIVE: cada acceso apunta a la pieza existente que corresponde.
 * Los accesos sin destino se ocultan (nunca mostramos módulos vacíos).
 * "Hoy" siempre apunta al bloque de piezas de la portada del especial.
 */
export function buildLiveNav(pieces: LivePiece[]): NavItem[] {
  const used = new Set<string>();
  const out: NavItem[] = [];
  for (const n of NAV) {
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
