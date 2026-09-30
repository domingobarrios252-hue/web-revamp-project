import { createFileRoute, redirect } from "@tanstack/react-router";

/** Dirección antigua del hub Miami: redirige de forma permanente al hub USA. */
export const Route = createFileRoute("/miami/")({
  beforeLoad: () => {
    throw redirect({ to: "/usa/$region/$city", params: { region: "florida", city: "miami" }, statusCode: 301 });
  },
});
