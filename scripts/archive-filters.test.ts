import { expect, test } from "bun:test";
import { clearedArchiveFilters, pendingArchiveName } from "../src/lib/results/archiveFilters";

test("clearing archive filters also removes ESP and the skater search", () => {
  const filters = { ...{ pais: "ESP", nombre: "Guzman", modalidad: "Pista" }, ...clearedArchiveFilters() };
  expect(filters.pais).toBe("");
  expect(filters.nombre).toBe("");
  expect(filters.modalidad).toBe("");
});
test("clearing does not schedule a stale name update restoring country", () => {
  expect(pendingArchiveName("", "Guzman", true)).toBeNull();
  expect(pendingArchiveName("Chevi", "Guzman", false)).toBe("Chevi");
});