import { z } from "zod";
import type { NewsBlock } from "@/lib/newsBlocks";

export const TRANSLATION_LIMITS = { site: 30, article: 3, windowSeconds: 86400 } as const;
const textKeys = ["text", "caption", "alt", "author", "label"] as const;
export function extractTranslationFields(blocks: NewsBlock[]) {
  return blocks.flatMap((block, index) => {
    const fields: { key: string; value: string }[] = [];
    for (const key of textKeys) {
      const value = (block as unknown as Record<string, unknown>)[key];
      if (typeof value === "string") fields.push({ key: `${index}.${key}`, value });
    }
    if (block.type === "list") block.items.forEach((value, i) => fields.push({ key: `${index}.items.${i}`, value }));
    return fields;
  });
}
export function restoreTranslationFields(blocks: NewsBlock[], fields: { key: string; value: string }[]): NewsBlock[] {
  const expected = extractTranslationFields(blocks);
  if (fields.length !== expected.length || new Set(fields.map(f => f.key)).size !== expected.length || expected.some(f => !fields.some(t => t.key === f.key))) {
    throw new Error("La traducción no conserva todos los campos del artículo.");
  }
  const values = new Map(fields.map(f => [f.key, f.value]));
  return blocks.map((block, index) => {
    const copy = structuredClone(block);
    for (const key of textKeys) {
      const value = values.get(`${index}.${key}`);
      if (value !== undefined) (copy as unknown as Record<string, unknown>)[key] = value;
    }
    if (copy.type === "list") copy.items = copy.items.map((item, i) => values.get(`${index}.items.${i}`) ?? item);
    return copy;
  });
}
export function assertPreservedBlocks(source: NewsBlock[], translated: NewsBlock[]) {
  // Rebuild from source and translated text only: media, IDs, order and types are immutable.
  const rebuilt = restoreTranslationFields(source, extractTranslationFields(translated));
  if (JSON.stringify(rebuilt) !== JSON.stringify(translated)) throw new Error("No cambies enlaces, archivos ni la estructura de los bloques traducidos.");
}
export const aiTranslationSchema = z.object({
  title: z.string().min(1).max(200), subtitle: z.string().max(300), excerpt: z.string().max(500),
  content: z.string().max(100000), seo_title: z.string().max(60), seo_description: z.string().max(155),
  fields: z.array(z.object({ key: z.string(), value: z.string() }).strict()).max(5000),
}).strict();
export const TRANSLATION_JSON_SCHEMA = {
  type: "object", additionalProperties: false,
  properties: {
    title: { type: "string" }, subtitle: { type: "string" }, excerpt: { type: "string" }, content: { type: "string" },
    seo_title: { type: "string" }, seo_description: { type: "string" },
    fields: { type: "array", items: { type: "object", additionalProperties: false,
      properties: { key: { type: "string" }, value: { type: "string" } }, required: ["key", "value"] } },
  },
  required: ["title", "subtitle", "excerpt", "content", "seo_title", "seo_description", "fields"],
} as const;