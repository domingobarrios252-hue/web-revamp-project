import { createFileRoute } from "@tanstack/react-router";
import { ResultadosIndex } from "./resultados.index";
import { bilingualHead } from "@/lib/i18n/paths";

export const Route = createFileRoute("/en/results/")({
  head: () => bilingualHead("Results", "Speed skating classifications, athletes and championship archives.", "/resultados", "/en/results", "en"),
  component: ResultadosIndex,
});
