import { createFileRoute } from "@tanstack/react-router";
import { TerritoryNewsIndex } from "@/components/territory/TerritoryNewsIndex";
import { MIAMI } from "@/lib/territory/territories";
import { bilingualHead } from "@/lib/i18n/paths";
export const Route = createFileRoute("/en/usa_/news")({
  head: () => bilingualHead("USA news", "Speed skating news from the RollerZone USA edition.", "/usa/noticias", "/en/usa/news", "en"),
  component: () => <TerritoryNewsIndex territory={MIAMI} />,
});