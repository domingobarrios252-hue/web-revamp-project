import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { loadEventResults, RESULT_STATE_LABEL, type NormalizedResult } from "@/lib/results/provider";
import { ASU26_RESULT_EVENT_ID } from "@/lib/tv/asu26Streaming";
import { groupResults } from "./Asu26Results";
import { RollerzoneMark, VeloproCredit } from "./ResultsBrand";

const FLAG: Record<string, string> = {
  ESP: "🇪🇸", COL: "🇨🇴", FRA: "🇫🇷", ITA: "🇮🇹", POR: "🇵🇹", BEL: "🇧🇪", NED: "🇳🇱", GER: "🇩🇪",
  ARG: "🇦🇷", CHI: "🇨🇱", PAR: "🇵🇾", USA: "🇺🇸", MEX: "🇲🇽", ECU: "🇪🇨", VEN: "🇻🇪", TPE: "🇹🇼", KOR: "🇰🇷", CHN: "🇨🇳",
};
const MEDAL = ["🥇", "🥈", "🥉"];
const TZ = "America/Asuncion";

type Item = { id: string; event_name: string; venue_type: string | null; discipline: string | null; scheduled_at: string };

function modality(i?: Item) {
  if (!i) return null;
  const n = `${i.event_name} ${i.discipline ?? ""}`.toLowerCase();
  if (/marat/.test(n)) return "Marathon";
  const v = (i.venue_type ?? "").toLowerCase();
  if (/road|ruta|circuit/.test(v + n)) return "Road";
  return "Track";
}

/** Últimos resultados oficiales ASU26 en /tv. Solo lee nuestra base de datos (misma vía que el Especial). */
export function Asu26TvLatestResults() {
  const [items, setItems] = useState<Item[]>([]);
  const [results, setResults] = useState<NormalizedResult[]>([]);
  const [updated, setUpdated] = useState<Date | null>(null);

  useEffect(() => {
    let off = false;
    const load = async () => {
      const s = await supabase
        .from("schedule_items")
        .select("id,event_name,venue_type,discipline,scheduled_at")
        .eq("result_event_id", ASU26_RESULT_EVENT_ID)
        .eq("published", true);
      if (s.error) return;
      const list = (s.data ?? []) as Item[];
      try {
        const r = await loadEventResults(supabase, ASU26_RESULT_EVENT_ID, null, new Map(list.map((i) => [i.id, i.scheduled_at])));
        if (off) return;
        setItems(list);
        setResults(r);
        setUpdated(new Date());
      } catch {
        /* conserva lo último correcto */
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
  const groups = useMemo(
    () => groupResults(results.filter((r) => r.scheduleItemId && byId.has(r.scheduleItemId) && r.athlete && r.category && r.gender)).slice(0, 5),
    [results, byId],
  );

  return (
    <section className="asu-hero-bg relative overflow-hidden px-4 py-10 md:py-14" aria-labelledby="asu26-latest">
      <div className="mx-auto max-w-6xl">
        <p className="font-condensed text-xs uppercase tracking-[3px] text-asu-light">World Skate Games ASU26</p>
        <h2 id="asu26-latest" className="font-display mt-1 text-2xl uppercase tracking-wide text-gold md:text-4xl">
          🏆 Últimos resultados oficiales
        </h2>
        {updated && (
          <p className="mt-1 text-xs text-muted-foreground">
            Última actualización: {updated.toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" })}
          </p>
        )}

        {groups.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-gold/30 bg-background/40 px-6 py-8 text-center">
            <p className="font-display text-lg uppercase tracking-wide text-foreground md:text-xl">
              Las competiciones de patinaje de velocidad comienzan el 10 de octubre.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">Próximamente podrás consultar aquí los resultados oficiales de ASU26.</p>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {groups.map(([name, rows]) => {
              const f = rows[0];
              const it = f.scheduleItemId ? byId.get(f.scheduleItemId) : undefined;
              const state = rows.some((r) => r.state === "in_progress") ? "in_progress" : rows.some((r) => r.state === "provisional") ? "provisional" : rows.some((r) => r.state === "unconfirmed") ? "unconfirmed" : "official";
              const final = state === "official";
              const top = rows.filter((r) => r.position != null).slice(0, 3);
              return (
                <Link
                  key={name + (f.scheduleItemId ?? "")}
                  to="/rollerzone-tv/world-skate-games-asu26/resultados"
                  className="group flex min-w-0 flex-col rounded-2xl border border-border bg-background/70 p-4 transition-colors hover:border-gold/60"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-display min-w-0 text-base uppercase leading-tight text-foreground">{f.race ?? name}</h3>
                    <RollerzoneMark />
                  </div>
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                    <VeloproCredit />
                    {state !== "unconfirmed" && (
                      <span className={`font-condensed shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[2px] ${final ? "border-asu-light/50 text-asu-light" : "border-asu-coral/70 text-asu-coral"}`}>
                        {RESULT_STATE_LABEL[state]}
                      </span>
                    )}
                  </div>
                  <p className="font-condensed mt-1 text-[11px] uppercase tracking-[2px] text-muted-foreground">
                    {[modality(it), f.category, f.gender, f.phase].filter(Boolean).join(" · ")}
                    {it && ` · ${new Date(it.scheduled_at).toLocaleDateString("es-ES", { day: "numeric", month: "short", timeZone: TZ })}`}
                  </p>
                  <ol className="mt-3 space-y-1.5">
                    {top.map((r) => {
                      const esp = r.country === "ESP";
                      return (
                        <li key={r.id} className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm ${esp ? "border-l-2 border-gold bg-gold/10" : "bg-surface/60"}`}>
                          <span className="w-6 shrink-0 text-center font-bold text-gold">{final && r.position! <= 3 ? MEDAL[r.position! - 1] : r.position}</span>
                          <span className="min-w-0 flex-1 truncate text-foreground">
                            {r.country && FLAG[r.country] ? `${FLAG[r.country]} ` : ""}
                            {r.athlete}
                            {r.country && <span className="ml-1 text-xs text-muted-foreground">{r.country}</span>}
                          </span>
                          {(r.time || r.points != null) && (
                            <span className="shrink-0 font-mono text-xs text-muted-foreground">{r.time ?? `${r.points} pts`}</span>
                          )}
                        </li>
                      );
                    })}
                  </ol>
                </Link>
              );
            })}
          </div>
        )}

        <div className="mt-8 text-center">
          <Link
            to="/rollerzone-tv/world-skate-games-asu26/resultados"
            className="font-condensed inline-flex items-center gap-2 rounded-full bg-gold px-6 py-3 text-sm font-bold uppercase tracking-[2px] text-background transition-opacity hover:opacity-90"
          >
            Ver todas las clasificaciones →
          </Link>
        </div>
      </div>
    </section>
  );
}
