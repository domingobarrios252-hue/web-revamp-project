import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * Alias del panel del editor territorial de Miami: reutiliza la arquitectura
 * editorial existente en /dashboard/miami.
 */
export const Route = createFileRoute("/editor/miami")({
  beforeLoad: () => {
    throw redirect({ to: "/dashboard/miami", replace: true });
  },
});
