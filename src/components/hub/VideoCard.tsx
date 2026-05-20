import { Link } from "@tanstack/react-router";
import { Play, Star } from "lucide-react";
import { youTubeThumbnail } from "@/lib/youtube";
import type { VideoRow } from "@/lib/hub/useVideos";

export function VideoCard({ country, video }: { country: string; video: VideoRow }) {
  const thumb = video.thumbnail_url ?? youTubeThumbnail(video.video_url) ?? null;
  return (
    <Link
      to="/hub/$country/tv/$slug"
      params={{ country, slug: video.slug }}
      className="group block overflow-hidden rounded-[6px] border border-[#2A2A2A] bg-[#1A1A1A] transition-colors hover:border-[#D4A017]"
    >
      <div className="relative aspect-video bg-[#0E0E0E]">
        {thumb ? (
          <img src={thumb} alt={video.title} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[#555]">
            <Play className="h-10 w-10" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
        <div className="absolute left-2 top-2 flex items-center gap-1">
          {video.featured && (
            <span className="font-ui inline-flex items-center gap-1 bg-[#D4A017] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-[#1A1A1A]">
              <Star className="h-2.5 w-2.5" /> Destacado
            </span>
          )}
          {video.category && (
            <span className="font-ui bg-black/70 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-[#D4A017]">
              {video.category}
            </span>
          )}
        </div>
        <Play className="absolute right-3 bottom-3 h-8 w-8 text-white opacity-80 transition-transform group-hover:scale-110" />
      </div>
      <div className="p-3">
        <h3 className="font-display line-clamp-2 text-sm tracking-wide text-[#F5F5F5] group-hover:text-[#D4A017]">
          {video.title}
        </h3>
        <div className="mt-1 text-[10px] uppercase tracking-widest text-[#888]">
          {new Date(video.published_at).toLocaleDateString("es-ES")}
        </div>
      </div>
    </Link>
  );
}
