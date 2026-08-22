import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type Related = {
  id: string;
  title: string;
  slug: string;
  image_url: string | null;
  published_at: string;
};

/**
 * "También te puede interesar": prioriza contenidos del mismo territorio
 * y completa con noticias generales de RollerZone si no hay suficientes.
 */
export function RelatedContent({
  countryCode,
  excludeId,
}: {
  countryCode: string | null;
  excludeId: string;
}) {
  const [items, setItems] = useState<Related[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const cols = "id,title,slug,image_url,published_at";
      const collected: Related[] = [];

      if (countryCode) {
        const { data } = await supabase
          .from("news")
          .select(cols)
          .eq("published", true)
          .eq("country_code", countryCode)
          .neq("id", excludeId)
          .order("published_at", { ascending: false })
          .limit(3);
        collected.push(...(((data as Related[]) ?? [])));
      }

      if (collected.length < 3) {
        const { data } = await supabase
          .from("news")
          .select(cols)
          .eq("published", true)
          .neq("id", excludeId)
          .order("published_at", { ascending: false })
          .limit(6);
        for (const row of ((data as Related[]) ?? [])) {
          if (collected.length >= 3) break;
          if (!collected.some((c) => c.id === row.id)) collected.push(row);
        }
      }

      if (!cancelled) setItems(collected.slice(0, 3));
    })();
    return () => {
      cancelled = true;
    };
  }, [countryCode, excludeId]);

  if (items.length === 0) return null;

  return (
    <section className="mt-12 border-t border-border pt-6">
      <h3 className="font-display mb-4 text-sm uppercase tracking-widest text-gold">
        También te puede interesar
      </h3>
      <div className="grid gap-4 sm:grid-cols-3">
        {items.map((n) => (
          <Link
            key={n.id}
            to="/noticias/articulo/$slug"
            params={{ slug: n.slug }}
            className="group border border-border bg-surface transition-colors hover:border-gold"
          >
            <div className="aspect-[16/10] overflow-hidden bg-background">
              {n.image_url && (
                <img
                  src={n.image_url}
                  alt={n.title}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              )}
            </div>
            <div className="p-3">
              <h4 className="font-display text-sm uppercase leading-tight tracking-wide text-foreground group-hover:text-gold">
                {n.title}
              </h4>
              <div className="font-condensed mt-1 text-[11px] uppercase tracking-widest text-muted-foreground">
                {new Date(n.published_at).toLocaleDateString("es-ES")}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
