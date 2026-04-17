import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Calendar, Eye, User as UserIcon, Instagram, Facebook, MessageCircle, Link as LinkIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getVisitorHash } from "@/lib/visitor";
import { toast } from "sonner";

type Article = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  author: string;
  legacy_tag: string | null;
  image_url: string | null;
  read_minutes: number | null;
  views_count: number;
  published_at: string;
  news_categories: { id: string; name: string; slug: string; scope: string } | null;
};

export const Route = createFileRoute("/noticias/articulo/$slug")({
  loader: async ({ params }) => {
    const { data } = await supabase
      .from("news")
      .select(
        "id, title, slug, excerpt, content, author, legacy_tag, image_url, read_minutes, views_count, published_at, news_categories(id, name, slug, scope)"
      )
      .eq("slug", params.slug)
      .eq("published", true)
      .maybeSingle();
    if (!data) throw notFound();
    return { article: data as unknown as Article };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.article.title} — RollerZone` },
          { name: "description", content: loaderData.article.excerpt ?? "RollerZone" },
          { property: "og:title", content: loaderData.article.title },
          { property: "og:description", content: loaderData.article.excerpt ?? "" },
          { property: "og:type", content: "article" },
          ...(loaderData.article.image_url
            ? ([
                { property: "og:image", content: loaderData.article.image_url },
                { name: "twitter:image", content: loaderData.article.image_url },
              ] as const)
            : []),
        ]
      : [],
  }),
  notFoundComponent: () => (
    <div className="mx-auto max-w-3xl px-6 py-16 text-center">
      <h1 className="font-display text-4xl tracking-widest">Noticia no encontrada</h1>
      <Link to="/noticias" className="mt-6 inline-block text-gold hover:underline">
        ← Volver a noticias
      </Link>
    </div>
  ),
  component: ArticlePage,
});

function ArticlePage() {
  const { article } = Route.useLoaderData();
  const [views, setViews] = useState(article.views_count);
  const url = typeof window !== "undefined" ? window.location.href : "";

  // Register a unique view per visitor
  useEffect(() => {
    const hash = getVisitorHash();
    supabase
      .rpc("register_news_view", { _news_id: article.id, _visitor_hash: hash })
      .then(({ data, error }) => {
        if (!error && typeof data === "number") setViews(data);
      });
  }, [article.id]);

  const shareInstagram = () => {
    // Instagram doesn't support direct URL sharing; copy link as fallback
    navigator.clipboard.writeText(url).then(() => {
      toast.success("Enlace copiado", {
        description: "Pégalo en tu historia o publicación de Instagram.",
      });
      window.open("https://www.instagram.com/", "_blank", "noopener,noreferrer");
    });
  };
  const shareFacebook = () => {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      "_blank",
      "noopener,noreferrer"
    );
  };
  const shareWhatsapp = () => {
    window.open(
      `https://wa.me/?text=${encodeURIComponent(`${article.title} ${url}`)}`,
      "_blank",
      "noopener,noreferrer"
    );
  };
  const copyLink = () => {
    navigator.clipboard.writeText(url);
    toast.success("Enlace copiado al portapapeles");
  };

  const paragraphs = (article.content ?? "")
    .split("\n")
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <article className="mx-auto max-w-4xl px-6 py-10">
      <nav className="font-condensed mb-3 text-xs uppercase tracking-widest text-muted-foreground">
        <Link to="/noticias" className="hover:text-gold">Noticias</Link>
        {article.news_categories && (
          <>
            <span className="mx-2 text-gold">/</span>
            <Link
              to="/noticias/$slug"
              params={{ slug: article.news_categories.slug }}
              className="hover:text-gold"
            >
              {article.news_categories.name}
            </Link>
          </>
        )}
      </nav>

      <header className="mb-6">
        <div className="font-condensed mb-3 flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-widest">
          {article.news_categories && (
            <span className="bg-gold/15 px-2 py-1 font-bold text-gold">
              {article.news_categories.name}
            </span>
          )}
          {article.legacy_tag && (
            <span className="border border-border px-2 py-1 text-muted-foreground">
              {article.legacy_tag}
            </span>
          )}
        </div>
        <h1 className="font-display text-3xl uppercase leading-tight tracking-wider md:text-5xl">
          {article.title}
        </h1>
        {article.excerpt && (
          <p className="mt-3 text-base text-muted-foreground md:text-lg">{article.excerpt}</p>
        )}

        <div className="font-condensed mt-5 flex flex-wrap items-center gap-4 border-y border-border py-3 text-xs uppercase tracking-widest text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <UserIcon className="h-3.5 w-3.5 text-gold" />
            <span className="text-foreground">{article.author}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-gold" />
            {new Date(article.published_at).toLocaleDateString("es-ES", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </span>
          <span className="flex items-center gap-1.5">
            <Eye className="h-3.5 w-3.5 text-gold" />
            {views} visita{views === 1 ? "" : "s"}
          </span>
          {article.read_minutes && (
            <span className="ml-auto text-muted-foreground/70">
              {article.read_minutes} min de lectura
            </span>
          )}
        </div>
      </header>

      {article.image_url && (
        <img
          src={article.image_url}
          alt={article.title}
          className="mb-8 aspect-[16/9] w-full object-cover"
        />
      )}

      <div className="prose prose-invert max-w-none space-y-4 text-[16px] leading-relaxed text-foreground/90">
        {paragraphs.length === 0 ? (
          <p className="italic text-muted-foreground">
            (Sin contenido — añade el cuerpo del artículo desde el panel de administración)
          </p>
        ) : (
          paragraphs.map((p, i) => <p key={i}>{p}</p>)
        )}
      </div>

      {/* Compartir */}
      <div className="mt-10 border-t border-border pt-6">
        <h3 className="font-display mb-3 text-sm tracking-widest text-gold">Compartir</h3>
        <div className="flex flex-wrap gap-2">
          <ShareBtn label="Instagram" onClick={shareInstagram} icon={<Instagram className="h-4 w-4" />} />
          <ShareBtn label="Facebook" onClick={shareFacebook} icon={<Facebook className="h-4 w-4" />} />
          <ShareBtn label="WhatsApp" onClick={shareWhatsapp} icon={<MessageCircle className="h-4 w-4" />} />
          <ShareBtn label="Copiar enlace" onClick={copyLink} icon={<LinkIcon className="h-4 w-4" />} />
        </div>
      </div>
    </article>
  );
}

function ShareBtn({ label, onClick, icon }: { label: string; onClick: () => void; icon: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="font-condensed inline-flex items-center gap-2 border border-border bg-surface px-4 py-2 text-xs font-bold uppercase tracking-widest text-foreground transition-colors hover:border-gold hover:text-gold"
    >
      {icon} {label}
    </button>
  );
}
