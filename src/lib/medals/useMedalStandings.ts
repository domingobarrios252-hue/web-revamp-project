import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Discipline = "pista" | "circuito" | "total";

export type MedalRow = {
  id: string;
  country_name: string;
  country_code: string | null;
  flag_url: string | null;
  gold: number;
  silver: number;
  bronze: number;
  discipline: "pista" | "circuito";
};

export type AggregatedMedalRow = {
  id: string;
  country_name: string;
  country_code: string | null;
  flag_url: string | null;
  gold: number;
  silver: number;
  bronze: number;
};

function sortByMedals(a: AggregatedMedalRow, b: AggregatedMedalRow) {
  if (b.gold !== a.gold) return b.gold - a.gold;
  if (b.silver !== a.silver) return b.silver - a.silver;
  if (b.bronze !== a.bronze) return b.bronze - a.bronze;
  return a.country_name.localeCompare(b.country_name);
}

export function aggregateByDiscipline(
  rows: MedalRow[],
  discipline: Discipline,
): AggregatedMedalRow[] {
  if (discipline === "pista" || discipline === "circuito") {
    return rows
      .filter((r) => r.discipline === discipline)
      .map((r) => ({
        id: r.id,
        country_name: r.country_name,
        country_code: r.country_code,
        flag_url: r.flag_url,
        gold: r.gold,
        silver: r.silver,
        bronze: r.bronze,
      }))
      .sort(sortByMedals);
  }
  // total: aggregate by country_code || country_name
  const map = new Map<string, AggregatedMedalRow>();
  for (const r of rows) {
    const key = (r.country_code ?? r.country_name).trim().toUpperCase();
    const existing = map.get(key);
    if (existing) {
      existing.gold += r.gold;
      existing.silver += r.silver;
      existing.bronze += r.bronze;
      if (!existing.flag_url && r.flag_url) existing.flag_url = r.flag_url;
    } else {
      map.set(key, {
        id: key,
        country_name: r.country_name,
        country_code: r.country_code,
        flag_url: r.flag_url,
        gold: r.gold,
        silver: r.silver,
        bronze: r.bronze,
      });
    }
  }
  return [...map.values()].sort(sortByMedals);
}

export function useMedalStandings(publishedOnly = true) {
  const [rows, setRows] = useState<MedalRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let q = supabase
        .from("medal_standings")
        .select("id,country_name,country_code,flag_url,gold,silver,bronze,discipline");
      if (publishedOnly) q = q.eq("published", true);
      const { data } = await q;
      if (cancelled) return;
      setRows((data as MedalRow[]) ?? []);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [publishedOnly]);

  return { rows, loading };
}
