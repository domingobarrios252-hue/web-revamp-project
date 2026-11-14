import { createServerFn } from "@tanstack/react-start";
import { setResponseHeader } from "@tanstack/react-start/server";
import { ASU26_RELEASE_HEADERS, asu26ReleaseState } from "./asu26Release";

export const getAsu26Release = createServerFn({ method: "POST" }).handler(() => {
  setResponseHeader("Cache-Control", ASU26_RELEASE_HEADERS["Cache-Control"]);
  setResponseHeader("CDN-Cache-Control", ASU26_RELEASE_HEADERS["CDN-Cache-Control"]);
  // Intentionally unset until the owner supplies each final edition URL.
  return asu26ReleaseState(Date.now(), {
    es: process.env['ASU26_HEYZINE_ES_URL'],
    en: process.env['ASU26_HEYZINE_EN_URL'],
  });
});