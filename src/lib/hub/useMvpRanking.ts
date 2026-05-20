import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type RankingRow = {
  id: string;
  season_id: string;
  tier: "elite" | "estrella" | "promesa";
  gender: "masculino" | "femenino";
  position: number;
  full_name: string;
  photo_url: string | null;
  club: string | null;
  region: string | null;
  category_age: string | null;
  merit: string | null;
  points: number;
  previous_position: number | null;
  skater_id: string | null;
  country_code: string;
  published: boolean;
};

export type Season = { id: string; year: number; label: string; is_current: boolean };

export function useMvpRanking(country: string, seasonId?: string) {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [rows, setRows] = useState<RankingRow[]>([]);
  const [activeSeasonId, setActiveSeasonId] = useState<string | undefined>(seasonId);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data: ss } = await supabase
        .from("mvp_seasons")
        .select("*")
        .order("year", { ascending: false });
      if (cancelled) return;
      const sList = (ss as Season[]) ?? [];
      setSeasons(sList);
      const sid =
        activeSeasonId ?? sList.find((s) => s.is_current)?.id ?? sList[0]?.id;
      if (!sid) {
        setRows([]);
        setLoading(false);
        return;
      }
      setActiveSeasonId(sid);
      const { data } = await supabase
        .from("mvp_awards")
        .select("*")
        .eq("season_id", sid)
        .eq("country_code", country)
        .eq("published", true)
        .order("points", { ascending: false });
      if (cancelled) return;
      setRows((data as RankingRow[]) ?? []);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [country, activeSeasonId]);

  return { seasons, rows, loading, activeSeasonId, setActiveSeasonId };
}
