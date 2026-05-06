import type { Language } from "./translations";

const localeOf = (lang: Language) => (lang === "en" ? "en-GB" : "es-ES");

export function formatDate(
  value: string | Date | null | undefined,
  lang: Language,
  opts: Intl.DateTimeFormatOptions = { day: "2-digit", month: "long", year: "numeric" },
) {
  if (!value) return "";
  const date = typeof value === "string" ? new Date(value) : value;
  if (isNaN(date.getTime())) return "";
  return date.toLocaleDateString(localeOf(lang), opts);
}

export function formatShortDate(value: string | Date | null | undefined, lang: Language) {
  return formatDate(value, lang, { day: "2-digit", month: "short" });
}

export function formatDateTime(value: string | Date | null | undefined, lang: Language) {
  if (!value) return "";
  const date = typeof value === "string" ? new Date(value) : value;
  if (isNaN(date.getTime())) return "";
  return date.toLocaleString(localeOf(lang), {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatTime(value: string | Date | null | undefined, lang: Language) {
  if (!value) return "";
  const date = typeof value === "string" ? new Date(value) : value;
  if (isNaN(date.getTime())) return "";
  return date.toLocaleTimeString(localeOf(lang), { hour: "2-digit", minute: "2-digit" });
}
