import { useEffect, useMemo, useState } from "react";
import { ASU26_OFFICIAL_MEDALS_URL, MEDAL_STATUS_LABEL, flagUrlFor, formatUpdated, isSpainCountry, rankMedals, useAsu26Medals } from "@/lib/specials/asu26Medals";
import { Link } from "@tanstack/react-router";
import {
  ES_TZ,
  KIND_LABEL,
  MODALITY_LABEL,
  STATE_LABEL,
  fmtDay,
  fmtLongDay,
  isSpain,
  itemState,
  modalityOf,
  nextItem,
  useAsu26Hub,
  type HubScheduleItem,
  type Modality,
} from "@/lib/specials/asu26Hub";
import { ASU26_PATH, ASU26_TZ } from "@/lib/tv/asu26Streaming";
import { hhmm, localHhmm, localSuffix, useViewerZone } from "@/components/tv/asu26/Asu26Time";
import { flagEmoji, type PieceMember } from "@/lib/specials/pieceMembers";

export type Asu26Module = "calendario" | "tv" | "resultados" | "medallero" | "noticias";

const DIRECTO = { to: ASU26_PATH, hash: "directo" } as const;
const RESULTADOS = { to: ASU26_PATH, hash: "resultados" } as const;

export function asu26ModuleFor(pieceSlug: string): Asu26Module | null {
  if (/calendario/.test(pieceSlug)) return "calendario";
  if (/rollerzone-tv|streaming/.test(pieceSlug)) return "tv";
  if (/resultado/.test(pieceSlug)) return "resultados";
  if (/medallero/.test(pieceSlug)) return "medallero";
  if (/noticia/.test(pieceSlug)) return "noticias";
  return null;
}

const btn =
  "font-condensed inline-flex min-h-10 items-center justify-center gap-2 bg-gold px-4 text-[11px] font-bold uppercase tracking-widest text-background transition-colors hover:bg-gold-light";
const btnGhost =
  "font-condensed inline-flex min-h-10 items-center justify-center gap-2 border border-gold/60 px-4 text-[11px] font-bold uppercase tracking-widest text-gold transition-colors hover:bg-gold hover:text-background";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-background py-10 md:py-14">
      <div className="mx-auto max-w-5xl px-4 md:px-6">
        <h2 className="font-display text-3xl uppercase tracking-wide text-foreground md:text-4xl">{title}</h2>
        <div className="mt-3 h-[3px] w-16 bg-gold" />
        <div className="mt-8">{children}</div>
      </div>
    </section>
  );
}

function Loading() {
  return <p className="text-sm text-muted-foreground">Cargando…</p>;
}

export function Asu26PieceModule({ kind }: { kind: Asu26Module }) {
  if (kind === "calendario") return <CalendarModule />;
  if (kind === "tv") return <TvModule />;
  if (kind === "resultados") return <ResultsModule />;
  if (kind === "medallero") return <MedalModule />;
  return <NewsModule />;
}

/* ---------------- Calendario ---------------- */

const FILTERS: { key: "all" | Modality; label: string }[] = [
  { key: "all", label: "Todos" },
  { key: "track", label: "Track" },
  { key: "road", label: "Road" },
  { key: "100m", label: "100 m" },
  { key: "marathon", label: "Marathon" },
];

function CalendarModule() {
  const { loading, schedule } = useAsu26Hub();
  const [f, setF] = useState<"all" | Modality>("all");
  const days = useMemo(() => {
    const list = schedule.filter((x) => f === "all" || modalityOf(x) === f);
    const g = new Map<string, HubScheduleItem[]>();
    for (const x of list) {
      const k = new Intl.DateTimeFormat("en-CA", { timeZone: ASU26_TZ }).format(new Date(x.scheduled_at));
      g.set(k, [...(g.get(k) ?? []), x]);
    }
    return [...g.values()];
  }, [schedule, f]);

  return (
    <Section title="Calendario">
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 md:mx-0 md:px-0" role="tablist">
        {FILTERS.map((x) => (
          <button
            key={x.key}
            type="button"
            role="tab"
            aria-selected={f === x.key}
            onClick={() => setF(x.key)}
            className={
              "font-condensed shrink-0 rounded-full border px-4 py-2 text-[11px] font-bold uppercase tracking-widest transition-colors " +
              (f === x.key ? "border-gold bg-gold text-background" : "border-border text-muted-foreground hover:text-foreground")
            }
          >
            {x.label}
          </button>
        ))}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">Horarios oficiales: Asunción (PY) · Hora España (ES)</p>
      {loading ? (
        <div className="mt-6"><Loading /></div>
      ) : days.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">No hay pruebas en esta modalidad.</p>
      ) : (
        <div className="mt-6 space-y-10">
          {days.map((items) => (
            <div key={items[0].id}>
              <h3 className="font-condensed text-xs font-bold uppercase tracking-[3px] text-gold first-letter:uppercase">
                {fmtLongDay(items[0].scheduled_at, ASU26_TZ)}
              </h3>
              <ul className="mt-3 divide-y divide-border/60">
                {items.map((x) => (
                  <ScheduleRow key={x.id} x={x} />
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}

function ScheduleRow({ x }: { x: HubScheduleItem }) {
  const st = itemState(x.status);
  const zone = useViewerZone();
  return (
    <li className="grid grid-cols-[4.5rem_1fr] items-center gap-3 py-3 sm:grid-cols-[5.5rem_1fr_auto]">
      <div className="leading-tight">
        <div className="font-display text-xl text-gold">{hhmm(x.scheduled_at, ASU26_TZ)}</div>
        {zone && (
          <div className="text-[11px] text-muted-foreground">
            {localHhmm(x.scheduled_at, zone.tz)} <span className="font-condensed text-[9px] uppercase tracking-wider">{zone.label}</span>
          </div>
        )}
      </div>
      <div className="min-w-0">
        <div className="break-words text-sm font-semibold text-foreground md:text-base">{x.event_name}</div>
        <div className="mt-0.5 flex flex-wrap gap-x-2 text-[11px] uppercase tracking-wide text-muted-foreground">
          <span>{MODALITY_LABEL[modalityOf(x)]}</span>
          {x.category && <span>· {x.category}</span>}
          {x.gender && <span>· {x.gender}</span>}
          {x.phase && <span>· {x.phase}</span>}
        </div>
      </div>
      <div className="col-span-2 flex items-center gap-2 sm:col-span-1 sm:justify-end">
        {st === "live" ? (
          <Link {...DIRECTO} className={btn}>● Ver directo</Link>
        ) : st === "finished" ? (
          <Link {...RESULTADOS} className={btnGhost}>Ver resultados</Link>
        ) : (
          <span className="font-condensed text-[10px] uppercase tracking-widest text-muted-foreground">{STATE_LABEL[st]}</span>
        )}
      </div>
    </li>
  );
}

/* ---------------- Rollerzone TV ---------------- */

export function NextBroadcast({ compact = false }: { compact?: boolean }) {
  const { loading, schedule, cfg } = useAsu26Hub();
  const n = nextItem(schedule);
  const zone = useViewerZone();
  const live = cfg.streamStatus === "live" || (n ? itemState(n.status) === "live" : false);
  if (loading) return <Loading />;
  return (
    <div className={compact ? "" : "rounded-2xl border border-border bg-surface p-5 md:p-8"}>
      {live ? (
        <p className="font-condensed inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[3px] text-destructive">
          🔴 En directo
        </p>
      ) : (
        <p className="font-condensed text-xs font-bold uppercase tracking-[3px] text-gold">Próxima retransmisión</p>
      )}
      {n ? (
        <>
          <p className="mt-2 break-words text-lg font-semibold text-foreground md:text-2xl">{n.event_name}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {fmtLongDay(n.scheduled_at, ASU26_TZ)} · <strong className="text-foreground">{hhmm(n.scheduled_at, ASU26_TZ)} PY</strong>
            {localSuffix(n.scheduled_at, zone)} · {STATE_LABEL[itemState(n.status)]}
          </p>
        </>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">Competición finalizada.</p>
      )}
      {!compact && (
        <Link {...DIRECTO} className={btn + " mt-6"}>Ver en Rollerzone TV →</Link>
      )}
    </div>
  );
}

function TvModule() {
  return (
    <Section title="Rollerzone TV">
      <NextBroadcast />
    </Section>
  );
}

/* ---------------- Resultados ---------------- */

function ResultsModule() {
  const { cfg } = useAsu26Hub();
  return (
    <Section title="Resultados oficiales">
      <div className="rounded-2xl border border-border bg-surface p-6 md:p-10">
        <p className="font-condensed text-[11px] uppercase tracking-[3px] text-muted-foreground">Powered by</p>
        {cfg.logoPoweredByVeloproUrl || cfg.logoVeloproUrl ? (
          <img src={cfg.logoPoweredByVeloproUrl || cfg.logoVeloproUrl} alt="VeloPro" className="mt-2 h-10 w-auto object-contain" />
        ) : (
          <p className="font-display mt-1 text-3xl tracking-wide text-foreground">VeloPro</p>
        )}
        <p className="mt-4 max-w-xl text-sm text-muted-foreground">
          Los resultados oficiales se publican en un único lugar: la página ASU26 de Rollerzone TV.
        </p>
        <Link {...RESULTADOS} className={btn + " mt-6"}>Ver resultados →</Link>
      </div>
    </Section>
  );
}

/* ---------------- Medallero ---------------- */

function MedalModule() {
  const m = useAsu26Medals();
  const ranked = useMemo(() => rankMedals(m?.countries ?? []), [m]);
  const stIcon = { soon: "⏳", updating: "🟡", updated: "🟢", final: "🏁" } as const;
  const coin = (cls: string, v: number, label: string) => (
    <span className="inline-flex items-center justify-center gap-1 md:gap-1.5" aria-label={`${v} ${label}`}>
      <span aria-hidden="true" className={`h-2.5 w-2.5 shrink-0 rounded-full md:h-3.5 md:w-3.5 shadow-inner ${cls}`} />
      <span className="font-display text-lg tabular-nums text-foreground md:text-xl">{v}</span>
    </span>
  );
  const GOLD = "bg-[radial-gradient(circle_at_30%_30%,#fff3b0,#d4a017_60%,#8a6508)]";
  const SILVER = "bg-[radial-gradient(circle_at_30%_30%,#ffffff,#c0c4c8_60%,#6f757a)]";
  const BRONZE = "bg-[radial-gradient(circle_at_30%_30%,#ffd2a8,#c27a3a_60%,#6e3f17)]";
  return (
    <section className="bg-background py-10 md:py-14">
      <div className="mx-auto max-w-5xl px-4 md:px-6">
        <h2 className="font-display text-4xl uppercase tracking-wide text-foreground md:text-6xl">Medallero</h2>
        <p className="font-condensed mt-1 text-xs font-bold uppercase tracking-[3px] text-gold md:text-sm">World Skate Games ASU26 · Patinaje de Velocidad</p>
        <div className="mt-3 h-[3px] w-16 bg-gold" />
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <p className="font-display text-xl uppercase tracking-wide text-foreground md:text-2xl">Clasificación por países</p>
          <div className="font-condensed flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-bold uppercase tracking-[2px] text-muted-foreground">
            <span className="text-asu-light">Datos oficiales ASU26</span>
            {m && <span>{stIcon[m.status]} {MEDAL_STATUS_LABEL[m.status]}</span>}
            {m?.updatedAt && <span>Última actualización: {formatUpdated(m.updatedAt)}</span>}
          </div>
        </div>

        {m === null ? (
          <div className="mt-6"><Loading /></div>
        ) : ranked.length === 0 ? (
          <p className="mt-6 rounded-2xl border border-border bg-surface p-6 text-sm text-muted-foreground">
            El medallero se publicará con las primeras finales, a partir del 10 de octubre.
          </p>
        ) : (
          <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-surface">
            <div className="asu-stripe h-[3px]" aria-hidden="true" />
            <div className="font-condensed grid grid-cols-[1.75rem_minmax(0,1fr)_repeat(3,2.4rem)_2.75rem] items-center gap-1 border-b border-border px-3 py-2.5 text-[9px] font-bold uppercase tracking-[0.5px] text-muted-foreground md:text-[10px] md:tracking-[2px] md:grid-cols-[3.5rem_minmax(0,1fr)_repeat(3,5.5rem)_6rem] md:px-5">
              <span>Pos.</span><span>País</span><span className="text-center">Oro</span><span className="text-center">Plata</span><span className="text-center">Bronce</span><span className="text-center text-gold">Total</span>
            </div>
            <ol>
              {ranked.map((c) => {
                const es = isSpainCountry(c);
                return (
                  <li key={c.id} className={"grid grid-cols-[1.75rem_minmax(0,1fr)_repeat(3,2.4rem)_2.75rem] items-center gap-1 border-b border-border/50 px-3 py-3 last:border-0 md:grid-cols-[3.5rem_minmax(0,1fr)_repeat(3,5.5rem)_6rem] md:px-5 " + (es ? "relative bg-gold/10 shadow-[inset_3px_0_0_var(--color-gold)] outline outline-1 -outline-offset-1 outline-gold/50" : "")}>
                    <span className={"font-display text-xl md:text-2xl " + (c.pos <= 3 ? "text-gold" : "text-muted-foreground")}>{c.pos}</span>
                    <span className="flex min-w-0 items-center gap-2">
                      {c.flagUrl ? <img src={c.flagUrl} alt="" className="h-4 w-6 shrink-0 rounded-sm object-cover" loading="lazy" /> : (flagUrlFor(c.iso) ? <img src={flagUrlFor(c.iso)} alt="" className="h-4 w-6 shrink-0 rounded-sm object-cover" loading="lazy" /> : null)}
                      <span className={"truncate text-sm font-semibold md:text-base " + (es ? "text-gold" : "text-foreground")}>{c.name}</span>
                      <span className="hidden font-mono text-[10px] text-muted-foreground sm:inline">{c.iso}</span>
                    </span>
                    {coin(GOLD, c.gold, "oros")}
                    {coin(SILVER, c.silver, "platas")}
                    {coin(BRONZE, c.bronze, "bronces")}
                    <span className="mx-auto inline-flex min-w-9 justify-center rounded-md bg-gold/15 px-1.5 md:min-w-10 md:px-2 py-1 font-display text-xl tabular-nums text-gold md:text-2xl">{c.total}</span>
                  </li>
                );
              })}
            </ol>
          </div>
        )}

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">Fuente de resultados: World Skate Games ASU26</p>
          <a href={ASU26_OFFICIAL_MEDALS_URL} target="_blank" rel="noopener noreferrer" className={btnGhost}>Consultar medallero oficial ↗</a>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Noticias ---------------- */

function NewsModule() {
  const { loading, news } = useAsu26Hub();
  const [main, ...rest] = news;
  return (
    <Section title="Noticias y crónicas">
      {loading ? (
        <Loading />
      ) : !main ? (
        <p className="text-sm text-muted-foreground">Pronto publicaremos aquí las noticias y crónicas de ASU26.</p>
      ) : (
        <>
          <Link
            to="/noticias/articulo/$slug"
            params={{ slug: main.slug }}
            className="group grid overflow-hidden rounded-2xl border border-border bg-surface md:grid-cols-2"
          >
            {main.image_url && (
              <img src={main.image_url} alt={main.title} className="aspect-[16/9] h-full w-full object-cover md:aspect-auto" />
            )}
            <div className="p-5 md:p-8">
              <NewsMeta kind={main.content_kind} date={main.published_at} />
              <h3 className="font-display mt-3 text-2xl uppercase leading-tight tracking-wide text-foreground group-hover:text-gold md:text-3xl">
                {main.title}
              </h3>
              {main.excerpt && <p className="mt-3 text-sm text-muted-foreground">{main.excerpt}</p>}
            </div>
          </Link>
          {rest.length > 0 && (
            <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {rest.map((n) => (
                <li key={n.id}>
                  <Link to="/noticias/articulo/$slug" params={{ slug: n.slug }} className="group block overflow-hidden rounded-xl border border-border bg-surface">
                    {n.image_url && <img src={n.image_url} alt={n.title} loading="lazy" className="aspect-[16/9] w-full object-cover" />}
                    <div className="p-4">
                      <NewsMeta kind={n.content_kind} date={n.published_at} />
                      <h3 className="mt-2 text-base font-semibold leading-snug text-foreground group-hover:text-gold">{n.title}</h3>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </Section>
  );
}

function NewsMeta({ kind, date }: { kind: string | null; date: string | null }) {
  return (
    <div className="font-condensed flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-widest">
      {kind && KIND_LABEL[kind] && <span className="bg-gold px-2 py-0.5 font-bold text-background">{KIND_LABEL[kind]}</span>}
      {date && <span className="text-muted-foreground">{fmtDay(date, ES_TZ)}</span>}
    </div>
  );
}

/* ---------------- Selección: bloque ASU26 por ficha ---------------- */

const norm = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

export function MemberAsu26Live({ m }: { m: PieceMember }) {
  const { schedule, results } = useAsu26Hub();
  const names = [`${m.first_name} ${m.last_name}`, m.display_name ?? ""].filter(Boolean).map(norm);
  const mine = results.filter((r) => names.includes(norm(r.athlete)));
  const next = m.next_schedule_item_id ? schedule.find((x) => x.id === m.next_schedule_item_id) : null;
  const showNext = next && itemState(next.status) !== "finished";
  const zone = useViewerZone();
  if (!showNext && mine.length === 0) return null;
  return (
    <div className="mb-4 rounded-lg border border-gold/30 bg-surface p-3 text-sm">
      <p className="font-condensed text-[10px] font-bold uppercase tracking-[3px] text-gold">ASU26</p>
      {showNext && next && (
        <p className="mt-1 text-foreground">
          <span className="text-muted-foreground">Próxima: </span>
          {next.event_name} · {fmtDay(next.scheduled_at, ASU26_TZ)} {hhmm(next.scheduled_at, ASU26_TZ)} PY{localSuffix(next.scheduled_at, zone)}
        </p>
      )}
      {mine.length > 0 && (
        <ul className="mt-2 space-y-1">
          {mine.map((r) => (
            <li key={r.id} className="flex justify-between gap-2 text-foreground">
              <span className="min-w-0 truncate">
                {r.position && r.position <= 3 ? ["🥇", "🥈", "🥉"][r.position - 1] + " " : ""}
                {r.race}
              </span>
              <span className="shrink-0 text-muted-foreground">
                {r.position ? `${r.position}º` : ""} {r.time ?? (r.points != null ? `${r.points} pts` : "")}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ---------------- Tarjetas dinámicas de la portada ---------------- */

function MedalCardMeta() {
  const m = useAsu26Medals();
  if (!m) return null;
  const ranked = rankMedals(m.countries);
  const es = ranked.find(isSpainCountry);
  const has = m.status !== "soon" && ranked.some((c) => c.total > 0);
  const cls = "font-condensed mt-3 line-clamp-2 text-[11px] font-bold uppercase tracking-[2px] text-foreground";
  if (!has) return <p className={cls}>Medallero disponible desde el 10 de octubre</p>;
  if (!es) return <p className={cls}>{ranked.reduce((a, c) => a + c.total, 0)} medallas repartidas</p>;
  return (
    <p className={cls}>
      🇪🇸 España · 🥇 {es.gold} 🥈 {es.silver} 🥉 {es.bronze} · Total {es.total} · {es.pos}.º puesto
    </p>
  );
}

export function Asu26CardMeta({ kind, pieceSlug }: { kind: Asu26Module | "seleccion"; pieceSlug: string }) {
  if (kind === "medallero") return <MedalCardMeta key={pieceSlug} />;
  return <HubCardMeta kind={kind} pieceSlug={pieceSlug} />;
}

function HubCardMeta({ kind, pieceSlug }: { kind: Asu26Module | "seleccion"; pieceSlug: string }) {
  const d = useAsu26Hub();
  const zone = useViewerZone();
  if (d.loading) return null;
  let line = "";
  if (kind === "calendario") {
    const n = nextItem(d.schedule);
    line = n ? `Próxima prueba: ${fmtDay(n.scheduled_at, ASU26_TZ)} · ${hhmm(n.scheduled_at, ASU26_TZ)} PY${localSuffix(n.scheduled_at, zone)}` : "Competición finalizada";
  } else if (kind === "seleccion") {
    line = d.members.total ? `${d.members.total} patinadores · ${d.members.junior} Junior · ${d.members.senior} Senior` : "";
  } else if (kind === "noticias") {
    line = d.news[0]?.title ?? "";
  } else if (kind === "resultados") {
    line = "Powered by VeloPro";
  } else if (kind === "tv") {
    const n = nextItem(d.schedule);
    const live = d.cfg.streamStatus === "live" || (n && itemState(n.status) === "live");
    line = live ? "🔴 En directo" : n ? `Próxima retransmisión: ${fmtDay(n.scheduled_at, ASU26_TZ)} · ${hhmm(n.scheduled_at, ASU26_TZ)} PY${localSuffix(n.scheduled_at, zone)}` : "";
  }
  if (!line) return null;
  return (
    <p key={pieceSlug} className="font-condensed mt-3 line-clamp-2 text-[11px] font-bold uppercase tracking-[2px] text-foreground">
      {line}
    </p>
  );
}
