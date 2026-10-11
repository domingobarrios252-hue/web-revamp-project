/**
 * Equivalencias verificadas entre las fichas de la Selección Española
 * (special_piece_members.id) y los resultados de Vensport (país ESP).
 * Prioridad: dorsal oficial (identificador estable en ASU26) → alias verificados.
 */
export type SpainLink = { bibs: string[]; aliases: string[]; sportName?: string };

export const SPAIN_LINKS: Record<string, SpainLink> = {
  // Jhoan Sebastián Guzmán Bitar · nombre deportivo «Chevi Guzmán»
  "2dd0c98f-a7e0-48e8-b00c-d23f73a56f75": { bibs: ["405"], aliases: ["Jhoan Guzman", "Chevi Guzman", "Jhoan Sebastian Guzman Bitar"], sportName: "Chevi Guzmán" },
  "ed51b5b5-eb74-45b7-8fa8-4b4fba3642d0": { bibs: ["79"], aliases: ["Carla Plana Olivares", "Carla Plana"] },
  "53190d1b-c1a8-4008-af65-db07996d4397": { bibs: ["80"], aliases: ["Paula Rodriguez"] },
  "76b6d773-0ee5-4fc4-8818-ccb431d55b7e": { bibs: ["191"], aliases: ["Iker Breton Barasoain", "Iker Breton"] },
  "cae2caca-4554-48c3-a76e-e77a2b458858": { bibs: [], aliases: ["Aura Quintana"] },
  "d9e8f7d5-b78f-4a33-a810-d34b5bb37780": { bibs: [], aliases: ["Patxi Peula", "Francisco Jose Patxi Peula", "Francisco Jose Peula"] },
  "e0523f71-8a1d-4c89-9fb0-6ef0b91ac5de": { bibs: [], aliases: ["Manu Taibo", "Manuel Taibo"] },
};

export const normName = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z\s]/g, " ").replace(/\s+/g, " ").trim();

/** Devuelve el id de ficha vinculado a un resultado ESP, o null si no hay equivalencia verificada. */
export function linkSpainResult(r: { bib: string | null; athlete: string }, memberIds: string[]): string | null {
  const bib = (r.bib ?? "").trim();
  const name = normName(r.athlete);
  for (const id of memberIds) {
    const l = SPAIN_LINKS[id];
    if (l && bib && l.bibs.includes(bib)) return id;
  }
  for (const id of memberIds) {
    const l = SPAIN_LINKS[id];
    if (l && l.aliases.some((a) => normName(a) === name)) return id;
  }
  return null;
}
