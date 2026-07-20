import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Trophy, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Row = {
  id: string;
  country_name: string;
  country_code: string | null;
  flag_url: string | null;
  gold: number;
  silver: number;
  bronze: number;
  sort_order: number;
};

/**
 * Medallero compacto mostrado dentro del bloque "Camino al Europeo" en la home.
 * Se controla desde /admin/medallero (toggle "Mostrar en portada" + filas).
 */
export function HomeMedalStandings() {
  const [rows, setRows] = useState<Row[]>([]);
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [{ data: setting }, { data }] = await Promise.all([
        supabase.from("site_settings").select("value").eq("key", "home_medals_enabled").maybeSingle(),
        supabase
          .from("medal_standings")
          .select("id,country_name,country_code,flag_url,gold,silver,bronze,sort_order")
          .eq("published", true)
          .order("gold", { ascending: false })
          .order("silver", { ascending: false })
          .order("bronze", { ascending: false })
          .limit(10),
      ]);
      if (cancelled) return;
      const isOn = Boolean((setting?.value as { enabled?: boolean } | null)?.enabled);
      setEnabled(isOn);
      setRows((data as Row[]) ?? []);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading || !enabled || rows.length === 0) return null;

  return (
    <section className="relative border-b border-gold/25 bg-background py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="font-condensed inline-flex items-center gap-2 bg-gold px-2.5 py-1 text-[10px] font-bold uppercase tracking-[3px] text-background">
              <Trophy className="h-3 w-3" /> Medallero
            </div>
            <h3 className="font-display mt-3 text-2xl uppercase tracking-wider text-foreground md:text-3xl">
              Medallero del Europeo 2026
            </h3>
            <div className="mt-2 h-[3px] w-16 bg-gold" aria-hidden="true" />
          </div>
          <Link
            to="/camino-al-europeo-2026/resultados-y-medallero"
            className="font-condensed inline-flex items-center gap-2 rounded-md border border-gold/60 bg-black/30 px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-gold transition-all hover:bg-black/50"
          >
            Ver medallero completo <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="overflow-x-auto rounded-xl border border-border bg-surface shadow-lg">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-black/30">
              <tr className="font-condensed text-left text-[10px] uppercase tracking-[2px] text-muted-foreground">
                <th className="px-3 py-2 w-10 text-center">#</th>
                <th className="px-3 py-2">País</th>
                <th className="px-3 py-2 text-center">🥇</th>
                <th className="px-3 py-2 text-center">🥈</th>
                <th className="px-3 py-2 text-center">🥉</th>
                <th className="px-3 py-2 text-center">Total</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.id} className="border-b border-border last:border-0 hover:bg-background/40">
                  <td className="px-3 py-2 text-center font-display text-gold">{i + 1}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      {r.flag_url && (
                        <img src={r.flag_url} alt="" className="h-4 w-6 object-cover" loading="lazy" />
                      )}
                      <span className="font-medium text-foreground">{r.country_name}</span>
                      {r.country_code && (
                        <span className="font-mono text-[10px] text-muted-foreground">{r.country_code}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-center font-bold text-gold">{r.gold}</td>
                  <td className="px-3 py-2 text-center">{r.silver}</td>
                  <td className="px-3 py-2 text-center">{r.bronze}</td>
                  <td className="px-3 py-2 text-center font-display">
                    {r.gold + r.silver + r.bronze}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
