import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { renderMarkdown } from "@/lib/markdown";

export const Route = createFileRoute("/sobre/$slug")({
  loader: async ({ params }) => {
    const { data, error } = await supabase
      .from("about_pages")
      .select("title, content, updated_at, published")
      .eq("slug", params.slug)
      .maybeSingle();
    if (error || !data || !data.published) throw notFound();
    return { page: data };
  },
  head: ({ loaderData }) => {
    const title = loaderData?.page.title ?? "Sobre nosotros";
    return {
      meta: [
        { title: `${title} — RollerZone` },
        { name: "description", content: `${title} — RollerZone.` },
        { name: "robots", content: "index, follow" },
        { property: "og:title", content: `${title} — RollerZone` },
        { property: "og:description", content: `${title} — RollerZone.` },
      ],
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

function AboutPage() {
  const { page } = Route.useLoaderData();
  const html = renderMarkdown(page.content);
  const updated = new Date(page.updated_at).toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <article className="mx-auto max-w-3xl px-6 py-10 md:py-14">
      <header className="mb-8 border-b border-border pb-6">
        <h1 className="font-display text-4xl tracking-widest text-gold md:text-5xl">
          {page.title}
        </h1>
        <p className="font-ui mt-2 text-xs uppercase tracking-widest text-muted-foreground">
          Última actualización: {updated}
        </p>
      </header>

      {html ? (
        <div
          className="font-ui text-base"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <div className="border border-dashed border-border bg-surface p-8 text-center">
          <p className="font-ui text-sm text-muted-foreground">
            Esta página aún no tiene contenido. El equipo editorial la publicará pronto.
          </p>
        </div>
      )}
    </article>
  );
}
