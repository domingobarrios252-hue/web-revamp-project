import { createFileRoute } from "@tanstack/react-router";
import { TerritoryWorkspace } from "@/components/territory/TerritoryWorkspace";
import { PORTUGAL } from "@/lib/territory/territories";

export const Route = createFileRoute("/dashboard/portugal")({
  head: () => ({
    meta: [
      { title: "Mi panel Portugal | RollerZone" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => <TerritoryWorkspace territory={PORTUGAL} />,
});
