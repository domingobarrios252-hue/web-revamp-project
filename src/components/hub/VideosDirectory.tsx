import { useMemo, useState } from "react";
import { useVideos, VIDEO_CATEGORIES, type VideoRow } from "@/lib/hub/useVideos";
import { VideoCard } from "./VideoCard";
import { videoEmbedUrl, videoThumbnail } from "@/lib/videoEmbed";
import { Link } from "@tanstack/react-router";
import { Play } from "lucide-react";

export function VideosDirectory({ country }: { country: string }) {
  const { videos, loading } = useVideos(country);
  const [cat, setCat] = useState<string>("");
  const [search, setSearch] = useState("");

  const featured = useMemo(() => videos.find((v) => v.featured) ?? videos[0] ?? null, [videos]);
  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return videos.filter((v) => {
      if (cat && v.category !== cat) return false;
      if (s && !v.title.toLowerCase().includes(s)) return false;
      return true;
    });
  }, [videos, cat, search]);

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-6 py-8 md:py-12 space-y-12">
      <header className="space-y-3">
        <div className="font-ui text-[11px] font-bold uppercase tracking-[0.2em] text-[#D4A017]">
          RollerZone TV · {country.toUpperCase()}
        </div>
        <h1 className="font-display text-4xl md:text-5xl font-black text-[#F5F5F5]">
          Vídeos, entrevistas y directos
        </h1>
        <p className="max-w-2xl text-sm text-[#B5B5B5]">
          Toda la cobertura audiovisual del patinaje en un solo lugar: entrevistas, resúmenes,
          highlights y reportajes producidos por la redacción de RollerZone.
        </p>
      </header>

      {featured && <FeaturedHero country={country} video={featured} />}

      <section className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setCat("")}
            className={`font-ui px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest rounded-[4px] ${
              cat === "" ? "bg-[#D4A017] text-[#1A1A1A]" : "border border-[#333] text-[#B5B5B5] hover:text-[#D4A017]"
            }`}
          >
            Todos
          </button>
          {VIDEO_CATEGORIES.map((c) => (
            <button
              key={c.key}
              onClick={() => setCat(c.key)}
              className={`font-ui px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest rounded-[4px] ${
                cat === c.key ? "bg-[#D4A017] text-[#1A1A1A]" : "border border-[#333] text-[#B5B5B5] hover:text-[#D4A017]"
              }`}
            >
              {c.label}
            </button>
          ))}
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar vídeo…"
            className="ml-auto w-full md:w-64 border border-[#333] bg-[#111] px-3 py-1.5 text-xs text-[#F5F5F5] placeholder:text-[#666]"
          />
        </div>

        {loading ? (
          <p className="text-sm text-[#888]">Cargando vídeos…</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-[#888]">No hay vídeos en esta categoría todavía.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((v) => (
              <VideoCard key={v.id} country={country} video={v} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function FeaturedHero({ country, video }: { country: string; video: VideoRow }) {
  const embed = youTubeEmbedUrl(video.video_url);
  const thumb = video.thumbnail_url ?? youTubeThumbnail(video.video_url);
  return (
    <section className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6 items-stretch">
      <div className="relative aspect-video overflow-hidden rounded-[8px] border border-[#2A2A2A] bg-black">
        {embed ? (
          <iframe
            src={embed}
            className="absolute inset-0 h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={video.title}
          />
        ) : thumb ? (
          <img loading="lazy" decoding="async" src={thumb} alt={video.title} className="h-full w-full object-cover" />
        ) : null}
      </div>
      <div className="flex flex-col justify-center space-y-3 border border-[#2A2A2A] bg-[#161616] p-5 rounded-[8px]">
        <div className="font-ui text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4A017]">
          Vídeo destacado · {video.category ?? "RollerZone TV"}
        </div>
        <h2 className="font-display text-2xl md:text-3xl text-[#F5F5F5]">{video.title}</h2>
        {video.description && (
          <p className="text-sm text-[#B5B5B5] line-clamp-4">{video.description}</p>
        )}
        <Link
          to="/hub/$country/tv/$slug"
          params={{ country, slug: video.slug }}
          className="font-ui inline-flex w-fit items-center gap-2 bg-[#D4A017] px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-[#1A1A1A] hover:bg-[#B8860B]"
        >
          <Play className="h-3.5 w-3.5" /> Ver vídeo
        </Link>
      </div>
    </section>
  );
}
