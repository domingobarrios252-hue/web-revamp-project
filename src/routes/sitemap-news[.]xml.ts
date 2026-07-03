import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const BASE_URL = "https://rollerzone.es";
const PUBLICATION_NAME = "RollerZone";
const PUBLICATION_LANG = "es";

// Google News accepts articles published in the last 48 hours.
const WINDOW_MS = 48 * 60 * 60 * 1000;

function xmlEscape(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export const Route = createFileRoute("/sitemap-news.xml")({
  server: {
    handlers: {
      GET: async () => {
        const url = process.env.SUPABASE_URL;
        const key = process.env.SUPABASE_PUBLISHABLE_KEY;

        const items: Array<{
          slug: string;
          title: string;
          published_at: string;
          image_url: string | null;
          category: string | null;
          country_code: string | null;
        }> = [];

        if (url && key) {
          const supabase = createClient<Database>(url, key, {
            auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
          });

          const since = new Date(Date.now() - WINDOW_MS).toISOString();
          const { data } = await supabase
            .from("news")
            .select(
              "slug, title, published_at, image_url, country_code, news_categories(name)",
            )
            .eq("published", true)
            .gte("published_at", since)
            .order("published_at", { ascending: false })
            .limit(1000);

          for (const n of (data ?? []) as Array<{
            slug: string | null;
            title: string | null;
            published_at: string | null;
            image_url: string | null;
            country_code: string | null;
            news_categories: { name: string | null } | null;
          }>) {
            if (!n.slug || !n.title || !n.published_at) continue;
            items.push({
              slug: n.slug,
              title: n.title,
              published_at: new Date(n.published_at).toISOString(),
              image_url: n.image_url,
              category: n.news_categories?.name ?? null,
              country_code: n.country_code,
            });
          }
        }

        const urls = items.map((n) => {
          const loc = `${BASE_URL}/noticias/articulo/${n.slug}`;
          const lang = n.country_code === "co" ? "es" : PUBLICATION_LANG;
          const parts = [
            `  <url>`,
            `    <loc>${xmlEscape(loc)}</loc>`,
            `    <news:news>`,
            `      <news:publication>`,
            `        <news:name>${xmlEscape(PUBLICATION_NAME)}</news:name>`,
            `        <news:language>${lang}</news:language>`,
            `      </news:publication>`,
            `      <news:publication_date>${n.published_at}</news:publication_date>`,
            `      <news:title>${xmlEscape(n.title)}</news:title>`,
            n.category ? `      <news:keywords>${xmlEscape(n.category)}</news:keywords>` : null,
            `    </news:news>`,
            n.image_url
              ? `    <image:image><image:loc>${xmlEscape(n.image_url)}</image:loc><image:title>${xmlEscape(n.title)}</image:title></image:image>`
              : null,
            `  </url>`,
          ].filter(Boolean);
          return parts.join("\n");
        });

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"`,
          `        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"`,
          `        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=300, s-maxage=300",
          },
        });
      },
    },
  },
});
