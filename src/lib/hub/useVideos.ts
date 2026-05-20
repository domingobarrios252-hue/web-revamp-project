import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type VideoRow = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  video_url: string | null;
  youtube_id: string | null;
  thumbnail_url: string | null;
  category: string | null;
  country_code: string;
  event_id: string | null;
  club_id: string | null;
  news_id: string | null;
  published: boolean;
  featured: boolean;
  published_at: string;
  duration_seconds: number | null;
};

export const VIDEO_CATEGORIES = [
  { key: "entrevista", label: "Entrevistas" },
  { key: "directo", label: "Directos" },
  { key: "highlight", label: "Highlights" },
  { key: "reportaje", label: "Reportajes" },
  { key: "resumen", label: "Resúmenes" },
  { key: "destacado", label: "Destacados" },
];

export function useVideos(country: string, opts?: { category?: string; limit?: number }) {
  const [videos, setVideos] = useState<VideoRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    let q = supabase
      .from("videos")
      .select("*")
      .eq("country_code", country)
      .eq("published", true)
      .order("published_at", { ascending: false });
    if (opts?.category) q = q.eq("category", opts.category);
    if (opts?.limit) q = q.limit(opts.limit);
    q.then(({ data }) => {
      if (cancelled) return;
      setVideos((data as VideoRow[]) ?? []);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [country, opts?.category, opts?.limit]);

  return { videos, loading };
}

export function useVideo(slug: string) {
  const [video, setVideo] = useState<VideoRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    supabase
      .from("videos")
      .select("*")
      .eq("slug", slug)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        setVideo((data as VideoRow) ?? null);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  return { video, loading };
}
