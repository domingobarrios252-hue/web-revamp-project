import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/francia")({
  component: FranceLayout,
});

function FranceLayout() {
  return <Outlet />;
}