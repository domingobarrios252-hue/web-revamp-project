import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/hub/$country/clubes")({
  component: () => <Outlet />,
});
