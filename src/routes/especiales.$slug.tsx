import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/especiales/$slug")({
  component: () => <Outlet />,
});
