// Unified video embed helpers: YouTube, Facebook (Video + Live), Twitch.
// Keep pure — no window access at module scope; twitch parent is resolved lazily.
import { extractYouTubeId, youTubeEmbedUrl, youTubeThumbnail } from "./youtube";

export type VideoPlatform = "youtube" | "facebook" | "twitch" | "iframe" | "external";

export function detectVideoPlatform(input: string | null | undefined): VideoPlatform | null {
  if (!input) return null;
  const raw = input.trim();
  if (!raw) return null;
  if (extractYouTubeId(raw)) return "youtube";
  // Raw iframe HTML pasted
  if (/<iframe[\s\S]*src=/i.test(raw)) return "iframe";
  try {
    const u = new URL(raw);
    const h = u.hostname.replace(/^www\./, "");
    if (h === "facebook.com" || h.endsWith(".facebook.com") || h === "fb.watch" || h === "fb.com") {
      return "facebook";
    }
    if (h === "twitch.tv" || h.endsWith(".twitch.tv")) return "twitch";
    if (u.pathname.includes("/embed")) return "iframe";
    return "external";
  } catch {
    return null;
  }
}

export function isFacebookVideoUrl(input: string | null | undefined): boolean {
  return detectVideoPlatform(input) === "facebook";
}

export function facebookEmbedUrl(
  input: string | null | undefined,
  opts?: { autoplay?: boolean; width?: number },
): string | null {
  if (!input) return null;
  const raw = input.trim();
  if (!raw) return null;
  try {
    // Validate it's a URL and looks like facebook
    const u = new URL(raw);
    const h = u.hostname.replace(/^www\./, "");
    const isFb =
      h === "facebook.com" || h.endsWith(".facebook.com") || h === "fb.watch" || h === "fb.com";
    if (!isFb) return null;
    const params = new URLSearchParams();
    params.set("href", raw);
    params.set("show_text", "false");
    if (opts?.autoplay) params.set("autoplay", "true");
    if (opts?.width) params.set("width", String(opts.width));
    return `https://www.facebook.com/plugins/video.php?${params.toString()}`;
  } catch {
    return null;
  }
}

function extractIframeSrc(raw: string): string | null {
  const m = raw.match(/src=["']([^"']+)["']/i);
  return m ? m[1] : null;
}

/**
 * Returns a ready-to-use embed src for the video player, or null if we can't
 * embed (caller should fall back to opening the URL externally).
 * `twitchParent` should be the current hostname on the client for Twitch to work.
 */
export function videoEmbedUrl(
  input: string | null | undefined,
  opts?: { autoplay?: boolean; twitchParent?: string },
): string | null {
  if (!input) return null;
  const raw = input.trim();
  if (!raw) return null;

  // Raw <iframe> HTML: extract the src
  const iframeSrc = extractIframeSrc(raw);
  const source = iframeSrc ?? raw;

  const yt = youTubeEmbedUrl(source, { autoplay: opts?.autoplay });
  if (yt) return yt;

  const fb = facebookEmbedUrl(source, { autoplay: opts?.autoplay });
  if (fb) return fb;

  try {
    const u = new URL(source);
    const h = u.hostname.replace(/^www\./, "");
    if (h === "twitch.tv" || h.endsWith(".twitch.tv")) {
      const parent =
        opts?.twitchParent ||
        (typeof window !== "undefined" ? window.location.hostname : "rollerzone.lovable.app");
      const path = u.pathname.split("/").filter(Boolean);
      if (path[0] === "videos" && path[1]) {
        return `https://player.twitch.tv/?video=${path[1]}&parent=${parent}${opts?.autoplay ? "&autoplay=true" : "&autoplay=false"}`;
      }
      if (path[0]) {
        return `https://player.twitch.tv/?channel=${path[0]}&parent=${parent}${opts?.autoplay ? "&autoplay=true" : "&autoplay=false"}`;
      }
    }
    // Trusted embeddable providers (live streaming CDNs, etc.)
    const trustedHosts = ["players.cdn.enetres.net", "player.vimeo.com", "iframe.mediadelivery.net"];
    if (iframeSrc || u.pathname.includes("/embed") || trustedHosts.includes(h)) return source;
  } catch {
    /* ignore */
  }
  return null;
}

/** Returns true when we can embed the URL in an iframe. */
export function canEmbedVideo(input: string | null | undefined): boolean {
  return videoEmbedUrl(input) !== null;
}

/** Best-effort thumbnail (currently only YouTube exposes a public one). */
export function videoThumbnail(input: string | null | undefined): string | null {
  return youTubeThumbnail(input);
}
