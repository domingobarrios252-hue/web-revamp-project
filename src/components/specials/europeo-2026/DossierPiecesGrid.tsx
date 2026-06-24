import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { piecePath } from "@/lib/specials/europeo-2026";
import { useSpecialPieces } from "@/lib/specials/useSpecialPieces";

export function DossierPiecesGrid() {
  const { pieces } = useSpecialPieces();
  return (
    <section className="bg-background py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <header className="mb-10 flex items-end justify-between gap-4">
          <div>
            <div className="font-condensed text-[10px] font-bold uppercase tracking-[3px] text-gold">
              Dossier RollerZone
            </div>
            <h2 className="font-display mt-2 text-3xl uppercase tracking-wider text-foreground md:text-4xl">
              Piezas del especial
            </h2>
            <div className="mt-3 h-[3px] w-24 bg-gold" aria-hidden="true" />
          </div>
          <span className="font-condensed hidden text-[10px] uppercase tracking-[3px] text-muted-foreground md:inline">
            {pieces.length} piezas
          </span>
        </header>

        <ol className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {pieces.map((p) => (
            <li key={p.slug}>
              <Link
                to={piecePath(p.slug)}
                className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-lg transition-all hover:-translate-y-1 hover:border-gold hover:shadow-[0_15px_40px_-10px_rgba(212,160,23,0.35)]"
              >
                <div className="relative aspect-[16/9] overflow-hidden bg-surface-2">
                  <img
                    src={p.image}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <span className="font-condensed absolute left-3 top-3 inline-block bg-gold px-2.5 py-1 text-[10px] font-bold uppercase tracking-[2.5px] text-background shadow-md">
                    {p.kicker}
                  </span>
                  <span className="font-display absolute right-3 top-3 text-2xl text-gold drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                    {p.number}
                  </span>
                  {p.status === "preparing" && (
                    <span className="font-condensed absolute bottom-3 left-3 inline-block border border-white/40 bg-black/50 px-2 py-1 text-[9px] font-bold uppercase tracking-[2.5px] text-white backdrop-blur-sm">
                      Próximamente
                    </span>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="font-display text-lg uppercase leading-snug tracking-wider text-foreground transition-colors group-hover:text-gold md:text-xl">
                    {p.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {p.description}
                  </p>
                  <div className="font-condensed mt-5 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[2.5px] text-gold">
                    Leer pieza <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
