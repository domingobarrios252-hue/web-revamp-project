import { createFileRoute } from "@tanstack/react-router";
import { MiamiWorkspace } from "@/components/miami/MiamiWorkspace";

export const Route = createFileRoute("/dashboard/miami")({
  head: () => ({
    meta: [
      { title: "Mi panel Miami | RollerZone" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MiamiWorkspace,
});
