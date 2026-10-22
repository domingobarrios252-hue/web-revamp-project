import { createFileRoute } from "@tanstack/react-router";
import { BilingualHubPage } from "@/components/hub/BilingualHubPage";
import { bilingualHead } from "@/lib/i18n/paths";
export const Route = createFileRoute("/en/hub/$country")({
 head: ({ params }) => bilingualHead(`RollerZone ${params.country === "es" ? "Spain" : params.country === "co" ? "Colombia" : params.country.toUpperCase()}`, "Country speed skating news, competitions and interviews.", `/hub/${params.country}`, `/en/hub/${params.country}`, "en"),
 component: EnglishHub,
});
function EnglishHub() { return <BilingualHubPage country={Route.useParams().country} />; }
