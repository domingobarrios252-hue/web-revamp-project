import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Trophy, ExternalLink } from "lucide-react";
import { SpecialBreadcrumb } from "@/components/specials/europeo-2026/SpecialBreadcrumb";
import { SpecialHero } from "@/components/specials/europeo-2026/SpecialHero";
import { SpecialSubNav } from "@/components/specials/europeo-2026/SpecialSubNav";
import { BackToSpecial } from "@/components/specials/europeo-2026/BackToSpecial";
import { getPiece, EVENT } from "@/lib/specials/europeo-2026";
import { supabase } from "@/integrations/supabase/client";

const PIECE = getPiece("resultados-y-medallero");
const CANON = "https://rollerzone.lovable.app/camino-al-europeo-2026/resultados-y-medallero";

export const Route = createFileRoute("/camino-al-europeo-2026/resultados-y-medallero")({
  head: () => ({
    meta: [
      { title: `${PIECE.title} — Europeo 2026` },
      { name: "description", content: PIECE.description },
      { property: "og:title", content: PIECE.title },
      { property: "og:description", content: PIECE.description },
      { property: "og:url", content: CANON },
      { property: "og:type", content: "article" },
      { property: "og:image", content: PIECE.image },
    ],
    links: [{ rel: "canonical", href: CANON }],
  }),
  component: Page,
});

type Row = {
  id: string;
  country_name: string;
  country_code: string | null;
  flag_url: string | null;
  gold: number;
  silver: number;
  bronze: number;
};

function Page() {
  const [rows, setRows] = useState<Row[]>([]);
  const [externalUrl, setExternalUrl] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [{ data }, { data: setting }] = await Promise.all([
        supabase
          .from("medal_standings")
          .select("id,country_name,country_code,flag_url,gold,silver,bronze")
          .eq("published", true)
          .order("gold", { ascending: false })
          .order("silver", { ascending: false })
          .order("bronze", { ascending: false }),
        supabase
          .from("site_settings")
          .select("value")
          .eq("key", "europeo_external_results_url")
          .maybeSingle(),
      ]);
      if (cancelled) return;
      setRows((data as Row[]) ?? []);
      const u = (setting?.value as { url?: string } | null)?.url;
      if (typeof u === "string") setExternalUrl(u);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <SpecialBreadcrumb current="Resultados" />
      <SpecialHero
        compact
        title={PIECE.title}
        subtitle={`Medallero oficial del Europeo (${EVENT.datesLabel}). Se actualiza en tiempo real durante el campeonato.`}
        image={PIECE.image}
      />
      <SpecialSubNav active="resultados-y-medallero" />

      <section className="bg-background py-14 md:py-20">
        <div className="mx-auto max-w-5xl px-4 md:px-6">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="font-condensed inline-flex items-center gap-2 bg-gold px-2.5 py-1 text-[10px] font-bold uppercase tracking-[3px] text-background">
                <Trophy className="h-3 w-3" /> Medallero
              </div>
              <h2 className="font-display mt-3 text-3xl uppercase tracking-wider text-foreground md:text-4xl">
                Medallero completo
              </h2>
              <div className="mt-3 h-[3px] w-16 bg-gold" />
            </div>
            {externalUrl && (
              <a
                href={externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-condensed inline-flex items-center gap-2 rounded-md border border-gold/60 bg-black/30 px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-gold transition-all hover:bg-black/50"
              >
                Resultados oficiales <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </div>

          {loading ? (
            <p className="text-muted-foreground">Cargando medallero…</p>
          ) : rows.length === 0 ? (
            <div className="rounded-xl border border-border bg-surface p-10 text-center">
              <Trophy className="mx-auto h-10 w-10 text-gold/70" />
              <p className="mt-4 text-muted-foreground">
                El medallero se activará durante el campeonato. Vuelve pronto para
                seguir las medallas país a país.
              </p>
            </div>
          ) : (
            <>
              {/* Mobile: cards */}
              <ul className="grid grid-cols-1 gap-3 md:hidden">
                {rows.map((r, i) => (
                  <li
                    key={r.id}
                    className="rounded-xl border border-border bg-surface p-3 shadow-md"
                    style={{ boxSizing: "border-box", minWidth: 0 }}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="font-display text-lg text-gold shrink-0 w-6 text-center">{i + 1}</span>
                      {r.flag_url && (
                        <img src={r.flag_url} alt="" className="h-4 w-6 shrink-0 object-cover" loading="lazy" />
                      )}
                      <span className="truncate text-[15px] font-medium text-foreground min-w-0 flex-1">
                        {r.country_name}
                      </span>
                      {r.country_code && (
                        <span className="shrink-0 font-mono text-[11px] text-muted-foreground">{r.country_code}</span>
                      )}
                    </div>
                    <dl className="mt-3 grid grid-cols-4 gap-2 text-center text-[14px]">
                      <div><dt className="text-[11px] uppercase tracking-widest text-muted-foreground">🥇</dt><dd className="font-bold text-gold">{r.gold}</dd></div>
                      <div><dt className="text-[11px] uppercase tracking-widest text-muted-foreground">🥈</dt><dd className="font-semibold text-foreground">{r.silver}</dd></div>
                      <div><dt className="text-[11px] uppercase tracking-widest text-muted-foreground">🥉</dt><dd className="font-semibold text-foreground">{r.bronze}</dd></div>
                      <div><dt className="text-[11px] uppercase tracking-widest text-muted-foreground">Total</dt><dd className="font-display text-foreground">{r.gold + r.silver + r.bronze}</dd></div>
                    </dl>
                  </li>
                ))}
              </ul>

              {/* Desktop: table */}
              <div className="hidden rounded-xl border border-border bg-surface shadow-lg md:block">
                <table className="w-full text-sm">
                  <thead className="border-b border-border bg-black/30">
                    <tr className="font-condensed text-left text-[10px] uppercase tracking-[2px] text-muted-foreground">
                      <th className="w-10 px-3 py-3 text-center">#</th>
                      <th className="px-3 py-3">País</th>
                      <th className="px-3 py-3 text-center">🥇</th>
                      <th className="px-3 py-3 text-center">🥈</th>
                      <th className="px-3 py-3 text-center">🥉</th>
                      <th className="px-3 py-3 text-center">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => (
                      <tr key={r.id} className="border-b border-border last:border-0 hover:bg-background/40">
                        <td className="px-3 py-3 text-center font-display text-gold">{i + 1}</td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2 min-w-0">
                            {r.flag_url && (
                              <img src={r.flag_url} alt="" className="h-4 w-6 shrink-0 object-cover" loading="lazy" />
                            )}
                            <span className="font-medium text-foreground">{r.country_name}</span>
                            {r.country_code && (
                              <span className="font-mono text-[10px] text-muted-foreground">{r.country_code}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-3 text-center font-bold text-gold">{r.gold}</td>
                        <td className="px-3 py-3 text-center">{r.silver}</td>
                        <td className="px-3 py-3 text-center">{r.bronze}</td>
                        <td className="px-3 py-3 text-center font-display">
                          {r.gold + r.silver + r.bronze}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          <div className="mt-10 text-center">
            <Link
              to="/resultados"
              className="font-condensed inline-flex items-center gap-2 rounded-md border border-gold/60 bg-black/20 px-6 py-3 text-xs font-bold uppercase tracking-widest text-gold transition-all hover:bg-black/40"
            >
              Ver todos los resultados publicados
            </Link>
          </div>
        </div>
      </section>

      <BackToSpecial />
    </>
  );
}
