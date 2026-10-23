// Pruebas unitarias del sistema de noticias bilingüe (sin red ni base de datos).
import { describe, expect, test } from "bun:test";
import { sourceHash, sourceSnapshot, translationIsCurrent, translationBlocks, type NewsTranslation } from "@/lib/news/translations";
import { TRANSLATION_LIMITS, extractTranslationFields, restoreTranslationFields, assertPreservedBlocks } from "@/lib/news/translationFields";
import { localizedPath } from "@/lib/i18n/paths";
import { parseBlocks } from "@/lib/newsBlocks";

describe("sourceHash", () => {
  const base = {
    title: "España gana el oro",
    excerpt: "Crónica de la final",
    content: "Texto de la noticia",
    content_blocks: [{ id: "a", type: "text", text: "Texto de la noticia" }],
  };

  test("es estable para el mismo contenido", () => {
    expect(sourceHash(base)).toBe(sourceHash({ ...base }));
  });

  test("cambia al modificar el título", () => {
    expect(sourceHash({ ...base, title: "Otro titular" })).not.toBe(sourceHash(base));
  });

  test("cambia al modificar los bloques", () => {
    expect(
      sourceHash({ ...base, content_blocks: [{ id: "a", type: "text", text: "Otro texto" }] }),
    ).not.toBe(sourceHash(base));
  });

  test("tolera campos vacíos", () => {
    expect(typeof sourceHash({ title: "Solo título" })).toBe("string");
  });
});

test("site translation limit is 30 per day", () => {
  expect(TRANSLATION_LIMITS.site).toBe(30);
  expect(TRANSLATION_LIMITS.windowSeconds).toBe(86400);
});
test("article translation limit is 3 per day", () => {
  expect(TRANSLATION_LIMITS.article).toBe(3);
});
test("source media changes invalidate reviewed translations", () => {
  const source = { title: "Marine Lefeuvre", content_blocks: [{ id: "img", type: "image", url: "/original.jpg", caption: "Marine" }] };
  const tr = { source_hash: sourceHash(source), source_snapshot: sourceSnapshot(source) } as unknown as NewsTranslation;
  expect(translationIsCurrent(tr, source)).toBe(true);
  expect(translationIsCurrent(tr, { ...source, content_blocks: [{ ...source.content_blocks[0], url: "/changed.jpg" }] })).toBe(false);
});
test("unchanged source reuses translations regardless of editorial approval", () => {
  const source = { title: "Chevi Guzmán", content: "100 metros, 9.800", content_blocks: [] };
  for (const status of ["draft", "pending", "approved"] as const) {
    const tr = { status, source_hash: sourceHash(source), source_snapshot: sourceSnapshot(source) } as NewsTranslation;
    expect(translationIsCurrent(tr, { ...source })).toBe(true);
    expect(translationIsCurrent(tr, { ...source, content: "100 metros, 9.700" })).toBe(false);
  }
});
test("translation keeps the original media and block IDs", () => {
  const blocks = parseBlocks([{ id: "a", type: "text", text: "España" }, { id: "b", type: "image", url: "/photo.jpg", caption: "Final" }]);
  const translated = restoreTranslationFields(blocks, extractTranslationFields(blocks).map(f => ({ ...f, value: "English" })));
  expect(translated[1]).toMatchObject({ id: "b", url: "/photo.jpg" });
  expect(() => assertPreservedBlocks(blocks, translated)).not.toThrow();
  expect(() => restoreTranslationFields(blocks, [])).toThrow();
});
test("ES EN switching retains the result ID and article slug", () => {
  expect(localizedPath("/resultados/asu26", "en")).toBe("/en/results/asu26");
  expect(localizedPath("/en/results/asu26", "es")).toBe("/resultados/asu26");
  expect(localizedPath("/eventos/asu26", "en")).toBe("/en/events/asu26");
  expect(localizedPath("/en/events/asu26", "es")).toBe("/eventos/asu26");
  expect(localizedPath("/noticias/articulo/marine-lefeuvre", "en")).toBe("/en/news/marine-lefeuvre");
});

describe("translationBlocks", () => {
  test("parsea los bloques traducidos", () => {
    const blocks = translationBlocks({
      content_blocks: [{ id: "x", type: "heading", text: "Hello", level: 2 }],
    } as never);
    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toMatchObject({ type: "heading", text: "Hello" });
  });

  test("devuelve vacío sin traducción", () => {
    expect(translationBlocks(null)).toEqual([]);
    expect(translationBlocks(undefined)).toEqual([]);
    expect(parseBlocks(null)).toEqual([]);
  });
});
