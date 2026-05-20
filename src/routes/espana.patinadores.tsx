import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/espana/patinadores")({
  beforeLoad: () => {
    throw redirect({ to: "/hub/$country/patinadores", params: { country: "es" } });
  },
});
