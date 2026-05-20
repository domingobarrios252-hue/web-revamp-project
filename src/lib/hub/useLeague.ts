import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type LeagueSeason = {
  id: string;
  country_code: string;
  name: string;
  slug: string;
  year_label: string | null;
  is_current: boolean;
  published: boolean;
};

export type LeagueRound = {
  id: string;
  season_id: string;
  round_number: number;
  name: string;
  event_date: string | null;
  city: string | null;
  venue: string | null;
  map_url: string | null;
  poster_url: string | null;
  status: "upcoming" | "live" | "finished";
  pdf_url: string | null;
  gallery: string[];
  video_url: string | null;
  summary_news_id: string | null;
  notes: string | null;
  published: boolean;
};

export type LeagueStanding = {
  id: string;
  season_id: string;
  category: string | null;
  gender: string | null;
  group_name: string | null;
  position: number;
  club: string | null;
  athlete_name: string | null;
  points: number;
  rounds_played: number;
  wins: number;
  podiums: number;
  point_diff: number | null;
  published: boolean;
};

export function useLeagueSeasons(country: string) {
  const [seasons, setSeasons] = useState<LeagueSeason[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (supabase as any)
      .from("league_seasons")
      .select("*")
      .eq("country_code", country)
      .eq("published", true)
      .order("sort_order", { ascending: false })
      .then(({ data }: { data: LeagueSeason[] | null }) => {
        if (cancelled) return;
        setSeasons(data ?? []);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [country]);

  return { seasons, current: seasons.find((s) => s.is_current) ?? seasons[0] ?? null, loading };
}

export function useLeagueRounds(seasonId: string | null | undefined) {
  const [rounds, setRounds] = useState<LeagueRound[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!seasonId) {
      setRounds([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    (supabase as any)
      .from("league_rounds")
      .select("*")
      .eq("season_id", seasonId)
      .eq("published", true)
      .order("round_number", { ascending: true })
      .then(({ data }: { data: LeagueRound[] | null }) => {
        if (cancelled) return;
        setRounds(data ?? []);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [seasonId]);

  return { rounds, loading };
}

export function useLeagueStandings(seasonId: string | null | undefined) {
  const [standings, setStandings] = useState<LeagueStanding[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!seasonId) {
      setStandings([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    (supabase as any)
      .from("league_standings")
      .select("*")
      .eq("season_id", seasonId)
      .eq("published", true)
      .order("position", { ascending: true })
      .then(({ data }: { data: LeagueStanding[] | null }) => {
        if (cancelled) return;
        setStandings(data ?? []);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [seasonId]);

  return { standings, loading };
}
