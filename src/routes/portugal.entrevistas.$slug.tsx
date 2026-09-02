import { createFileRoute, redirect } from "@tanstack/react-router";

/** URL territorial: /portugal/entrevistas/<slug> → entrevista canónica de RollerZone. */
export const Route = createFileRoute("/portugal/entrevistas/$slug")({
  beforeLoad: ({ params }) => {
    throw redirect({ to: "/entrevistas/$slug", params: { slug: params.slug } });
  },
});
