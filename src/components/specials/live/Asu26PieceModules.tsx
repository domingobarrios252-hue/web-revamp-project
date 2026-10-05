import { useMemo, useState } from "react";
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
  medalTable,
  modalityOf,
  nextItem,
  useAsu26Hub,
  type HubScheduleItem,
  type Modality,
} from "@/lib/specials/asu26Hub";
import { ASU26_PATH, ASU26_TZ } from "@/lib/tv/asu26Streaming";
import { hhmm } from "@/components/tv/asu26/Asu26Time";
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
  return (
    <li className="grid grid-cols-[4.5rem_1fr] items-center gap-3 py-3 sm:grid-cols-[5.5rem_1fr_auto]">
      <div className="leading-tight">
        <div className="font-display text-xl text-gold">{hhmm(x.scheduled_at, ASU26_TZ)}</div>
        <div className="text-[11px] text-muted-foreground">
          <span className="font-condensed text-[9px] uppercase tracking-wider">ES</span> {hhmm(x.scheduled_at, ES_TZ)}
        </div>
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
            {fmtLongDay(n.scheduled_at, ASU26_TZ)} · <strong className="text-foreground">{hhmm(n.scheduled_at, ASU26_TZ)} PY</strong> ·{" "}
            {hhmm(n.scheduled_at, ES_TZ)} ES · {STATE_LABEL[itemState(n.status)]}
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
  const { loading, results } = useAsu26Hub();
  const table = medalTable(results);
  const es = table.find((c) => isSpain(c.country)) ?? { country: "ESP", oro: 0, plata: 0, bronce: 0, total: 0 };
  return (
    <Section title="Medallero">
      <div className="rounded-2xl border border-gold/40 bg-surface p-5 md:p-6">
        <p className="font-condensed text-xs font-bold uppercase tracking-[3px] text-gold">🇪🇸 España</p>
        <div className="mt-3 grid grid-cols-4 gap-2 text-center">
          {(
            [
              ["Oro", es.oro],
              ["Plata", es.plata],
              ["Bronce", es.bronce],
              ["Total", es.total],
            ] as const
          ).map(([l, v]) => (
            <div key={l}>
              <div className="font-display text-3xl text-foreground md:text-4xl">{v}</div>
              <div className="font-condensed text-[10px] uppercase tracking-widest text-muted-foreground">{l}</div>
            </div>
          ))}
        </div>
      </div>
      {loading ? (
        <div className="mt-6"><Loading /></div>
      ) : table.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">
          El medallero se actualizará automáticamente con los resultados oficiales. Comienza el 10 de octubre.
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[320px] text-sm">
            <thead>
              <tr className="font-condensed border-b border-border text-[10px] uppercase tracking-widest text-muted-foreground">
                <th className="py-2 text-left">Pos.</th>
                <th className="py-2 text-left">País</th>
                <th className="py-2">Oro</th>
                <th className="py-2">Plata</th>
                <th className="py-2">Bronce</th>
                <th className="py-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {table.map((c, i) => (
                <tr key={c.country} className={"border-b border-border/50 " + (isSpain(c.country) ? "text-gold" : "text-foreground")}>
                  <td className="py-2">{i + 1}</td>
                  <td className="py-2">{flagEmoji(c.country)} {c.country}</td>
                  <td className="py-2 text-center">{c.oro}</td>
                  <td className="py-2 text-center">{c.plata}</td>
                  <td className="py-2 text-center">{c.bronce}</td>
                  <td className="py-2 text-center font-bold">{c.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Section>
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
  if (!showNext && mine.length === 0) return null;
  return (
    <div className="mb-4 rounded-lg border border-gold/30 bg-surface p-3 text-sm">
      <p className="font-condensed text-[10px] font-bold uppercase tracking-[3px] text-gold">ASU26</p>
      {showNext && next && (
        <p className="mt-1 text-foreground">
          <span className="text-muted-foreground">Próxima: </span>
          {next.event_name} · {fmtDay(next.scheduled_at, ASU26_TZ)} {hhmm(next.scheduled_at, ASU26_TZ)} PY
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

export function Asu26CardMeta({ kind, pieceSlug }: { kind: Asu26Module | "seleccion"; pieceSlug: string }) {
  const d = useAsu26Hub();
  if (d.loading) return null;
  let line = "";
  if (kind === "calendario") {
    const n = nextItem(d.schedule);
    line = n ? `Próxima prueba: ${fmtDay(n.scheduled_at, ASU26_TZ)} · ${hhmm(n.scheduled_at, ASU26_TZ)} PY` : "Competición finalizada";
  } else if (kind === "seleccion") {
    line = d.members.total ? `${d.members.total} patinadores · ${d.members.junior} Junior · ${d.members.senior} Senior` : "";
  } else if (kind === "noticias") {
    line = d.news[0]?.title ?? "";
  } else if (kind === "resultados") {
    line = "Powered by VeloPro";
  } else if (kind === "medallero") {
    const t = medalTable(d.results).reduce((a, c) => a + c.total, 0);
    line = t ? `${t} medallas repartidas` : "Comienza el 10 de octubre";
  } else if (kind === "tv") {
    const n = nextItem(d.schedule);
    const live = d.cfg.streamStatus === "live" || (n && itemState(n.status) === "live");
    line = live ? "🔴 En directo" : n ? `Próxima retransmisión: ${fmtDay(n.scheduled_at, ASU26_TZ)} · ${hhmm(n.scheduled_at, ASU26_TZ)} PY` : "";
  }
  if (!line) return null;
  return (
    <p key={pieceSlug} className="font-condensed mt-3 line-clamp-2 text-[11px] font-bold uppercase tracking-[2px] text-foreground">
      {line}
    </p>
  );
}
