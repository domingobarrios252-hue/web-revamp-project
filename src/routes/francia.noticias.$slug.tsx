import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/francia/noticias/$slug")({
  beforeLoad: ({ params }) => {
    throw redirect({ to: "/noticias/articulo/$slug", params: { slug: params.slug } });
  },
});