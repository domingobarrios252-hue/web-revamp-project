import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getCountryBySlug } from "@/lib/countries";

export const Route = createFileRoute("/$country/noticias")({
  component: CountryNews,
});

type Row = { id: string; title: string; slug: string; excerpt: string | null; image_url: string | null; published_at: string };

function CountryNews() {
  const { country: slug } = Route.useParams();
  const c = getCountryBySlug(slug)!;
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data: vis } = await supabase
        .from("news_visibility").select("news_id")
        .eq("channel", "country").eq("country_code", c.code);
      const ids = (vis ?? []).map((r) => r.news_id);
      if (!ids.length) { if (alive) { setRows([]); setLoading(false); } return; }
      const { data } = await supabase
        .from("news").select("id,title,slug,excerpt,image_url,published_at")
        .in("id", ids).eq("published", true)
        .order("published_at", { ascending: false }).limit(50);
      if (alive) { setRows((data as Row[]) ?? []); setLoading(false); }
    })();
    return () => { alive = false; };
  }, [c.code]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
      <h1 className="font-display mb-6 text-3xl tracking-widest">
        Noticias <span className="text-gold">{c.name}</span>
      </h1>
      {loading ? (
        <div className="h-40 animate-pulse rounded-lg bg-surface" />
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aún no hay noticias publicadas para {c.name}.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((n) => (
            <Link key={n.id} to="/noticias/articulo/$slug" params={{ slug: n.slug }}
              className="group overflow-hidden rounded-lg border border-border bg-surface transition-all hover:-translate-y-0.5 hover:border-gold">
              <div className="aspect-[16/9] w-full overflow-hidden bg-background">
                {n.image_url && <img src={n.image_url} alt={n.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />}
              </div>
              <div className="p-4">
                <h3 className="font-display line-clamp-2 text-base tracking-wide">{n.title}</h3>
                {n.excerpt && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{n.excerpt}</p>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
