import { createFileRoute } from "@tanstack/react-router";
import { NoticiasIndexPage } from "./noticias.index";
import { bilingualHead } from "@/lib/i18n/paths";

export const Route = createFileRoute("/en/news/")({
  head: () => bilingualHead("Speed skating news", "Speed skating news and reports from Spain and around the world.", "/noticias", "/en/news", "en"),
  component: NoticiasIndexPage,
});
