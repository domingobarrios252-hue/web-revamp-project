import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/espana/archivo")({
  beforeLoad: () => {
    throw redirect({ to: "/hub/$country/archivo", params: { country: "es" } });
  },
});
