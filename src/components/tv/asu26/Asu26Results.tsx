import type { NormalizedResult } from "@/lib/results/provider";
import { RESULT_STATE_LABEL } from "@/lib/results/provider";
import { httpsOnly, type Asu26StreamingConfig } from "@/lib/tv/asu26Streaming";
import { RollerzoneMark, VeloproCredit } from "./ResultsBrand";

const FLAG: Record<string, string> = {
  ESP: "🇪🇸", COL: "🇨🇴", FRA: "🇫🇷", ITA: "🇮🇹", POR: "🇵🇹", BEL: "🇧🇪", NED: "🇳🇱", GER: "🇩🇪",
  ARG: "🇦🇷", CHI: "🇨🇱", PAR: "🇵🇾", USA: "🇺🇸", MEX: "🇲🇽", ECU: "🇪🇨", VEN: "🇻🇪", TPE: "🇹🇼", KOR: "🇰🇷", CHN: "🇨🇳",
};
const MEDAL = ["Oro", "Plata", "Bronce"];
const MEDAL_CLS = ["bg-gold text-background", "bg-foreground/80 text-background", "bg-gold-dark/80 text-background"];

/**
 * Resultados oficiales. Desacoplado: hoy lee los resultados normalizados de
 * la capa existente (provider.ts). Cuando VeloPro esté conectado, basta con
 * activar su iframe/widget en la configuración o implementar su proveedor
 * en provider.ts; esta sección no cambia.
 */
/** Agrupa por prueba + categoría + género + fase (nunca mezcla clasificaciones), más reciente primero. */
export function groupResults(results: NormalizedResult[]): [string, NormalizedResult[]][] {
  const groups = new Map<string, { name: string; rows: NormalizedResult[] }>();
  for (const r of results) {
    if (r.state === "upcoming") continue;
    const name = [r.race, r.category, r.gender, r.phase].filter(Boolean).join(" · ") || "Resultados";
    const k = `${r.scheduleItemId ?? ""}|${name}`;
    const g = groups.get(k) ?? { name, rows: [] };
    g.rows.push(r);
    groups.set(k, g);
  }
  const t = (rows: NormalizedResult[]) => Math.max(0, ...rows.map((r) => (r.scheduledAt ? Date.parse(r.scheduledAt) : 0)));
  return [...groups.values()]
    .map((g) => {
      g.rows.sort((a, b) => (a.position ?? 9999) - (b.position ?? 9999) || a.sort - b.sort);
      return g;
    })
    .sort((a, b) => t(b.rows) - t(a.rows))
    .map((g) => [g.name, g.rows]);
}

export function Asu26Results({ cfg, results, limit, emptyText }: { cfg: Asu26StreamingConfig; results: NormalizedResult[]; limit?: number; emptyText?: string }) {
  const embed = cfg.veloproEnabled ? httpsOnly(cfg.veloproEmbedUrl) : "";
  const all = groupResults(results);
  const groups = limit ? all.slice(0, limit) : all;

  return (
    <div>
      {embed ? (
        <div className="aspect-[4/5] w-full overflow-hidden rounded-2xl border border-border bg-surface sm:aspect-video">
          <iframe src={embed} title="Resultados oficiales VeloPro" className="h-full w-full" loading="lazy" referrerPolicy="strict-origin-when-cross-origin" />
        </div>
      ) : groups.length === 0 ? (
        <div className="asu-hero-bg relative overflow-hidden rounded-2xl px-6 py-8 text-center md:py-10">
          <p className="font-display text-xl uppercase tracking-wide text-foreground md:text-2xl">
            {emptyText ?? "Los resultados oficiales aparecerán aquí durante la competición."}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">Integración de resultados en directo disponible durante ASU26.</p>
          <p className="font-condensed mt-3 text-xs uppercase tracking-[3px] text-muted-foreground">
            Proveedor oficial de resultados: VeloPro.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {groups.map(([name, rows]) => (
            <article key={`${rows[0].scheduleItemId}-${name}`} className="min-w-0 overflow-hidden rounded-2xl bg-surface/70">
              <header className="border-b border-asu-light/30 bg-asu-deep/60 px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-display min-w-0 text-lg uppercase tracking-wide text-foreground">{name}</h3>
                  <RollerzoneMark />
                </div>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                  <VeloproCredit />
                  {rows.every((r) => r.state === "unconfirmed") ? null : (
                    <span className={`font-condensed shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[2px] ${rows.some((r) => r.state !== "official") ? "border-asu-coral/70 text-asu-coral" : "border-asu-light/50 text-asu-light"}`}>
                      {RESULT_STATE_LABEL[rows.some((r) => r.state === "in_progress") ? "in_progress" : rows.some((r) => r.state === "provisional") ? "provisional" : rows.some((r) => r.state === "unconfirmed") ? "unconfirmed" : "official"]}
                    </span>
                  )}
                </div>
              </header>
              <ol>
                {rows.map((r) => {
                  // Medallas solo con resultado oficial confirmado.
                  const p = r.state === "official" ? (r.position ?? 0) : 0;
                  const code = (r.country ?? "").toUpperCase().slice(0, 3);
                  const isEsp = code === "ESP";
                  return (
                    <li key={r.id} className={`grid grid-cols-[2.75rem_1fr_auto] items-center gap-3 border-b border-border/60 px-4 py-3 last:border-0 ${isEsp ? "border-l-2 border-l-gold bg-gold/10" : ""}`}>
                      <span className={`font-display flex h-11 w-11 items-center justify-center rounded-full text-2xl ${p >= 1 && p <= 3 ? MEDAL_CLS[p - 1] : "bg-surface-2 text-foreground"}`} title={p >= 1 && p <= 3 ? MEDAL[p - 1] : undefined}>
                        {r.position ?? "–"}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-base font-semibold text-foreground">
                          {FLAG[code] && <span className="mr-1.5" aria-hidden="true">{FLAG[code]}</span>}
                          {r.athlete}
                        </p>
                        <p className="font-condensed text-[11px] uppercase tracking-widest text-muted-foreground">
                          {[code, r.bib ? `Dorsal ${r.bib}` : null].filter(Boolean).join(" · ")}
                        </p>
                      </div>
                      <div className="text-right">
                        {r.time && <p className="font-display text-xl tabular-nums text-foreground">{r.time}</p>}
                        {!r.time && r.points != null && <p className="font-display text-xl tabular-nums text-foreground">{r.points} pts</p>}
                        {r.time && r.points != null && <p className="text-xs tabular-nums text-muted-foreground">{r.points} pts</p>}
                        {r.gap && <p className="text-xs tabular-nums text-muted-foreground">{r.gap}</p>}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
