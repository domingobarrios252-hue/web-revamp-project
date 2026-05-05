import { useEffect, useState } from "react";

import { supabase } from "@/integrations/supabase/client";

type LiveItem = { id: string; event_name: string; category: string | null; location: string | null };

export function LiveBar() {
  const [items, setItems] = useState<LiveItem[]>([]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const { data } = await supabase
        .from("schedule_items")
        .select("id, event_name, category, location, status, published")
        .eq("published", true)
        .eq("status", "en_curso")
        .order("scheduled_at", { ascending: true })
        .limit(8);
      if (!cancelled) setItems((data ?? []) as LiveItem[]);
    };
    load();
    const ch = supabase
      .channel("live-bar")
      .on("postgres_changes", { event: "*", schema: "public", table: "schedule_items" }, load)
      .subscribe();
    return () => {
      cancelled = true;
      supabase.removeChannel(ch);
    };
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="w-full bg-black border-b border-[#333]">
      <div className="flex items-center h-8 overflow-hidden">
        <div className="flex items-center gap-2 bg-[#D4001A] h-full px-3 flex-shrink-0">
          <span className="h-2 w-2 rounded-full bg-white animate-pulse" aria-hidden />
          <span className="text-[11px] font-bold uppercase tracking-widest text-white">EN DIRECTO</span>
        </div>
        <div className="flex-1 overflow-x-auto whitespace-nowrap">
          <a
            href="/#live-center"
            className="inline-flex items-center gap-6 px-4 text-xs font-semibold text-white hover:text-[#D4A017] transition-colors"
          >
            {items.map((it) => (
              <span key={it.id} className="inline-flex items-center gap-2">
                <span className="text-white">{it.event_name}</span>
                {it.location && <span className="text-[#A0A0A0]">· {it.location}</span>}
                <span className="text-[#D4A017]">→ Ver resultados</span>
              </span>
            ))}
          </a>
        </div>
      </div>
    </div>
  );
}
