import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/espana/rollerzone-tv")({
  beforeLoad: () => {
    throw redirect({ to: "/hub/$country/tv", params: { country: "es" } });
  },
});
