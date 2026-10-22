import { useUiText } from "@/lib/i18n/uiText";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { TerritoryMasthead, TerritoryNewsCard } from "./TerritoryCards";
import { useTerritoryNews } from "@/lib/territory/useTerritory";
import type { Territory } from "@/lib/territory/territories";

export function TerritoryNewsIndex({ territory }: { territory: Territory }) {
  const { items, loading } = useTerritoryNews(territory.code, 60);
  const { lang } = useLanguage();
  const ui = useUiText();
  return <div className="mx-auto max-w-7xl px-4 py-10 md:px-8">
    <TerritoryMasthead territory={territory} subtitle={lang === "en" ? `News · ${territory.code === "fr" ? "France" : territory.name} edition` : `Noticias · Edición ${territory.name}`} />
    {loading ? <p className="mt-8 text-muted-foreground">{ui("Cargando…")}</p> : !items.length ? <p className="mt-8 text-muted-foreground">{lang === "en" ? "No news has been published in this edition yet." : "Aún no hay noticias publicadas en esta edición."}</p> : <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{items.map(item => <TerritoryNewsCard key={item.id} item={item} territory={territory} />)}</div>}
  </div>;
}