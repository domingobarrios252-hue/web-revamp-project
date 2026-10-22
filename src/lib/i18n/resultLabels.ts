/** Display-only labels; never use the translated value for grouping or filtering. */
export function resultHeading(name: string, lang: "es" | "en") {
  if (lang === "es") return name;
  const labels: Record<string, string> = { masculino: "Men", femenino: "Women", pista: "Track", ruta: "Road", maratón: "Marathon", relevos: "Relay", semifinal: "Semifinal", cuartos: "Quarterfinals", series: "Heats", "clasificación general": "Overall classification" };
  return name.split(" · ").map(part => labels[part.toLowerCase()] ?? part).join(" · ");
}