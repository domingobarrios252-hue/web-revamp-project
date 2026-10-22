import { createFileRoute } from "@tanstack/react-router";
import { EventosPage } from "./eventos.index";
import { bilingualHead } from "@/lib/i18n/paths";

export const Route = createFileRoute("/en/events/")({
  head: () => bilingualHead("Events", "Speed skating competition calendar, dates and venues.", "/eventos", "/en/events", "en"),
  component: EventosPage,
});
