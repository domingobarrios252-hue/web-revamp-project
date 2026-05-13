// Country catalog helpers. Source of truth lives in the `countries` table,
// but for routing/SEO we keep a small static map of the supported slugs.

export type CountrySlug = "espana" | "colombia" | "venezuela";

export type CountryInfo = {
  slug: CountrySlug;
  code: "es" | "co" | "ve";
  name: string;
  emoji: string;
  accents: { c1: string; c2: string; c3: string };
};

export const COUNTRIES: Record<CountrySlug, CountryInfo> = {
  espana: {
    slug: "espana",
    code: "es",
    name: "España",
    emoji: "🇪🇸",
    accents: { c1: "#AA151B", c2: "#F1BF00", c3: "#AA151B" },
  },
  colombia: {
    slug: "colombia",
    code: "co",
    name: "Colombia",
    emoji: "🇨🇴",
    accents: { c1: "#FCD116", c2: "#003893", c3: "#CE1126" },
  },
  venezuela: {
    slug: "venezuela",
    code: "ve",
    name: "Venezuela",
    emoji: "🇻🇪",
    accents: { c1: "#FCD116", c2: "#00247D", c3: "#CF142B" },
  },
};

export const COUNTRY_LIST: CountryInfo[] = Object.values(COUNTRIES);

export function getCountryBySlug(slug: string | undefined): CountryInfo | null {
  if (!slug) return null;
  const c = COUNTRIES[slug as CountrySlug];
  return c ?? null;
}
