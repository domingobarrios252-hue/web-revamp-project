import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type TvLiveRow = {
  live_is_active: boolean | null;
  status_label: string | null;
  live_starts_at: string | null;
  live_ends_at: string | null;
};

/**
 * Hook compartido para saber si RollerZone TV está emitiendo en directo.
 * Fuente única de verdad: tabla `tv_settings` (misma que el panel de admin).
 * Se usa tanto en /tv como en /camino-al-europeo-2026 para sincronizar el
 * estado "EN DIRECTO" / "próximamente" en todas las páginas.
 */
export function useTvLiveStatus(): boolean {
  const [row, setRow] = useState<TvLiveRow | null>(null);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("tv_settings")
      .select("live_is_active, status_label, live_starts_at, live_ends_at")
      .order("updated_at", { ascending: false })
      .limit(1)
      .then(({ data }) => {
        if (cancelled) return;
        const first = Array.isArray(data) ? data[0] : data;
        setRow((first as TvLiveRow) ?? null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  return useMemo(() => {
    if (!row) return false;
    if (row.live_is_active) return true;
    if (row.status_label === "live") return true;
    if (row.live_starts_at) {
      const start = new Date(row.live_starts_at).getTime();
      const end = row.live_ends_at
        ? new Date(row.live_ends_at).getTime()
        : start + 1000 * 60 * 60 * 4;
      const t = now.getTime();
      if (t >= start && t <= end) return true;
    }
    return false;
  }, [row, now]);
}
