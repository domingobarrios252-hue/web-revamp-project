import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Timer } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { LiveResultsWidget } from "@/components/site/LiveResultsWidget";

export function LiveResultsHomeSection() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = () =>
      supabase
        .from("live_results")
        .select("id", { count: "exact", head: true })
        .eq("published", true)
        .then(({ count: c }) => {
          if (!cancelled) setCount(c ?? 0);
        });
    load();
    const channel = supabase
      .channel("live_results_home_count")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "live_results" },
        () => load(),
      )
      .subscribe();
    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, []);

  if (count === null || count === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-6 py-10">
      <div className="mb-6 flex items-baseline justify-between border-b border-border pb-3">
        <h2 className="font-display flex items-center gap-3 text-2xl tracking-widest md:text-3xl">
          <Timer className="h-6 w-6 text-gold" />
          Resultados <span className="text-gold">en vivo</span>
        </h2>
        <Link
          to="/resultados"
          className="font-condensed text-xs font-bold uppercase tracking-widest text-gold hover:text-gold-dark"
        >
          Ver todos →
        </Link>
      </div>
      <LiveResultsWidget limit={6} compact />
    </section>
  );
}
