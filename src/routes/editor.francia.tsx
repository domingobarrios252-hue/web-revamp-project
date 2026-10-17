import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * Alias del panel del editor territorial de Francia: reutiliza la arquitectura
 * editorial existente en /dashboard/francia.
 */
export const Route = createFileRoute("/editor/francia")({
  beforeLoad: () => {
    throw redirect({ to: "/dashboard/francia", replace: true });
  },
});
