import { createFileRoute } from "@tanstack/react-router";
import { TerritoryNewsIndex } from "@/components/territory/TerritoryNewsIndex";
import { FRANCE } from "@/lib/territory/territories";
import { bilingualHead } from "@/lib/i18n/paths";
export const Route = createFileRoute("/en/france_/news")({
  head: () => bilingualHead("France news", "Speed skating news from the RollerZone France edition.", "/francia/noticias", "/en/france/news", "en"),
  component: () => <TerritoryNewsIndex territory={FRANCE} />,
});