// Pruebas unitarias del sistema de noticias bilingüe (sin red ni base de datos).
import { describe, expect, test } from "bun:test";
import { sourceHash, translationBlocks } from "@/lib/news/translations";
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
