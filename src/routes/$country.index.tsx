import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getCountryBySlug } from "@/lib/countries";

export const Route = createFileRoute("/$country/")({
  component: CountryHome,
});

type NewsRow = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  image_url: string | null;
  published_at: string;
};

type EventRow = {
  id: string;
  name: string;
  slug: string;
  start_date: string;
  location: string | null;
  cover_url: string | null;
};

function CountryHome() {
  const { country: slug } = Route.useParams();
  const c = getCountryBySlug(slug)!;
  const [news, setNews] = useState<NewsRow[]>([]);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const { data: visIds } = await supabase
        .from("news_visibility")
        .select("news_id")
        .eq("channel", "country")
        .eq("country_code", c.code);
      const ids = (visIds ?? []).map((r) => r.news_id);
      let newsRows: NewsRow[] = [];
      if (ids.length) {
        const { data } = await supabase
          .from("news")
          .select("id,title,slug,excerpt,image_url,published_at")
          .in("id", ids)
          .eq("published", true)
          .order("published_at", { ascending: false })
          .limit(7);
        newsRows = (data as NewsRow[]) ?? [];
      }
      const { data: evs } = await supabase
        .from("events")
        .select("id,name,slug,start_date,location,cover_url")
        .eq("published", true)
        .eq("country_code", c.code)
        .gte("start_date", new Date().toISOString().slice(0, 10))
        .order("start_date", { ascending: true })
        .limit(4);
      if (!alive) return;
      setNews(newsRows);
      setEvents((evs as EventRow[]) ?? []);
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [c.code]);

  const hero = news[0];
  const rest = news.slice(1, 7);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-10">
      {/* Hero */}
      <section className="mb-10">
        <div className="mb-4 flex items-baseline justify-between">
          <h1 className="font-display text-3xl tracking-widest md:text-4xl">
            <span className="text-gold">RollerZone</span> {c.name}
          </h1>
          <Link
            to="/$country/noticias"
            params={{ country: c.slug }}
            className="font-condensed text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-gold"
          >
            Ver todas →
          </Link>
        </div>

        {loading ? (
          <div className="h-72 animate-pulse rounded-lg bg-surface" />
        ) : hero ? (
          <Link
            to="/noticias/articulo/$slug"
            params={{ slug: hero.slug }}
            className="group relative block overflow-hidden rounded-lg border border-border bg-surface"
          >
            <div className="aspect-[16/8] w-full overflow-hidden bg-background">
              {hero.image_url && (
                <img
                  src={hero.image_url}
                  alt={hero.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              )}
            </div>
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-5">
              <span
                className="font-condensed inline-block rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-background"
                style={{ background: c.accents.c2 }}
              >
                {c.name}
              </span>
              <h2 className="font-display mt-2 text-xl tracking-wide text-white md:text-3xl">
                {hero.title}
              </h2>
              {hero.excerpt && (
                <p className="mt-2 line-clamp-2 max-w-2xl text-sm text-white/80">
                  {hero.excerpt}
                </p>
              )}
            </div>
          </Link>
        ) : (
          <EmptyBlock>Aún no hay noticias publicadas para {c.name}.</EmptyBlock>
        )}
      </section>

      {/* Latest news grid */}
      {rest.length > 0 && (
        <section className="mb-12">
          <SectionTitle>Últimas noticias</SectionTitle>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((n) => (
              <Link
                key={n.id}
                to="/noticias/articulo/$slug"
                params={{ slug: n.slug }}
                className="group overflow-hidden rounded-lg border border-border bg-surface transition-all hover:-translate-y-0.5 hover:border-gold"
              >
                <div className="aspect-[16/9] w-full overflow-hidden bg-background">
                  {n.image_url && (
                    <img
                      src={n.image_url}
                      alt={n.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-display line-clamp-2 text-base tracking-wide">
                    {n.title}
                  </h3>
                  {n.excerpt && (
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                      {n.excerpt}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Próximos eventos */}
      <section className="mb-12">
        <SectionTitle>Próximos eventos</SectionTitle>
        {loading ? (
          <div className="mt-4 h-32 animate-pulse rounded-lg bg-surface" />
        ) : events.length === 0 ? (
          <EmptyBlock>No hay eventos próximos en {c.name}.</EmptyBlock>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            {events.map((e) => (
              <Link
                key={e.id}
                to="/eventos/$slug"
                params={{ slug: e.slug }}
                className="flex items-center gap-4 rounded-lg border border-border bg-surface p-4 transition-colors hover:border-gold"
              >
                <div className="flex h-16 w-16 flex-col items-center justify-center rounded bg-background text-center">
                  <div className="font-display text-lg leading-none text-gold">
                    {new Date(e.start_date).getDate()}
                  </div>
                  <div className="font-condensed text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    {new Date(e.start_date).toLocaleString("es", { month: "short" })}
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-display truncate text-base tracking-wide">
                    {e.name}
                  </div>
                  {e.location && (
                    <div className="truncate text-xs text-muted-foreground">{e.location}</div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Quick links */}
      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { to: "atletas" as const, label: "Atletas" },
          { to: "clubes" as const, label: "Clubes" },
          { to: "entrevistas" as const, label: "Entrevistas" },
          { to: "galeria" as const, label: "Galería" },
        ].map((q) => (
          <Link
            key={q.to}
            to={`/$country/${q.to}` as "/$country/atletas"}
            params={{ country: c.slug }}
            className="font-condensed rounded-lg border border-border bg-surface p-5 text-center text-sm font-bold uppercase tracking-widest text-muted-foreground transition-colors hover:border-gold hover:text-gold"
          >
            {q.label}
          </Link>
        ))}
      </section>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-display border-l-4 border-gold pl-3 text-xl tracking-widest md:text-2xl">
      {children}
    </h2>
  );
}

function EmptyBlock({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-4 rounded-lg border border-dashed border-border bg-surface/40 p-8 text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}
