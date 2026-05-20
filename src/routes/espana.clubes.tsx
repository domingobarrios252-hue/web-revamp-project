import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/espana/clubes")({
  beforeLoad: () => {
    throw redirect({ to: "/hub/$country/clubes", params: { country: "es" } });
  },
});
