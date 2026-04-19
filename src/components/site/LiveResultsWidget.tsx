import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Radio, CheckCircle2, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type LiveResult = {
  id: string;
  event_name: string;
  category: string | null;
  status: "en_vivo" | "finalizado";
  first_name: string | null;
  first_time: string | null;
  first_club: string | null;
  second_name: string | null;
  second_time: string | null;
  second_club: string | null;
  third_name: string | null;
  third_time: string | null;
  third_club: string | null;
  news_id: string | null;
  news?: { slug: string } | null;
};

type Props = {
  /** If true, only fetch when there is at least one en_vivo entry. */
  liveOnly?: boolean;
  /** Max items to show. */
  limit?: number;
  /** Compact mode for home widget. */
  compact?: boolean;
};

export function LiveResultsWidget({ liveOnly = false, limit = 6, compact = false }: Props) {
  const [items, setItems] = useState<LiveResult[] | null>(null);

  const load = async () => {
    let q = supabase
      .from("live_results")
      .select("id, event_name, category, status, first_name, first_time, first_club, second_name, second_time, second_club, third_name, third_time, third_club, news_id, news:news_id(slug)")
      .eq("published", true)
      .order("status", { ascending: true }) // en_vivo before finalizado alphabetically
      .order("sort_order", { ascending: true })
      .order("updated_at", { ascending: false })
      .limit(limit);
    if (liveOnly) q = q.eq("status", "en_vivo");
    const { data } = await q;
    setItems((data ?? []) as unknown as LiveResult[]);
  };

  useEffect(() => {
    load();
    const channel = supabase
      .channel("live_results_widget")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "live_results" },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveOnly, limit]);

  if (items === null) return null;
  if (items.length === 0) {
    if (liveOnly) return null;
    return (
      <div className="border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        No hay resultados publicados todavía.
      </div>
    );
  }

  return (
    <div className={compact ? "grid gap-3 sm:grid-cols-2 lg:grid-cols-3" : "grid gap-4 sm:grid-cols-2 lg:grid-cols-3"}>
      {items.map((it) => (
        <ResultCard key={it.id} item={it} />
      ))}
    </div>
  );
}

function ResultCard({ item }: { item: LiveResult }) {
  const slug = item.news?.slug;
  const inner = (
    <article className="group h-full border border-border bg-surface p-4 transition-colors hover:border-gold">
      <div className="mb-2 flex items-center gap-2">
        {item.status === "en_vivo" ? (
          <span className="font-condensed inline-flex items-center gap-1 bg-red-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white">
            <Radio className="h-3 w-3 animate-pulse" /> En vivo
          </span>
        ) : (
          <span className="font-condensed inline-flex items-center gap-1 border border-border px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            <CheckCircle2 className="h-3 w-3" /> Final
          </span>
        )}
        {item.category && (
          <span className="font-condensed text-[10px] uppercase tracking-widest text-muted-foreground">
            {item.category}
          </span>
        )}
      </div>
      <h3 className="text-sm font-semibold text-foreground group-hover:text-gold">
        {item.event_name}
      </h3>
      <ol className="mt-3 space-y-1 text-sm">
        {[
          { pos: 1, name: item.first_name, time: item.first_time, club: item.first_club, medal: "🥇" },
          { pos: 2, name: item.second_name, time: item.second_time, club: item.second_club, medal: "🥈" },
          { pos: 3, name: item.third_name, time: item.third_time, club: item.third_club, medal: "🥉" },
        ]
          .filter((p) => p.name)
          .map((p) => (
            <li key={p.pos} className="flex items-baseline gap-2">
              <span className="text-base">{p.medal}</span>
              <span className="min-w-0 flex-1 truncate text-foreground">
                {p.name}
                {p.club && (
                  <span className="ml-1 text-xs text-muted-foreground">· {p.club}</span>
                )}
              </span>
              {p.time && (
                <span className="font-mono text-xs text-muted-foreground">{p.time}</span>
              )}
            </li>
          ))}
      </ol>
      {slug && (
        <div className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-gold">
          Ver noticia <ArrowRight className="h-3 w-3" />
        </div>
      )}
    </article>
  );
  if (slug) {
    return (
      <Link to="/noticias/articulo/$slug" params={{ slug }} className="block">
        {inner}
      </Link>
    );
  }
  return inner;
}
