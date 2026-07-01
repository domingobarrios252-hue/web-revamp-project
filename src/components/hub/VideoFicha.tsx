import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useVideo, useVideos } from "@/lib/hub/useVideos";
import { youTubeEmbedUrl } from "@/lib/youtube";
import { VideoCard } from "./VideoCard";

type RelatedSkater = { id: string; full_name: string; slug: string };
type RelatedClub = { id: string; name: string; slug: string };
type RelatedEvent = { id: string; name: string; slug: string };
type RelatedNews = { id: string; title: string; slug: string };

export function VideoFicha({ country, slug }: { country: string; slug: string }) {
  const { video, loading } = useVideo(slug);
  const { videos: latest } = useVideos(country, { limit: 8 });
  const [skaters, setSkaters] = useState<RelatedSkater[]>([]);
  const [club, setClub] = useState<RelatedClub | null>(null);
  const [event, setEvent] = useState<RelatedEvent | null>(null);
  const [news, setNews] = useState<RelatedNews | null>(null);

  useEffect(() => {
    if (!video) return;
    let cancelled = false;
    (async () => {
      const { data: vs } = await supabase
        .from("video_skaters")
        .select("skater_id, skaters(id, full_name, slug)")
        .eq("video_id", video.id);
      if (cancelled) return;
      type Row = { skaters: RelatedSkater | RelatedSkater[] | null };
      const rows = (vs as unknown as Row[]) ?? [];
      setSkaters(
        rows
          .map((r) => (Array.isArray(r.skaters) ? r.skaters[0] : r.skaters))
          .filter((s): s is RelatedSkater => !!s),
      );

      if (video.club_id) {
        const { data } = await supabase
          .from("clubs")
          .select("id, name, slug")
          .eq("id", video.club_id)
          .maybeSingle();
        if (!cancelled) setClub((data as RelatedClub) ?? null);
      }
      if (video.event_id) {
        const { data } = await supabase
          .from("events")
          .select("id, name, slug")
          .eq("id", video.event_id)
          .maybeSingle();
        if (!cancelled) setEvent((data as RelatedEvent) ?? null);
      }
      if (video.news_id) {
        const { data } = await supabase
          .from("news")
          .select("id, title, slug")
          .eq("id", video.news_id)
          .maybeSingle();
        if (!cancelled) setNews((data as RelatedNews) ?? null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [video]);

  if (loading) {
    return <div className="px-6 py-12 text-[#888]">Cargando vídeo…</div>;
  }
  if (!video) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16 text-center">
        <h1 className="font-display text-3xl text-[#F5F5F5]">Vídeo no encontrado</h1>
        <Link
          to="/hub/$country/tv"
          params={{ country }}
          className="mt-4 inline-flex items-center gap-2 text-[#D4A017] hover:underline"
        >
          <ChevronLeft className="h-4 w-4" /> Volver a RollerZone TV
        </Link>
      </div>
    );
  }

  const embed = videoEmbedUrl(video.video_url, { autoplay: true });

  return (
    <article className="mx-auto max-w-6xl px-4 md:px-6 py-8 space-y-8">
      <Link
        to="/hub/$country/tv"
        params={{ country }}
        className="font-ui inline-flex items-center gap-1 text-[11px] uppercase tracking-widest text-[#888] hover:text-[#D4A017]"
      >
        <ChevronLeft className="h-3.5 w-3.5" /> RollerZone TV
      </Link>

      <div className="relative aspect-video overflow-hidden rounded-[8px] border border-[#2A2A2A] bg-black">
        {embed ? (
          <iframe
            src={embed}
            className="absolute inset-0 h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={video.title}
          />
        ) : (
          <div className="p-6 text-[#888]">Vídeo no disponible</div>
        )}
      </div>

      <header className="space-y-3">
        {video.category && (
          <div className="font-ui text-[10px] uppercase tracking-[0.2em] text-[#D4A017]">
            {video.category}
          </div>
        )}
        <h1 className="font-display text-3xl md:text-4xl font-black text-[#F5F5F5]">
          {video.title}
        </h1>
        <div className="text-xs uppercase tracking-widest text-[#888]">
          {new Date(video.published_at).toLocaleDateString("es-ES", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          })}
        </div>
        {video.description && (
          <p className="text-sm leading-relaxed text-[#D5D5D5] whitespace-pre-line">
            {video.description}
          </p>
        )}
      </header>

      {(skaters.length > 0 || club || event || news) && (
        <section className="border-t border-[#2A2A2A] pt-6 space-y-4">
          <h2 className="font-ui text-[11px] font-bold uppercase tracking-[0.2em] text-[#D4A017]">
            Relacionado
          </h2>
          <div className="flex flex-wrap gap-2 text-xs">
            {skaters.map((s) => (
              <Link
                key={s.id}
                to="/hub/$country/patinadores/$slug"
                params={{ country, slug: s.slug }}
                className="border border-[#333] px-3 py-1.5 text-[#D5D5D5] hover:border-[#D4A017] hover:text-[#D4A017]"
              >
                {s.full_name}
              </Link>
            ))}
            {club && (
              <Link
                to="/hub/$country/clubes/$slug"
                params={{ country, slug: club.slug }}
                className="border border-[#333] px-3 py-1.5 text-[#D5D5D5] hover:border-[#D4A017] hover:text-[#D4A017]"
              >
                Club: {club.name}
              </Link>
            )}
            {event && (
              <Link
                to="/eventos/$slug"
                params={{ slug: event.slug }}
                className="border border-[#333] px-3 py-1.5 text-[#D5D5D5] hover:border-[#D4A017] hover:text-[#D4A017]"
              >
                Evento: {event.name}
              </Link>
            )}
            {news && (
              <Link
                to="/noticias/$slug"
                params={{ slug: news.slug }}
                className="border border-[#333] px-3 py-1.5 text-[#D5D5D5] hover:border-[#D4A017] hover:text-[#D4A017]"
              >
                Noticia: {news.title}
              </Link>
            )}
          </div>
        </section>
      )}

      <section className="border-t border-[#2A2A2A] pt-6">
        <h2 className="font-display text-xl text-[#F5F5F5] mb-4">Más vídeos</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {latest.filter((v) => v.id !== video.id).slice(0, 4).map((v) => (
            <VideoCard key={v.id} country={country} video={v} />
          ))}
        </div>
      </section>
    </article>
  );
}
