import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import specialFallback from "@/assets/special-fallback.svg";

type Special = {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  cover_url: string;
  hero_image_url: string;
  status: string;
};

type Piece = {
  slug: string;
  number: string;
  kicker: string;
  category: string;
  title: string;
  description: string;
  excerpt: string;
  image_url: string;
  thumbnail_url: string;
  sort_order: number;
  featured: boolean;
  visible: boolean;
  status: string;
  external_url: string;
};

export const Route = createFileRoute("/especiales/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug} — Especial RollerZone` },
      { name: "description", content: "Cobertura especial RollerZone." },
    ],
  }),
  component: SpecialLanding,
  notFoundComponent: SpecialNotFound,
});

function SpecialLanding() {
  const { slug } = Route.useParams();
  const [special, setSpecial] = useState<Special | null>(null);
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sb = supabase as any;
      const { data: sp } = await sb
        .from("special_editorials")
        .select("*")
        .eq("slug", slug)
        .eq("status", "active")
        .maybeSingle();
      if (cancelled) return;
      if (!sp) {
        setMissing(true);
        setLoading(false);
        return;
      }
      const { data: pcs } = await sb
        .from("special_pieces")
        .select("*")
        .eq("special_slug", slug)
        .in("status", ["published", "live"])
        .eq("visible", true)
        .order("sort_order", { ascending: true });
      setSpecial(sp as Special);
      setPieces((pcs ?? []) as Piece[]);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-24 text-muted-foreground">Cargando especial…</div>
    );
  }
  if (missing || !special) {
    throw notFound();
  }

  const heroImage = special.hero_image_url?.trim() || special.cover_url?.trim() || (specialFallback as string);
  const featured = pieces.filter((p) => p.featured);
  const rest = pieces.filter((p) => !p.featured);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-surface">
        <div className="absolute inset-0">
          <img loading="lazy" decoding="async"
            src={heroImage}
            alt=""
            className="h-full w-full object-cover opacity-40"
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
        </div>
        <div className="relative mx-auto max-w-5xl px-4 py-20 md:px-6 md:py-28">
          <Link
            to="/especiales"
            className="font-condensed inline-block text-[10px] font-bold uppercase tracking-[3px] text-gold hover:text-gold-light"
          >
            ← Especiales RollerZone
          </Link>
          <h1 className="font-display mt-4 text-4xl uppercase tracking-wider text-foreground md:text-6xl">
            {special.title}
          </h1>
          <div className="mt-4 h-[3px] w-24 bg-gold" />
          {special.subtitle && (
            <p className="mt-6 max-w-3xl text-lg text-muted-foreground md:text-xl">
              {special.subtitle}
            </p>
          )}
        </div>
      </section>

      {/* Description */}
      {special.description && (
        <section className="bg-background py-12">
          <div className="mx-auto max-w-3xl px-4 md:px-6">
            <p className="text-base leading-relaxed text-muted-foreground md:text-lg">
              {special.description}
            </p>
          </div>
        </section>
      )}

      {/* Featured */}
      {featured.length > 0 && (
        <section className="bg-background py-8 md:py-12">
          <div className="mx-auto max-w-7xl px-4 md:px-6">
            <h2 className="font-display mb-6 text-2xl uppercase tracking-wider text-foreground">
              Piezas destacadas
            </h2>
            <ol className="grid gap-5 sm:grid-cols-2">
              {featured.map((p) => (
                <PieceCard key={p.slug} piece={p} specialSlug={slug} large />
              ))}
            </ol>
          </div>
        </section>
      )}

      {/* All pieces */}
      <section className="bg-background py-12 md:py-16">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <h2 className="font-display mb-6 text-2xl uppercase tracking-wider text-foreground">
            {featured.length > 0 ? "Todas las piezas" : "Piezas del especial"}
          </h2>
          {rest.length === 0 && featured.length === 0 ? (
            <div className="border border-dashed border-border p-8 text-center text-muted-foreground">
              Aún no hay piezas publicadas en este especial.
            </div>
          ) : (
            <ol className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {(rest.length ? rest : featured).map((p) => (
                <PieceCard key={p.slug} piece={p} specialSlug={slug} />
              ))}
            </ol>
          )}
        </div>
      </section>
    </>
  );
}

function PieceCard({
  piece,
  specialSlug,
  large,
}: {
  piece: Piece;
  specialSlug: string;
  large?: boolean;
}) {
  const img = piece.image_url || piece.thumbnail_url || (specialFallback as string);
  return (
    <li>
      <Link
        to="/especiales/$slug/$piece"
        params={{ slug: specialSlug, piece: piece.slug }}
        className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-lg transition-all hover:-translate-y-1 hover:border-gold hover:shadow-[0_15px_40px_-10px_rgba(212,160,23,0.35)]"
      >
        <div className={"relative overflow-hidden bg-surface-2 " + (large ? "aspect-[16/9]" : "aspect-[16/9]")}>
          <img
            src={img}
            alt={piece.title}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {(piece.kicker || piece.category) && (
            <span className="font-condensed absolute left-3 top-3 inline-block bg-gold px-2.5 py-1 text-[10px] font-bold uppercase tracking-[2.5px] text-background shadow-md">
              {piece.kicker || piece.category}
            </span>
          )}
          {piece.number && (
            <span className="font-display absolute right-3 top-3 text-2xl text-gold drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
              {piece.number}
            </span>
          )}
        </div>
        <div className="flex flex-1 flex-col p-5">
          <h3 className="font-display text-lg uppercase leading-snug tracking-wider text-foreground transition-colors group-hover:text-gold md:text-xl">
            {piece.title}
          </h3>
          {(piece.excerpt || piece.description) && (
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {piece.excerpt || piece.description}
            </p>
          )}
          <div className="font-condensed mt-5 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[2.5px] text-gold">
            Leer pieza <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
          </div>
        </div>
      </Link>
    </li>
  );
}

function SpecialNotFound() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-24 text-center">
      <h1 className="font-display text-3xl uppercase tracking-wider text-foreground">
        Especial no disponible
      </h1>
      <p className="mt-4 text-muted-foreground">
        El especial que buscas no existe o ya no está publicado.
      </p>
      <Link
        to="/especiales"
        className="font-condensed mt-6 inline-block bg-gold px-5 py-2 text-xs font-bold uppercase tracking-widest text-background"
      >
        Ver todos los especiales
      </Link>
    </div>
  );
}
