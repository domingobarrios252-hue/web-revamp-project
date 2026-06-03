import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BookOpen, BookOpenCheck, Calendar, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useAuthDialog } from "@/lib/auth-dialog-context";
import { EmptyState } from "@/components/site/EmptyState";
import { Button } from "@/components/ui/button";

type Purchase = {
  id: string;
  purchased_at: string;
  amount_paid: number | null;
  magazine: {
    id: string;
    title: string;
    edition_number: number | null;
    issue_number: string | null;
    edition_date: string;
    description: string | null;
    cover_image_url: string | null;
    cover_url: string | null;
    read_url: string | null;
    pdf_url: string | null;
    country: string | null;
  } | null;
};

export const Route = createFileRoute("/mi-biblioteca")({
  head: () => ({
    meta: [
      { title: "Mi biblioteca — RollerZone" },
      { name: "description", content: "Tus revistas RollerZone compradas." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MiBibliotecaPage,
});

function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("es-ES", { month: "long", year: "numeric" });
}

function MiBibliotecaPage() {
  const { user, loading } = useAuth();
  const { openAuthDialog } = useAuthDialog();
  const [items, setItems] = useState<Purchase[] | null>(null);

  useEffect(() => {
    if (!user) { setItems([]); return; }
    let cancelled = false;
    supabase
      .from("magazine_purchases")
      .select(`
        id, purchased_at, amount_paid,
        magazine:magazines (
          id, title, edition_number, issue_number, edition_date, description,
          cover_image_url, cover_url, read_url, pdf_url, country
        )
      `)
      .eq("user_id", user.id)
      .order("purchased_at", { ascending: false })
      .then(({ data, error }) => {
        if (!cancelled) setItems(error ? [] : ((data as unknown as Purchase[]) ?? []));
      });
    return () => { cancelled = true; };
  }, [user]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-8">
      <div className="mb-8 flex items-center gap-3 border-b border-border pb-4">
        <BookOpen className="h-7 w-7 text-gold" />
        <h1 className="font-display text-3xl tracking-widest">MI BIBLIOTECA</h1>
      </div>

      {loading ? null : !user ? (
        <EmptyState
          icon={Lock}
          title="Inicia sesión"
          message="Accede a tu cuenta para ver las revistas que has comprado."
          action={<Button onClick={openAuthDialog}>Iniciar sesión</Button>}
        />
      ) : items === null ? (
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="aspect-[3/4] animate-pulse border border-border bg-surface-2" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Aún no tienes revistas"
          message="Explora las ediciones disponibles y consigue tu primera revista RollerZone."
        />
      ) : (
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {items.map((p) => {
            const m = p.magazine;
            if (!m) return null;
            const cover = m.cover_image_url || m.cover_url;
            const href = m.read_url || m.pdf_url || "#";
            const editionLabel = m.edition_number != null ? `Nº ${m.edition_number}` : m.issue_number ? `Nº ${m.issue_number}` : null;
            return (
              <article key={p.id} className="group flex flex-col">
                <div className="relative aspect-[3/4] overflow-hidden border border-border bg-surface">
                  {cover ? (
                    <img src={cover} alt={`Portada ${m.title}`} loading="lazy" className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground/40">
                      <BookOpen className="h-12 w-12" />
                    </div>
                  )}
                  {editionLabel && (
                    <span className="font-condensed absolute left-0 top-3 bg-gold px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-background">
                      {editionLabel}
                    </span>
                  )}
                </div>
                <div className="mt-3 flex flex-1 flex-col">
                  <h3 className="font-display text-base leading-tight tracking-wide">{m.title}</h3>
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" /> {formatDate(m.edition_date)}
                  </div>
                  <div className="mt-auto pt-4">
                    <Button asChild className="w-full bg-green-600 text-white hover:bg-green-700">
                      <a href={href} target="_blank" rel="noopener noreferrer">
                        <BookOpenCheck className="h-4 w-4" /> Leer
                      </a>
                    </Button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
