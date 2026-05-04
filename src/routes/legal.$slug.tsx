import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { renderMarkdown } from "@/lib/markdown";

const SLUGS = ["privacidad", "aviso-legal", "cookies"] as const;
type LegalSlug = (typeof SLUGS)[number];

export const Route = createFileRoute("/legal/$slug")({
  loader: async ({ params }) => {
    const slug = params.slug;
    if (!SLUGS.includes(slug as LegalSlug)) throw notFound();
    const { data, error } = await supabase
      .from("legal_pages")
      .select("title, content, updated_at")
      .eq("slug", slug)
      .maybeSingle();
    if (error || !data) throw notFound();
    return { page: data };
  },
  head: ({ loaderData }) => {
    const title = loaderData?.page.title ?? "Página legal";
    return {
      meta: [
        { title: `${title} — RollerZone` },
        { name: "description", content: `${title} de RollerZone.` },
        { name: "robots", content: "index, follow" },
        { property: "og:title", content: `${title} — RollerZone` },
        { property: "og:description", content: `${title} de RollerZone.` },
      ],
    };
  },
  component: LegalPage,
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

const SLUG_META: Record<string, { eyebrow: string; intro: string }> = {
  privacidad: {
    eyebrow: "Tu privacidad importa",
    intro:
      "En RollerZone tratamos tus datos con transparencia. Aquí explicamos qué recogemos, por qué lo hacemos y cómo puedes ejercer tus derechos en todo momento.",
  },
  "aviso-legal": {
    eyebrow: "Información legal",
    intro:
      "Conoce quién está detrás de RollerZone, las condiciones de uso del medio y la información legal exigida por la normativa vigente.",
  },
  cookies: {
    eyebrow: "Política de cookies",
    intro:
      "Usamos cookies para que la experiencia sea fluida y para entender qué contenidos funcionan mejor. Tú decides qué aceptar y puedes cambiar de opinión cuando quieras.",
  },
};

function LegalPage() {
  const { page } = Route.useLoaderData();
  const { slug } = Route.useParams();
  const meta = SLUG_META[slug] ?? { eyebrow: "RollerZone", intro: "" };
  const html = renderMarkdown(page.content);
  const updated = new Date(page.updated_at).toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="bg-background">
      {/* Hero legal */}
      <section className="relative overflow-hidden border-b border-border bg-surface">
        <div className="diagonal-lines-bg absolute inset-0 opacity-60" aria-hidden />
        <div className="relative mx-auto max-w-3xl px-6 py-12 md:py-16">
          <div className="font-condensed mb-4 inline-flex w-fit items-center gap-2 border border-gold px-3 py-1 text-[10px] font-bold uppercase tracking-[3px] text-gold">
            {meta.eyebrow}
          </div>
          <h1 className="font-display text-3xl uppercase leading-tight tracking-wider text-foreground md:text-5xl">
            {page.title}
          </h1>
          <div className="mt-4 h-[2px] w-16 bg-gold" />
          {meta.intro && (
            <p className="mt-5 max-w-2xl text-sm text-muted-foreground md:text-base">{meta.intro}</p>
          )}
          <p className="font-ui mt-6 text-[11px] uppercase tracking-widest text-muted-foreground">
            Última actualización: {updated}
          </p>
        </div>
      </section>

      <article className="mx-auto max-w-3xl px-6 py-10 md:py-14">
        {html ? (
          <div
            className="font-ui legal-prose text-base leading-relaxed text-foreground/90"
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: html }}
          />
        ) : (
          <div className="rounded-[8px] border border-dashed border-border bg-surface p-8 text-center">
            <p className="font-ui text-sm text-muted-foreground">
              Esta página aún no tiene contenido. El equipo editorial la publicará pronto.
            </p>
          </div>
        )}

        {/* Bloque de contacto */}
        <aside className="mt-12 rounded-[8px] border border-border bg-surface p-6 md:p-8">
          <div className="font-condensed text-[10px] font-bold uppercase tracking-[3px] text-gold">
            ¿Dudas?
          </div>
          <h2 className="font-display mt-2 text-xl uppercase tracking-widest text-foreground">
            Contacta con nosotros
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Si tienes preguntas sobre este documento o quieres ejercer tus derechos, escríbenos
            directamente a nuestro correo.
          </p>
          <a
            href="mailto:rollerzonespain@gmail.com"
            className="font-condensed mt-5 inline-flex items-center gap-2 border border-gold px-4 py-2 text-[11px] font-bold uppercase tracking-[2.5px] text-gold transition-colors hover:bg-gold hover:text-background"
          >
            rollerzonespain@gmail.com
          </a>
        </aside>

        <div className="mt-10 border-t border-border pt-6 text-center">
          <Link
            to="/"
            className="font-ui text-xs uppercase tracking-widest text-muted-foreground hover:text-gold"
          >
            ← Volver al inicio
          </Link>
        </div>
      </article>
    </div>
  );
}
