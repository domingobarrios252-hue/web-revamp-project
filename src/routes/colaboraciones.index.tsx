import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Handshake } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import specialFallback from "@/assets/special-fallback.svg";
import {
  COLLAB_CATEGORIES,
  categoryLabel,
  normalizeCollaboration,
  typeLabel,
  type Collaboration,
} from "@/lib/colaboraciones";
import { toJsonLd } from "@/lib/jsonLd";

const CANON = "https://rollerzone.es/colaboraciones";
const TITLE = "Colaboraciones y Convenios | RollerZone";
const DESC =
  "Archivo institucional de colaboraciones, convenios y proyectos desarrollados por RollerZone junto a federaciones, clubes, instituciones y entidades del patinaje de velocidad.";

export const Route = createFileRoute("/colaboraciones/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:url", content: CANON },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: CANON }],
  }),
  component: CollaborationsIndex,
});

function CollaborationsIndex() {
  const [items, setItems] = useState<Collaboration[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<string>("all");
  const [year, setYear] = useState<string>("all");

  useEffect(() => {
    (async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from("collaborations")
        .select("*")
        .eq("status", "published")
        .order("year", { ascending: false })
        .order("sort_order", { ascending: true });
      setItems(((data ?? []) as Record<string, unknown>[]).map(normalizeCollaboration));
      setLoading(false);
    })();
  }, []);

  const years = useMemo(() => {
    const set = new Set<number>(items.map((i) => i.year));
    [2025, 2026, 2027].forEach((y) => set.add(y));
    return Array.from(set).sort((a, b) => a - b);
  }, [items]);

  const filtered = useMemo(
    () =>
      items.filter(
        (i) =>
          (category === "all" || i.category === category) &&
          (year === "all" || String(i.year) === year),
      ),
    [items, category, year],
  );

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Colaboraciones y Convenios de RollerZone",
    description: DESC,
    url: CANON,
    hasPart: filtered.map((c) => ({
      "@type": "CreativeWork",
      name: c.title,
      url: `https://rollerzone.es/colaboraciones/${c.slug}`,
      datePublished: String(c.year),
      sponsor: c.entity ? { "@type": "Organization", name: c.entity } : undefined,
    })),
  };

  return (
    <main className="bg-background py-12 md:py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toJsonLd(jsonLd) }} />

      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <header className="border-b border-border pb-8">
          <div className="font-condensed inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[3px] text-gold">
            <Handshake className="h-3.5 w-3.5" /> Institucional
          </div>
          <h1 className="font-display mt-2 text-[clamp(1.9rem,6vw,3.4rem)] uppercase leading-[1.05] tracking-wider text-foreground">
            Colaboraciones y Convenios
          </h1>
          <p className="font-condensed mt-2 text-sm font-bold uppercase tracking-[2px] text-gold">
            Proyectos que hacen crecer el patinaje de velocidad
          </p>
          <div className="mt-4 h-[3px] w-28 bg-gradient-to-r from-gold to-transparent" />
          <p className="mt-4 max-w-3xl text-[0.95rem] leading-relaxed text-muted-foreground">
            RollerZone trabaja junto a federaciones, clubes, instituciones, empresas y entidades
            vinculadas al patinaje para desarrollar proyectos editoriales, deportivos y de promoción
            de nuestro deporte.
          </p>
        </header>

        <div className="sticky top-0 z-10 -mx-4 mt-6 bg-background/95 px-4 py-3 backdrop-blur md:mx-0 md:px-0">
          <div className="filters-scroll flex gap-2 overflow-x-auto pb-1">
            <FilterChip active={category === "all"} onClick={() => setCategory("all")}>
              Todos
            </FilterChip>
            {COLLAB_CATEGORIES.map((c) => (
              <FilterChip
                key={c.value}
                active={category === c.value}
                onClick={() => setCategory(c.value)}
              >
                {c.label}
              </FilterChip>
            ))}
          </div>
          <div className="filters-scroll mt-2 flex gap-2 overflow-x-auto pb-1">
            {years.map((y) => (
              <FilterChip key={y} active={year === String(y)} onClick={() => setYear(String(y))}>
                {y}
              </FilterChip>
            ))}
            <FilterChip active={year === "all"} onClick={() => setYear("all")}>
              Todos los años
            </FilterChip>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-muted-foreground">Cargando…</div>
        ) : filtered.length === 0 ? (
          <div className="mt-8 border border-dashed border-border p-8 text-center text-muted-foreground">
            No hay colaboraciones para este filtro.
          </div>
        ) : (
          <ol className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((c) => (
              <li key={c.slug}>
                <CollaborationCard item={c} />
              </li>
            ))}
          </ol>
        )}
      </div>
    </main>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`font-condensed shrink-0 border px-3.5 py-2 text-[11px] font-bold uppercase tracking-[2px] transition-colors ${
        active
          ? "border-gold bg-gold text-background"
          : "border-border bg-surface text-muted-foreground hover:border-gold hover:text-gold"
      }`}
    >
      {children}
    </button>
  );
}

export function CollaborationCard({ item }: { item: Collaboration }) {
  return (
    <Link
      to="/colaboraciones/$slug"
      params={{ slug: item.slug }}
      className="group flex h-full min-w-0 flex-col overflow-hidden border border-border bg-surface shadow-lg transition-all hover:-translate-y-1 hover:border-gold hover:shadow-[0_15px_40px_-10px_rgba(212,160,23,0.35)]"
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-surface-2">
        <img
          src={item.cover_url?.trim() ? item.cover_url : (specialFallback as string)}
          alt={item.title}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <span className="font-condensed absolute left-3 top-3 bg-gold px-2.5 py-1 text-[10px] font-bold uppercase tracking-[2px] text-background">
          {typeLabel(item.type)} · {item.year}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="font-condensed text-[10px] font-bold uppercase tracking-[2.5px] text-muted-foreground">
          {categoryLabel(item.category)}
        </div>
        <div className="font-condensed mt-1 text-xs font-bold uppercase tracking-[1.5px] text-gold">
          {item.entity}
        </div>
        <h3 className="font-display mt-2 text-lg uppercase leading-snug tracking-wider text-foreground group-hover:text-gold">
          {item.title}
        </h3>
        <p className="mt-2 line-clamp-4 flex-1 text-sm leading-relaxed text-muted-foreground">
          {item.short_description}
        </p>
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-3">
          <span className="font-condensed inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[2px] text-gold">
            Ver colaboración <ArrowRight className="h-3.5 w-3.5" />
          </span>
          {item.entity_logo_url?.trim() ? (
            <img
              src={item.entity_logo_url}
              alt={item.entity}
              loading="lazy"
              className="h-8 w-auto max-w-[80px] object-contain opacity-80"
            />
          ) : null}
        </div>
      </div>
    </Link>
  );
}
