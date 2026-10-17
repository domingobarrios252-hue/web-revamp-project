import { createFileRoute } from "@tanstack/react-router";
import { TerritoryWorkspace } from "@/components/territory/TerritoryWorkspace";
import { FRANCE } from "@/lib/territory/territories";

export const Route = createFileRoute("/admin/francia")({
  head: () => ({
    meta: [
      { title: "RollerZone Francia | Panel" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => <TerritoryWorkspace territory={FRANCE} />,
});
