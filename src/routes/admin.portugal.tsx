import { createFileRoute } from "@tanstack/react-router";
import { TerritoryWorkspace } from "@/components/territory/TerritoryWorkspace";
import { PORTUGAL } from "@/lib/territory/territories";

export const Route = createFileRoute("/admin/portugal")({
  head: () => ({
    meta: [
      { title: "RollerZone Portugal | Panel" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => <TerritoryWorkspace territory={PORTUGAL} />,
});
