import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type RegionRow = { id: string; code: string; name: string };
export type RegionFederation = { id: string; slug: string; name: string; short_name: string | null; logo_url: string | null };
export type RegionClub = { id: string; slug: string; name: string; city: string | null; logo_url: string | null; school_type: string | null };
export type RegionSkater = { id: string; slug: string; full_name: string; photo_url: string | null; category: string | null; gender: string | null; club_id: string | null };

export function useRegion(countryCode: string, regionCode: string) {
  const [region, setRegion] = useState<RegionRow | null>(null);
  const [federation, setFederation] = useState<RegionFederation | null>(null);
  const [clubs, setClubs] = useState<RegionClub[]>([]);
  const [skaters, setSkaters] = useState<RegionSkater[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      const { data: regRow } = await supabase
        .from("regions").select("id, code, name").eq("code", regionCode).maybeSingle();
      if (cancelled) return;
      const r = (regRow as RegionRow) ?? null;
      setRegion(r);
      if (!r) {
        setLoading(false);
        return;
      }
      const [{ data: fedData }, { data: clubsData }, { data: skatersData }] = await Promise.all([
        supabase
          .from("federations")
          .select("id, slug, name, short_name, logo_url")
          .eq("country_code", countryCode)
          .eq("region_code", regionCode)
          .eq("published", true)
          .maybeSingle(),
        supabase
          .from("clubs")
          .select("id, slug, name, city, logo_url, school_type")
          .eq("region_id", r.id)
          .order("name"),
        supabase
          .from("skaters")
          .select("id, slug, full_name, photo_url, category, gender, club_id")
          .eq("region_id", r.id)
          .eq("active", true)
          .order("total_points", { ascending: false })
          .limit(60),
      ]);
      if (cancelled) return;
      setFederation((fedData as RegionFederation) ?? null);
      setClubs((clubsData as RegionClub[]) ?? []);
      setSkaters((skatersData as RegionSkater[]) ?? []);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [countryCode, regionCode]);

  return { region, federation, clubs, skaters, loading };
}
