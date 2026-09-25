import { useMemo, useState } from "react";
import {
  SCHEDULE_STATUS_LABEL,
  dayChipLabel,
  dayInTz,
  timeInTz,
  type ScheduleItem,
} from "@/lib/specials/liveEvent";

type Props = {
  items: ScheduleItem[];
  days: string[];
  tz: string;
  city: string;
  todayOverride?: string | null;
  notice?: string | null;
  noticeVisible?: boolean;
  streamAnchor?: string;
};

/** Hoy en [sede] + Calendario por jornadas. Se oculta si no hay pruebas. */
export function LiveSchedule({ items, days, tz, city, todayOverride, notice, noticeVisible, streamAnchor }: Props) {
  const byDay = useMemo(() => {
    const m = new Map<string, ScheduleItem[]>();
    for (const it of items) {
      const d = dayInTz(it.scheduled_at, tz);
      if (!m.has(d)) m.set(d, []);
      m.get(d)!.push(it);
    }
    for (const list of m.values())
      list.sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at) || a.sort_order - b.sort_order);
    return m;
  }, [items, tz]);

  const allDays = useMemo(() => {
    const set = new Set([...days, ...byDay.keys()]);
    return [...set].sort();
  }, [days, byDay]);

  const today = todayOverride || dayInTz(new Date(), tz);
  const todayItems = byDay.get(today) ?? [];
  const firstWithItems = allDays.find((d) => byDay.has(d)) ?? allDays[0];
  const [selected, setSelected] = useState(allDays.includes(today) ? today : firstWithItems);

  if (items.length === 0) return null;
  const selItems = byDay.get(selected) ?? [];
  const groups = groupByVenue(selItems);

  return (
    <>
      {todayItems.length > 0 && (
        <section className="bg-background pt-8 md:pt-12">
          <div className="mx-auto max-w-7xl px-4 md:px-6">
            <h2 className="font-display text-2xl uppercase tracking-wider text-foreground">
              Hoy en {city || "la sede"}
            </h2>
            <p className="font-condensed mt-1 text-[11px] uppercase tracking-[2px] text-muted-foreground">
              {dayChipLabel(today)} · hora local
            </p>
            <ul className="mt-4 grid gap-2 md:grid-cols-2">
              {todayItems.map((it) => (
                <ScheduleRow streamAnchor={streamAnchor} key={it.id} item={it} tz={tz} />
              ))}
            </ul>
          </div>
        </section>
      )}

      <section id="calendario" className="scroll-mt-14 bg-background py-8 md:py-12">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <h2 className="font-display text-2xl uppercase tracking-wider text-foreground">Calendario</h2>
          {noticeVisible !== false && notice?.trim() && (
            <p className="font-condensed mt-2 inline-block border border-gold/40 px-2 py-1 text-[10px] font-bold uppercase tracking-[2px] text-gold">
              {notice}
            </p>
          )}

          <div
            role="tablist"
            aria-label="Jornadas"
            className="-mx-4 mt-4 flex snap-x gap-1.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none] md:mx-0 md:px-0 [&::-webkit-scrollbar]:hidden"
          >
            {allDays.map((d) => {
              const active = d === selected;
              const has = byDay.has(d);
              return (
                <button
                  key={d}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setSelected(d)}
                  className={
                    "font-condensed min-h-11 shrink-0 snap-start border px-3 text-xs font-bold uppercase tracking-[2px] transition-colors " +
                    (active
                      ? "border-gold bg-gold text-background"
                      : has
                        ? "border-border text-foreground hover:border-gold"
                        : "border-border/50 text-muted-foreground")
                  }
                >
                  {dayChipLabel(d)}
                  {d === today && <span className="sr-only"> (hoy)</span>}
                </button>
              );
            })}
          </div>

          <div className="mt-5 space-y-6">
            {groups.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay pruebas programadas esta jornada.</p>
            ) : (
              groups.map(([venue, list]) => (
                <div key={venue}>
                  {venue && (
                    <h3 className="font-condensed mb-2 text-xs font-bold uppercase tracking-[3px] text-gold">{venue}</h3>
                  )}
                  <ul className="grid gap-2 md:grid-cols-2">
                    {list.map((it) => (
                      <ScheduleRow streamAnchor={streamAnchor} key={it.id} item={it} tz={tz} />
                    ))}
                  </ul>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </>
  );
}

function groupByVenue(list: ScheduleItem[]): [string, ScheduleItem[]][] {
  const m = new Map<string, ScheduleItem[]>();
  for (const it of list) {
    const k = it.venue_type?.trim() || "";
    if (!m.has(k)) m.set(k, []);
    m.get(k)!.push(it);
  }
  return [...m.entries()];
}

function ScheduleRow({ item, tz, streamAnchor }: { item: ScheduleItem; tz: string; streamAnchor?: string }) {
  const meta = [item.category, item.gender].filter(Boolean).join(" · ");
  const live = item.status === "en_curso";
  const off = item.status === "cancelada" || item.status === "aplazada";
  return (
    <li
      className={
        "flex items-start gap-3 border bg-surface px-3 py-2.5 " +
        (item.featured ? "border-gold" : "border-border")
      }
    >
      <time className="font-display w-14 shrink-0 text-lg leading-tight text-gold">{timeInTz(item.scheduled_at, tz)}</time>
      <div className="min-w-0 flex-1">
        <div className={"font-display text-base uppercase leading-snug tracking-wide " + (off ? "text-muted-foreground line-through" : "text-foreground")}>
          {item.event_name}
        </div>
        {(item.phase || meta) && (
          <div className="font-condensed mt-0.5 text-[11px] uppercase tracking-[1.5px] text-muted-foreground">
            {[item.phase, meta].filter(Boolean).join(" · ")}
          </div>
        )}
        {live && streamAnchor && (
          <a href={streamAnchor} className="font-condensed mt-1 inline-flex min-h-8 items-center text-[11px] font-bold uppercase tracking-[1.5px] text-gold underline-offset-4 hover:underline">
            ▶ Ver directo
          </a>
        )}
      </div>
      <span
        className={
          "font-condensed inline-flex shrink-0 items-center gap-1 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[1.5px] " +
          (live
            ? "bg-destructive text-destructive-foreground"
            : item.status === "finalizada"
              ? "bg-muted text-muted-foreground"
              : off
                ? "border border-border text-muted-foreground"
                : "border border-gold/40 text-gold")
        }
      >
        {live && <span className="live-dot h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />}
        {SCHEDULE_STATUS_LABEL[item.status]}
      </span>
    </li>
  );
}
