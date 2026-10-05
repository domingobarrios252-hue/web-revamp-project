import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

// Slugs antiguos → nuevos (redirección 301).
const LEGACY_SLUGS: Record<string, string> = {
  "world-skate-games-asu26-patinaje-velocidad-copia-vmrz": "world-skate-games-asu26-patinaje-velocidad",
};

export const Route = createFileRoute("/especiales/$slug")({
  beforeLoad: ({ params, location }) => {
    const target = LEGACY_SLUGS[params.slug];
    if (target) {
      throw redirect({
        href: location.href.replace(`/especiales/${params.slug}`, `/especiales/${target}`),
        statusCode: 301,
      });
    }
  },
  component: () => <Outlet />,
});
