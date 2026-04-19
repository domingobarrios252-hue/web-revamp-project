// Tiny, dependency-free markdown renderer for legal pages.
// Supports: h1-h3, paragraphs, bold, italic, links, lists (ul/ol), hr, line breaks.
// Escapes HTML to prevent XSS — content comes from trusted admins, but we sanitize anyway.

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function inline(text: string): string {
  let out = escapeHtml(text);
  // links [text](url)
  out = out.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+|\/[^\s)]*|mailto:[^\s)]+)\)/g,
    '<a href="$2" class="text-gold underline hover:text-gold-dark" target="_blank" rel="noopener noreferrer">$1</a>',
  );
  // bold **text**
  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  // italic *text*
  out = out.replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>");
  return out;
}

export function renderMarkdown(md: string): string {
  if (!md || !md.trim()) return "";
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const blocks: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) {
      i++;
      continue;
    }

    // Headings
    const h = /^(#{1,3})\s+(.*)$/.exec(line);
    if (h) {
      const lvl = h[1].length;
      const cls =
        lvl === 1
          ? "font-display text-3xl tracking-widest text-gold mt-8 mb-4"
          : lvl === 2
            ? "font-display text-2xl tracking-widest text-foreground mt-6 mb-3"
            : "font-ui text-lg font-semibold text-foreground mt-4 mb-2";
      blocks.push(`<h${lvl} class="${cls}">${inline(h[2])}</h${lvl}>`);
      i++;
      continue;
    }

    // HR
    if (/^---+$/.test(line.trim())) {
      blocks.push('<hr class="my-6 border-border" />');
      i++;
      continue;
    }

    // Unordered list
    if (/^\s*[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        items.push(`<li>${inline(lines[i].replace(/^\s*[-*]\s+/, ""))}</li>`);
        i++;
      }
      blocks.push(
        `<ul class="my-3 ml-6 list-disc space-y-1.5 text-foreground/85">${items.join("")}</ul>`,
      );
      continue;
    }

    // Ordered list
    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push(`<li>${inline(lines[i].replace(/^\s*\d+\.\s+/, ""))}</li>`);
        i++;
      }
      blocks.push(
        `<ol class="my-3 ml-6 list-decimal space-y-1.5 text-foreground/85">${items.join("")}</ol>`,
      );
      continue;
    }

    // Paragraph (collect consecutive non-empty, non-special lines)
    const para: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^(#{1,3})\s+/.test(lines[i]) &&
      !/^---+$/.test(lines[i].trim()) &&
      !/^\s*[-*]\s+/.test(lines[i]) &&
      !/^\s*\d+\.\s+/.test(lines[i])
    ) {
      para.push(lines[i]);
      i++;
    }
    if (para.length > 0) {
      blocks.push(
        `<p class="my-3 leading-relaxed text-foreground/85">${inline(para.join(" "))}</p>`,
      );
    }
  }

  return blocks.join("\n");
}
