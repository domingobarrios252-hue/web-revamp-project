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

export type ZoneFilter = { regionId?: string | null; cityId?: string | null };

export function useTerritoryNews(code: TerritoryCode, limit = 24, zone?: ZoneFilter) {
  const regionId = zone?.regionId ?? null;
  const cityId = zone?.cityId ?? null;
  const [items, setItems] = useState<TerritoryNews[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      let q = supabase
        .from("news")
        .select("id,title,slug,excerpt,image_url,image_crops,author,published_at,category_id")
        .eq("country_code", code)
        .eq("published", true);
      if (cityId) q = q.eq("zone_city_id", cityId);
      else if (regionId) q = q.eq("zone_region_id", regionId);
      const { data } = await q.order("published_at", { ascending: false }).limit(limit);
      if (cancelled) return;
      setItems((data as TerritoryNews[]) ?? []);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [code, limit, regionId, cityId]);

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

export type TerritoryZone = {
  id: string;
  slug: string;
  name: string;
  parent_id: string | null;
  sort_order: number;
};

/** Zonas (estados/regiones y ciudades) activas de un territorio. */
export function useTerritoryZones(code: TerritoryCode) {
  const [zones, setZones] = useState<TerritoryZone[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("territory_zones")
        .select("id,slug,name,parent_id,sort_order")
        .eq("territory_code", code)
        .eq("active", true)
        .order("sort_order")
        .order("name");
      if (cancelled) return;
      setZones((data as TerritoryZone[]) ?? []);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [code]);
  return { zones, loading };
}
