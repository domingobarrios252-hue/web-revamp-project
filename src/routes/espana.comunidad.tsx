import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/espana/comunidad")({
  beforeLoad: () => {
    throw redirect({ to: "/hub/$country/comunidad", params: { country: "es" } });
  },
});
