import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Calendar, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Interview = {
  id: string;
  title: string;
  slug: string;
  interviewee_name: string;
  interview_date: string;
  cover_url: string | null;
  excerpt: string | null;
};

export const Route = createFileRoute("/entrevistas/")({
  head: () => ({
    meta: [
      { title: "Entrevistas — RollerZone" },
      { name: "description", content: "Entrevistas en profundidad a patinadores, entrenadores y figuras del patinaje de velocidad." },
      { property: "og:title", content: "Entrevistas — RollerZone" },
      { property: "og:description", content: "Entrevistas en profundidad a patinadores, entrenadores y figuras del patinaje de velocidad." },
    ],
  }),
  component: EntrevistasIndex,
});

function EntrevistasIndex() {
  const [items, setItems] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("interviews")
        .select("id,title,slug,interviewee_name,interview_date,cover_url,excerpt")
        .eq("published", true)
        .order("interview_date", { ascending: false });
      setItems((data as Interview[]) ?? []);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-8">
      <header className="mb-8 border-b border-border pb-6">
        <h1 className="font-display text-4xl tracking-widest md:text-5xl">
          <span className="text-gold">ENTRE</span>VISTAS
        </h1>
        <p className="font-condensed mt-2 text-sm uppercase tracking-widest text-muted-foreground">
          Las voces del patinaje en primera persona
        </p>
      </header>

      {loading ? (
        <p className="text-muted-foreground">Cargando…</p>
      ) : items.length === 0 ? (
        <p className="text-muted-foreground">Aún no hay entrevistas publicadas.</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map((it) => (
            <Link
              key={it.id}
              to="/entrevistas/$slug"
              params={{ slug: it.slug }}
              className="group block border border-border bg-surface transition-colors hover:border-gold"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-background">
                {it.cover_url ? (
                  <img
                    src={it.cover_url}
                    alt={it.interviewee_name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs uppercase text-muted-foreground">
                    Sin portada
                  </div>
                )}
                <div className="absolute left-3 top-3 bg-background/90 px-2 py-1">
                  <span className="font-condensed text-[10px] font-bold uppercase tracking-widest text-gold">
                    Entrevista
                  </span>
                </div>
              </div>
              <div className="p-4">
                <div className="font-condensed flex items-center gap-2 text-[11px] uppercase tracking-widest text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {new Date(it.interview_date).toLocaleDateString("es-ES", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </div>
                <h2 className="font-display mt-2 text-lg leading-tight tracking-wider text-foreground group-hover:text-gold">
                  {it.title}
                </h2>
                <div className="font-condensed mt-1 text-xs uppercase tracking-wider text-gold">
                  {it.interviewee_name}
                </div>
                {it.excerpt && (
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{it.excerpt}</p>
                )}
                <div className="font-condensed mt-3 inline-flex items-center gap-1 text-[11px] uppercase tracking-widest text-gold">
                  Leer entrevista <ArrowRight className="h-3 w-3" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
