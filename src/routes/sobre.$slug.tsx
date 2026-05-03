import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { renderMarkdown } from "@/lib/markdown";
import {
  Info,
  Users,
  Handshake,
  Megaphone,
  Mail,
  ChevronRight,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

export const Route = createFileRoute("/sobre/$slug")({
  loader: async ({ params }) => {
    const { data, error } = await supabase
      .from("about_pages")
      .select("title, content, updated_at, published")
      .eq("slug", params.slug)
      .maybeSingle();
    if (error || !data || !data.published) throw notFound();
    return { page: data, slug: params.slug };
  },
  head: ({ loaderData, params }) => {
    const title = loaderData?.page.title ?? "Sobre nosotros";
    const slug = params.slug;
    const meta = SLUG_SEO[slug];
    const description =
      meta?.description ??
      stripToDescription(loaderData?.page.content) ??
      `${title} — RollerZone, el medio del patinaje de velocidad.`;
    const fullTitle = `${title} — RollerZone`;
    const url = `https://rollerzone.lovable.app/sobre/${slug}`;
    const ogImage =
      "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/96e18c62-051f-45d8-b718-d61cb204c1d5";
    return {
      meta: [
        { title: fullTitle },
        { name: "description", content: description },
        { name: "robots", content: "index, follow" },
        { name: "keywords", content: meta?.keywords ?? "RollerZone, patinaje de velocidad, noticias patinaje" },
        { property: "og:title", content: fullTitle },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { property: "og:url", content: url },
        { property: "og:image", content: ogImage },
        { property: "og:site_name", content: "RollerZone" },
        { property: "og:locale", content: "es_ES" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: fullTitle },
        { name: "twitter:description", content: description },
        { name: "twitter:image", content: ogImage },
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },
  component: AboutPage,
  notFoundComponent: () => (
    <div className="mx-auto max-w-2xl px-6 py-16 text-center">
      <h1 className="font-display text-3xl tracking-widest text-gold">Página no encontrada</h1>
      <Link
        to="/"
        className="font-condensed mt-6 inline-flex items-center bg-gold px-5 py-2 text-xs font-bold uppercase tracking-widest text-background hover:bg-gold-dark"
      >
        Volver al inicio
      </Link>
    </div>
  ),
});

type SlugMeta = {
  Icon: LucideIcon;
  eyebrow: string;
  subtitle: string;
  cta?: { label: string; href: string; external?: boolean };
};

const SLUG_META: Record<string, SlugMeta> = {
  "quienes-somos": {
    Icon: Users,
    eyebrow: "Sobre RollerZone",
    subtitle:
      "El medio digital del patinaje de velocidad: noticias, rankings, eventos y entrevistas que mueven la pista.",
  },
  contacto: {
    Icon: Mail,
    eyebrow: "Habla con nosotros",
    subtitle:
      "¿Tienes una noticia, una propuesta o una duda? Estamos al otro lado para escucharte.",
    cta: { label: "Escríbenos", href: "mailto:info@rollerzone.es", external: true },
  },
  colabora: {
    Icon: Handshake,
    eyebrow: "Únete al proyecto",
    subtitle:
      "Redactores, fotógrafos, clubes y federaciones: hay sitio para quien quiera empujar el patinaje.",
    cta: { label: "Quiero colaborar", href: "mailto:info@rollerzone.es", external: true },
  },
  publicidad: {
    Icon: Megaphone,
    eyebrow: "Patrocinio y publicidad",
    subtitle:
      "Conecta tu marca con la comunidad del patinaje de velocidad en España y Latinoamérica.",
    cta: { label: "Solicitar tarifas", href: "mailto:info@rollerzone.es", external: true },
  },
};

function AboutPage() {
  const { page, slug } = Route.useLoaderData();
  const meta = SLUG_META[slug] ?? { Icon: Info, eyebrow: "RollerZone", subtitle: "" };
  const { Icon, eyebrow, subtitle, cta } = meta;
  const html = renderMarkdown(page.content);
  const updated = new Date(page.updated_at).toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="relative">
      {/* Glow decorativo */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] bg-[radial-gradient(ellipse_at_top,_color-mix(in_oklab,var(--gold)_18%,transparent)_0%,_transparent_60%)]"
      />

      <div className="mx-auto max-w-3xl px-6 pb-16 pt-8 md:pt-12">
        {/* Breadcrumb */}
        <nav
          aria-label="Migas de pan"
          className="font-condensed mb-8 flex items-center gap-2 text-[11px] uppercase tracking-widest text-muted-foreground"
        >
          <Link to="/" className="transition-colors hover:text-gold">
            Inicio
          </Link>
          <ChevronRight className="h-3 w-3 text-gold/50" />
          <span className="text-gold">{page.title}</span>
        </nav>

        {/* Hero */}
        <header className="relative overflow-hidden rounded-xl border border-gold/30 bg-gradient-to-br from-surface via-surface to-background p-8 shadow-xl shadow-gold/5 md:p-12">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-gold to-transparent" />
          <div
            aria-hidden
            className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-gold/10 blur-3xl"
          />

          <div className="relative">
            <div className="mb-5 inline-flex items-center gap-2 border border-gold/40 bg-background/50 px-3 py-1.5 backdrop-blur">
              <Sparkles className="h-3 w-3 text-gold" />
              <span className="font-condensed text-[11px] font-bold uppercase tracking-[0.2em] text-gold">
                {eyebrow}
              </span>
            </div>

            <div className="flex items-start gap-5">
              <div className="hidden h-14 w-14 shrink-0 items-center justify-center border border-gold/40 bg-gold/10 text-gold shadow-lg shadow-gold/10 md:flex">
                <Icon className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h1 className="font-display text-4xl leading-none tracking-widest text-foreground md:text-6xl">
                  {page.title.split(" ").map((word, idx, arr) => (
                    <span key={idx} className={idx === arr.length - 1 ? "text-gold" : ""}>
                      {word}
                      {idx < arr.length - 1 ? " " : ""}
                    </span>
                  ))}
                </h1>
                {subtitle && (
                  <p className="font-ui mt-4 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-4">
              <p className="font-condensed text-[11px] uppercase tracking-widest text-muted-foreground">
                Actualizado · <span className="text-foreground/80">{updated}</span>
              </p>
              {cta && (
                <a
                  href={cta.href}
                  {...(cta.external
                    ? { target: "_blank", rel: "noopener noreferrer" }
                    : {})}
                  className="font-condensed inline-flex items-center gap-2 bg-gold px-5 py-2 text-xs font-bold uppercase tracking-widest text-background shadow-lg shadow-gold/20 transition-all hover:-translate-y-0.5 hover:bg-gold-dark hover:shadow-gold/30"
                >
                  {cta.label}
                  <ChevronRight className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          </div>
        </header>

        {/* Contenido */}
        <article className="mt-10">
          {html ? (
            <div className="relative rounded-xl border border-border/60 bg-surface/40 p-6 shadow-md backdrop-blur md:p-10">
              <div
                aria-hidden
                className="absolute left-6 top-0 h-1 w-16 bg-gold md:left-10"
              />
              <div
                className="font-ui prose-rollerzone text-base leading-relaxed text-foreground/90 [&_a]:font-medium [&_h1]:first:mt-0 [&_h2]:first:mt-0 [&_h3]:first:mt-0 [&_p]:first:mt-0"
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={{ __html: html }}
              />
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border bg-surface/40 p-10 text-center">
              <p className="font-ui text-sm text-muted-foreground">
                Esta página aún no tiene contenido. El equipo editorial la publicará pronto.
              </p>
            </div>
          )}
        </article>

        {/* Footer card: navegación entre secciones "Sobre" */}
        <div className="mt-12 grid gap-3 sm:grid-cols-2">
          <Link
            to="/"
            className="group flex items-center justify-between rounded-lg border border-border bg-surface/50 px-5 py-4 transition-all hover:-translate-y-0.5 hover:border-gold/60 hover:bg-surface"
          >
            <div>
              <p className="font-condensed text-[10px] uppercase tracking-widest text-gold">
                Volver
              </p>
              <p className="font-ui mt-0.5 text-sm font-semibold text-foreground">
                Página principal
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground transition-all group-hover:translate-x-1 group-hover:text-gold" />
          </Link>
          <a
            href="mailto:info@rollerzone.es"
            className="group flex items-center justify-between rounded-lg border border-border bg-surface/50 px-5 py-4 transition-all hover:-translate-y-0.5 hover:border-gold/60 hover:bg-surface"
          >
            <div>
              <p className="font-condensed text-[10px] uppercase tracking-widest text-gold">
                Contacto directo
              </p>
              <p className="font-ui mt-0.5 text-sm font-semibold text-foreground">
                info@rollerzone.es
              </p>
            </div>
            <Mail className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-gold" />
          </a>
        </div>
      </div>
    </div>
  );
}
