import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/portugal")({
  component: () => <Outlet />,
});
