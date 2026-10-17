import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/francia")({
  beforeLoad: () => {
    throw redirect({ to: "/admin", search: { hub: "fr" }, replace: true });
  },
});