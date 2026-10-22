import { createFileRoute } from "@tanstack/react-router";
import { UsaHome } from "./usa.index";
import { bilingualHead } from "@/lib/i18n/paths";

export const Route = createFileRoute("/en/usa")({
  head: () => bilingualHead("RollerZone USA", "Speed skating news and interviews from the United States.", "/usa", "/en/usa", "en"),
  component: UsaHome,
});
