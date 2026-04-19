import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/privacidad")({
  beforeLoad: () => {
    throw redirect({ to: "/legal/$slug", params: { slug: "privacidad" } });
  },
});
