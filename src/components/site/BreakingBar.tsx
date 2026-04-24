import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

type BreakingItem = {
  id: string;
  title: string;
  slug: string;
  published_at: string;
};

/**
 * Barra "ÚLTIMA HORA" — banda horizontal animada bajo el header.
 * Muestra las 8 noticias más recientes en marquesina infinita.
 * Estilo medio deportivo (Marca / ESPN): fondo negro, etiqueta roja,
 * tipografía condensada en mayúsculas.
 */
export function BreakingBar() {
  const [items, setItems] = useState<BreakingItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const { data } = await supabase
        .from("news")
        .select("id, title, slug, published_at")
        .eq("published", true)
        .order("published_at", { ascending: false })
        .limit(8);
      if (cancelled) return;
      setItems((data as BreakingItem[]) ?? []);
      setLoaded(true);
    };
    load();

    const channel = supabase
      .channel("breaking-bar")
      .on("postgres_changes", { event: "*", schema: "public", table: "news" }, load)
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, []);

  if (!loaded || items.length === 0) return null;

  const repeated = [...items, ...items];

  return (
    <div className="relative flex h-10 w-full items-center overflow-hidden border-b-2 border-tv-red/60 bg-background">
      {/* Etiqueta fija roja — "ÚLTIMA HORA" */}
      <div className="live-red-tag relative z-10 flex h-full shrink-0 items-center gap-2 bg-tv-red px-4 shadow-[4px_0_12px_rgba(0,0,0,0.4)]">
        <span className="live-dot inline-block h-2 w-2 rounded-full bg-white" />
        <span className="font-condensed text-[12px] font-bold uppercase tracking-[3px] text-white">
          Última hora
        </span>
      </div>

      {/* Marquesina */}
      <div className="flex-1 overflow-hidden">
        <div className="ticker-track">
          {repeated.map((item, i) => (
            <Link
              key={`${item.id}-${i}`}
              to="/noticias/articulo/$slug"
              params={{ slug: item.slug }}
              className="font-condensed flex shrink-0 items-center gap-3 px-6 text-[13px] font-semibold uppercase tracking-wider text-foreground/90 transition-colors hover:text-gold"
            >
              <span className="h-1 w-1 rounded-full bg-gold/70" />
              {item.title}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
