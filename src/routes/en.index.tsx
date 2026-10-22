import { createFileRoute } from "@tanstack/react-router";
import { HomePage } from "./index";
import { bilingualHead } from "@/lib/i18n/paths";

export const Route = createFileRoute("/en/")({
  head: () => bilingualHead("RollerZone", "Speed skating news, interviews, competitions and magazine.", "/", "/en", "en"),
  component: HomePage,
});
