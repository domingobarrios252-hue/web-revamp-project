import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { sourceHash, type NewsTranslation } from "@/lib/news/translations";
import type { Json } from "@/integrations/supabase/types";
import { parseBlocks, blocksPlainText } from "@/lib/newsBlocks";

const TRANSLATION_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    title: { type: "string" },
    subtitle: { type: "string" },
    excerpt: { type: "string" },
    content: { type: "string" },
    content_blocks: { type: "array", items: { type: "object" } },
    seo_title: { type: "string" },
    seo_description: { type: "string" },
  },
  required: ["title", "subtitle", "excerpt", "content", "content_blocks", "seo_title", "seo_description"],
} as const;

const SYSTEM_PROMPT = `You are a professional sports journalist translator for RollerZone, a speed skating news outlet. Translate the Spanish article into natural, publish-quality English.

Rules:
- NEVER translate proper nouns: skater names, club names, brand names, country names, official event names (e.g. "World Skate Games", "Campeonato de España"), or federation acronyms (RFEP, World Skate, FEP...).
- Keep quotes faithful to what was said; do not invent or soften statements.
- Speed skating glossary: "prueba de eliminación" → "elimination race", "prueba de puntos" → "points race", "vuelta lanzada" → "flying lap", "contrarreloj" → "time trial", "relevos" → "relay", "patín en línea" → "inline skate", "patinaje de velocidad" → "speed skating", "circuito" → "road circuit", "pista" → "track".
- content_blocks: keep the SAME number of blocks, same ids, same types, same urls/images, same order. Translate only human text fields: text, caption, alt, author, label, and list items. Never translate URLs or ids.
- content: plain-text version of the body, paragraphs separated by blank lines.
- seo_title: max 60 characters. seo_description: max 155 characters.
- Return ONLY the JSON object matching the schema.`;

type AiTranslation = {
  title: string;
  subtitle: string;
  excerpt: string;
  content: string;
  content_blocks: Json[];
  seo_title: string;
  seo_description: string;
};

async function callTranslationModel(payload: Record<string, unknown>): Promise<AiTranslation> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("El servicio de traducción no está configurado.");

  const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "X-Lovable-AIG-SDK": "fetch",
    },
    body: JSON.stringify({
      model: "openai/gpt-6-astra",
      stream: true,
      store: false,
      reasoning: { effort: "low" },
      instructions: SYSTEM_PROMPT,
      input: JSON.stringify(payload),
      text: {
        format: {
          type: "json_schema",
          name: "news_translation",
          strict: true,
          schema: TRANSLATION_JSON_SCHEMA,
        },
      },
    }),
  });

  if (!res.ok || !res.body) {
    const msg = await res.text().catch(() => "");
    if (res.status === 402) throw new Error("Créditos de IA agotados. Recarga créditos en la configuración del espacio de trabajo.");
    if (res.status === 429) throw new Error("Demasiadas traducciones seguidas. Espera un minuto y vuelve a intentarlo.");
    if (res.status === 403) throw new Error("El servicio de traducción no está disponible para este espacio de trabajo.");
    throw new Error(`Error del servicio de traducción (${res.status}). ${msg.slice(0, 200)}`);
  }

  // Consume el stream SSE y extrae el texto final.
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let outputText = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const frames = buffer.split("\n\n");
    buffer = frames.pop() ?? "";
    for (const frame of frames) {
      const dataLines = frame
        .split("\n")
        .filter((l) => l.startsWith("data:"))
        .map((l) => l.slice(5).trim());
      for (const dl of dataLines) {
        if (!dl || dl === "[DONE]") continue;
        try {
          const evt = JSON.parse(dl) as {
            type?: string;
            delta?: string;
            response?: { output?: { type?: string; content?: { type?: string; text?: string }[] }[] };
          };
          if (evt.type === "response.output_text.delta" && typeof evt.delta === "string") {
            outputText += evt.delta;
          } else if (evt.type === "response.completed" && !outputText) {
            for (const item of evt.response?.output ?? []) {
              if (item.type !== "message") continue;
              for (const c of item.content ?? []) {
                if (c.type === "output_text" && c.text) outputText += c.text;
              }
            }
          }
        } catch {
          /* frame parcial: se ignora */
        }
      }
    }
  }

  if (!outputText) throw new Error("La traducción llegó vacía. Inténtalo de nuevo.");
  return JSON.parse(outputText) as AiTranslation;
}

export const getNewsTranslation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ newsId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("news_translations")
      .select("*")
      .eq("news_id", data.newsId)
      .eq("lang", "en")
      .maybeSingle();
    if (error) throw new Error(error.message);
    return { translation: (row as NewsTranslation | null) ?? null };
  });

export const translateNews = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ newsId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Límite de uso: 30 traducciones/día por sitio y 3/día por noticia.
    const { data: siteOk } = await supabase.rpc("check_rate_limit", {
      _action: "ai_translate_site",
      _identity: "global",
      _max_hits: 30,
      _window_seconds: 86400,
    });
    if (siteOk === false) {
      throw new Error("Límite diario de traducciones alcanzado (30). Inténtalo mañana.");
    }
    const { data: newsOk } = await supabase.rpc("check_rate_limit", {
      _action: "ai_translate_news",
      _identity: data.newsId,
      _max_hits: 3,
      _window_seconds: 86400,
    });
    if (newsOk === false) {
      throw new Error("Esta noticia ya se tradujo 3 veces hoy. Edita la traducción a mano o inténtalo mañana.");
    }

    // La política de lectura de news ya limita al editor a sus noticias.
    const { data: news, error } = await supabase
      .from("news")
      .select("id, title, excerpt, content, content_blocks, created_by, country_code")
      .eq("id", data.newsId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!news) throw new Error("No tienes acceso a esta noticia.");

    const hash = sourceHash(news);
    const ai = await callTranslationModel({
      title: news.title,
      excerpt: news.excerpt ?? "",
      content: news.content ?? "",
      content_blocks: parseBlocks(news.content_blocks),
    });

    // No rebajar una traducción aprobada: pasa a pendiente de revisión.
    const { data: existing } = await supabase
      .from("news_translations")
      .select("id, status")
      .eq("news_id", data.newsId)
      .eq("lang", "en")
      .maybeSingle();
    const nextStatus = existing?.status === "approved" ? "pending" : "draft";

    const row = {
      news_id: data.newsId,
      lang: "en",
      title: ai.title,
      subtitle: ai.subtitle || null,
      excerpt: ai.excerpt || null,
      content: ai.content || null,
      content_blocks: ai.content_blocks as Json,
      seo_title: ai.seo_title || null,
      seo_description: ai.seo_description || null,
      status: nextStatus,
      source_hash: hash,
      translated_at: new Date().toISOString(),
    };

    const { data: saved, error: upErr } = existing
      ? await supabase.from("news_translations").update(row).eq("id", existing.id).select("*").single()
      : await supabase.from("news_translations").insert(row).select("*").single();
    if (upErr) throw new Error(upErr.message);

    return { translation: saved as NewsTranslation };
  });

const saveSchema = z.object({
  newsId: z.string().uuid(),
  title: z.string().max(200),
  subtitle: z.string().max(300).nullable(),
  excerpt: z.string().max(500).nullable(),
  content: z.string().max(100000).nullable(),
  content_blocks: z.array(z.record(z.string(), z.unknown())).max(200).transform((v) => v as Json[]),
  seo_title: z.string().max(120).nullable(),
  seo_description: z.string().max(300).nullable(),
});

export const saveNewsTranslation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => saveSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { newsId, ...fields } = data;
    const { data: existing } = await context.supabase
      .from("news_translations")
      .select("id, status")
      .eq("news_id", newsId)
      .eq("lang", "en")
      .maybeSingle();

    const row = { news_id: newsId, lang: "en", ...fields };
    const { data: saved, error } = existing
      ? await context.supabase.from("news_translations").update(row).eq("id", existing.id).select("*").single()
      : await context.supabase.from("news_translations").insert(row).select("*").single();
    if (error) throw new Error(error.message);
    return { translation: saved as NewsTranslation };
  });

export const approveNewsTranslation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ newsId: z.string().uuid(), approve: z.boolean() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    // El trigger news_translations_guard_approval exige rol admin en el servidor.
    const { data: saved, error } = await context.supabase
      .from("news_translations")
      .update(
        data.approve
          ? { status: "approved", approved_by: context.userId, approved_at: new Date().toISOString() }
          : { status: "pending", approved_by: null, approved_at: null },
      )
      .eq("news_id", data.newsId)
      .eq("lang", "en")
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return { translation: saved as NewsTranslation };
  });
