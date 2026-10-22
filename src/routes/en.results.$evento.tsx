import { createFileRoute } from "@tanstack/react-router";
import { loadResultsPage, ResultsPageView, type SearchParams } from "./resultados.$evento";
import { bilingualHead } from "@/lib/i18n/paths";
export const Route = createFileRoute("/en/results/$evento")({
  validateSearch: (search: Record<string, unknown>): SearchParams => Object.fromEntries(Object.entries(search).filter(([key, value]) => ["prueba", "categoria", "sexo", "ronda", "club", "federacion", "modalidad", "pais", "nombre"].includes(key) && typeof value === "string")),
  loader: loadResultsPage,
  head: ({ loaderData, params }) => {
    const name = loaderData?.meta?.name ?? loaderData?.rows[0]?.event_name ?? "Results";
    const metadata = bilingualHead(`${name} results`, `Classifications and results for ${name}.`, `/resultados/${params.evento}`, `/en/results/${params.evento}`, "en");
    const image = loaderData?.meta?.banner_url;
    return { ...metadata, meta: [...metadata.meta, ...(image?.startsWith("https://") ? [{ property: "og:image", content: image }, { name: "twitter:image", content: image }] : [])] };
  },
  component: EnglishResults,
});
function EnglishResults() { return <ResultsPageView data={Route.useLoaderData()} search={Route.useSearch()} />; }
