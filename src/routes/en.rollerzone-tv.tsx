import { createFileRoute } from "@tanstack/react-router";
import { RollerzoneTvPage } from "@/components/tv/RollerzoneTvPage";
import { bilingualHead } from "@/lib/i18n/paths";
export const Route = createFileRoute("/en/rollerzone-tv")({ head: () => bilingualHead("RollerZone TV", "Speed skating broadcasts and competition archive.", "/rollerzone-tv", "/en/rollerzone-tv", "en"), component: RollerzoneTvPage });
