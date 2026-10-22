import { createFileRoute } from "@tanstack/react-router";
import { RevistaPage } from "./revista.index";
import { bilingualHead } from "@/lib/i18n/paths";

export const Route = createFileRoute("/en/magazine/")({
  head: () => bilingualHead("RollerZone Magazine", "Read the published RollerZone magazine editions in our open digital library.", "/revista", "/en/magazine", "en"),
  component: RevistaPage,
});
