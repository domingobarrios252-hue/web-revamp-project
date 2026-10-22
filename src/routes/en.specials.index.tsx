import { createFileRoute } from "@tanstack/react-router";
import { SpecialsIndex } from "./especiales.index";
import { bilingualHead } from "@/lib/i18n/paths";

export const Route = createFileRoute("/en/specials/")({
  head: () => bilingualHead("Special coverage", "Championship coverage, interviews and historical archives.", "/especiales", "/en/specials", "en"),
  component: SpecialsIndex,
});
