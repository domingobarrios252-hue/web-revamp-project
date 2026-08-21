import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { BookOpen, Calendar, BookOpenCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { EmptyState } from "@/components/site/EmptyState";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

type Magazine = {
  id: string;
  title: string;
  slug: string;
  issue_number: string | null;
  edition_number: number | null;
  edition_date: string;
  description: string | null;
  cover_url: string | null;
  cover_image_url: string | null;
  pdf_url: string | null;
  read_url: string | null;
  is_free: boolean | null;
  public_access: boolean | null;
  is_active: boolean | null;
  country: string | null;
};

export const Route = createFileRoute("/revista/")({
  head: () => ({
    meta: [
      { title: "Revista | RollerZone" },
      {
        name: "description",
        content:
          "Biblioteca digital abierta de RollerZone: lee gratis todas las ediciones publicadas de España y Colombia, sin registro.",
      },
      { property: "og:title", content: "Revista RollerZone" },
      { property: "og:description", content: "Biblioteca digital abierta: todas las ediciones de la revista RollerZone." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RevistaPage,
});

function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("es-ES", { month: "long", year: "numeric" });
}

function isReadable(m: Magazine) {
  return !!(m.public_access || m.is_free);
}

function RevistaPage() {
  const [issues, setIssues] = useState<Magazine[] | null>(null);
  const [tab, setTab] = useState<"spain" | "colombia">("spain");

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("magazines")
      .select(
        "id, title, slug, issue_number, edition_number, edition_date, description, cover_url, cover_image_url, pdf_url, read_url, is_free, public_access, is_active, country",
      )
      .eq("published", true)
      .order("edition_number", { ascending: false, nullsFirst: false })
      .order("edition_date", { ascending: false })
      .limit(200)
      .then(({ data, error }) => {
        if (!cancelled) setIssues(error ? [] : ((data as Magazine[]) ?? []));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const { spain, colombia } = useMemo(() => {
    const s: Magazine[] = [];
    const c: Magazine[] = [];
    (issues ?? []).forEach((m) => {
      if (m.country === "colombia") c.push(m);
      else s.push(m);
    });
    return { spain: s, colombia: c };
  }, [issues]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-8">
      <div className="mb-4 flex items-center gap-3 border-b border-border pb-4">
        <BookOpen className="h-7 w-7 text-gold" />
        <h1 className="font-display text-3xl tracking-widest">REVISTA</h1>
      </div>
      <p className="mb-8 text-sm text-muted-foreground">
        Biblioteca digital de acceso libre: lee todas las ediciones publicadas sin necesidad de cuenta.
      </p>

      {issues === null ? (
        <Skeleton />
      ) : issues.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Próximamente"
          message="Aún no hay ediciones publicadas. Estamos preparando el primer número — vuelve pronto para hojearlo."
        />
      ) : (
        <Tabs value={tab} onValueChange={(v) => setTab(v as "spain" | "colombia")}>
          <TabsList className="mb-8 !flex !h-auto w-full flex-wrap gap-1 bg-surface p-1 sm:!inline-flex sm:w-auto">
            <TabsTrigger value="spain" className="font-condensed min-h-11 flex-1 whitespace-normal tracking-widest uppercase sm:flex-none">
              🇪🇸 España <span className="ml-2 text-xs opacity-70">({spain.length})</span>
            </TabsTrigger>
            <TabsTrigger value="colombia" className="font-condensed min-h-11 flex-1 whitespace-normal tracking-widest uppercase sm:flex-none">
              🇨🇴 Colombia <span className="ml-2 text-xs opacity-70">({colombia.length})</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="spain">
            <MagazineGrid items={spain} />
          </TabsContent>
          <TabsContent value="colombia">
            <MagazineGrid items={colombia} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

function Skeleton() {
  return (
    <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="flex flex-col">
          <div className="aspect-[3/4] animate-pulse border border-border bg-surface-2" />
          <div className="mt-3 space-y-2">
            <div className="h-4 w-3/4 animate-pulse bg-surface-2" />
            <div className="h-3 w-1/2 animate-pulse bg-surface-2" />
          </div>
        </div>
      ))}
    </div>
  );
}

function MagazineGrid({ items }: { items: Magazine[] }) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon={BookOpen}
        title="Próximamente"
        message="Aún no hay ediciones publicadas para esta región. Vuelve pronto."
      />
    );
  }
  return (
    <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {items.map((m) => (
        <MagazineCard key={m.id} magazine={m} />
      ))}
    </div>
  );
}

function MagazineCard({ magazine: m }: { magazine: Magazine }) {
  const cover = m.cover_image_url || m.cover_url;
  const readable = isReadable(m);
  const externalHref = m.read_url || m.pdf_url;
  const editionLabel =
    m.edition_number != null ? `Nº ${m.edition_number}` : m.issue_number ? `Nº ${m.issue_number}` : null;

  return (
    <article className="group flex flex-col">
      <div className="relative aspect-[3/4] overflow-hidden border border-border bg-surface">
        {cover ? (
          <img
            src={cover}
            alt={`Portada ${m.title}`}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
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
        {m.description && <p className="mt-2 line-clamp-2 text-xs text-foreground/70">{m.description}</p>}

        <div className="mt-auto pt-4">
          {readable ? (
            externalHref ? (
              <Button asChild className="min-h-11 w-full bg-green-600 text-white hover:bg-green-700">
                <a href={externalHref} target="_blank" rel="noopener noreferrer">
                  <BookOpenCheck className="h-4 w-4" /> Leer ahora
                </a>
              </Button>
            ) : (
              <Button asChild className="min-h-11 w-full bg-green-600 text-white hover:bg-green-700">
                <Link to="/revista/leer/$id" params={{ id: m.id }}>
                  <BookOpenCheck className="h-4 w-4" /> Leer ahora
                </Link>
              </Button>
            )
          ) : (
            <Button variant="outline" className="min-h-11 w-full" disabled>
              Edición no disponible online
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
