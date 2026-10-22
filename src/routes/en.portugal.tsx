import { createFileRoute } from "@tanstack/react-router";
import { PortugalHome } from "./portugal.index";
import { bilingualHead } from "@/lib/i18n/paths";

export const Route = createFileRoute("/en/portugal")({
  head: () => bilingualHead("RollerZone Portugal", "Speed skating news and interviews from Portugal.", "/portugal", "/en/portugal", "en"),
  component: PortugalHome,
});
