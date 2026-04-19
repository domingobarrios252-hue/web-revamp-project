import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const FALLBACK = [
  "Bienvenidos a RollerZone — Revista de Patinaje de Velocidad",
];

export function Ticker() {
  const [items, setItems] = useState<string[]>([]);
  const [enabled, setEnabled] = useState<boolean>(true);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const [itemsRes, settingRes] = await Promise.all([
        supabase
          .from("ticker_items")
          .select("text, sort_order, active")
          .eq("active", true)
          .order("sort_order", { ascending: true }),
        supabase.from("site_settings").select("value").eq("key", "ticker_enabled").maybeSingle(),
      ]);
      if (cancelled) return;
      const texts = (itemsRes.data ?? []).map((i) => i.text).filter(Boolean);
      setItems(texts.length ? texts : FALLBACK);
      const v = settingRes.data?.value;
      setEnabled(v === true || v === "true" || v === undefined || v === null);
      setLoaded(true);
    };
    load();

    const channel = supabase
      .channel("ticker-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "ticker_items" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "site_settings" }, load)
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, []);

  if (!loaded || !enabled || items.length === 0) return null;

  const repeated = [...items, ...items];
  return (
    <div className="flex h-9 items-center overflow-hidden bg-gold">
      <div className="flex h-full flex-shrink-0 items-center bg-background px-4">
        <span className="font-display text-sm tracking-widest text-gold">EN VIVO</span>
      </div>
      <div className="flex-1 overflow-hidden">
        <div className="ticker-track">
          {repeated.map((item, i) => (
            <div
              key={i}
              className="font-condensed flex flex-shrink-0 items-center gap-2 px-8 text-xs font-bold uppercase tracking-wider text-background"
            >
              <span className="h-1 w-1 rounded-full bg-background/40" />
              {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
