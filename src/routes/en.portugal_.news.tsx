import { createFileRoute } from "@tanstack/react-router";
import { TerritoryNewsIndex } from "@/components/territory/TerritoryNewsIndex";
import { PORTUGAL } from "@/lib/territory/territories";
import { bilingualHead } from "@/lib/i18n/paths";
export const Route = createFileRoute("/en/portugal_/news")({
  head: () => bilingualHead("Portugal news", "Speed skating news from the RollerZone Portugal edition.", "/portugal/noticias", "/en/portugal/news", "en"),
  component: () => <TerritoryNewsIndex territory={PORTUGAL} />,
});