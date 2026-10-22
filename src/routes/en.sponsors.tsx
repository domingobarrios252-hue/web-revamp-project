import { createFileRoute } from "@tanstack/react-router";
import { SponsorsPage } from "./patrocinadores";
import { bilingualHead } from "@/lib/i18n/paths";

export const Route = createFileRoute("/en/sponsors")({
  head: () => bilingualHead("Sponsors", "Brands supporting RollerZone and speed skating.", "/patrocinadores", "/en/sponsors", "en"),
  component: SponsorsPage,
});
