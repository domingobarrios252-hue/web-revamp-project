export function clearedArchiveFilters() {
  return { modalidad: "", prueba: "", categoria: "", sexo: "", ronda: "", pais: "", nombre: "" };
}

export function pendingArchiveName(value: string, current: string, clearing: boolean) {
  return clearing || value === current ? null : value.trim();
}