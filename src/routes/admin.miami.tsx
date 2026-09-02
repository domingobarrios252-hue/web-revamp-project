import { createFileRoute } from "@tanstack/react-router";
import { TerritoryWorkspace } from "@/components/territory/TerritoryWorkspace";
import { MIAMI } from "@/lib/territory/territories";

export const Route = createFileRoute("/admin/miami")({
  head: () => ({
    meta: [
      { title: "RollerZone Miami | Panel" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => <TerritoryWorkspace territory={MIAMI} />,
});
