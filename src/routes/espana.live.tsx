import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/espana/live")({
  beforeLoad: () => {
    throw redirect({ to: "/hub/$country/live", params: { country: "es" } });
  },
});
