import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type InterviewRow = {
  id: string;
  slug: string;
  title: string;
  interviewee_name: string;
  interview_date: string;
  cover_url: string | null;
  excerpt: string | null;
};

export const Route = createFileRoute("/hub/$country/entrevistas")({
  head: ({ params }) => ({
    meta: [
      { title: `Entrevistas — Hub ${params.country.toUpperCase()} · RollerZone` },
      {
        name: "description",
        content: `Entrevistas a patinadores, entrenadores y figuras del patinaje en ${params.country.toUpperCase()}.`,
      },
    ],
  }),
  component: HubEntrevistas,
});

function HubEntrevistas() {
  const { country } = Route.useParams();
  const [items, setItems] = useState<InterviewRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    supabase
      .from("interviews")
      .select("id,slug,title,interviewee_name,interview_date,cover_url,excerpt")
      .eq("published", true)
      .or(`hub_countries.cs.{${country}},country_code.eq.${country}`)
      .order("interview_date", { ascending: false })
      .limit(60)
      .then(({ data }) => {
        if (cancelled) return;
        setItems((data as InterviewRow[]) ?? []);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [country]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-8 md:py-14">
      <header className="mb-8 border-b border-[#333] pb-6">
        <div className="font-ui mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-gold">
          Hub {country.toUpperCase()}
        </div>
        <h1 className="font-display text-3xl font-black uppercase tracking-wider md:text-5xl">
          Entrevistas
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-[#B5B5B5]">
          Conversaciones con patinadores, entrenadores y figuras del patinaje de velocidad.
        </p>
      </header>

      {loading ? (
        <p className="text-muted-foreground">Cargando…</p>
      ) : items.length === 0 ? (
        <p className="text-muted-foreground">Aún no hay entrevistas publicadas en este hub.</p>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it) => (
            <Link
              key={it.id}
              to="/entrevistas/$slug"
              params={{ slug: it.slug }}
              className="group block border border-border bg-surface transition-colors hover:border-gold"
            >
              {it.cover_url && (
                <div className="aspect-[16/10] w-full overflow-hidden bg-background">
                  <img
                    src={it.cover_url}
                    alt={it.interviewee_name}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
              )}
              <div className="p-4">
                <div className="font-condensed mb-1 text-[10px] font-bold uppercase tracking-widest text-gold">
                  {it.interviewee_name}
                </div>
                <h2 className="font-display text-lg uppercase leading-tight tracking-wider text-foreground group-hover:text-gold">
                  {it.title}
                </h2>
                {it.excerpt && (
                  <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{it.excerpt}</p>
                )}
                <div className="font-condensed mt-3 flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-muted-foreground">
                  <Calendar className="h-3 w-3 text-gold" />
                  {new Date(it.interview_date).toLocaleDateString("es-ES", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
