import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * El registro público se ha eliminado. /auth se mantiene como alias del acceso
 * privado del equipo para no romper enlaces internos antiguos.
 */
export const Route = createFileRoute("/auth")({
  beforeLoad: () => {
    throw redirect({ to: "/acceso-interno", replace: true });
  },
});
