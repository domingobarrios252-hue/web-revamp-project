import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Radio, Trophy, CalendarDays, Flag } from "lucide-react";
import { ASU26_TZ } from "@/lib/tv/asu26Streaming";
import type { NavItem, ScheduleItem } from "@/lib/specials/liveEvent";

/** Slug del especial ASU26: DIRECTO y RESULTADOS viven solo en Rollerzone.TV. */
export const ASU26_SPECIAL_SLUG = "world-skate-games-asu26-patinaje-velocidad";
export const ASU26_TV_PATH = "/rollerzone-tv/world-skate-games-asu26";
export const ASU26_DIRECTO = `${ASU26_TV_PATH}#directo`;
export const ASU26_RESULTADOS = `${ASU26_TV_PATH}/resultados`;

const ORDER = ["calendario", "espana", "medallero", "noticias", "galeria"] as const;
const LABELS: Record<string, string> = {
  calendario: "Calendario", espana: "España", medallero: "Medallero", noticias: "Noticias", galeria: "Galería",
};

/** Navegación del especial: DIRECTO y RESULTADOS primero, hacia Rollerzone.TV. */
export function asu26Nav(base: NavItem[]): NavItem[] {
  const out: NavItem[] = [
    { key: "directo", label: "Directo", pieceSlug: null, href: ASU26_DIRECTO },
    { key: "resultados", label: "Resultados oficiales", pieceSlug: null, href: ASU26_RESULTADOS },
  ];
  for (const k of ORDER) {
    const it = base.find((x) => x.key === k && x.pieceSlug);
    if (it) out.push({ ...it, label: LABELS[k] });
  }
  return out;
}

const dayKey = (iso: string) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: ASU26_TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(iso));
const hm = (iso: string) =>
  new Intl.DateTimeFormat("es-ES", { timeZone: ASU26_TZ, hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
const dayLabel = (iso: string) =>
  new Intl.DateTimeFormat("es-ES", { timeZone: ASU26_TZ, weekday: "long", day: "numeric", month: "long" }).format(new Date(iso));

/** Bloque compacto: nº de pruebas, primera, última y modalidad. */
export function Asu26Today({ items, slug, calendarPiece }: { items: ScheduleItem[]; slug: string; calendarPiece: string | null }) {
  const sorted = [...items].filter((x) => x.scheduled_at).sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at));
  if (sorted.length === 0) return null;
  const today = dayKey(new Date().toISOString());
  let day = sorted.filter((x) => dayKey(x.scheduled_at) === today);
  let isToday = true;
  if (day.length === 0) {
    const next = sorted.find((x) => dayKey(x.scheduled_at) > today);
    if (!next) return null;
    isToday = false;
    day = sorted.filter((x) => dayKey(x.scheduled_at) === dayKey(next.scheduled_at));
  }
  const first = day[0], last = day[day.length - 1];
  const mods = Array.from(new Set(day.map((x) => (x.discipline || x.venue_type || "").trim()).filter(Boolean)));
  const btn = "font-condensed inline-flex min-h-11 items-center gap-2 bg-gold px-5 text-[11px] font-bold uppercase tracking-[2px] text-background hover:bg-gold-light";
  return (
    <section id="hoy-asu26" className="scroll-mt-14 bg-background py-8 md:py-10">
      <div className="mx-auto max-w-5xl px-4 md:px-6">
        <h2 className="font-display text-2xl uppercase tracking-wider text-foreground md:text-3xl">Hoy en ASU26</h2>
        <p className="font-condensed mt-1 text-[11px] font-bold uppercase tracking-[2px] text-gold">
          {isToday ? "Hoy" : "Próxima jornada"} · {dayLabel(first.scheduled_at)} · Hora Asunción
        </p>
        <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 border-y border-border py-5 md:grid-cols-4">
          <div><dt className="text-xs text-muted-foreground">Pruebas</dt><dd className="font-display text-2xl text-foreground">{day.length}</dd></div>
          <div><dt className="text-xs text-muted-foreground">Primera</dt><dd className="text-sm text-foreground"><b className="text-gold">{hm(first.scheduled_at)}</b> · {first.event_name}</dd></div>
          <div><dt className="text-xs text-muted-foreground">Última</dt><dd className="text-sm text-foreground"><b className="text-gold">{hm(last.scheduled_at)}</b> · {last.event_name}</dd></div>
          <div><dt className="text-xs text-muted-foreground">Modalidad</dt><dd className="text-sm uppercase text-foreground">{mods.join(" · ") || "—"}</dd></div>
        </dl>
        <div className="mt-5">
          {calendarPiece ? (
            <Link to="/especiales/$slug/$piece" params={{ slug, piece: calendarPiece }} className={btn}>
              Ver horarios completos <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <a href={`${ASU26_TV_PATH}#horarios`} className={btn}>Ver horarios completos <ArrowRight className="h-4 w-4" /></a>
          )}
        </div>
      </div>
    </section>
  );
}

/** Accesos rápidos móviles: Directo, Resultados, Hoy, España, después el resto. */
export function Asu26MobileAccess({ slug, nav }: { slug: string; nav: NavItem[] }) {
  const piece = (k: string) => nav.find((x) => x.key === k)?.pieceSlug ?? null;
  const card = "flex min-h-[72px] items-center gap-3 rounded-lg border border-border bg-surface px-4 text-sm font-bold uppercase tracking-wider text-foreground active:border-gold";
  const big: { label: string; href?: string; piece?: string | null; icon: React.ReactNode }[] = [
    { label: "Directo", href: ASU26_DIRECTO, icon: <Radio className="h-5 w-5 text-destructive" /> },
    { label: "Resultados", href: ASU26_RESULTADOS, icon: <Trophy className="h-5 w-5 text-gold" /> },
    { label: "Hoy", href: "#hoy-asu26", icon: <CalendarDays className="h-5 w-5 text-gold" /> },
    { label: "España", piece: piece("espana"), icon: <Flag className="h-5 w-5 text-gold" /> },
  ];
  const rest = (["calendario", "medallero", "noticias", "galeria"] as const)
    .map((k) => ({ k, p: piece(k) }))
    .filter((x) => x.p);
  return (
    <section className="bg-background px-4 py-6 md:hidden">
      <div className="grid grid-cols-2 gap-3">
        {big.filter((b) => b.href || b.piece).map((b) =>
          b.piece ? (
            <Link key={b.label} to="/especiales/$slug/$piece" params={{ slug, piece: b.piece }} className={card}>{b.icon}{b.label}</Link>
          ) : (
            <a key={b.label} href={b.href} className={card}>{b.icon}{b.label}</a>
          ),
        )}
      </div>
      {rest.length > 0 && (
        <div className="mt-3 grid grid-cols-2 gap-3">
          {rest.map(({ k, p }) => (
            <Link key={k} to="/especiales/$slug/$piece" params={{ slug, piece: p! }}
              className="flex min-h-12 items-center justify-center rounded-lg border border-border px-3 text-xs font-bold uppercase tracking-wider text-muted-foreground active:text-gold">
              {LABELS[k]}
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

/** Barra fija inferior solo en móvil. */
export function Asu26StickyBar() {
  // Solo visible durante ASU26 (10–18 oct 2026, hora Asunción); se evalúa tras hidratar.
  const [active, setActive] = useState(false);
  useEffect(() => {
    const d = dayKey(new Date().toISOString());
    setActive(d >= "2026-10-10" && d <= "2026-10-18");
  }, []);
  if (!active) return null;
  return (
    <>
      <div className="h-16 md:hidden" aria-hidden="true" />
      <div className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-2 gap-2 border-t border-gold/30 bg-background/95 px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur md:hidden">
        <a href={ASU26_DIRECTO} className="font-condensed flex min-h-11 items-center justify-center gap-2 bg-gold text-[11px] font-bold uppercase tracking-[2px] text-background">
          <span className="live-dot h-2 w-2 rounded-full bg-destructive" aria-hidden="true" /> Ver directo
        </a>
        <a href={ASU26_RESULTADOS} className="font-condensed flex min-h-11 items-center justify-center border border-gold/60 text-[11px] font-bold uppercase tracking-[2px] text-gold">
          Resultados
        </a>
      </div>
    </>
  );
}
