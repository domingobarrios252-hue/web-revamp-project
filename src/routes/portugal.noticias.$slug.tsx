import { createFileRoute, redirect } from "@tanstack/react-router";

/** URL territorial: /portugal/noticias/<slug> → artículo canónico de RollerZone. */
export const Route = createFileRoute("/portugal/noticias/$slug")({
  beforeLoad: ({ params }) => {
    throw redirect({ to: "/noticias/articulo/$slug", params: { slug: params.slug } });
  },
});
