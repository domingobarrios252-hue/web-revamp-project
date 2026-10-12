import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { loadEventResults, type NormalizedResult } from "@/lib/results/provider";
import { ASU26_RESULT_EVENT_ID, ASU26_TZ } from "@/lib/tv/asu26Streaming";
import { modalityOf } from "@/lib/specials/asu26Hub";
import type { PieceMember } from "@/lib/specials/pieceMembers";
import { SPAIN_LINKS, linkSpainResult } from "@/lib/specials/spainLinks";
import { RollerzoneMark, VeloproCredit } from "@/components/tv/asu26/ResultsBrand";

type Item = { id: string; event_name: string; discipline: string | null; scheduled_at: string };
type Mod = "pista" | "circuito" | "maraton";
const MOD_LABEL: Record<Mod, string> = { pista: "Pista", circuito: "Circuito", maraton: "Maratón" };
const MEDAL_CLS = ["bg-gold text-background", "bg-foreground/80 text-background", "bg-gold-dark/80 text-background"];

function memberLabel(m: PieceMember) {
  const sport = SPAIN_LINKS[m.id]?.sportName;
  const base = m.display_name?.trim() || `${m.first_name} ${m.last_name}`.trim();
  return sport ? `${sport} (${`${m.first_name.split(" ")[0]} ${m.last_name.split(" ")[0]}`.trim()})` : base;
}
const normLabel = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

function modOf(i?: Item): Mod {
  if (!i) return "pista";
  const m = modalityOf(i);
  return m === "marathon" ? "maraton" : m === "road" ? "circuito" : "pista";
}

/** Resultados de la Selección Española (código ESP) desde los resultados ya almacenados. */
export function SpainResults({ members }: { members: PieceMember[] }) {
  const [items, setItems] = useState<Item[]>([]);
  const [results, setResults] = useState<NormalizedResult[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [skater, setSkater] = useState("");
  const [mod, setMod] = useState<"" | Mod>("");

  useEffect(() => {
    let off = false;
    const load = async () => {
      const s = await supabase
        .from("schedule_items")
        .select("id,event_name,discipline,scheduled_at")
        .eq("result_event_id", ASU26_RESULT_EVENT_ID)
        .eq("published", true);
      if (s.error) return;
      const list = (s.data ?? []) as Item[];
      try {
        const r = await loadEventResults(supabase, ASU26_RESULT_EVENT_ID, null, new Map(list.map((i) => [i.id, i.scheduled_at])));
        if (off) return;
        setItems(list);
        setResults(r);
      } catch {
        /* conserva lo último correcto */
      } finally {
        if (!off) setLoaded(true);
      }
    };
    load();
    const t = setInterval(load, 120_000);
    return () => {
      off = true;
      clearInterval(t);
    };
  }, []);

  const byId = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);
  const esp = useMemo(
    () =>
      results
        .filter((r) => (r.country ?? "").toUpperCase() === "ESP" && r.state !== "upcoming" && r.position != null)
        .map((r) => {
          const it = r.scheduleItemId ? byId.get(r.scheduleItemId) : undefined;
          return { r, it, mod: modOf(it), member: members.find((m) => m.id === linkSpainResult(r, members.map((x) => x.id))) };
        })
        .sort((a, b) => (a.r.scheduledAt ?? "").localeCompare(b.r.scheduledAt ?? "") || (a.r.race ?? "").localeCompare(b.r.race ?? "") || (a.r.position ?? 0) - (b.r.position ?? 0)),
    [results, byId, members],
  );

  const skaterName = (x: (typeof esp)[number]) => (x.member ? memberLabel(x.member) : x.r.athlete);
  const skaters = useMemo(() => {
    const s = new Set<string>(members.map(memberLabel));
    esp.forEach((x) => s.add(skaterName(x)));
    return [...s];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [esp, members]);
  const mods = useMemo(() => (["pista", "circuito", "maraton"] as Mod[]).filter((m) => esp.some((x) => x.mod === m)), [esp]);
  const shown = esp.filter((x) => (!skater || skaterName(x) === skater) && (!mod || x.mod === mod));
  const pending = members.filter((m) => !esp.some((x) => x.member?.id === m.id));

  const chip = (active: boolean) =>
    `font-condensed inline-flex min-h-10 shrink-0 items-center rounded-full border px-3 text-[11px] font-bold uppercase tracking-widest ${active ? "border-gold bg-gold text-background" : "border-border text-foreground hover:border-gold/60"}`;

  return (
    <section className="asu-hero-bg relative overflow-hidden py-10 md:py-14" aria-labelledby="esp-results">
      <div className="mx-auto max-w-5xl px-4 md:px-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-condensed text-xs uppercase tracking-[3px] text-asu-light">World Skate Games ASU26</p>
            <h2 id="esp-results" className="font-display mt-1 text-2xl uppercase tracking-wide text-gold md:text-4xl">
              🇪🇸 Resultados de la Selección Española
            </h2>
          </div>
          <RollerzoneMark />
        </div>
        <VeloproCredit className="mt-3" />

        {!loaded ? (
          <p className="mt-6 text-sm text-muted-foreground">Cargando…</p>
        ) : (
          <>
            <div className="mt-6 space-y-3">
              <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] md:flex-wrap">
                <button type="button" className={chip(!skater)} onClick={() => setSkater("")}>Todos</button>
                {skaters.map((s) => (
                  <button key={s} type="button" className={chip(skater === s)} onClick={() => setSkater(s)}>{s}</button>
                ))}
              </div>
              {mods.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] md:flex-wrap">
                  <button type="button" className={chip(!mod)} onClick={() => setMod("")}>Todas las modalidades</button>
                  {mods.map((m) => (
                    <button key={m} type="button" className={chip(mod === m)} onClick={() => setMod(m)}>{MOD_LABEL[m]}</button>
                  ))}
                </div>
              )}
            </div>

            {shown.length === 0 ? (
              <p className="mt-6 rounded-2xl border border-gold/30 bg-background/40 px-5 py-6 text-center text-sm text-muted-foreground">
                {skater ? "Pendiente de resultados." : "Todavía no hay clasificaciones de la Selección Española."}
              </p>
            ) : (
              <ol className="mt-6 overflow-hidden rounded-2xl border border-border bg-background/70">
                {shown.map(({ r, it, mod: m, member }) => {
                  const p = r.position ?? 0;
                  const podium = p >= 1 && p <= 3;
                  return (
                    <li key={r.id} className="grid grid-cols-[2.75rem_minmax(0,1fr)_auto] items-center gap-3 border-b border-l-2 border-b-border/60 border-l-gold bg-gold/5 px-4 py-3 last:border-b-0">
                      <span
                        className={`font-display flex h-11 w-11 items-center justify-center rounded-full text-xl ${podium ? MEDAL_CLS[p - 1] : "bg-surface-2 text-foreground"}`}
                        title={podium && r.state !== "official" ? "Puesto de podio (oficialidad no confirmada)" : undefined}
                      >
                        {p}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-base font-semibold text-foreground">🇪🇸 {member ? memberLabel(member) : r.athlete}</p>
                        {member && normLabel(memberLabel(member)) !== normLabel(r.athlete) && <p className="truncate text-xs text-muted-foreground">En la clasificación: {r.athlete}{r.bib ? ` · Dorsal ${r.bib}` : ""}</p>}
                        <p className="font-condensed text-[11px] uppercase tracking-widest text-muted-foreground">
                          {[r.race, r.category, r.gender, r.phase, MOD_LABEL[m]].filter(Boolean).join(" · ")}
                          {it && ` · ${new Date(it.scheduled_at).toLocaleDateString("es-ES", { day: "numeric", month: "short", timeZone: ASU26_TZ })}`}
                        </p>
                      </div>
                      <div className="text-right">
                        {r.time && <p className="font-display text-lg tabular-nums text-foreground">{r.time}</p>}
                        {r.points != null && <p className={r.time ? "text-xs tabular-nums text-muted-foreground" : "font-display text-lg tabular-nums text-foreground"}>{r.points} pts</p>}
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}

            {!skater && pending.length > 0 && (
              <div className="mt-6">
                <p className="font-condensed text-[11px] font-bold uppercase tracking-[3px] text-gold">Pendiente de resultados</p>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {pending.map((m) => (
                    <li key={m.id} className="rounded-full border border-border bg-background/50 px-3 py-1.5 text-sm text-foreground">
                      {memberLabel(m)}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <p className="mt-4 text-xs text-muted-foreground">Los colores de podio indican el puesto; la oficialidad depende de la confirmación de la organización.</p>
          </>
        )}
      </div>
    </section>
  );
}
