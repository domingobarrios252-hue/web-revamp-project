// Cálculo del panel de Estadísticas. Cada módulo se calcula de forma aislada:
// si una fuente falla, solo ese bloque recibe un aviso (errors[módulo]).
import { runReport, runRealtime, ga4Configured, type GaRow } from "./ga4.server";

export type StatsInput = { start: string; end: string; prevStart: string; prevEnd: string; grain: "day" | "week" | "month" };
export type Totals = { users: number; sessions: number; views: number; avgDuration: number; viewsPerSession: number };
export type StatsModule = "totals" | "series" | "pages" | "countries" | "sources" | "devices" | "tv" | "streams" | "news" | "comparisons";

export type StatsResult = {
  configured: boolean;
  error: string | null;
  errors: Partial<Record<StatsModule, string>>;
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

export type RealtimeResult = { ok: boolean; error: string | null; active: number; pages: { name: string; users: number }[]; countries: { name: string; users: number }[]; devices: { name: string; users: number }[] };

const HUB_BY_SEG: Record<string, string> = {
  espana: "España", es: "España", colombia: "Colombia", co: "Colombia",
  portugal: "Portugal", pt: "Portugal", miami: "Miami", mia: "Miami",
};
const HUB_BY_CODE: Record<string, string> = { general: "General", es: "España", co: "Colombia", pt: "Portugal", mia: "Miami" };
const DEV: Record<string, string> = { mobile: "Móvil", desktop: "Ordenador", tablet: "Tablet" };

const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : 0);
const str = (v: unknown, fb = "") => (typeof v === "string" ? v : fb);
const safeRows = (r: GaRow[] | null | undefined) => (Array.isArray(r) ? r : []).map((x) => ({ d: Array.isArray(x?.d) ? x.d : [], m: Array.isArray(x?.m) ? x.m : [] }));

function countryName(code: string) {
  if (!code || code === "(not set)") return "Desconocido";
  try { return new Intl.DisplayNames(["es"], { type: "region" }).of(code) ?? code; } catch { return code; }
}
const fmt = (d: Date) => d.toISOString().slice(0, 10);
const errMsg = (e: unknown) => (e instanceof Error ? e.message : String(e));

const cache = new Map<string, { at: number; v: StatsResult }>();

export async function computeStats(data: StatsInput): Promise<StatsResult> {
  const key = JSON.stringify(data);
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < 5 * 60_000) return hit.v;

  const errors: StatsResult["errors"] = {};
  const configured = ga4Configured();
  const res: StatsResult = {
    configured, error: null, errors, totals: null, prevTotals: null, series: [], sections: [],
    countries: [], sources: [], devices: [], browsers: [], os: [],
    tv: { pageViews: 0, pageUsers: 0, avgDuration: 0, plays: null, playUsers: null, streams: null, streamsNote: null },
    specials: [], news: [], comparisons: [],
  };

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  // Guardia: ejecuta un módulo y registra su error sin afectar al resto.
  async function guard<T>(mod: StatsModule, fn: () => Promise<T>): Promise<T | null> {
    try { return await fn(); } catch (e) { console.error(`[stats:${mod}]`, errMsg(e)); errors[mod] = "No se han podido cargar estos datos."; return null; }
  }

  // ---- Contador propio de noticias (independiente de GA4) ----
  const newsCounts = await guard("news", async () => {
    const counts = new Map<string, { views: number; visitors: Set<string> }>();
    const endExcl = fmt(new Date(new Date(`${data.end}T00:00:00Z`).getTime() + 86_400_000));
    for (let from = 0; from < 200_000; from += 1000) {
      const { data: rows, error } = await supabaseAdmin.from("news_views").select("news_id, visitor_hash")
        .gte("viewed_at", `${data.start}T00:00:00Z`).lt("viewed_at", `${endExcl}T00:00:00Z`).range(from, from + 999);
      if (error) throw new Error(error.message);
      for (const r of rows ?? []) {
        if (!r?.news_id) continue;
        const c = counts.get(r.news_id) ?? { views: 0, visitors: new Set<string>() };
        c.views++; if (r.visitor_hash) c.visitors.add(r.visitor_hash);
        counts.set(r.news_id, c);
      }
      if (!rows || rows.length < 1000) break;
    }
    const top = [...counts.entries()].sort((a, b) => b[1].views - a[1].views).slice(0, 20);
    let meta: { id: string; title: string | null; slug: string | null; image_url: string | null; country_code: string | null; published_at: string | null }[] = [];
    if (top.length) {
      const { data: rows, error } = await supabaseAdmin.from("news").select("id,title,slug,image_url,country_code,published_at").in("id", top.map(([id]) => id));
      if (error) throw new Error(error.message);
      meta = rows ?? [];
    }
    return { top, byId: new Map(meta.map((n) => [n.id, n])) };
  });

  const buildNews = (gaTime: Map<string, number> | null) =>
    (newsCounts?.top ?? []).flatMap(([id, c]) => {
      const n = newsCounts?.byId.get(id);
      if (!n || !n.slug) return [];
      const code = str(n.country_code, "general");
      return [{
        id, title: str(n.title, "(sin título)"), slug: n.slug, image: n.image_url ?? null, hub: HUB_BY_CODE[code] ?? code,
        publishedAt: n.published_at ?? null, views: c.views, unique: c.visitors.size, gaAvgSeconds: gaTime?.get(n.slug) ?? null,
      }];
    });

  if (!configured) {
    res.news = buildNews(null);
    return res;
  }

  const range = [{ startDate: data.start, endDate: data.end }];
  const TOT = ["totalUsers", "sessions", "screenPageViews", "averageSessionDuration", "screenPageViewsPerSession"].map((name) => ({ name }));
  const totals = async (s: string, e: string): Promise<Totals> => {
    const r = safeRows(await runReport({ dateRanges: [{ startDate: s, endDate: e }], metrics: TOT }));
    const m = r[0]?.m ?? [];
    return { users: num(m[0]), sessions: num(m[1]), views: num(m[2]), avgDuration: num(m[3]), viewsPerSession: num(m[4]) };
  };
  const report = async (body: unknown) => safeRows(await runReport(body));
  const dimTime = data.grain === "day" ? "date" : data.grain === "week" ? "isoYearIsoWeek" : "yearMonth";
  const tvFilter = { filter: { fieldName: "eventName", stringFilter: { value: "tv_play" } } };

  const today = new Date();
  const daysAgo = (n: number) => fmt(new Date(today.getTime() - n * 86_400_000));
  const monthStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
  const prevMonthStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 1, 1));
  const prevMonthSameDay = new Date(Math.min(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 1, today.getUTCDate()), monthStart.getTime() - 86_400_000));

  const [tot, series, pages, countries, sources, devices, tvPlays, streams, comps, allNews, specs] = await Promise.all([
    guard("totals", async () => Promise.all([totals(data.start, data.end), totals(data.prevStart, data.prevEnd)])),
    guard("series", () => report({ dateRanges: range, dimensions: [{ name: dimTime }], metrics: TOT.slice(0, 3), orderBys: [{ dimension: { dimensionName: dimTime } }] })),
    guard("pages", () => report({ dateRanges: range, dimensions: [{ name: "pagePath" }], metrics: [{ name: "screenPageViews" }, { name: "totalUsers" }, { name: "userEngagementDuration" }], limit: 10000 })),
    guard("countries", () => report({ dateRanges: range, dimensions: [{ name: "countryId" }], metrics: [{ name: "totalUsers" }, { name: "sessions" }], limit: 30, orderBys: [{ metric: { metricName: "totalUsers" }, desc: true }] })),
    guard("sources", () => report({ dateRanges: range, dimensions: [{ name: "sessionSource" }, { name: "sessionMedium" }], metrics: [{ name: "sessions" }], limit: 500 })),
    guard("devices", async () => Promise.all([
      report({ dateRanges: range, dimensions: [{ name: "deviceCategory" }], metrics: [{ name: "totalUsers" }] }),
      report({ dateRanges: range, dimensions: [{ name: "browser" }], metrics: [{ name: "totalUsers" }], limit: 6, orderBys: [{ metric: { metricName: "totalUsers" }, desc: true }] }),
      report({ dateRanges: range, dimensions: [{ name: "operatingSystem" }], metrics: [{ name: "totalUsers" }], limit: 6, orderBys: [{ metric: { metricName: "totalUsers" }, desc: true }] }),
    ])),
    guard("tv", () => report({ dateRanges: range, dimensions: [{ name: "eventName" }], metrics: [{ name: "eventCount" }, { name: "totalUsers" }], dimensionFilter: tvFilter })),
    // Requiere la dimensión personalizada stream_title en GA4; si no existe, se muestra una nota (no es un fallo).
    runReport({ dateRanges: range, dimensions: [{ name: "customEvent:stream_title" }], metrics: [{ name: "eventCount" }], dimensionFilter: tvFilter, limit: 10 })
      .then((r) => safeRows(r)).catch(() => null),
    guard("comparisons", async () => Promise.all([
      totals(daysAgo(6), fmt(today)), totals(daysAgo(13), daysAgo(7)),
      totals(daysAgo(29), fmt(today)), totals(daysAgo(59), daysAgo(30)),
      totals(fmt(monthStart), fmt(today)), totals(fmt(prevMonthStart), fmt(prevMonthSameDay)),
    ])),
    supabaseAdmin.from("news").select("slug,country_code").limit(5000).then((r) => r.data ?? [], () => []),
    supabaseAdmin.from("special_editorials").select("slug,title").then((r) => r.data ?? [], () => []),
  ]);

  if (tot) { res.totals = tot[0]; res.prevTotals = tot[1]; }
  if (series) res.series = series.map((r) => ({ key: str(r.d[0]), users: num(r.m[0]), sessions: num(r.m[1]), views: num(r.m[2]) }));
  if (countries) res.countries = countries.map((r) => ({ name: countryName(str(r.d[0])), users: num(r.m[0]), sessions: num(r.m[1]) }));
  if (devices) {
    const [dv, br, os] = devices;
    res.devices = dv.map((r) => ({ name: DEV[str(r.d[0])] ?? (str(r.d[0]) || "Desconocido"), users: num(r.m[0]) }));
    res.browsers = br.map((r) => ({ name: str(r.d[0]) || "Desconocido", users: num(r.m[0]) }));
    res.os = os.map((r) => ({ name: str(r.d[0]) || "Desconocido", users: num(r.m[0]) }));
  }
  if (sources) {
    const bucket = new Map<string, number>();
    for (const r of sources) {
      const s = str(r.d[0]).toLowerCase(), m = str(r.d[1]).toLowerCase();
      const k = s.includes("google") ? "Google" : /instagram|^ig$/.test(s) ? "Instagram" : /facebook|^fb$/.test(s) ? "Facebook"
        : s === "(direct)" ? "Directo" : m === "referral" ? "Enlaces externos" : "Otras fuentes";
      bucket.set(k, (bucket.get(k) ?? 0) + num(r.m[0]));
    }
    res.sources = [...bucket.entries()].map(([name, sessions]) => ({ name, sessions })).sort((a, b) => b.sessions - a.sessions);
  }
  if (comps) {
    const [c7, p7, c30, p30, cm, pm] = comps;
    res.comparisons = [
      { label: "Últimos 7 días vs 7 anteriores", cur: c7, prev: p7 },
      { label: "Últimos 30 días vs 30 anteriores", cur: c30, prev: p30 },
      { label: "Este mes vs mismo tramo del mes anterior", cur: cm, prev: pm },
    ];
  }
  if (tvPlays) { res.tv.plays = num(tvPlays[0]?.m[0]); res.tv.playUsers = num(tvPlays[0]?.m[1]); }
  if (streams) res.tv.streams = streams.map((r) => ({ name: str(r.d[0]), plays: num(r.m[0]) })).filter((r) => r.name && r.name !== "(not set)");
  else res.tv.streamsNote = "Para ver qué emisión se ha reproducido más, registra en GA4 la dimensión personalizada «stream_title» (ámbito: evento).";

  // Secciones, TV, especiales y tiempo por noticia (a partir de pagePath).
  let gaTime: Map<string, number> | null = null;
  if (pages) {
    try {
      const hubBySlug = new Map((allNews as { slug: string | null; country_code: string | null }[]).filter((n) => n?.slug).map((n) => [n.slug as string, HUB_BY_CODE[str(n.country_code)] ?? "General"]));
      const specTitle = new Map((specs as { slug: string | null; title: string | null }[]).filter((s) => s?.slug).map((s) => [s.slug as string, str(s.title, s.slug as string)]));
      if (!specTitle.has("camino-al-europeo-2026")) specTitle.set("camino-al-europeo-2026", "Camino al Europeo 2026");
      const sec = new Map<string, number>();
      const add = (k: string, v: number) => sec.set(k, (sec.get(k) ?? 0) + v);
      const tv = { views: 0, users: 0, eng: 0 };
      const sp = new Map<string, { users: number; views: number; pages: Map<string, number> }>();
      gaTime = new Map();
      for (const r of pages) {
        const path = (str(r.d[0]) || "/").split("?")[0];
        const views = num(r.m[0]), users = num(r.m[1]), eng = num(r.m[2]);
        const seg = path.split("/").filter(Boolean);
        const a = seg[0] ?? "";
        if (a === "admin" || a === "dashboard" || a === "acceso-interno" || a === "editor") continue;
        const isTv = a === "tv" || a === "rollerzone-tv" || seg.includes("tv") || seg[1] === "rollerzone-tv";
        if (isTv) { tv.views += views; tv.users += users; tv.eng += eng; add("Rollerzone TV", views); }
        else if (a === "noticias" && seg.length >= 2) {
          const slug = seg[seg.length - 1];
          add(hubBySlug.get(slug) ?? "General", views);
          if (views > 0) gaTime.set(slug, (gaTime.get(slug) ?? 0) + eng / views);
        } else if (a === "hub" && seg[1] && HUB_BY_SEG[seg[1]]) add(HUB_BY_SEG[seg[1]], views);
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
      res.sections = [...sec.entries()].map(([name, views]) => ({ name, views })).sort((a, b) => b.views - a.views);
      res.tv.pageViews = tv.views; res.tv.pageUsers = tv.users; res.tv.avgDuration = tv.views ? tv.eng / tv.views : 0;
      res.specials = [...sp.entries()].map(([slug, e]) => ({
        slug, title: specTitle.get(slug) ?? slug, users: e.users, views: e.views,
        top: [...e.pages.entries()].sort((x, y) => y[1] - x[1]).slice(0, 5).map(([path, views]) => ({ path, views })),
      })).sort((x, y) => y.views - x.views);
    } catch (e) {
      console.error("[stats:pages]", errMsg(e));
      errors.pages = "No se han podido cargar estos datos.";
      gaTime = null;
    }
  } else {
    errors.tv = errors.tv ?? "No se han podido cargar estos datos.";
  }
  res.news = buildNews(gaTime);

  // Si todas las fuentes GA4 fallaron, aviso general; si no, solo avisos por bloque.
  if (errors.totals && errors.series && errors.pages && errors.countries) res.error = "No se han podido leer los datos de Google Analytics en este momento.";
  if (Object.keys(errors).length === 0) cache.set(key, { at: Date.now(), v: res });
  return res;
}

export async function computeRealtime(): Promise<RealtimeResult> {
  const off: RealtimeResult = { ok: false, error: null, active: 0, pages: [], countries: [], devices: [] };
  if (!ga4Configured()) return off;
  try {
    const top = (dim: string) =>
      runRealtime({ dimensions: [{ name: dim }], metrics: [{ name: "activeUsers" }], limit: 8, orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }] })
        .then((r) => safeRows(r).map((x) => ({ name: str(x.d[0]) || "Desconocido", users: num(x.m[0]) })));
    const [tot, pages, countries, devices] = await Promise.all([
      runRealtime({ metrics: [{ name: "activeUsers" }] }).then(safeRows),
      top("unifiedScreenName"), top("country"), top("deviceCategory"),
    ]);
    return { ok: true, error: null, active: num(tot[0]?.m[0]), pages, countries, devices };
  } catch (e) {
    console.error("[stats:realtime]", errMsg(e));
    return { ...off, error: "No se han podido cargar los datos en tiempo real." };
  }
}
