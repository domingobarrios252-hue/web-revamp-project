import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/paises")({
  beforeLoad: () => {
    throw redirect({ to: "/" });
  },
});
