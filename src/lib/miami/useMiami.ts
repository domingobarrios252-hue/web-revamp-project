import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { ImageCrops } from "@/lib/imageCrops";

/**
 * Miami reutiliza la arquitectura territorial existente:
 * news.country_code / interviews.country_code = MIAMI_CODE.
 * No hay tablas nuevas ni sistema editorial paralelo.
 */
export const MIAMI_CODE = "mia";

export type MiamiNews = {
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

export type MiamiInterview = {
  id: string;
  title: string;
  slug: string;
  interviewee_name: string;
  excerpt: string | null;
  cover_url: string | null;
  cover_crops: ImageCrops | null;
  interview_date: string;
};

export function useMiamiNews(limit = 24) {
  const [items, setItems] = useState<MiamiNews[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("news")
        .select("id,title,slug,excerpt,image_url,image_crops,author,published_at,category_id")
        .eq("country_code", MIAMI_CODE)
        .eq("published", true)
        .order("published_at", { ascending: false })
        .limit(limit);
      if (cancelled) return;
      setItems((data as MiamiNews[]) ?? []);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [limit]);

  return { items, loading };
}

export function useMiamiInterviews(limit = 24) {
  const [items, setItems] = useState<MiamiInterview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("interviews")
        .select("id,title,slug,interviewee_name,excerpt,cover_url,cover_crops,interview_date")
        .eq("country_code", MIAMI_CODE)
        .eq("published", true)
        .order("interview_date", { ascending: false })
        .limit(limit);
      if (cancelled) return;
      setItems((data as MiamiInterview[]) ?? []);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [limit]);

  return { items, loading };
}
