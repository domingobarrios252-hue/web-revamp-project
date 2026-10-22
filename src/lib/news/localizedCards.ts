import { supabase } from "@/integrations/supabase/client";

/** One batch read; approved drafts are never used. Source invalidation is also enforced by database triggers. */
export async function localizeNewsCards<T extends { id: string; title: string; excerpt: string | null }>(rows: T[], lang: "es" | "en"): Promise<T[]> {
  if (lang !== "en" || !rows.length) return rows;
  const { data, error } = await supabase.from("news_translations").select("news_id,title,excerpt,source_hash").eq("lang", "en").eq("status", "approved").in("news_id", rows.map(r => r.id));
  if (error) return rows;
  const translations = new Map((data ?? []).filter(t => t.source_hash).map(t => [t.news_id, t]));
  return rows.map(row => {
    const tr = translations.get(row.id);
    return tr ? { ...row, title: tr.title, excerpt: tr.excerpt } : row;
  });
}