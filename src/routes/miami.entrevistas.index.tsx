import { createFileRoute, redirect } from "@tanstack/react-router";

/** Dirección antigua del hub Miami: redirige de forma permanente al hub USA. */
export const Route = createFileRoute("/miami/entrevistas/")({
  beforeLoad: () => {
    throw redirect({ to: "/usa/entrevistas", statusCode: 301 });
  },
});
