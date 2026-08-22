import { createFileRoute, redirect } from "@tanstack/react-router";

/** URL territorial: /miami/entrevistas/<slug> → entrevista canónica de RollerZone. */
export const Route = createFileRoute("/miami/entrevistas/$slug")({
  beforeLoad: ({ params }) => {
    throw redirect({ to: "/entrevistas/$slug", params: { slug: params.slug } });
  },
});
