import { createFileRoute, redirect } from "@tanstack/react-router";

const SUBPATH_MAP: Record<string, string> = {
  noticias: "/noticias",
  eventos: "/eventos",
  entrevistas: "/entrevistas",
  atletas: "/redactores",
  patinadores: "/redactores",
  clubes: "/",
  galeria: "/",
  calendario: "/eventos",
};

export const Route = createFileRoute("/$country/$")({
  beforeLoad: ({ params }) => {
    const splat = (params as { _splat?: string })._splat ?? "";
    const first = splat.split("/")[0] ?? "";
    const dest = SUBPATH_MAP[first] ?? "/";
    throw redirect({ to: dest });
  },
});
