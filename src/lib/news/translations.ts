// Utilidades compartidas para las versiones en inglés de las noticias.
import { blocksPlainText, parseBlocks, type NewsBlock } from "@/lib/newsBlocks";
import type { Json } from "@/integrations/supabase/types";

export type TranslationStatus = "draft" | "pending" | "approved";

export type NewsTranslation = {
  id: string;
  news_id: string;
  lang: string;
  title: string;
  subtitle: string | null;
  excerpt: string | null;
  content: string | null;
  content_blocks: Json;
  seo_title: string | null;
  seo_description: string | null;
  status: TranslationStatus;
  source_hash: string | null;
  source_snapshot?: Json | null;
  translated_at: string | null;
  approved_by: string | null;
  approved_at: string | null;
  updated_at: string;
};

/** Huella estable del texto original: cambia cuando la traducción queda desactualizada. */
export function sourceHash(input: {
  title: string;
  excerpt?: string | null;
  content?: string | null;
  content_blocks?: unknown;
}): string {
  const blocksText = blocksPlainText(parseBlocks(input.content_blocks));
  const raw = [input.title, input.excerpt ?? "", input.content ?? "", blocksText].join("");
  // FNV-1a 32 bits: síncrono, sin crypto (seguro en workerd).
  let h = 0x811c9dc5;
  for (let i = 0; i < raw.length; i++) {
    h ^= raw.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16);
}

export function translationBlocks(t: NewsTranslation | null | undefined): NewsBlock[] {
  return parseBlocks(t?.content_blocks);
}

export function sourceSnapshot(input: { title: string; excerpt?: string | null; content?: string | null; content_blocks?: unknown }) {
  return { title: input.title, excerpt: input.excerpt ?? null, content: input.content ?? null, content_blocks: input.content_blocks ?? [] };
}
function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.entries(value).sort(([a],[b]) => a.localeCompare(b)).map(([k,v]) => `${JSON.stringify(k)}:${stable(v)}`).join(",")}}`;
  return JSON.stringify(value) ?? "null";
}
export function translationIsCurrent(t: NewsTranslation, source: Parameters<typeof sourceSnapshot>[0]) {
  return Boolean(t.source_hash) && (t.source_snapshot ? stable(t.source_snapshot) === stable(sourceSnapshot(source)) : t.source_hash === sourceHash(source));
}
