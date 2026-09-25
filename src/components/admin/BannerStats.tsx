import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type Row = {
  banner_id: string | null;
  banner_ref: string;
  banner_name: string;
  advertiser_name: string | null;
  placement: string;
  device: string;
  day: string;
  impressions: number;
  clicks: number;
};

const ctr = (c: number, i: number) => (i > 0 ? `${((c / i) * 100).toFixed(2)} %` : "—");

/** Estadísticas agregadas de banners (solo admin). Incluye histórico de banners eliminados. */
export function BannerStats() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [days, setDays] = useState(30);

  useEffect(() => {
    const from = new Date(Date.now() - days * 864e5).toISOString().slice(0, 10);
    supabase
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .from("ad_banner_stats_daily" as any)
      .select("banner_id, banner_ref, banner_name, advertiser_name, placement, device, day, impressions, clicks")
      .gte("day", from)
      .then(({ data }) => setRows((data as unknown as Row[]) ?? []));
  }, [days]);

  const grouped = useMemo(() => {
    const m = new Map<string, Row & { deleted: boolean }>();
    for (const r of rows ?? []) {
      const k = `${r.banner_ref}|${r.placement}|${r.device}`;
      const cur = m.get(k);
      if (cur) {
        cur.impressions += Number(r.impressions);
        cur.clicks += Number(r.clicks);
      } else m.set(k, { ...r, impressions: Number(r.impressions), clicks: Number(r.clicks), deleted: !r.banner_id });
    }
    return [...m.values()].sort((a, b) => b.impressions - a.impressions);
  }, [rows]);

  return (
    <div className="mt-8">
      <div className="mb-2 flex items-center justify-between gap-3">
        <h2 className="font-display text-xl tracking-widest">Estadísticas</h2>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="border border-border bg-background px-2 py-1 text-xs"
        >
          <option value={7}>7 días</option>
          <option value={30}>30 días</option>
          <option value={90}>90 días</option>
          <option value={365}>365 días</option>
        </select>
      </div>
      {rows === null ? (
        <p className="text-sm text-muted-foreground">Cargando…</p>
      ) : grouped.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sin impresiones registradas en este periodo.</p>
      ) : (
        <div className="overflow-x-auto border border-border bg-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="font-condensed border-b border-border bg-background text-left text-[11px] uppercase tracking-widest text-muted-foreground">
                <th className="px-3 py-2">Banner</th>
                <th className="px-3 py-2">Anunciante</th>
                <th className="px-3 py-2">Posición</th>
                <th className="px-3 py-2">Dispositivo</th>
                <th className="px-3 py-2 text-right">Impresiones</th>
                <th className="px-3 py-2 text-right">Clics</th>
                <th className="px-3 py-2 text-right">CTR</th>
              </tr>
            </thead>
            <tbody>
              {grouped.map((r) => (
                <tr key={`${r.banner_ref}${r.placement}${r.device}`} className="border-b border-border/50 last:border-0">
                  <td className="px-3 py-2">
                    {r.banner_name}
                    {r.deleted && <span className="ml-2 text-[10px] uppercase tracking-widest text-muted-foreground">(eliminado)</span>}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{r.advertiser_name ?? "—"}</td>
                  <td className="px-3 py-2 text-gold">{r.placement}</td>
                  <td className="px-3 py-2 text-muted-foreground">{r.device === "desktop" ? "Desktop" : "Mobile"}</td>
                  <td className="px-3 py-2 text-right">{r.impressions}</td>
                  <td className="px-3 py-2 text-right">{r.clicks}</td>
                  <td className="px-3 py-2 text-right">{ctr(r.clicks, r.impressions)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
