import { supabase } from "@/integrations/supabase/client";

/**
 * Extracts { bucket, path } from a Supabase Storage URL of the form
 *   https://<ref>.supabase.co/storage/v1/object/(public|sign|authenticated)/<bucket>/<path...>
 * Returns null when the URL is not a Supabase Storage URL.
 */
export function parseStorageUrl(
  url: string | null | undefined,
): { bucket: string; path: string } | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (!/\.supabase\.co$/i.test(u.hostname)) return null;
    const m = u.pathname.match(
      /^\/storage\/v1\/object\/(?:public|sign|authenticated)\/([^/]+)\/(.+)$/,
    );
    if (!m) return null;
    return { bucket: m[1], path: decodeURIComponent(m[2]) };
  } catch {
    return null;
  }
}

/**
 * Returns a viewable URL for a Supabase Storage file. Private buckets get a
 * signed URL; anything else (already-signed, public bucket, or external URL)
 * is returned as-is.
 */
export async function getViewableStorageUrl(
  url: string | null | undefined,
  expiresInSeconds = 60 * 60,
): Promise<string | null> {
  if (!url) return null;
  const parsed = parseStorageUrl(url);
  if (!parsed) return url;
  // If it's already a signed url, keep it
  if (/\/object\/sign\//.test(url)) return url;
  const { data, error } = await supabase.storage
    .from(parsed.bucket)
    .createSignedUrl(parsed.path, expiresInSeconds);
  if (error || !data?.signedUrl) return url;
  return data.signedUrl;
}
