import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const DateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const Input = z.object({
  start: DateStr,
  end: DateStr,
  prevStart: DateStr,
  prevEnd: DateStr,
  grain: z.enum(["day", "week", "month"]),
});
export type StatsInput = z.infer<typeof Input>;

type Totals = { users: number; sessions: number; views: number; avgDuration: number; viewsPerSession: number };
type Named = { name: string; users: number; sessions?: number; views?: number };

export type StatsResult = {
  configured: boolean;
  error: string | null;
  totals: Totals | null;
  prevTotals: Totals | null;
  series: { key: string; users: number; sessions: number; views: number }[];
  sections: { name: string; views: number }[];
  countries: { name: string; users: number; sessions: number }[];
  sources: { name: string; sessions: number }[];
  devices: { name: string; users: number }[];
  browsers: { name: string; users: number }[];
  os: { name: string; users: number }[];
  tv: { pageViews: number; pageUsers: number; avgDuration: number; plays: number | null; playUsers: number | null; streams: { name: string; plays: number }[] | null; streamsNote: string | null };
  specials: { slug: string; title: string; users: number; views: number; top: { path: string; views: number }[] }[];
  news: { id: string; title: string; slug: string; image: string | null; hub: string; publishedAt: string | null; views: number; unique: number; gaAvgSeconds: number | null }[];
  comparisons: { label: string; cur: Totals | null; prev: Totals | null }[];
};

const cache = new Map<string, { at: number; v: StatsResult }>();

const HUB_BY_SEG: Record<string, string> = {
  espana: "España", es: "España", colombia: "Colombia", co: "Colombia",
  portugal: "Portugal", pt: "Portugal", miami: "Miami", mia: "Miami",
};
const HUB_BY_CODE: Record<string, string> = { general: "General", es: "España", co: "Colombia", pt: "Portugal", mia: "Miami" };

const regionNames = new Intl.DisplayNames(["es"], { type: "region" });
function countryName(code: string) {
  if (!code || code === "(not set)") return "Desconocido";
  try { return regionNames.of(code) ?? code; } catch { return code; }
}

function fmt(d: Date) {
  return d.toISOString().slice(0, 10);
}

export const getStats = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data, context }): Promise<StatsResult> => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");

    const key = JSON.stringify(data);
    const hit = cache.get(key);
    if (hit && Date.now() - hit.at < 5 * 60_000) return hit.v;

    const { runReport, ga4Configured } = await import("./ga4.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // ---- Contador propio de noticias (independiente de GA4) ----
    const counts = new Map<string, { views: number; visitors: Set<string> }>();
    for (let from = 0; from < 200_000; from += 1000) {
      const { data: rows, error } = await supabaseAdmin
        .from("news_views")
        .select("news_id, visitor_hash")
        .gte("viewed_at", `${data.start}T00:00:00Z`)
        .lt("viewed_at", `${fmt(new Date(new Date(data.end).getTime() + 86_400_000))}T00:00:00Z`)
        .range(from, from + 999);
      if (error) throw new Error(error.message);
      for (const r of rows ?? []) {
        const c = counts.get(r.news_id) ?? { views: 0, visitors: new Set<string>() };
        c.views++;
        c.visitors.add(r.visitor_hash);
        counts.set(r.news_id, c);
      }
      if (!rows || rows.length < 1000) break;
    }
    const topIds = [...counts.entries()].sort((a, b) => b[1].views - a[1].views).slice(0, 20);
    const { data: newsRows } = topIds.length
      ? await supabaseAdmin.from("news").select("id,title,slug,image_url,country_code,published_at").in("id", topIds.map(([id]) => id))
      : { data: [] as { id: string; title: string; slug: string; image_url: string | null; country_code: string; published_at: string | null }[] };
    const newsById = new Map((newsRows ?? []).map((n) => [n.id, n]));

    const empty: StatsResult = {
      configured: ga4Configured(), error: null, totals: null, prevTotals: null, series: [], sections: [],
      countries: [], sources: [], devices: [], browsers: [], os: [],
      tv: { pageViews: 0, pageUsers: 0, avgDuration: 0, plays: null, playUsers: null, streams: null, streamsNote: null },
      specials: [], news: [], comparisons: [],
    };

    const newsList = (gaTime: Map<string, number> | null) =>
      topIds.flatMap(([id, c]) => {
        const n = newsById.get(id);
        if (!n) return [];
        return [{
          id, title: n.title, slug: n.slug, image: n.image_url, hub: HUB_BY_CODE[n.country_code] ?? n.country_code,
          publishedAt: n.published_at, views: c.views, unique: c.visitors.size,
          gaAvgSeconds: gaTime?.get(n.slug) ?? null,
        }];
      });

    if (!empty.configured) {
      const v = { ...empty, news: newsList(null) };
      return v;
    }

    const range = [{ startDate: data.start, endDate: data.end }];
    const TOT = ["totalUsers", "sessions", "screenPageViews", "averageSessionDuration", "screenPageViewsPerSession"].map((name) => ({ name }));
    const totals = async (s: string, e: string): Promise<Totals | null> => {
      const r = await runReport({ dateRanges: [{ startDate: s, endDate: e }], metrics: TOT });
      const m = r[0]?.m ?? [0, 0, 0, 0, 0];
      return { users: m[0], sessions: m[1], views: m[2], avgDuration: m[3], viewsPerSession: m[4] };
    };
    const dimTime = data.grain === "day" ? "date" : data.grain === "week" ? "isoYearIsoWeek" : "yearMonth";

    const today = new Date();
    const daysAgo = (n: number) => fmt(new Date(today.getTime() - n * 86_400_000));
    const monthStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
    const prevMonthStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 1, 1));
    const prevMonthSameDay = new Date(Math.min(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 1, today.getUTCDate()),
      monthStart.getTime() - 86_400_000,
    ));

    try {
      const [cur, prev, series, pages, countries, sources, devices, browsers, os, tvPlays, c7, p7, c30, p30, cm, pm] = await Promise.all([
        totals(data.start, data.end),
        totals(data.prevStart, data.prevEnd),
        runReport({ dateRanges: range, dimensions: [{ name: dimTime }], metrics: TOT.slice(0, 3), orderBys: [{ dimension: { dimensionName: dimTime } }] }),
        runReport({ dateRanges: range, dimensions: [{ name: "pagePath" }], metrics: [{ name: "screenPageViews" }, { name: "totalUsers" }, { name: "userEngagementDuration" }], limit: 10000 }),
        runReport({ dateRanges: range, dimensions: [{ name: "countryId" }], metrics: [{ name: "totalUsers" }, { name: "sessions" }], limit: 30, orderBys: [{ metric: { metricName: "totalUsers" }, desc: true }] }),
        runReport({ dateRanges: range, dimensions: [{ name: "sessionSource" }, { name: "sessionMedium" }], metrics: [{ name: "sessions" }], limit: 500 }),
        runReport({ dateRanges: range, dimensions: [{ name: "deviceCategory" }], metrics: [{ name: "totalUsers" }] }),
        runReport({ dateRanges: range, dimensions: [{ name: "browser" }], metrics: [{ name: "totalUsers" }], limit: 6, orderBys: [{ metric: { metricName: "totalUsers" }, desc: true }] }),
        runReport({ dateRanges: range, dimensions: [{ name: "operatingSystem" }], metrics: [{ name: "totalUsers" }], limit: 6, orderBys: [{ metric: { metricName: "totalUsers" }, desc: true }] }),
        runReport({ dateRanges: range, dimensions: [{ name: "eventName" }], metrics: [{ name: "eventCount" }, { name: "totalUsers" }], dimensionFilter: { filter: { fieldName: "eventName", stringFilter: { value: "tv_play" } } } }),
        totals(daysAgo(6), fmt(today)), totals(daysAgo(13), daysAgo(7)),
        totals(daysAgo(29), fmt(today)), totals(daysAgo(59), daysAgo(30)),
        totals(fmt(monthStart), fmt(today)), totals(fmt(prevMonthStart), fmt(prevMonthSameDay)),
      ]);

      // Emisiones más vistas: requiere dimensión personalizada stream_title registrada en GA4.
      let streams: { name: string; plays: number }[] | null = null;
      let streamsNote: string | null = null;
      try {
        const s = await runReport({
          dateRanges: range, dimensions: [{ name: "customEvent:stream_title" }], metrics: [{ name: "eventCount" }],
          dimensionFilter: { filter: { fieldName: "eventName", stringFilter: { value: "tv_play" } } }, limit: 10,
        });
        streams = s.map((r) => ({ name: r.d[0], plays: r.m[0] })).filter((r) => r.name && r.name !== "(not set)");
      } catch {
        streamsNote = "Para ver qué emisión se ha reproducido más, registra en GA4 la dimensión personalizada «stream_title» (ámbito: evento).";
      }

      // Secciones, TV, especiales, tiempo por noticia.
      const { data: allNews } = await supabaseAdmin.from("news").select("slug,country_code").limit(5000);
      const hubBySlug = new Map((allNews ?? []).map((n) => [n.slug, HUB_BY_CODE[n.country_code] ?? "General"]));
      const { data: specs } = await supabaseAdmin.from("special_editorials").select("slug,title");
      const specTitle = new Map((specs ?? []).map((s) => [s.slug as string, s.title as string]));
      specTitle.set("camino-al-europeo-2026", specTitle.get("camino-al-europeo-2026") ?? "Camino al Europeo 2026");

      const sec = new Map<string, number>();
      const add = (k: string, v: number) => sec.set(k, (sec.get(k) ?? 0) + v);
      const tv = { views: 0, users: 0, eng: 0 };
      const sp = new Map<string, { users: number; views: number; pages: Map<string, number> }>();
      const gaTime = new Map<string, number>();
      for (const r of pages) {
        const path = (r.d[0] || "/").split("?")[0];
        const [views, users, eng] = r.m;
        const seg = path.split("/").filter(Boolean);
        const a = seg[0] ?? "";
        if (a === "admin" || a === "dashboard" || a === "acceso-interno" || a === "editor") continue;
        const isTv = a === "tv" || a === "rollerzone-tv" || seg.includes("tv") || a.endsWith("rollerzone-tv") || seg[1] === "rollerzone-tv";
        if (isTv) { tv.views += views; tv.users += users; tv.eng += eng; add("Rollerzone TV", views); }
        else if (a === "noticias" && seg.length >= 2) {
          const slug = seg[seg.length - 1];
          add(hubBySlug.get(slug) ?? "General", views);
          if (views > 0) gaTime.set(slug, (gaTime.get(slug) ?? 0) + eng / views);
        }
        else if (a === "hub" && seg[1] && HUB_BY_SEG[seg[1]]) add(HUB_BY_SEG[seg[1]], views);
        else if (HUB_BY_SEG[a]) add(HUB_BY_SEG[a], views);
        else if (a === "resultados") add("Resultados", views);
        else if (a === "revista") add("Magazine", views);
        else if (a === "eventos" || a === "events") add("Eventos", views);
        else if (a === "especiales" || a === "camino-al-europeo-2026") {
          add("Especiales", views);
          const slug = a === "especiales" ? seg[1] : a;
          if (slug) {
            const e = sp.get(slug) ?? { users: 0, views: 0, pages: new Map() };
            e.users += users; e.views += views; e.pages.set(path, (e.pages.get(path) ?? 0) + views);
            sp.set(slug, e);
          }
        } else add(a ? "Otras páginas" : "Portada", views);
      }

      const bucket = new Map<string, number>();
      for (const r of sources) {
        const s = r.d[0].toLowerCase(), m = r.d[1].toLowerCase();
        const k = s.includes("google") ? "Google"
          : /instagram|^ig$/.test(s) ? "Instagram"
          : /facebook|^fb$/.test(s) ? "Facebook"
          : s === "(direct)" ? "Directo"
          : m === "referral" ? "Enlaces externos"
          : "Otras fuentes";
        bucket.set(k, (bucket.get(k) ?? 0) + r.m[0]);
      }

      const DEV: Record<string, string> = { mobile: "Móvil", desktop: "Ordenador", tablet: "Tablet" };
      const v: StatsResult = {
        ...empty,
        totals: cur, prevTotals: prev,
        series: series.map((r) => ({ key: r.d[0], users: r.m[0], sessions: r.m[1], views: r.m[2] })),
        sections: [...sec.entries()].map(([name, views]) => ({ name, views })).sort((a, b) => b.views - a.views),
        countries: countries.map((r) => ({ name: countryName(r.d[0]), users: r.m[0], sessions: r.m[1] })),
        sources: [...bucket.entries()].map(([name, sessions]) => ({ name, sessions })).sort((a, b) => b.sessions - a.sessions),
        devices: devices.map((r) => ({ name: DEV[r.d[0]] ?? r.d[0], users: r.m[0] })),
        browsers: browsers.map((r) => ({ name: r.d[0], users: r.m[0] })),
        os: os.map((r) => ({ name: r.d[0], users: r.m[0] })),
        tv: {
          pageViews: tv.views, pageUsers: tv.users, avgDuration: tv.views ? tv.eng / tv.views : 0,
          plays: tvPlays[0]?.m[0] ?? 0, playUsers: tvPlays[0]?.m[1] ?? 0, streams, streamsNote,
        },
        specials: [...sp.entries()].map(([slug, e]) => ({
          slug, title: specTitle.get(slug) ?? slug, users: e.users, views: e.views,
          top: [...e.pages.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([path, views]) => ({ path, views })),
        })).sort((a, b) => b.views - a.views),
        news: newsList(gaTime),
        comparisons: [
          { label: "Últimos 7 días vs 7 anteriores", cur: c7, prev: p7 },
          { label: "Últimos 30 días vs 30 anteriores", cur: c30, prev: p30 },
          { label: "Este mes vs mismo tramo del mes anterior", cur: cm, prev: pm },
        ],
      };
      cache.set(key, { at: Date.now(), v });
      return v;
    } catch (e) {
      console.error("GA4 stats error", e);
      return { ...empty, news: newsList(null), error: "No se han podido leer los datos de Google Analytics en este momento." };
    }
  });

export const getRealtime = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");
    const { runRealtime, ga4Configured } = await import("./ga4.server");
    if (!ga4Configured()) return { ok: false as const, active: 0, pages: [], countries: [], devices: [] };
    try {
      const top = (dim: string) =>
        runRealtime({ dimensions: [{ name: dim }], metrics: [{ name: "activeUsers" }], limit: 8, orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }] })
          .then((r) => r.map((x) => ({ name: x.d[0], users: x.m[0] })));
      const [tot, pages, countries, devices] = await Promise.all([
        runRealtime({ metrics: [{ name: "activeUsers" }] }),
        top("unifiedScreenName"), top("country"), top("deviceCategory"),
      ]);
      return { ok: true as const, active: tot[0]?.m[0] ?? 0, pages, countries, devices };
    } catch (e) {
      console.error("GA4 realtime error", e);
      return { ok: false as const, active: 0, pages: [], countries: [], devices: [] };
    }
  });
