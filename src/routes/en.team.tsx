import { createFileRoute } from "@tanstack/react-router";
import { EquipoPage } from "./equipo";
import { bilingualHead } from "@/lib/i18n/paths";

export const Route = createFileRoute("/en/team")({
  head: () => bilingualHead("Team", "The editors and contributors behind RollerZone.", "/equipo", "/en/team", "en"),
  component: EquipoPage,
});
