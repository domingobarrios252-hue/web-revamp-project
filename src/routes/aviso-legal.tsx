import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/aviso-legal")({
  beforeLoad: () => {
    throw redirect({ to: "/legal/$slug", params: { slug: "aviso-legal" } });
  },
});
