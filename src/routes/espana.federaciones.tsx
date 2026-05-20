import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/espana/federaciones")({
  beforeLoad: () => {
    throw redirect({ to: "/hub/$country/federaciones", params: { country: "es" } });
  },
});
