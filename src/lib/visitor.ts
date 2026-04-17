// Generates a stable visitor hash stored in localStorage. Used only to
// dedupe news views per browser; not for tracking or analytics.
const KEY = "rz-visitor-id";

export function getVisitorHash(): string {
  if (typeof window === "undefined") return "ssr";
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(KEY, id);
  }
  return id;
}
