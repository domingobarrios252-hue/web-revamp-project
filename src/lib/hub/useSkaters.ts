import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Skater = {
  id: string;
  full_name: string;
  slug: string;
  photo_url: string | null;
  cover_url: string | null;
  birth_year: number | null;
  category: string | null;
  gender: string | null;
  specialty: string | null;
  province: string | null;
  country_code: string;
  club_id: string | null;
  region_id: string | null;
  total_points: number;
  personal_records: Array<{ event: string; time: string; date?: string; place?: string }>;
  palmares: Array<{ year: number; event: string; position: number }>;
  social: { instagram?: string; twitter?: string; facebook?: string; tiktok?: string; youtube?: string };
  sponsors: string[];
  gallery: string[];
  bio: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  dominant_foot: string | null;
  featured: boolean;
  published: boolean;
  active: boolean;
  clubs?: { id: string; name: string; slug: string; logo_url: string | null } | null;
  regions?: { name: string; code: string } | null;
};

export type SkatersFilters = {
  search?: string;
  category?: string;
  gender?: string;
  specialty?: string;
  clubId?: string;
};

export function useSkaters(countryCode: string, filters: SkatersFilters = {}) {
  const [skaters, setSkaters] = useState<Skater[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    let q = supabase
      .from("skaters")
      .select("*, clubs(id, name, slug, logo_url), regions(name, code)")
      .eq("country_code", countryCode)
      .eq("published", true)
      .eq("active", true)
      .order("featured", { ascending: false })
      .order("total_points", { ascending: false });

    if (filters.category) q = q.eq("category", filters.category);
    if (filters.gender) q = q.eq("gender", filters.gender);
    if (filters.specialty) q = q.eq("specialty", filters.specialty);
    if (filters.clubId) q = q.eq("club_id", filters.clubId);
    if (filters.search) q = q.ilike("full_name", `%${filters.search}%`);

    q.then(({ data }) => {
      if (cancelled) return;
      setSkaters((data as unknown as Skater[]) ?? []);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [countryCode, filters.search, filters.category, filters.gender, filters.specialty, filters.clubId]);

  return { skaters, loading };
}

export function useSkater(slug: string) {
  const [skater, setSkater] = useState<Skater | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    supabase
      .from("skaters")
      .select("*, clubs(id, name, slug, logo_url), regions(name, code)")
      .eq("slug", slug)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        setSkater((data as unknown as Skater) ?? null);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  return { skater, loading };
}

export type SkaterRelatedNews = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  image_url: string | null;
  published_at: string;
};

export function useSkaterNews(skaterId: string | undefined) {
  const [news, setNews] = useState<SkaterRelatedNews[]>([]);
  useEffect(() => {
    if (!skaterId) return;
    let cancelled = false;
    supabase
      .from("news_skaters")
      .select("news(id, slug, title, excerpt, image_url, published_at, published)")
      .eq("skater_id", skaterId)
      .limit(12)
      .then(({ data }) => {
        if (cancelled) return;
        const rows = ((data as unknown as Array<{ news: SkaterRelatedNews & { published: boolean } }>) ?? [])
          .map((r) => r.news)
          .filter((n) => n && (n as unknown as { published: boolean }).published)
          .sort((a, b) => (a.published_at < b.published_at ? 1 : -1));
        setNews(rows as SkaterRelatedNews[]);
      });
    return () => {
      cancelled = true;
    };
  }, [skaterId]);
  return news;
}

export type SkaterVideo = {
  id: string;
  slug: string;
  title: string;
  youtube_id: string | null;
  thumbnail_url: string | null;
  category: string | null;
};

export function useSkaterVideos(skaterId: string | undefined) {
  const [videos, setVideos] = useState<SkaterVideo[]>([]);
  useEffect(() => {
    if (!skaterId) return;
    let cancelled = false;
    supabase
      .from("video_skaters")
      .select("videos(id, slug, title, youtube_id, thumbnail_url, category, published)")
      .eq("skater_id", skaterId)
      .then(({ data }) => {
        if (cancelled) return;
        const rows = ((data as unknown as Array<{ videos: SkaterVideo & { published: boolean } }>) ?? [])
          .map((r) => r.videos)
          .filter((v) => v && (v as unknown as { published: boolean }).published);
        setVideos(rows as SkaterVideo[]);
      });
    return () => {
      cancelled = true;
    };
  }, [skaterId]);
  return videos;
}

export type SkaterResult = {
  id: string;
  position: number;
  time: string | null;
  gap: string | null;
  race_id: string;
};

export function useSkaterResults(skaterId: string | undefined) {
  const [results, setResults] = useState<Array<SkaterResult & { race?: { name: string; date: string } | null }>>([]);
  useEffect(() => {
    if (!skaterId) return;
    let cancelled = false;
    supabase
      .from("result_skaters")
      .select("results(id, position, time, gap, race_id, races(name, date))")
      .eq("skater_id", skaterId)
      .limit(20)
      .then(({ data }) => {
        if (cancelled) return;
        const rows = ((data as unknown as Array<{ results: SkaterResult & { races?: { name: string; date: string } } }>) ?? [])
          .map((r) => ({ ...r.results, race: r.results?.races ?? null }))
          .filter((r) => r.id);
        setResults(rows);
      });
    return () => {
      cancelled = true;
    };
  }, [skaterId]);
  return results;
}
