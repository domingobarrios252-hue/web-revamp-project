import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/espana/mvp")({
  beforeLoad: () => {
    throw redirect({ to: "/hub/$country/mvp", params: { country: "es" } });
  },
});
