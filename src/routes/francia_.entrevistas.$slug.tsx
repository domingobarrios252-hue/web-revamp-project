import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/francia_/entrevistas/$slug")({
  beforeLoad: ({ params }) => {
    throw redirect({ to: "/entrevistas/$slug", params: { slug: params.slug } });
  },
});