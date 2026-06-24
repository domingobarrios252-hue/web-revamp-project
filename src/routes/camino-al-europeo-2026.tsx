import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/camino-al-europeo-2026")({
  component: () => <Outlet />,
});
