// Sistema de bloques de contenido para noticias.
// Las noticias antiguas (sin bloques) siguen funcionando con `content` + `gallery`.

export type BlockWidth = "normal" | "full";

export type NewsBlock =
  | { id: string; type: "text"; text: string }
  | { id: string; type: "heading"; text: string; level: 2 | 3 }
  | {
      id: string;
      type: "image";
      url: string;
      caption?: string;
      alt?: string;
      width?: BlockWidth;
    }
  | { id: string; type: "gallery"; images: string[]; caption?: string }
  | {
      id: string;
      type: "video";
      fileUrl?: string;
      embedUrl?: string;
      posterUrl?: string;
      caption?: string;
    }
  | { id: string; type: "quote"; text: string; author?: string }
  | { id: string; type: "divider" };

export type NewsBlockType = NewsBlock["type"];

export const BLOCK_LABELS: Record<NewsBlockType, string> = {
  text: "Texto enriquecido",
  heading: "Título / subtítulo",
  image: "Imagen",
  gallery: "Galería de imágenes",
  video: "Vídeo o embed",
  quote: "Cita destacada",
  divider: "Separador",
};

export function newBlockId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `b-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createBlock(type: NewsBlockType): NewsBlock {
  const id = newBlockId();
  switch (type) {
    case "text":
      return { id, type: "text", text: "" };
    case "heading":
      return { id, type: "heading", text: "", level: 2 };
    case "image":
      return { id, type: "image", url: "", caption: "", alt: "", width: "normal" };
    case "gallery":
      return { id, type: "gallery", images: [], caption: "" };
    case "video":
      return { id, type: "video", fileUrl: "", embedUrl: "", posterUrl: "", caption: "" };
    case "quote":
      return { id, type: "quote", text: "", author: "" };
    case "divider":
      return { id, type: "divider" };
  }
}

/** Parsea con tolerancia el jsonb almacenado en `news.content_blocks`. */
export function parseBlocks(raw: unknown): NewsBlock[] {
  if (!Array.isArray(raw)) return [];
  const out: NewsBlock[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const b = item as Record<string, unknown>;
    const type = b.type as NewsBlockType;
    if (!type || !(type in BLOCK_LABELS)) continue;
    const id = typeof b.id === "string" && b.id ? b.id : newBlockId();
    const str = (v: unknown) => (typeof v === "string" ? v : "");
    switch (type) {
      case "text":
        out.push({ id, type, text: str(b.text) });
        break;
      case "heading":
        out.push({ id, type, text: str(b.text), level: b.level === 3 ? 3 : 2 });
        break;
      case "image":
        out.push({
          id,
          type,
          url: str(b.url),
          caption: str(b.caption),
          alt: str(b.alt),
          width: b.width === "full" ? "full" : "normal",
        });
        break;
      case "gallery":
        out.push({
          id,
          type,
          images: Array.isArray(b.images) ? b.images.filter((x): x is string => typeof x === "string") : [],
          caption: str(b.caption),
        });
        break;
      case "video":
        out.push({
          id,
          type,
          fileUrl: str(b.fileUrl),
          embedUrl: str(b.embedUrl),
          posterUrl: str(b.posterUrl),
          caption: str(b.caption),
        });
        break;
      case "quote":
        out.push({ id, type, text: str(b.text), author: str(b.author) });
        break;
      case "divider":
        out.push({ id, type });
        break;
    }
  }
  return out;
}

/** Quita bloques vacíos antes de guardar. */
export function cleanBlocks(blocks: NewsBlock[]): NewsBlock[] {
  return blocks.filter((b) => {
    switch (b.type) {
      case "text":
      case "heading":
      case "quote":
        return b.text.trim().length > 0;
      case "image":
        return b.url.trim().length > 0;
      case "gallery":
        return b.images.length > 0;
      case "video":
        return Boolean(b.fileUrl?.trim() || b.embedUrl?.trim());
      case "divider":
        return true;
    }
  });
}

/** Texto plano de los bloques (SEO / recuento de palabras). */
export function blocksPlainText(blocks: NewsBlock[]): string {
  return blocks
    .map((b) => {
      switch (b.type) {
        case "text":
        case "heading":
        case "quote":
          return b.text;
        case "image":
          return b.caption ?? "";
        default:
          return "";
      }
    })
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

export type BlockIssue = {
  index: number;
  type: NewsBlockType;
  level: "error" | "warning";
  message: string;
};

/** Valida los bloques antes de publicar: campos obligatorios y recomendados. */
export function validateBlocks(blocks: NewsBlock[]): BlockIssue[] {
  const issues: BlockIssue[] = [];
  const push = (index: number, type: NewsBlockType, level: BlockIssue["level"], message: string) =>
    issues.push({ index, type, level, message });

  blocks.forEach((b, i) => {
    switch (b.type) {
      case "text":
        if (!b.text.trim()) push(i, b.type, "error", "El bloque de texto está vacío.");
        break;
      case "heading":
        if (!b.text.trim()) push(i, b.type, "error", "El título está vacío.");
        break;
      case "quote":
        if (!b.text.trim()) push(i, b.type, "error", "La cita está vacía.");
        break;
      case "image":
        if (!b.url.trim()) push(i, b.type, "error", "Falta la imagen (sube un archivo o pega una URL).");
        if (!b.alt?.trim()) push(i, b.type, "error", "Falta el texto alternativo (obligatorio para SEO y accesibilidad).");
        if (!b.caption?.trim()) push(i, b.type, "warning", "Sin pie de foto (recomendado).");
        break;
      case "gallery":
        if (b.images.length === 0) push(i, b.type, "error", "La galería no tiene imágenes.");
        if (!b.caption?.trim()) push(i, b.type, "warning", "Galería sin pie de foto (recomendado).");
        break;
      case "video":
        if (!b.fileUrl?.trim() && !b.embedUrl?.trim())
          push(i, b.type, "error", "Falta el vídeo: sube un archivo o añade una URL de embed.");
        if (!b.caption?.trim()) push(i, b.type, "warning", "Vídeo sin pie descriptivo (recomendado).");
        break;
      case "divider":
        break;
    }
  });

  return issues;
}
