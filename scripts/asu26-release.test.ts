import { test, expect } from "bun:test";
import { asu26ReleaseState, asu26EditionResponse } from "../src/lib/magazine/asu26Release";
const launch = Date.parse("2026-11-15T16:15:00Z");
const links = { es: "https://rollerzonecolombiadigital.aflip.in/e1fb399f1b.html", en: "https://rollerzonecolombiadigital.aflip.in/73f06e9b58.html" };
test("apertura inmediata autorizada el 15 noviembre a las 17:15 Europe/Madrid", () => {
  expect(new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Madrid", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(launch)).toBe("17:15");
  expect(asu26ReleaseState(Date.parse("2026-11-15T16:15:00Z"), links).editions).toEqual({ es: true, en: true });
});
test("un milisegundo antes del estreno bloquea ambas ediciones incluso configuradas", () => {
  expect(asu26ReleaseState(launch - 1, links).editions).toEqual({ es: false, en: false });
  expect(asu26EditionResponse("es", launch - 1, links).status).toBe(403);
  expect(asu26EditionResponse("en", launch - 1, links).headers.get("Location")).toBeNull();
});
test("desde la apertura adelantada cada edición redirige a su propio enlace", () => {
  expect(asu26ReleaseState(launch, links).editions).toEqual({ es: true, en: true });
  for (const edition of ["es", "en"] as const) {
    const response = asu26EditionResponse(edition, launch, links);
    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe(links[edition]);
    expect(response.headers.get("Cache-Control")).toContain("no-store");
  }
});
test("enlaces pendientes mantienen ambos botones desactivados tras el estreno", () => {
  expect(asu26ReleaseState(launch + 1, { es: undefined, en: undefined }).editions).toEqual({ es: false, en: false });
  expect(asu26EditionResponse("es", launch, { es: undefined, en: undefined }).status).toBe(503);
});
test("configurar solo español no activa inglés", () => {
  expect(asu26ReleaseState(launch, { es: links.es, en: undefined }).editions).toEqual({ es: true, en: false });
});
test("no admite redirecciones arbitrarias o enlaces inválidos", () => {
  for (const es of ["http://heyzine.com/book", "https://heyzine.com.evil.example/book", "[PEGAR ENLACE HEYZINE ES]", "https://heyzine.com/", "https://aflip.in/book", "https://rollerzonecolombiadigital.aflip.in.evil.example/book", "http://rollerzonecolombiadigital.aflip.in/book"]) {
    expect(asu26ReleaseState(launch, { es, en: undefined }).editions.es).toBe(false);
  }
  expect(asu26EditionResponse("fr", launch, links).status).toBe(404);
});