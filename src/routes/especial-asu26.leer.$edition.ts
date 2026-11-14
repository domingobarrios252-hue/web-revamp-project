import { createFileRoute } from "@tanstack/react-router";
import { asu26EditionResponse } from "@/lib/magazine/asu26Release";

export const Route = createFileRoute("/especial-asu26/leer/$edition")({
  server: {
    handlers: {
      GET: ({ params }) => asu26EditionResponse(params.edition, Date.now(), {
        es: process.env['ASU26_HEYZINE_ES_URL'],
        en: process.env['ASU26_HEYZINE_EN_URL'],
      }),
    },
  },
});