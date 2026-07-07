import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import specialFallback from "@/assets/special-fallback.svg";

type Special = {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  cover_url: string;
  status: string;
  featured_home: boolean;
  sort_order: number;
  start_date: string | null;
  end_date: string | null;
};

const CANON = "https://rollerzone.lovable.app/especiales";

export const Route = createFileRoute("/especiales/")({
  head: () => ({
    meta: [
      { title: "Especiales editoriales — RollerZone" },
      {
        name: "description",
        content:
          "Cobertura especial de RollerZone: campeonatos, torneos y eventos clave del patinaje de velocidad.",
      },
      { property: "og:title", content: "Especiales editoriales — RollerZone" },
      {
        property: "og:description",
        content: "Todos los especiales editoriales de RollerZone.",
      },
      { property: "og:url", content: CANON },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: CANON }],
  }),
  component: SpecialsIndex,
});

function SpecialsIndex() {
  const [items, setItems] = useState<Special[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from("special_editorials")
        .select("*")
        .eq("status", "active")
        .order("sort_order", { ascending: true });
      setItems((data ?? []) as Special[]);
      setLoading(false);
    })();
  }, []);

  return (
    <section className="bg-background py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <header className="mb-10">
          <div className="font-condensed inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[3px] text-gold">
            <Sparkles className="h-3 w-3" /> Especiales RollerZone
          </div>
          <h1 className="font-display mt-2 text-4xl uppercase tracking-wider text-foreground md:text-5xl">
            Coberturas especiales
          </h1>
          <div className="mt-3 h-[3px] w-24 bg-gold" />
          <p className="mt-4 max-w-2xl text-base text-muted-foreground">
            Reportajes, entrevistas, calendarios, resultados y todo lo publicado alrededor de los
            grandes eventos del patinaje de velocidad.
          </p>
        </header>

        {loading ? (
          <div className="text-muted-foreground">Cargando…</div>
        ) : items.length === 0 ? (
          <div className="border border-dashed border-border p-8 text-center text-muted-foreground">
            Aún no hay especiales publicados.
          </div>
        ) : (
          <ol className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((s) => (
              <li key={s.slug}>
                <Link
                  to="/especiales/$slug"
                  params={{ slug: s.slug }}
                  className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-lg transition-all hover:-translate-y-1 hover:border-gold hover:shadow-[0_15px_40px_-10px_rgba(212,160,23,0.35)]"
                >
                  <div className="relative aspect-[16/9] overflow-hidden bg-surface-2">
                    <img
                      src={s.cover_url?.trim() ? s.cover_url : (specialFallback as string)}
                      alt={s.title}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    {s.featured_home && (
                      <span className="font-condensed absolute left-3 top-3 inline-block bg-gold px-2.5 py-1 text-[10px] font-bold uppercase tracking-[2.5px] text-background shadow-md">
                        Destacado
                      </span>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="font-display text-lg uppercase leading-snug tracking-wider text-foreground transition-colors group-hover:text-gold md:text-xl">
                      {s.title}
                    </h3>
                    {s.subtitle && (
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        {s.subtitle}
                      </p>
                    )}
                    <div className="font-condensed mt-5 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[2.5px] text-gold">
                      Ver especial <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}
