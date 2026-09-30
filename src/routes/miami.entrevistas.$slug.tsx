import { createFileRoute, redirect } from "@tanstack/react-router";

/** Dirección antigua del hub Miami: redirige de forma permanente al hub USA. */
export const Route = createFileRoute("/miami/entrevistas/$slug")({
  beforeLoad: ({ params }) => {
    throw redirect({ to: "/entrevistas/$slug", params: { slug: params.slug }, statusCode: 301 });
  },
});
