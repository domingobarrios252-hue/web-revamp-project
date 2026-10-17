import { createFileRoute } from "@tanstack/react-router";
import { TerritoryWorkspace } from "@/components/territory/TerritoryWorkspace";
import { FRANCE } from "@/lib/territory/territories";

export const Route = createFileRoute("/dashboard/francia")({
  head: () => ({
    meta: [
      { title: "Mi panel Francia | RollerZone" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => <TerritoryWorkspace territory={FRANCE} />,
});
