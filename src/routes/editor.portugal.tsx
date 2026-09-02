import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * Alias del panel del editor territorial de Portugal: reutiliza la arquitectura
 * editorial existente en /dashboard/portugal.
 */
export const Route = createFileRoute("/editor/portugal")({
  beforeLoad: () => {
    throw redirect({ to: "/dashboard/portugal", replace: true });
  },
});
