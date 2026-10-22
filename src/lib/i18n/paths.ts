import type { Language } from "./translations";

export const LANGUAGE_PATHS = [
  ["/", "/en"], ["/noticias", "/en/news"], ["/eventos", "/en/events"],
  ["/resultados", "/en/results"], ["/revista", "/en/magazine"],
  ["/especiales", "/en/specials"], ["/rollerzone-tv", "/en/rollerzone-tv"],
  ["/tv", "/en/rollerzone-tv"], ["/equipo", "/en/team"],
  ["/patrocinadores", "/en/sponsors"], ["/francia", "/en/france"],
  ["/portugal", "/en/portugal"], ["/usa", "/en/usa"],
] as const;

/** Only real equivalents are mapped; untranslated editorial documents retain their URL. */
export function localizedPath(path: string, lang: Language): string {
  const clean = path.length > 1 ? path.replace(/\/$/, "") : path;
  const article = clean.match(/^\/(?:noticias\/articulo|en\/news)\/([^/]+)$/);
  if (article) return `${lang === "en" ? "/en/news" : "/noticias/articulo"}/${article[1]}`;
  const result = clean.match(/^\/(?:resultados|en\/results)\/([^/]+)$/);
  if (result) return `${lang === "en" ? "/en/results" : "/resultados"}/${result[1]}`;
  const hub = clean.match(/^\/(?:hub|en\/hub)\/([^/]+)$/);
  if (hub) return `${lang === "en" ? "/en/hub" : "/hub"}/${hub[1]}`;
  for (const [es, en] of LANGUAGE_PATHS) {
    if (clean === es || clean === en) return lang === "en" ? en : es;
  }
  return path;
}

export function languageFromPath(path: string): Language {
  return path === "/en" || path.startsWith("/en/") ? "en" : "es";
}

export function bilingualHead(title: string, description: string, es: string, en: string, lang: Language) {
  const canonical = `https://rollerzone.es${lang === "en" ? en : es}`;
  return {
    meta: [{ title: `${title} — RollerZone` }, { name: "description", content: description },
      { property: "og:title", content: `${title} — RollerZone` }, { property: "og:description", content: description },
      { property: "og:type", content: "website" }, { property: "og:url", content: canonical },
      { property: "og:locale", content: lang === "en" ? "en_GB" : "es_ES" }, { name: "twitter:card", content: "summary_large_image" }],
    links: [{ rel: "canonical", href: canonical }, { rel: "alternate", hreflang: "es", href: `https://rollerzone.es${es}` },
      { rel: "alternate", hreflang: "en", href: `https://rollerzone.es${en}` }, { rel: "alternate", hreflang: "x-default", href: `https://rollerzone.es${es}` }],
  };
}