import { createFileRoute } from "@tanstack/react-router";
import { FranciaHome } from "./francia";
import { bilingualHead } from "@/lib/i18n/paths";

export const Route = createFileRoute("/en/france")({
  head: () => bilingualHead("RollerZone France", "Speed skating news and interviews from France.", "/francia", "/en/france", "en"),
  component: FranciaHome,
});
