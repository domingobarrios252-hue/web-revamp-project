import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { renderMarkdown } from "@/lib/markdown";
import specialFallback from "@/assets/special-fallback.svg";

type Piece = {
  slug: string;
  number: string;
  kicker: string;
  category: string;
  title: string;
  description: string;
  excerpt: string;
  content_md: string;
  image_url: string;
  thumbnail_url: string;
  external_url: string;
  status: string;
  visible: boolean;
  gallery?: string[] | null;
};

type SpecialLite = { slug: string; title: string };

export const Route = createFileRoute("/especiales/$slug/$piece")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.piece} — ${params.slug} — RollerZone` },
      { name: "description", content: "Pieza editorial del especial." },
    ],
  }),
  component: PiecePage,
  notFoundComponent: PieceNotFound,
});

function PiecePage() {
  const { slug, piece: pieceSlug } = Route.useParams();
  const [special, setSpecial] = useState<SpecialLite | null>(null);
  const [piece, setPiece] = useState<Piece | null>(null);
  const [siblings, setSiblings] = useState<Piece[]>([]);
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
        .select("slug,title,status")
        .eq("slug", slug)
        .eq("status", "active")
        .maybeSingle();
      if (cancelled) return;
      if (!sp) {
        setMissing(true);
        setLoading(false);
        return;
      }
      const { data: pc } = await sb
        .from("special_pieces")
        .select("*")
        .eq("special_slug", slug)
        .eq("slug", pieceSlug)
        .in("status", ["published", "live"])
        .eq("visible", true)
        .maybeSingle();
      if (cancelled) return;
      if (!pc) {
        setMissing(true);
        setLoading(false);
        return;
      }
      const { data: sibs } = await sb
        .from("special_pieces")
        .select("*")
        .eq("special_slug", slug)
        .in("status", ["published", "live"])
        .eq("visible", true)
        .neq("slug", pieceSlug)
        .order("sort_order", { ascending: true })
        .limit(4);
      setSpecial(sp as SpecialLite);
      setPiece(pc as Piece);
      setSiblings((sibs ?? []) as Piece[]);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [slug, pieceSlug]);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-24 text-muted-foreground">Cargando pieza…</div>
    );
  }
  if (missing || !piece || !special) {
    throw notFound();
  }

  const hero = piece.image_url || piece.thumbnail_url || (specialFallback as string);
  const html = renderMarkdown(piece.content_md ?? "");

  return (
    <>
      <section className="relative overflow-hidden bg-surface">
        <div className="absolute inset-0">
          <img src={hero} alt="" className="h-full w-full object-cover opacity-30" aria-hidden="true" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
        </div>
        <div className="relative mx-auto max-w-4xl px-4 py-16 md:px-6 md:py-24">
          <Link
            to="/especiales/$slug"
            params={{ slug }}
            className="font-condensed inline-block text-[10px] font-bold uppercase tracking-[3px] text-gold hover:text-gold-light"
          >
            ← {special.title}
          </Link>
          <div className="mt-4 flex items-center gap-3">
            {(piece.kicker || piece.category) && (
              <span className="font-condensed inline-block bg-gold px-2.5 py-1 text-[10px] font-bold uppercase tracking-[2.5px] text-background">
                {piece.kicker || piece.category}
              </span>
            )}
            {piece.number && (
              <span className="font-display text-2xl text-gold">{piece.number}</span>
            )}
          </div>
          <h1 className="font-display mt-4 text-3xl uppercase tracking-wider text-foreground md:text-5xl">
            {piece.title}
          </h1>
          <div className="mt-4 h-[3px] w-24 bg-gold" />
          {piece.excerpt && (
            <p className="mt-6 max-w-3xl text-lg text-muted-foreground md:text-xl">
              {piece.excerpt}
            </p>
          )}
        </div>
      </section>

      <article className="bg-background py-12 md:py-16">
        <div className="mx-auto max-w-3xl px-4 md:px-6">
          {html ? (
            <div
              className="prose prose-invert max-w-none text-base leading-relaxed text-muted-foreground [&_a]:text-gold [&_h1]:font-display [&_h1]:uppercase [&_h1]:tracking-wider [&_h1]:text-foreground [&_h2]:font-display [&_h2]:uppercase [&_h2]:tracking-wider [&_h2]:text-foreground [&_h3]:font-display [&_h3]:uppercase [&_h3]:tracking-wider [&_h3]:text-foreground [&_strong]:text-foreground"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          ) : (
            <p className="text-muted-foreground">
              {piece.description || "Contenido en preparación."}
            </p>
          )}
          {piece.external_url && (
            <a
              href={piece.external_url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-condensed mt-8 inline-flex items-center gap-2 border border-gold px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-gold hover:bg-gold hover:text-background"
            >
              Enlace externo <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>

        {Array.isArray(piece.gallery) && piece.gallery.length > 0 && (
          <div className="mx-auto mt-14 max-w-5xl px-4 md:px-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="h-[2px] w-10 bg-gold" />
              <h2 className="font-condensed text-[11px] font-bold uppercase tracking-[3px] text-gold">
                Galería del reportaje
              </h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {piece.gallery.map((url, i) => (
                <figure
                  key={`${url}-${i}`}
                  className={
                    "overflow-hidden rounded-lg border border-border bg-surface " +
                    (i % 3 === 0 ? "sm:col-span-2" : "")
                  }
                >
                  <img
                    src={url}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                </figure>
              ))}
            </div>
          </div>
        )}
      </article>


      {siblings.length > 0 && (
        <section className="bg-surface py-12">
          <div className="mx-auto max-w-7xl px-4 md:px-6">
            <h2 className="font-display mb-6 text-xl uppercase tracking-wider text-foreground">
              Más piezas del especial
            </h2>
            <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {siblings.map((s) => (
                <li key={s.slug}>
                  <Link
                    to="/especiales/$slug/$piece"
                    params={{ slug, piece: s.slug }}
                    className="group block overflow-hidden rounded-xl border border-border bg-background transition-colors hover:border-gold"
                  >
                    <div className="aspect-[16/9] overflow-hidden bg-surface-2">
                      <img
                        src={s.thumbnail_url || s.image_url || (specialFallback as string)}
                        alt={s.title}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-3">
                      {(s.kicker || s.category) && (
                        <div className="font-condensed text-[9px] font-bold uppercase tracking-[2px] text-gold">
                          {s.kicker || s.category}
                        </div>
                      )}
                      <div className="font-display mt-1 text-sm uppercase leading-tight tracking-wider text-foreground group-hover:text-gold">
                        {s.title}
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}
    </>
  );
}

function PieceNotFound() {
  const { slug } = Route.useParams();
  return (
    <div className="mx-auto max-w-3xl px-4 py-24 text-center">
      <h1 className="font-display text-3xl uppercase tracking-wider text-foreground">
        Pieza no disponible
      </h1>
      <p className="mt-4 text-muted-foreground">
        Esta pieza no existe o ya no está publicada.
      </p>
      <Link
        to="/especiales/$slug"
        params={{ slug }}
        className="font-condensed mt-6 inline-block bg-gold px-5 py-2 text-xs font-bold uppercase tracking-widest text-background"
      >
        Volver al especial
      </Link>
    </div>
  );
}
