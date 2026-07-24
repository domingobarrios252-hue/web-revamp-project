import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { renderMarkdown } from "@/lib/markdown";

type Row = {
  content_md: string | null;
  gallery: string[] | null;
  external_url: string | null;
};

/**
 * Bloque editorial editable desde /admin/especiales.
 * Se inyecta debajo del contenido estático de cada pieza del especial
 * "Camino al Europeo 2026" para renderizar el content_md, la galería y
 * el enlace externo cargados desde la tabla special_pieces.
 * Si no hay contenido en BBDD, no renderiza nada.
 */
export function PieceEditorialContent({
  slug,
  specialSlug = "camino-al-europeo-2026",
}: {
  slug: string;
  specialSlug?: string;
}) {
  const [row, setRow] = useState<Row | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("special_pieces")
        .select("content_md,gallery,external_url")
        .eq("special_slug", specialSlug)
        .eq("slug", slug)
        .eq("visible", true)
        .in("status", ["published", "live"])
        .maybeSingle();
      if (!cancelled) setRow((data as Row) ?? null);
    })();
    return () => {
      cancelled = true;
    };
  }, [slug, specialSlug]);

  const md = row?.content_md?.trim();
  const gallery = Array.isArray(row?.gallery) ? row!.gallery! : [];
  const external = row?.external_url?.trim();

  if (!md && gallery.length === 0 && !external) return null;

  const html = md ? renderMarkdown(md) : "";

  return (
    <section className="bg-background pb-12">
      <div className="mx-auto max-w-3xl px-4 md:px-6">
        {html && (
          <div
            className="prose prose-invert max-w-none text-base leading-relaxed text-muted-foreground [&_a]:text-gold [&_h1]:font-display [&_h1]:uppercase [&_h1]:tracking-wider [&_h1]:text-foreground [&_h2]:font-display [&_h2]:uppercase [&_h2]:tracking-wider [&_h2]:text-foreground [&_h3]:font-display [&_h3]:uppercase [&_h3]:tracking-wider [&_h3]:text-foreground [&_strong]:text-foreground"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        )}
        {external && (
          <a
            href={external}
            target="_blank"
            rel="noopener noreferrer"
            className="font-condensed mt-8 inline-flex items-center gap-2 border border-gold px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-gold hover:bg-gold hover:text-background"
          >
            Enlace externo oficial
          </a>
        )}
      </div>

      {gallery.length > 0 && (
        <div className="mx-auto mt-12 max-w-5xl px-4 md:px-6">
          <div className="mb-6 flex items-center gap-3">
            <div className="h-[2px] w-10 bg-gold" />
            <h2 className="font-condensed text-[11px] font-bold uppercase tracking-[3px] text-gold">
              Galería del reportaje
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {gallery.map((url, i) => (
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
    </section>
  );
}
