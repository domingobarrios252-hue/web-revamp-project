import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Calendar, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatShortDate } from "@/lib/i18n/format";

export const Route = createFileRoute("/hub/$country/competicion/liga-nacional/noticias")({
  component: NoticiasLigaPage,
});

type NewsRow = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  image_url: string | null;
  published_at: string;
  views_count: number;
};

function NoticiasLigaPage() {
  const { country } = Route.useParams();
  const [news, setNews] = useState<NewsRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (supabase as any)
      .from("news")
      .select("id,title,slug,excerpt,image_url,published_at,views_count")
      .eq("published", true)
      .eq("country_code", country)
      .eq("competition_tag", "liga_nacional")
      .order("published_at", { ascending: false })
      .limit(50)
      .then(({ data }: { data: NewsRow[] | null }) => {
        if (cancelled) return;
        setNews(data ?? []);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [country]);

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-6 py-8">
      <header className="mb-6">
        <div className="font-ui text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4A017]">Liga Nacional</div>
        <h2 className="mt-1 font-display text-2xl md:text-3xl font-black text-[#F5F5F5]">Noticias de la Liga</h2>
        <p className="mt-1 text-sm text-[#888]">
          Feed editorial automático. Filtrado por país <span className="text-[#D4A017]">{country.toUpperCase()}</span> + etiqueta <code className="text-[#D4A017]">liga_nacional</code>. Sin duplicar contenido.
        </p>
      </header>

      {loading ? (
        <div className="text-sm text-[#888]">Cargando…</div>
      ) : news.length === 0 ? (
        <div className="rounded-[6px] border border-dashed border-[#333] bg-[#141414] p-8 text-center text-sm text-[#888]">
          Aún no hay noticias etiquetadas como Liga Nacional. Desde admin marca la etiqueta <code className="text-[#D4A017]">competition_tag = "liga_nacional"</code> en las noticias que correspondan.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {news.map((n) => (
            <Link key={n.id} to="/noticias/$slug" params={{ slug: n.slug }}
              className="group block overflow-hidden rounded-[6px] border border-[#2A2A2A] bg-[#141414] hover:border-[#D4A017]/60">
              {n.image_url && (
                <div className="aspect-video overflow-hidden bg-[#0d0d0d]">
                  <img src={n.image_url} alt={n.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                </div>
              )}
              <div className="p-4">
                <h3 className="font-display text-base font-bold leading-snug text-[#F5F5F5] group-hover:text-[#D4A017] line-clamp-2">{n.title}</h3>
                {n.excerpt && <p className="mt-1.5 text-xs text-[#888] line-clamp-2">{n.excerpt}</p>}
                <div className="mt-2 flex items-center gap-3 text-[10px] text-[#888]">
                  <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" />{formatShortDate(n.published_at, "es")}</span>
                  <span className="inline-flex items-center gap-1"><Eye className="h-3 w-3" />{n.views_count}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
