import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Club = {
  id: string;
  name: string;
  slug: string;
  country_code: string;
  logo_url: string | null;
  cover_url: string | null;
  website: string | null;
  region_id: string | null;
  city: string | null;
  province: string | null;
  address: string | null;
  email: string | null;
  phone: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  youtube_url: string | null;
  tiktok_url: string | null;
  description: string | null;
  history: string | null;
  school_type: "escuela" | "competicion" | "mixto";
  categories: string[];
  coaches: Array<{ name: string; role?: string; photo?: string }>;
  gallery: string[];
  featured: boolean;
  published: boolean;
  founded_year: number | null;
  regions?: { name: string; code: string } | null;
};

export type ClubsFilters = {
  search?: string;
  regionId?: string;
  schoolType?: string;
  category?: string;
};

export function useClubs(countryCode: string, filters: ClubsFilters = {}) {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      let q = supabase
        .from("clubs")
        .select("*, regions(name, code)")
        .eq("published", true)
        .order("featured", { ascending: false })
        .order("name");

      if (filters.regionId) q = q.eq("region_id", filters.regionId);
      if (filters.schoolType) q = q.eq("school_type", filters.schoolType);
      if (filters.search) q = q.ilike("name", `%${filters.search}%`);
      if (filters.category) q = q.contains("categories", [filters.category]);

      const [{ data: allClubs }, { data: hubRows }] = await Promise.all([
        q,
        supabase.from("club_hubs").select("club_id, country_code"),
      ]);
      if (cancelled) return;

      const hasAnyHub = new Set<string>();
      const forThisHub = new Set<string>();
      for (const r of (hubRows ?? []) as { club_id: string; country_code: string }[]) {
        hasAnyHub.add(r.club_id);
        if (r.country_code === countryCode) forThisHub.add(r.club_id);
      }

      const filtered = ((allClubs as unknown as Club[]) ?? []).filter((c) => {
        if (forThisHub.has(c.id)) return true;
        if (hasAnyHub.has(c.id)) return false;
        return c.country_code === countryCode;
      });
      setClubs(filtered);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [countryCode, filters.search, filters.regionId, filters.schoolType, filters.category]);

  return { clubs, loading };
}

export function useClub(slug: string) {
  const [club, setClub] = useState<Club | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    supabase
      .from("clubs")
      .select("*, regions(name, code)")
      .eq("slug", slug)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        setClub((data as unknown as Club) ?? null);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  return { club, loading };
}

export type ClubRelatedNews = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  image_url: string | null;
  published_at: string;
};

export function useClubNews(clubId: string | undefined) {
  const [news, setNews] = useState<ClubRelatedNews[]>([]);
  useEffect(() => {
    if (!clubId) return;
    let cancelled = false;
    supabase
      .from("news_clubs")
      .select("news(id, slug, title, excerpt, image_url, published_at, published)")
      .eq("club_id", clubId)
      .limit(12)
      .then(({ data }) => {
        if (cancelled) return;
        const rows = ((data as unknown as Array<{ news: ClubRelatedNews & { published: boolean } }>) ?? [])
          .map((r) => r.news)
          .filter((n) => n && (n as unknown as { published: boolean }).published)
          .sort((a, b) => (a.published_at < b.published_at ? 1 : -1));
        setNews(rows as ClubRelatedNews[]);
      });
    return () => {
      cancelled = true;
    };
  }, [clubId]);
  return news;
}

export type ClubSkater = {
  id: string;
  slug: string;
  full_name: string;
  photo_url: string | null;
  category: string | null;
  gender: string | null;
};

export function useClubSkaters(clubId: string | undefined) {
  const [skaters, setSkaters] = useState<ClubSkater[]>([]);
  useEffect(() => {
    if (!clubId) return;
    let cancelled = false;
    supabase
      .from("skaters")
      .select("id, slug, full_name, photo_url, category, gender")
      .eq("club_id", clubId)
      .eq("active", true)
      .order("featured", { ascending: false })
      .order("full_name")
      .then(({ data }) => {
        if (cancelled) return;
        setSkaters((data as unknown as ClubSkater[]) ?? []);
      });
    return () => {
      cancelled = true;
    };
  }, [clubId]);
  return skaters;
}

export type ClubEvent = {
  id: string;
  slug: string;
  name: string;
  start_date: string;
  location: string | null;
  cover_url: string | null;
};

export function useClubEvents(clubId: string | undefined) {
  const [events, setEvents] = useState<ClubEvent[]>([]);
  useEffect(() => {
    if (!clubId) return;
    let cancelled = false;
    supabase
      .from("event_clubs")
      .select("events(id, slug, name, start_date, location, cover_url, published)")
      .eq("club_id", clubId)
      .then(({ data }) => {
        if (cancelled) return;
        const rows = ((data as unknown as Array<{ events: ClubEvent & { published: boolean } }>) ?? [])
          .map((r) => r.events)
          .filter((e) => e && (e as unknown as { published: boolean }).published)
          .sort((a, b) => (a.start_date < b.start_date ? 1 : -1));
        setEvents(rows as ClubEvent[]);
      });
    return () => {
      cancelled = true;
    };
  }, [clubId]);
  return events;
}
