// Safely serialize JSON-LD for embedding in <script> tags.
// JSON.stringify does not escape "</", which can allow a stored value
// containing "</script>" to break out of the script tag (stored XSS).
export function toJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
