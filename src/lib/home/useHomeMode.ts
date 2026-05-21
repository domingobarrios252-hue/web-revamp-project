import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type HomeZoneMode = "liga" | "live" | "both" | "none";

export function useHomeMode() {
  const [mode, setMode] = useState<HomeZoneMode>("liga");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const sb = supabase as any;
      const { data } = await sb
        .from("home_modules")
        .select("value")
        .eq("key", "dynamic_zone_mode")
        .maybeSingle();
      if (cancelled) return;
      if (data?.value && ["liga", "live", "both", "none"].includes(data.value)) {
        setMode(data.value as HomeZoneMode);
      }
      setLoading(false);
    };
    load();
    const ch = supabase
      .channel("home-modules")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "home_modules" },
        load,
      )
      .subscribe();
    return () => {
      cancelled = true;
      supabase.removeChannel(ch);
    };
  }, []);

  return { mode, loading };
}
