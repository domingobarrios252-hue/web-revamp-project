// Helpers to extract a YouTube video ID from any common URL form
export function extractYouTubeId(input: string | null | undefined): string | null {
  if (!input) return null;
  const url = input.trim();
  if (!url) return null;

  // Already a bare ID (11 chars, alphanumeric/_/-)
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) return url;

  try {
    const u = new URL(url);
    // youtu.be/<id>
    if (u.hostname.includes("youtu.be")) {
      const id = u.pathname.split("/").filter(Boolean)[0];
      return id && /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
    }
    // youtube.com/watch?v=<id>
    const v = u.searchParams.get("v");
    if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) return v;
    // youtube.com/embed/<id>  or  /live/<id>  or  /shorts/<id>
    const segments = u.pathname.split("/").filter(Boolean);
    const idx = segments.findIndex((s) => ["embed", "live", "shorts", "v"].includes(s));
    if (idx !== -1 && segments[idx + 1] && /^[a-zA-Z0-9_-]{11}$/.test(segments[idx + 1])) {
      return segments[idx + 1];
    }
  } catch {
    // not a URL
  }
  return null;
}

export function youTubeEmbedUrl(input: string | null | undefined, opts?: { autoplay?: boolean }): string | null {
  const id = extractYouTubeId(input);
  if (!id) return null;
  const params = new URLSearchParams();
  if (opts?.autoplay) params.set("autoplay", "1");
  params.set("rel", "0");
  const qs = params.toString();
  return `https://www.youtube.com/embed/${id}${qs ? `?${qs}` : ""}`;
}

export function youTubeThumbnail(input: string | null | undefined): string | null {
  const id = extractYouTubeId(input);
  if (!id) return null;
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}
