import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Calendar, Eye, User as UserIcon, Newspaper, Inbox } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AdBannerSmall } from "@/components/site/AdBannerSmall";
import { EmptyState } from "@/components/site/EmptyState";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { formatDate } from "@/lib/i18n/format";
import { cropObjectPosition } from "@/lib/imageCrops";

type News = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  author: string;
  legacy_tag: string | null;
  image_url: string | null;
  image_crops: import("@/lib/imageCrops").ImageCrops | null;
  views_count: number;
  published_at: string;
  news_categories: { name: string; slug: string; scope: string } | null;
};

type Category = { id: string; name: string; slug: string; scope: string };

export const Route = createFileRoute("/noticias/")({
  head: () => ({
    meta: [
      { title: "Noticias — RollerZone" },
      {
        name: "description",
        content:
          "Todas las noticias del patinaje de velocidad: nacionales, internacionales y reportajes.",
      },
      { property: "og:title", content: "Noticias — RollerZone" },
      {
        property: "og:description",
        content: "Todas las noticias del patinaje de velocidad.",
      },
    ],
  }),
  component: NoticiasIndexPage,
});

function NoticiasIndexPage() {
  const { t, lang } = useLanguage();
  const [news, setNews] = useState<News[] | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [scope, setScope] = useState<"all" | "Nacional" | "Internacional">("all");
  const [showAllCats, setShowAllCats] = useState(false);

  useEffect(() => {
    supabase
      .from("news")
      .select(
        "id, title, slug, excerpt, author, legacy_tag, image_url, image_crops, views_count, published_at, news_categories(name, slug, scope)"
      )
      .eq("published", true)
      .order("published_at", { ascending: false })
      .then(async ({ data, error }) => {
        if (error) { setNews([]); return; }
        const rows = (data as unknown as (News & { id: string })[]) ?? [];
        if (rows.length === 0) { setNews([]); return; }
        const { data: visData } = await supabase
          .from("news_visibility")
          .select("news_id, channel")
          .in("channel", ["global_home", "country"])
          .in("news_id", rows.map((r) => r.id));
        const withAnyRow = new Set<string>();
        const onHome = new Set<string>();
        for (const v of (visData ?? []) as { news_id: string; channel: string }[]) {
          withAnyRow.add(v.news_id);
          if (v.channel === "global_home") onHome.add(v.news_id);
        }
        setNews(rows.filter((r) => onHome.has(r.id) || !withAnyRow.has(r.id)));
      });

    supabase
      .from("news_categories")
      .select("id, name, slug, scope")
      .order("sort_order", { ascending: true })
      .then(({ data, error }) => setCategories(error ? [] : ((data as Category[]) ?? [])));
  }, []);

  const filtered = useMemo(() => {
    if (!news) return null;
    if (scope === "all") return news;
    return news.filter((n) => n.news_categories?.scope === scope);
  }, [news, scope]);

  const tabs: { key: "all" | "Nacional" | "Internacional"; label: string }[] = [
    { key: "all", label: t("news.all") },
    { key: "Nacional", label: t("nav.national") },
    { key: "Internacional", label: t("nav.international") },
  ];

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <header className="mb-8">
        <p className="font-condensed text-xs uppercase tracking-widest text-gold">{t("news.category")}</p>
        <h1 className="font-display text-5xl tracking-widest md:text-6xl">
          {t("home.latestNews")} <span className="text-gold">{t("home.latestNewsAccent")}</span>
        </h1>
        <div className="mt-4 h-[2px] w-24 bg-gold" aria-hidden="true" />
      </header>

      {/* Filtros de ámbito — fila horizontal desplazable en móvil */}
      <div
        role="tablist"
        aria-label="Filtrar noticias por ámbito"
        className="filters-scroll mb-4 -mx-6 flex gap-2 overflow-x-auto px-6 pb-2 sm:mx-0 sm:flex-wrap sm:px-0 sm:pb-0"
      >
        {tabs.map((tab) => {
          const active = scope === tab.key;
          return (
            <button
              key={tab.key}
              role="tab"
              aria-selected={active}
              onClick={() => setScope(tab.key)}
              className={
                "font-condensed shrink-0 snap-start whitespace-nowrap px-4 py-2 text-xs uppercase tracking-widest transition-colors " +
                (active
                  ? "border-b-2 border-gold bg-gold text-background shadow-[0_2px_0_0_var(--color-gold)]"
                  : "border border-border bg-transparent text-muted-foreground hover:border-gold hover:text-gold")
              }
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Subcategorías — scroll horizontal + "Ver todas" */}
      {categories.length > 0 && (() => {
        const list = categories.filter((c) => scope === "all" || c.scope === scope);
        if (list.length === 0) return null;
        return (
          <div className="mb-8">
            <div
              className={
                showAllCats
                  ? "flex flex-wrap gap-2"
                  : "filters-scroll -mx-6 flex gap-2 overflow-x-auto px-6 pb-2 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0"
              }
              aria-label="Subcategorías"
            >
              {list.map((c) => (
                <Link
                  key={c.id}
                  to="/noticias/$slug"
                  params={{ slug: c.slug }}
                  className="font-condensed shrink-0 snap-start whitespace-nowrap border border-border bg-surface px-3 py-1.5 text-[11px] uppercase tracking-wider text-muted-foreground hover:border-gold hover:text-gold"
                >
                  {c.name}
                </Link>
              ))}
            </div>
            {list.length > 4 && (
              <button
                type="button"
                onClick={() => setShowAllCats((v) => !v)}
                className="font-condensed mt-2 inline-flex items-center gap-1 text-[11px] uppercase tracking-widest text-gold hover:underline"
                aria-expanded={showAllCats}
              >
                {showAllCats ? "Ver menos" : "Ver todas"}
              </button>
            )}
          </div>
        );
      })()}

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0">
          {filtered === null ? (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <NewsSkeleton key={i} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyNews />
          ) : (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((n) => (
                <NewsListCard key={n.id} news={n} />
              ))}
            </div>
          )}
        </div>
        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <AdBannerSmall placement="noticias_side" />
        </aside>
      </div>
    </div>
  );
}

function NewsSkeleton() {
  return (
    <div className="overflow-hidden border border-border bg-surface">
      <div className="aspect-[16/10] animate-pulse bg-surface-2" />
      <div className="space-y-3 p-4">
        <div className="h-3 w-24 animate-pulse bg-surface-2" />
        <div className="h-4 w-full animate-pulse bg-surface-2" />
        <div className="h-4 w-3/4 animate-pulse bg-surface-2" />
        <div className="h-3 w-1/2 animate-pulse bg-surface-2" />
      </div>
    </div>
  );
}

function EmptyNews() {
  return (
    <EmptyState
      icon={Inbox}
      title="Próximamente"
      message="Aún no hay noticias publicadas en esta sección. Vuelve pronto o explora el resto del sitio."
      action={
        <Link
          to="/"
          className="font-condensed inline-flex items-center gap-2 border border-gold px-4 py-2 text-xs uppercase tracking-widest text-gold hover:bg-gold hover:text-background"
        >
          <Newspaper className="h-4 w-4" /> Volver al inicio
        </Link>
      }
    />
  );
}

function NewsListCard({ news }: { news: News }) {
  const { lang } = useLanguage();
  return (
    <Link
      to="/noticias/articulo/$slug"
      params={{ slug: news.slug }}
      className="group block overflow-hidden border border-border bg-surface transition-colors hover:border-gold"
      aria-label={`${news.title}`}
    >
      <div className="aspect-[16/10] overflow-hidden bg-surface-2">
        {news.image_url ? (
          <img
            src={news.image_url}
            alt={news.title}
            loading="lazy"
            style={{ objectPosition: cropObjectPosition(news.image_crops, "card") }}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />

        ) : (
          <div className="hero-grid-bg flex h-full w-full items-center justify-center">
            <span className="font-display text-5xl tracking-widest text-gold/30">RZ</span>
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="font-condensed mb-2 flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-widest">
          {news.news_categories && (
            <span className="bg-gold/15 px-2 py-0.5 font-bold text-gold">{news.news_categories.name}</span>
          )}
          {news.legacy_tag && <span className="text-muted-foreground">{news.legacy_tag}</span>}
        </div>
        <h3 className="font-display clamp-2 text-lg leading-tight tracking-wide group-hover:text-gold">
          {news.title}
        </h3>
        {news.excerpt && (
          <p className="clamp-2 mt-2 text-sm text-muted-foreground">{news.excerpt}</p>
        )}
        <div className="font-condensed mt-3 flex items-center gap-3 text-[11px] uppercase tracking-wider text-muted-foreground">
          <span className="flex items-center gap-1"><UserIcon className="h-3 w-3" /> {news.author}</span>
          {news.views_count > 0 && (
            <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {news.views_count}</span>
          )}
          <span className="ml-auto flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formatDate(news.published_at, lang, { day: "2-digit", month: "short" })}
          </span>
        </div>
      </div>
    </Link>
  );
}
