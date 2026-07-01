import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Play, Tv, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { youTubeEmbedUrl, extractYouTubeId } from "@/lib/youtube";
import { SectionHeading } from "./SectionHeading";

type Highlight = {
  id: string;
  title: string;
  description: string | null;
  video_url: string | null;
  thumbnail_url: string | null;
  category: string | null;
  duration: string | null;
  featured: boolean;
};

export function RollerZoneTVHome() {
  const [items, setItems] = useState<Highlight[] | null>(null);
  const [openUrl, setOpenUrl] = useState<string | null>(null);

  function openVideo(url: string | null) {
    if (!url) return;
    if (extractYouTubeId(url)) setOpenUrl(url);
    else window.open(url, "_blank", "noopener,noreferrer");
  }

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("tv_highlights")
      .select("id, title, description, video_url, thumbnail_url, category, duration, featured")
      .eq("published", true)
      .order("featured", { ascending: false })
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false })
      .limit(4)
      .then(({ data }) => {
        if (!cancelled) setItems((data as Highlight[]) ?? []);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (items !== null && items.length === 0) return null;

  const featured = items?.[0];
  const rest = items?.slice(1, 4) ?? [];

  return (
    <section className="border-y border-border bg-surface/30 py-12 md:py-14">
      <div className="mx-auto max-w-7xl px-5 md:px-6">
        <SectionHeading
          kicker="RollerZone TV"
          title="Lo último en"
          accent="vídeo"
          icon={<Tv className="h-3 w-3" />}
          action={{ to: "/tv", label: "Ver todos los vídeos" }}
        />

        {items === null ? (
          <div className="grid gap-5 lg:grid-cols-[2fr_1fr]">
            <div className="aspect-video animate-pulse rounded-xl bg-surface-2" />
            <div className="space-y-4">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-24 animate-pulse rounded-lg bg-surface-2" />
              ))}
            </div>
          </div>
        ) : featured ? (
          <div className="grid gap-5 lg:grid-cols-[2fr_1fr]">
            {/* Destacado */}
            <button
              type="button"
              onClick={() => openVideo(featured.video_url)}
              className="group relative block w-full overflow-hidden rounded-2xl border border-border bg-black text-left shadow-xl transition-all hover:border-gold"
            >
              <div className="relative aspect-video">
                {featured.thumbnail_url ? (
                  <img
                    src={featured.thumbnail_url}
                    alt={featured.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                ) : (
                  <div className="hero-grid-bg h-full w-full" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gold/95 text-background shadow-2xl transition-transform group-hover:scale-110 md:h-20 md:w-20">
                    <Play className="ml-1 h-7 w-7 md:h-9 md:w-9" fill="currentColor" />
                  </div>
                </div>
                <div className="absolute inset-x-0 bottom-0 p-5 md:p-6">
                  {featured.category && (
                    <span className="font-condensed mb-2 inline-block bg-gold px-2 py-0.5 text-[10px] font-bold uppercase tracking-[2.5px] text-background">
                      {featured.category}
                    </span>
                  )}
                  <h3 className="font-display text-xl uppercase leading-tight tracking-wider text-white drop-shadow-lg md:text-2xl">
                    {featured.title}
                  </h3>
                  {featured.duration && (
                    <div className="font-condensed mt-1 text-[11px] uppercase tracking-widest text-white/70">
                      {featured.duration}
                    </div>
                  )}
                </div>
              </div>
            </button>

            {/* Miniaturas */}
            <div className="flex flex-col gap-3">
              {rest.map((h) => (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => openVideo(h.video_url)}
                  className="group flex gap-3 overflow-hidden rounded-xl border border-border bg-surface p-2 text-left transition-all hover:border-gold"
                >
                  <div className="relative h-20 w-32 shrink-0 overflow-hidden rounded-md bg-black">
                    {h.thumbnail_url ? (
                      <img
                        src={h.thumbnail_url}
                        alt={h.title}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="hero-grid-bg h-full w-full" />
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
                      <Play className="h-6 w-6 text-gold" fill="currentColor" />
                    </div>
                  </div>
                  <div className="min-w-0 flex-1 py-1 pr-2">
                    {h.category && (
                      <div className="font-condensed text-[9px] font-bold uppercase tracking-[2px] text-gold">
                        {h.category}
                      </div>
                    )}
                    <h4 className="font-display clamp-2 mt-0.5 text-sm uppercase leading-snug tracking-wider text-foreground transition-colors group-hover:text-gold">
                      {h.title}
                    </h4>
                    {h.duration && (
                      <div className="font-condensed mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">
                        {h.duration}
                      </div>
                    )}
                  </div>
                </button>
              ))}
              <Link
                to="/tv"
                className="font-condensed mt-1 inline-flex items-center justify-center gap-2 rounded-md border border-gold/60 px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-gold transition-all hover:bg-gold hover:text-background"
              >
                Ir a RollerZone TV
              </Link>
            </div>
          </div>
        ) : null}
      </div>

      {openUrl && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
          onClick={() => setOpenUrl(null)}
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            onClick={() => setOpenUrl(null)}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="w-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
            <div className="aspect-video overflow-hidden rounded-lg bg-black">
              <iframe
                src={youTubeEmbedUrl(openUrl, { autoplay: true }) ?? undefined}
                title="Vídeo"
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
