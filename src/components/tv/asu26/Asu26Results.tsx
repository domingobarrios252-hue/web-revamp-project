import type { NormalizedResult } from "@/lib/results/provider";
import { RESULT_STATE_LABEL } from "@/lib/results/provider";
import { httpsOnly, type Asu26StreamingConfig } from "@/lib/tv/asu26Streaming";

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
export function Asu26Results({ cfg, results }: { cfg: Asu26StreamingConfig; results: NormalizedResult[] }) {
  const embed = cfg.veloproEnabled ? httpsOnly(cfg.veloproEmbedUrl) : "";
  const groups = new Map<string, NormalizedResult[]>();
  for (const r of results) {
    const k = [r.race, r.category, r.gender, r.phase].filter(Boolean).join(" · ") || "Resultados";
    groups.set(k, [...(groups.get(k) ?? []), r]);
  }

  return (
    <div>
      {embed ? (
        <div className="aspect-[4/5] w-full overflow-hidden rounded-2xl border border-border bg-surface sm:aspect-video">
          <iframe src={embed} title="Resultados oficiales VeloPro" className="h-full w-full" loading="lazy" referrerPolicy="strict-origin-when-cross-origin" />
        </div>
      ) : results.length === 0 ? (
        <div className="rounded-2xl border border-border bg-surface/60 px-5 py-6 text-center md:py-7">
          <p className="font-display text-xl uppercase tracking-wide text-foreground md:text-2xl">
            Los resultados oficiales aparecerán aquí durante la competición.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">Integración de resultados en directo disponible durante ASU26.</p>
          <p className="font-condensed mt-3 text-xs uppercase tracking-[3px] text-muted-foreground">
            Proveedor oficial de resultados: VeloPro.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {[...groups].map(([name, rows]) => (
            <article key={name} className="overflow-hidden rounded-2xl border border-border bg-surface">
              <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
                <h3 className="font-display min-w-0 text-lg uppercase tracking-wide text-foreground">{name}</h3>
                <span className="font-condensed shrink-0 rounded-full border border-asu-light/50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[2px] text-asu-light">
                  {RESULT_STATE_LABEL[rows[0].state]}
                </span>
              </header>
              <ol>
                {rows.map((r) => {
                  const p = r.position ?? 0;
                  const code = (r.country ?? "").toUpperCase().slice(0, 3);
                  return (
                    <li key={r.id} className="grid grid-cols-[2.25rem_1fr_auto] items-center gap-3 border-b border-border/60 px-4 py-3 last:border-0">
                      <span className={`font-display flex h-9 w-9 items-center justify-center rounded-full text-lg ${p >= 1 && p <= 3 ? MEDAL_CLS[p - 1] : "bg-surface-2 text-foreground"}`} title={p >= 1 && p <= 3 ? MEDAL[p - 1] : undefined}>
                        {r.position ?? "–"}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {FLAG[code] && <span className="mr-1.5" aria-hidden="true">{FLAG[code]}</span>}
                          {r.athlete}
                        </p>
                        <p className="font-condensed text-[11px] uppercase tracking-widest text-muted-foreground">
                          {[code, r.bib ? `Dorsal ${r.bib}` : null].filter(Boolean).join(" · ")}
                        </p>
                      </div>
                      <div className="text-right">
                        {r.time && <p className="font-display text-lg tabular-nums text-foreground">{r.time}</p>}
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
