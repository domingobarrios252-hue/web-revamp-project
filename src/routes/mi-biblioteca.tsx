import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * La biblioteca ya es 100 % pública: no existen cuentas de lector.
 * Se mantiene la URL para no romper enlaces antiguos y se redirige a /revista.
 */
export const Route = createFileRoute("/mi-biblioteca")({
  beforeLoad: () => {
    throw redirect({ to: "/revista", replace: true });
  },
});
