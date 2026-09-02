import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { ImageCrops } from "@/lib/imageCrops";
import type { TerritoryCode } from "@/lib/territory/territories";

export type TerritoryNews = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  image_url: string | null;
  image_crops: ImageCrops | null;
  author: string;
  published_at: string;
  category_id: string | null;
};

export type TerritoryInterview = {
  id: string;
  title: string;
  slug: string;
  interviewee_name: string;
  excerpt: string | null;
  cover_url: string | null;
  cover_crops: ImageCrops | null;
  interview_date: string;
};

export function useTerritoryNews(code: TerritoryCode, limit = 24) {
  const [items, setItems] = useState<TerritoryNews[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      const { data } = await supabase
        .from("news")
        .select("id,title,slug,excerpt,image_url,image_crops,author,published_at,category_id")
        .eq("country_code", code)
        .eq("published", true)
        .order("published_at", { ascending: false })
        .limit(limit);
      if (cancelled) return;
      setItems((data as TerritoryNews[]) ?? []);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [code, limit]);

  return { items, loading };
}

export function useTerritoryInterviews(code: TerritoryCode, limit = 24) {
  const [items, setItems] = useState<TerritoryInterview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      const { data } = await supabase
        .from("interviews")
        .select("id,title,slug,interviewee_name,excerpt,cover_url,cover_crops,interview_date")
        .eq("country_code", code)
        .eq("published", true)
        .order("interview_date", { ascending: false })
        .limit(limit);
      if (cancelled) return;
      setItems((data as TerritoryInterview[]) ?? []);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [code, limit]);

  return { items, loading };
}
