import { createFileRoute, redirect } from "@tanstack/react-router";

/** URL territorial: /usa/entrevistas/<slug> → entrevista canónica de RollerZone. */
export const Route = createFileRoute("/usa/entrevistas/$slug")({
  beforeLoad: ({ params }) => {
    throw redirect({ to: "/entrevistas/$slug", params: { slug: params.slug } });
  },
});
