import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type LiveEvent = {
  id: string;
  slug: string;
  name: string;
  status: string;
  start_date: string;
  end_date: string | null;
  location: string | null;
  cover_url: string | null;
  description: string | null;
  country_code: string;
};

export type TimelineEntry = {
  id: string;
  event_id: string;
  entry_type: string;
  message: string;
  occurred_at: string;
  published: boolean;
};

export type LiveResultRow = {
  id: string;
  event_name: string;
  category: string | null;
  race: string | null;
  position: number;
  athlete_name: string;
  club: string | null;
  country: string | null;
  race_time: string | null;
  gap: string | null;
  is_highlighted: boolean;
};

export function useActiveLiveEvent(country: string) {
  const [event, setEvent] = useState<LiveEvent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const { data } = await supabase
        .from("events")
        .select("*")
        .eq("country_code", country)
        .eq("published", true)
        .eq("status", "live")
        .order("start_date", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (cancelled) return;
      setEvent((data as LiveEvent) ?? null);
      setLoading(false);
    };
    load();
    const ch = supabase
      .channel(`live-event-${country}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "events" }, load)
      .subscribe();
    return () => {
      cancelled = true;
      supabase.removeChannel(ch);
    };
  }, [country]);

  return { event, loading };
}

export function useLiveTimeline(eventId: string | null | undefined) {
  const [entries, setEntries] = useState<TimelineEntry[]>([]);

  useEffect(() => {
    if (!eventId) {
      setEntries([]);
      return;
    }
    let cancelled = false;
    const load = async () => {
      const { data } = await supabase
        .from("live_timeline")
        .select("*")
        .eq("event_id", eventId)
        .eq("published", true)
        .order("occurred_at", { ascending: false });
      if (cancelled) return;
      setEntries((data as TimelineEntry[]) ?? []);
    };
    load();
    const ch = supabase
      .channel(`timeline-${eventId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "live_timeline", filter: `event_id=eq.${eventId}` },
        load,
      )
      .subscribe();
    return () => {
      cancelled = true;
      supabase.removeChannel(ch);
    };
  }, [eventId]);

  return entries;
}

export function useLiveResults(eventSlug: string | null | undefined) {
  const [rows, setRows] = useState<LiveResultRow[]>([]);

  useEffect(() => {
    if (!eventSlug) {
      setRows([]);
      return;
    }
    let cancelled = false;
    const load = async () => {
      const { data } = await supabase
        .from("live_results")
        .select("*")
        .eq("event_slug", eventSlug)
        .eq("published", true)
        .order("race", { ascending: true })
        .order("position", { ascending: true });
      if (cancelled) return;
      setRows((data as LiveResultRow[]) ?? []);
    };
    load();
    const ch = supabase
      .channel(`live-results-${eventSlug}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "live_results" }, load)
      .subscribe();
    return () => {
      cancelled = true;
      supabase.removeChannel(ch);
    };
  }, [eventSlug]);

  return rows;
}
