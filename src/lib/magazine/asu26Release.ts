export const ASU26_RELEASE_AT = "2026-11-15T16:15:00Z";
export type Asu26Edition = "es" | "en";
export const ASU26_RELEASE_HEADERS = { "Cache-Control": "no-store, max-age=0", "CDN-Cache-Control": "no-store" };

export function heyzineUrl(value: string | undefined): string | null {
  if (!value?.trim()) return null;
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:" || !["heyzine.com", "www.heyzine.com", "rollerzone.aflip.in"].includes(url.hostname) || url.username || url.password || url.port) return null;
    if (url.pathname === "/") return null;
    return url.href;
  } catch { return null; }
}

export function asu26ReleaseState(now: number, links: Record<Asu26Edition, string | undefined>) {
  const released = now >= Date.parse(ASU26_RELEASE_AT);
  return {
    serverNow: now,
    releaseAt: ASU26_RELEASE_AT,
    released,
    editions: { es: released && heyzineUrl(links.es) !== null, en: released && heyzineUrl(links.en) !== null },
  };
}

export function asu26EditionResponse(edition: string, now: number, links: Record<Asu26Edition, string | undefined>): Response {
  if (edition !== "es" && edition !== "en") return new Response("Not found", { status: 404, headers: ASU26_RELEASE_HEADERS });
  if (now < Date.parse(ASU26_RELEASE_AT)) return new Response(edition === "es" ? "Edición todavía no disponible." : "Edition not yet available.", { status: 403, headers: ASU26_RELEASE_HEADERS });
  const url = heyzineUrl(links[edition]);
  if (!url) return new Response(edition === "es" ? "Edición todavía no disponible." : "Edition not yet available.", { status: 503, headers: ASU26_RELEASE_HEADERS });
  return new Response(null, { status: 302, headers: { ...ASU26_RELEASE_HEADERS, Location: url } });
}