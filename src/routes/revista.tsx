import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BookOpen, Calendar, Download, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Magazine = {
  id: string;
  title: string;
  slug: string;
  issue_number: string | null;
  edition_date: string;
  description: string | null;
  cover_url: string | null;
  pdf_url: string | null;
  read_url: string | null;
};

export const Route = createFileRoute("/revista")({
  head: () => ({
    meta: [
      { title: "Revista — RollerZone" },
      { name: "description", content: "Todas las ediciones de la revista RollerZone — patinaje de velocidad, reportajes y entrevistas." },
      { property: "og:title", content: "Revista RollerZone" },
      { property: "og:description", content: "Todas las ediciones de la revista RollerZone." },
    ],
  }),
  component: RevistaPage,
});

function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("es-ES", { month: "long", year: "numeric" });
}

function RevistaPage() {
  const [issues, setIssues] = useState<Magazine[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("magazines")
      .select("id, title, slug, issue_number, edition_date, description, cover_url, pdf_url, read_url")
      .eq("published", true)
      .order("created_at", { ascending: false })
      .limit(100)
      .then(({ data }) => {
        if (!cancelled) setIssues((data as Magazine[]) ?? []);
      });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-8">
      <div className="mb-8 flex items-center gap-3 border-b border-border pb-4">
        <BookOpen className="h-7 w-7 text-gold" />
        <h1 className="font-display text-3xl tracking-widest">REVISTA</h1>
      </div>

      {issues === null ? (
        <p className="text-muted-foreground">Cargando ediciones…</p>
      ) : issues.length === 0 ? (
        <p className="text-muted-foreground">Aún no hay ediciones publicadas.</p>
      ) : (
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {issues.map((m) => (
            <article key={m.id} className="group flex flex-col">
              <div className="relative aspect-[3/4] overflow-hidden border border-border bg-surface">
                {m.cover_url ? (
                  <img src={m.cover_url} alt={`Portada ${m.title}`} loading="lazy" className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground/40">
                    <BookOpen className="h-12 w-12" />
                  </div>
                )}
                {m.issue_number && (
                  <span className="font-condensed absolute left-0 top-3 bg-gold px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-background">
                    Nº {m.issue_number}
                  </span>
                )}
              </div>
              <div className="mt-3">
                <h3 className="font-display text-base leading-tight tracking-wide">{m.title}</h3>
                <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" /> {formatDate(m.edition_date)}
                </div>
                {m.description && <p className="mt-2 line-clamp-2 text-xs text-foreground/70">{m.description}</p>}
                <div className="mt-3 flex gap-2">
                  {m.read_url && (
                    <a href={m.read_url} target="_blank" rel="noopener noreferrer" className="font-condensed inline-flex items-center gap-1 border border-border px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-gold hover:bg-gold hover:text-background">
                      Leer <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  {m.pdf_url && (
                    <a href={m.pdf_url} target="_blank" rel="noopener noreferrer" className="font-condensed inline-flex items-center gap-1 border border-border px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-gold">
                      PDF <Download className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
