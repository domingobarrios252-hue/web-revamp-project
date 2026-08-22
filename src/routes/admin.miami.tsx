import { createFileRoute } from "@tanstack/react-router";
import { MiamiWorkspace } from "@/components/miami/MiamiWorkspace";

export const Route = createFileRoute("/admin/miami")({
  head: () => ({
    meta: [
      { title: "RollerZone Miami | Panel" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MiamiWorkspace,
});
