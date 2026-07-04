import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const BASE_URL = "https://rollerzone.es";

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?:
    | "always"
    | "hourly"
    | "daily"
    | "weekly"
    | "monthly"
    | "yearly"
    | "never";
  priority?: string;
  image?: string;
  imageTitle?: string;
}

const STATIC_ENTRIES: SitemapEntry[] = [
  { path: "/", changefreq: "daily", priority: "1.0" },
  { path: "/noticias", changefreq: "hourly", priority: "0.9" },
  { path: "/entrevistas", changefreq: "weekly", priority: "0.8" },
  { path: "/eventos", changefreq: "daily", priority: "0.8" },
  { path: "/resultados", changefreq: "weekly", priority: "0.7" },
  { path: "/premios-mvp", changefreq: "weekly", priority: "0.7" },
  { path: "/salon-de-la-fama", changefreq: "monthly", priority: "0.6" },
  
  { path: "/redactores", changefreq: "monthly", priority: "0.5" },
  { path: "/patrocinadores", changefreq: "monthly", priority: "0.4" },
  { path: "/revista", changefreq: "weekly", priority: "0.6" },
  { path: "/tv", changefreq: "weekly", priority: "0.6" },
  { path: "/paises", changefreq: "monthly", priority: "0.5" },
  { path: "/hub/es", changefreq: "daily", priority: "0.8" },
  { path: "/hub/co", changefreq: "daily", priority: "0.8" },
  { path: "/hub/es/clubes", changefreq: "weekly", priority: "0.6" },
  { path: "/hub/es/patinadores", changefreq: "weekly", priority: "0.6" },
  { path: "/hub/es/federaciones", changefreq: "weekly", priority: "0.5" },
  { path: "/hub/es/entrevistas", changefreq: "weekly", priority: "0.6" },
  { path: "/hub/es/competicion", changefreq: "weekly", priority: "0.6" },
  { path: "/hub/co/clubes", changefreq: "weekly", priority: "0.6" },
  { path: "/hub/co/patinadores", changefreq: "weekly", priority: "0.6" },
  { path: "/hub/co/federaciones", changefreq: "weekly", priority: "0.5" },
  { path: "/hub/co/entrevistas", changefreq: "weekly", priority: "0.6" },
  { path: "/hub/co/competicion", changefreq: "weekly", priority: "0.6" },
  { path: "/camino-al-europeo-2026", changefreq: "weekly", priority: "0.7" },
  { path: "/sobre/quienes-somos", changefreq: "monthly", priority: "0.4" },
  { path: "/sobre/publicidad", changefreq: "monthly", priority: "0.4" },
  { path: "/sobre/contacto", changefreq: "monthly", priority: "0.4" },
  { path: "/aviso-legal", changefreq: "yearly", priority: "0.2" },
  { path: "/privacidad", changefreq: "yearly", priority: "0.2" },
  { path: "/cookies", changefreq: "yearly", priority: "0.2" },
];

function xmlEscape(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function toIso(value: string | null | undefined) {
  if (!value) return undefined;
  const d = new Date(value);
  return isNaN(d.getTime()) ? undefined : d.toISOString();
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const url = process.env.SUPABASE_URL;
        const key = process.env.SUPABASE_PUBLISHABLE_KEY;

        const entries: SitemapEntry[] = [...STATIC_ENTRIES];

        if (url && key) {
          const supabase = createClient<Database>(url, key, {
            auth: {
              storage: undefined,
              persistSession: false,
              autoRefreshToken: false,
            },
          });

          const [newsRes, interviewsRes, eventsRes, categoriesRes, magazinesRes] =
            await Promise.all([
              supabase
                .from("news")
                .select("slug, title, published_at, updated_at, image_url")
                .eq("published", true)
                .order("published_at", { ascending: false })
                .limit(5000),
              supabase
                .from("interviews")
                .select("slug, title, updated_at, interview_date, cover_url")
                .eq("published", true)
                .order("interview_date", { ascending: false })
                .limit(5000),
              supabase
                .from("events")
                .select("slug, name, updated_at, start_date, cover_url")
                .eq("published", true)
                .order("start_date", { ascending: false })
                .limit(5000),
              supabase
                .from("news_categories")
                .select("slug, updated_at")
                .limit(200),
              supabase
                .from("magazines")
                .select("id, updated_at, edition_date, cover_url, title")
                .eq("published", true)
                .eq("is_active", true)
                .order("edition_date", { ascending: false })
                .limit(2000),
            ]);

          for (const n of (newsRes.data ?? []) as Array<{ slug: string | null; title: string | null; published_at: string | null; updated_at: string | null; image_url: string | null }>) {
            if (!n.slug) continue;
            entries.push({
              path: `/noticias/articulo/${n.slug}`,
              lastmod: toIso(n.updated_at ?? n.published_at),
              changefreq: "weekly",
              priority: "0.8",
              image: n.image_url ?? undefined,
              imageTitle: n.title ?? undefined,
            });
          }
          for (const i of (interviewsRes.data ?? []) as Array<{ slug: string | null; title: string | null; updated_at: string | null; interview_date: string | null; cover_url: string | null }>) {
            if (!i.slug) continue;
            entries.push({
              path: `/entrevistas/${i.slug}`,
              lastmod: toIso(i.updated_at ?? i.interview_date),
              changefreq: "monthly",
              priority: "0.7",
              image: i.cover_url ?? undefined,
              imageTitle: i.title ?? undefined,
            });
          }
          for (const e of (eventsRes.data ?? []) as Array<{ slug: string | null; name: string | null; updated_at: string | null; start_date: string | null; cover_url: string | null }>) {
            if (!e.slug) continue;
            entries.push({
              path: `/eventos/${e.slug}`,
              lastmod: toIso(e.updated_at ?? e.start_date),
              changefreq: "weekly",
              priority: "0.7",
              image: e.cover_url ?? undefined,
              imageTitle: e.name ?? undefined,
            });
          }
          for (const c of categoriesRes.data ?? []) {
            if (!c.slug) continue;
            entries.push({
              path: `/noticias/${c.slug}`,
              lastmod: toIso(c.updated_at),
              changefreq: "daily",
              priority: "0.6",
            });
          }
          for (const m of (magazinesRes.data ?? []) as Array<{ id: string | null; title: string | null; updated_at: string | null; edition_date: string | null; cover_url: string | null }>) {
            if (!m.id) continue;
            entries.push({
              path: `/revista/leer/${m.id}`,
              lastmod: toIso(m.updated_at ?? m.edition_date),
              changefreq: "monthly",
              priority: "0.6",
              image: m.cover_url ?? undefined,
              imageTitle: m.title ?? undefined,
            });
          }
        }

        const urls = entries.map((e) =>
          [
            `  <url>`,
            `    <loc>${xmlEscape(BASE_URL + e.path)}</loc>`,
            e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            e.image
              ? `    <image:image><image:loc>${xmlEscape(e.image)}</image:loc>${e.imageTitle ? `<image:title>${xmlEscape(e.imageTitle)}</image:title>` : ""}</image:image>`
              : null,
            `  </url>`,
          ]
            .filter(Boolean)
            .join("\n"),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"`,
          `        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=1800, s-maxage=1800",
          },
        });
      },
    },
  },
});
