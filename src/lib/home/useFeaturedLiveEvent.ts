import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type FeaturedEvent = {
  id: string;
  slug: string;
  name: string;
  start_date: string;
  end_date: string | null;
  location: string | null;
  city: string | null;
  venue: string | null;
  description: string | null;
  cover_url: string | null;
  banner_url: string | null;
  logo_url: string | null;
  streaming_url: string | null;
  event_type: string | null;
  season: string | null;
  status: string;
  country_code: string;
};

export type EventTest = {
  id: string;
  event_id: string;
  race_name: string;
  category: string | null;
  gender: string | null;
  description: string | null;
  scheduled_time: string;
  status: "upcoming" | "live" | "finished";
  display_order: number;
};

export type EventResult = {
  id: string;
  race_id: string;
  position: number;
  athlete_name: string;
  club: string | null;
  country: string | null;
  time: string | null;
  gap: string | null;
  is_highlighted: boolean;
};

export function useFeaturedLiveEvent() {
  const [event, setEvent] = useState<FeaturedEvent | null>(null);
  const [tests, setTests] = useState<EventTest[]>([]);
  const [results, setResults] = useState<Record<string, EventResult[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const sb = supabase as any;
      const { data: ev } = await sb
        .from("events")
        .select("*")
        .eq("published", true)
        .eq("is_featured", true)
        .eq("live_center_enabled", true)
        .order("start_date", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (cancelled) return;
      if (!ev) {
        setEvent(null);
        setTests([]);
        setResults({});
        setLoading(false);
        return;
      }
      setEvent(ev as FeaturedEvent);

      const { data: rs } = await sb
        .from("races")
        .select("*")
        .eq("event_id", ev.id)
        .order("display_order", { ascending: true })
        .order("scheduled_time", { ascending: true });
      const testList = (rs ?? []) as EventTest[];
      if (cancelled) return;
      setTests(testList);

      const ids = testList.map((t) => t.id);
      if (ids.length) {
        const { data: rr } = await sb
          .from("results")
          .select("*")
          .in("race_id", ids)
          .order("position", { ascending: true });
        if (cancelled) return;
        const byRace: Record<string, EventResult[]> = {};
        ((rr ?? []) as EventResult[]).forEach((row) => {
          (byRace[row.race_id] ||= []).push(row);
        });
        setResults(byRace);
      } else {
        setResults({});
      }
      setLoading(false);
    };
    load();
    const ch = supabase
      .channel("featured-live-event")
      .on("postgres_changes", { event: "*", schema: "public", table: "events" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "races" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "results" }, load)
      .subscribe();
    return () => {
      cancelled = true;
      supabase.removeChannel(ch);
    };
  }, []);

  return { event, tests, results, loading };
}
