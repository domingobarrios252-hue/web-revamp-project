import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/francia_/noticias_/$slug")({
  beforeLoad: ({ params }) => {
    throw redirect({ to: "/noticias/articulo/$slug", params: { slug: params.slug } });
  },
});