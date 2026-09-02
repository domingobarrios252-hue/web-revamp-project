import { createFileRoute } from "@tanstack/react-router";
import { TerritoryWorkspace } from "@/components/territory/TerritoryWorkspace";
import { MIAMI } from "@/lib/territory/territories";

export const Route = createFileRoute("/dashboard/miami")({
  head: () => ({
    meta: [
      { title: "Mi panel Miami | RollerZone" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => <TerritoryWorkspace territory={MIAMI} />,
});
