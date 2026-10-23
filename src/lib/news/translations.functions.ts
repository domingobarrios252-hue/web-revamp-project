import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { sourceHash, sourceSnapshot, translationIsCurrent, type NewsTranslation } from "@/lib/news/translations";
import type { Json } from "@/integrations/supabase/types";
import { parseBlocks } from "@/lib/newsBlocks";

import { TRANSLATION_JSON_SCHEMA, TRANSLATION_LIMITS, aiTranslationSchema, extractTranslationFields, restoreTranslationFields, assertPreservedBlocks } from "@/lib/news/translationFields";

const SYSTEM_PROMPT = `You are a professional sports journalist translator for RollerZone, a speed skating news outlet. Translate the Spanish article into natural, publish-quality English.

Rules:
- NEVER translate proper nouns: skater names, club names, brand names, country names, official event names (e.g. "World Skate Games", "Campeonato de España"), or federation acronyms (RFEP, World Skate, FEP...).
- Keep quotes faithful to what was said; do not invent or soften statements.
- Speed skating glossary: "prueba de eliminación" → "elimination race", "prueba de puntos" → "points race", "vuelta lanzada" → "flying lap", "contrarreloj" → "time trial", "relevos" → "relay", "patín en línea" → "inline skate", "patinaje de velocidad" → "speed skating", "circuito" → "road circuit", "pista" → "track".
- fields: return every supplied key exactly once in the same order, translating only its value. Never change keys, names, numbers, times or records. Preserve HTML tags and links inside text.
- content: plain-text version of the body, paragraphs separated by blank lines.
- seo_title: max 60 characters. seo_description: max 155 characters.
- Return ONLY the JSON object matching the schema.`;

async function callTranslationModel(payload: Record<string, unknown>): Promise<z.infer<typeof aiTranslationSchema>> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("El servicio de traducción no está configurado.");

  const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
    method: "POST",
    headers: {
      "Lovable-API-Key": apiKey,
      "Content-Type": "application/json",
      "X-Lovable-AIG-SDK": "fetch",
    },
    body: JSON.stringify({
      model: "openai/gpt-6-astra",
      stream: true,
      store: false,
      reasoning: { effort: "low", summary: "auto" },
      include: ["reasoning.encrypted_content"],
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
    const payload = await res.json().catch(() => null) as { message?: unknown; error?: { message?: unknown } } | null;
    const message = typeof payload?.message === "string" ? payload.message : typeof payload?.error?.message === "string" ? payload.error.message : null;
    if (message) throw new Error(message);
    if (res.status === 402) throw new Error("Créditos de IA agotados. Recarga créditos en la configuración del espacio de trabajo.");
    if (res.status === 429) throw new Error("Demasiadas traducciones seguidas. Espera un minuto y vuelve a intentarlo.");
    if (res.status === 403) throw new Error("El servicio de traducción no está disponible para este espacio de trabajo.");
    throw new Error(`Error del servicio de traducción (${res.status}).`);
  }

  // Consume el stream SSE y extrae el texto final.
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let outputText = "";
  let terminalError: string | null = null;
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
            error?: { message?: string };
            response?: { error?: { message?: string }; status?: string; output?: { type?: string; content?: { type?: string; text?: string; refusal?: string }[] }[] };
          };
          if (["error", "response.failed", "response.incomplete", "response.refusal.delta", "response.refusal.done"].includes(evt.type ?? "")) {
            terminalError = evt.error?.message ?? evt.response?.error?.message ?? "La solicitud de traducción no se completó. No se guardó ningún texto.";
          } else if (evt.type === "response.output_text.delta" && typeof evt.delta === "string") {
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
    if (terminalError) {
      await reader.cancel();
      throw new Error(terminalError);
    }
  }

  if (!outputText) throw new Error("La traducción llegó vacía. No se guardó ningún texto.");
  return aiTranslationSchema.parse(JSON.parse(outputText));
}

export const getNewsTranslation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ newsId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await editableSource(context.supabase, context.userId, data.newsId, "read");
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

    const news = await editableSource(supabase, userId, data.newsId, "edit");
    // Reuse the reviewed or draft version before consuming rate limits or AI credits.
    const { data: existing, error: existingError } = await supabase
      .from("news_translations")
      .select("*")
      .eq("news_id", data.newsId)
      .eq("lang", "en")
      .maybeSingle();
    if (existingError) throw new Error(existingError.message);
    if (existing && translationIsCurrent(existing as NewsTranslation, news)) {
      return { translation: existing as NewsTranslation, reused: true };
    }
    // This RPC is intentionally service-role-only. Editorial authorization above
    // must succeed before loading the privileged client; ordinary reads/writes stay under RLS.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: siteOk, error: siteError } = await supabaseAdmin.rpc("check_rate_limit", {
      _action: "ai_translate_site", _identity: "global", _max_hits: TRANSLATION_LIMITS.site, _window_seconds: TRANSLATION_LIMITS.windowSeconds,
    });
    if (siteError || siteOk == null) throw new Error("No se pudo comprobar el límite de traducciones. Inténtalo de nuevo más tarde.");
    if (siteOk !== true) throw new Error("Límite de 30 intentos de traducción en las últimas 24 horas alcanzado.");
    const { data: newsOk, error: newsError } = await supabaseAdmin.rpc("check_rate_limit", {
      _action: "ai_translate_news", _identity: data.newsId, _max_hits: TRANSLATION_LIMITS.article, _window_seconds: TRANSLATION_LIMITS.windowSeconds,
    });
    if (newsError || newsOk == null) throw new Error("No se pudo comprobar el límite de esta noticia. Inténtalo de nuevo más tarde.");
    if (newsOk !== true) throw new Error("Esta noticia alcanzó el límite de 3 intentos de traducción en las últimas 24 horas.");

    const hash = sourceHash(news);
    const ai = await callTranslationModel({
      title: news.title,
      excerpt: news.excerpt ?? "",
      content: news.content ?? "",
      fields: extractTranslationFields(parseBlocks(news.content_blocks)),
    });

    const current = await editableSource(supabase, userId, data.newsId, "edit");
    if (JSON.stringify(sourceSnapshot(current)) !== JSON.stringify(sourceSnapshot(news))) throw new Error("El original cambió durante la traducción; vuelve a revisarlo.");
    const translatedBlocks = restoreTranslationFields(parseBlocks(news.content_blocks), ai.fields);

    // No rebajar una traducción aprobada: pasa a pendiente de revisión.
    const nextStatus = existing?.status === "approved" ? "pending" : "draft";

    const row = {
      news_id: data.newsId,
      lang: "en",
      title: ai.title,
      subtitle: ai.subtitle || null,
      excerpt: ai.excerpt || null,
      content: ai.content || null,
      content_blocks: translatedBlocks as unknown as Json,
      seo_title: ai.seo_title || null,
      seo_description: ai.seo_description || null,
      status: nextStatus,
      source_hash: hash,
      source_snapshot: sourceSnapshot(news) as unknown as Json,
      approved_by: null, approved_at: null,
      translated_at: new Date().toISOString(),
    };

    const { data: saved, error: upErr } = existing
      ? await supabase.from("news_translations").update(row).eq("id", existing.id).select("*").single()
      : await supabase.from("news_translations").insert(row).select("*").single();
    if (upErr) throw new Error(upErr.message);

    return { translation: saved as NewsTranslation, reused: false };
  });

const saveSchema = z.object({
  sourceHash: z.string(),
  newsId: z.string().uuid(),
  title: z.string().max(200),
  subtitle: z.string().max(300).nullable(),
  excerpt: z.string().max(500).nullable(),
  content: z.string().max(100000).nullable(),
  content_blocks: z.array(z.record(z.string(), z.unknown())).max(200).transform((v) => v as Json[]),
  seo_title: z.string().max(60).nullable(),
  seo_description: z.string().max(155).nullable(),
});

export const saveNewsTranslation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => saveSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { newsId, sourceHash: reviewedHash, ...fields } = data;
    const news = await editableSource(context.supabase, context.userId, newsId, "edit");
    if (sourceHash(news) !== reviewedHash) throw new Error("El original cambió; guarda el original y revisa la traducción antes de continuar.");
    assertPreservedBlocks(parseBlocks(news.content_blocks), parseBlocks(fields.content_blocks));
    const { data: existing } = await context.supabase
      .from("news_translations")
      .select("id, status")
      .eq("news_id", newsId)
      .eq("lang", "en")
      .maybeSingle();

    const row = { news_id: newsId, lang: "en", ...fields, source_hash: reviewedHash, source_snapshot: sourceSnapshot(news) as unknown as Json };
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
    const { data: active, error: activeError } = await context.supabase.rpc("account_is_active", { _user_id: context.userId });
    const { data: admin, error: roleError } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (activeError || roleError || active !== true || admin !== true) throw new Error("Solo un administrador activo puede aprobar o retirar traducciones.");
    if (data.approve) {
      const { data: news, error: newsError } = await context.supabase.from("news").select("title,excerpt,content,content_blocks").eq("id", data.newsId).single();
      if (newsError || !news) throw new Error("No se puede comprobar el original de esta noticia.");
      const { data: tr, error } = await context.supabase.from("news_translations").select("*").eq("news_id", data.newsId).eq("lang", "en").single();
      if (error || !tr || !translationIsCurrent(tr as NewsTranslation, news)) throw new Error("La traducción está desactualizada; revísala y guárdala primero.");
    }
    // La base de datos repite la comprobación para solicitudes directas.
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

async function editableSource(client: import("@supabase/supabase-js").SupabaseClient<import("@/integrations/supabase/types").Database>, userId: string, newsId: string, action: "read" | "edit") {
  const { data: active, error: activeError } = await client.rpc("account_is_active", { _user_id: userId });
  if (activeError || active !== true) throw new Error("La cuenta no está activa.");
  const { data: news, error } = await client.from("news").select("id,title,excerpt,content,content_blocks,created_by,country_code,section_id").eq("id", newsId).single();
  if (error || !news) throw new Error("No tienes acceso a esta noticia.");
  const { data: allowed, error: permissionError } = await client.rpc("can_access_own_editorial", {
    _owner: news.created_by ?? "00000000-0000-0000-0000-000000000000", _country: news.country_code ?? "", _section_id: news.section_id ?? "00000000-0000-0000-0000-000000000000", _kind: "noticias", _action: action,
  });
  if (permissionError || allowed !== true) throw new Error("No tienes permiso para gestionar la traducción de esta noticia.");
  return news;
}
