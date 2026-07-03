/**
 * Configuración central del especial "Camino al Europeo 2026".
 * Fuente única de verdad para piezas del dossier, datos del evento y
 * convocatoria de la selección española. Editable y escalable: para añadir
 * una nueva pieza basta con añadir un objeto al array PIECES y crear la
 * ruta correspondiente en src/routes/camino-al-europeo-2026.<slug>.tsx
 */

import specialFallback from "@/assets/special-fallback.svg";

export const SPECIAL_BASE_PATH = "/camino-al-europeo-2026" as const;

/** Imagen de respaldo con identidad RollerZone cuando una pieza no tiene imagen destacada. */
export const SPECIAL_FALLBACK_IMAGE = specialFallback as string;

export const EVENT = {
  name: "Campeonato de Europa de Patinaje de Velocidad 2026",
  shortName: "Europeo 2026",
  venue: "Cardano al Campo",
  region: "Varese, Italia",
  country: "Italia",
  startDate: "2026-07-19",
  endDate: "2026-07-26",
  datesLabel: "19 – 26 de julio de 2026",
  disciplines: ["Pista", "Ruta", "Maratón"],
  officialUrl: "https://www.euroskatingcardano2026.it/",
  heroImage:
    "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1920&q=80",
};

export const EVENT_PROGRAM: Array<{
  date: string;
  label: string;
  title: string;
  kind: "ceremony" | "track" | "rest" | "road" | "marathon";
  description: string;
}> = [
  {
    date: "2026-07-19",
    label: "Domingo 19 julio",
    title: "Ceremonia de apertura",
    kind: "ceremony",
    description: "Acto inaugural del Europeo en Cardano al Campo.",
  },
  {
    date: "2026-07-20",
    label: "Lunes 20 julio",
    title: "Pruebas de pista (jornada 1)",
    kind: "track",
    description: "Inicio de la competición en pista.",
  },
  {
    date: "2026-07-21",
    label: "Martes 21 julio",
    title: "Pruebas de pista (jornada 2)",
    kind: "track",
    description: "Continúa el programa de pista.",
  },
  {
    date: "2026-07-22",
    label: "Miércoles 22 julio",
    title: "Pruebas de pista (jornada 3)",
    kind: "track",
    description: "Cierre de la competición en pista.",
  },
  {
    date: "2026-07-23",
    label: "Jueves 23 julio",
    title: "Jornada de descanso",
    kind: "rest",
    description: "Día sin competición / posible recuperación.",
  },
  {
    date: "2026-07-24",
    label: "Viernes 24 julio",
    title: "Pruebas de ruta (jornada 1)",
    kind: "road",
    description: "Comienzan las pruebas en circuito de ruta.",
  },
  {
    date: "2026-07-25",
    label: "Sábado 25 julio",
    title: "Pruebas de ruta (jornada 2)",
    kind: "road",
    description: "Cierre de las pruebas de ruta.",
  },
  {
    date: "2026-07-26",
    label: "Domingo 26 julio",
    title: "Maratón",
    kind: "marathon",
    description: "Gran final con el maratón europeo.",
  },
];

export type PieceSlug =
  | "presentacion-europeo-2026"
  | "convocatoria-seleccion-espanola"
  | "calendario-y-sedes"
  | "entrevista-seleccionador"
  | "informacion-campeonato"
  | "resultados-y-medallero"
  | "galeria-rollerzone-tv";

export type SpecialPiece = {
  slug: PieceSlug;
  number: string;
  kicker: string;
  title: string;
  description: string;
  image: string;
  featured?: boolean;
  status?: "live" | "preparing" | "upcoming";
};

export const PIECES: SpecialPiece[] = [
  {
    slug: "presentacion-europeo-2026",
    number: "01",
    kicker: "Presentación",
    title: "El Europeo 2026, en juego en Cardano al Campo",
    description:
      "Qué es, dónde se disputa y por qué este Europeo marca la temporada del patinaje de velocidad.",
    image:
      "https://images.unsplash.com/photo-1530549387789-4c1017266635?auto=format&fit=crop&w=1600&q=80",
    featured: true,
  },
  {
    slug: "convocatoria-seleccion-espanola",
    number: "02",
    kicker: "Selección",
    title: "Convocatoria oficial de la selección española",
    description:
      "Los patinadores y patinadoras elegidos por Garikoitz Lerga para defender a España en el Europeo.",
    image:
      "https://images.unsplash.com/photo-1518604666860-9ed391f76460?auto=format&fit=crop&w=1600&q=80",
    featured: true,
  },
  {
    slug: "calendario-y-sedes",
    number: "03",
    kicker: "Agenda",
    title: "Calendario y sedes del Europeo",
    description:
      "Día a día del campeonato: ceremonia, pista, ruta y maratón en Cardano al Campo.",
    image:
      "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1600&q=80",
  },
  {
    slug: "entrevista-seleccionador",
    number: "04",
    kicker: "Entrevista",
    title: "Entrevista al seleccionador y protagonistas",
    description:
      "Las voces que marcarán el camino de España hasta Italia.",
    image:
      "https://images.unsplash.com/photo-1521412644187-c49fa049e84d?auto=format&fit=crop&w=1600&q=80",
  },
  {
    slug: "informacion-campeonato",
    number: "05",
    kicker: "Guía",
    title: "Información del campeonato y datos clave",
    description:
      "Ficha técnica, sede, accesos e información útil del Europeo 2026.",
    image:
      "https://images.unsplash.com/photo-1505739679850-7adc7c2dbbf6?auto=format&fit=crop&w=1600&q=80",
  },
  {
    slug: "resultados-y-medallero",
    number: "06",
    kicker: "Resultados",
    title: "Resultados y medallero del Europeo",
    description:
      "Espacio preparado para seguir las medallas y la actuación española durante el campeonato.",
    image:
      "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1600&q=80",
    status: "preparing",
  },
  {
    slug: "galeria-rollerzone-tv",
    number: "07",
    kicker: "Galería",
    title: "Galería y RollerZone TV del Europeo",
    description:
      "Fotos, vídeos y momentos en directo del Europeo a través de RollerZone TV.",
    image:
      "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1600&q=80",
    status: "preparing",
  },
];

export function getPiece(slug: PieceSlug): SpecialPiece {
  const p = PIECES.find((x) => x.slug === slug);
  if (!p) throw new Error(`Pieza no encontrada: ${slug}`);
  return p;
}

export function piecePath(slug: PieceSlug | string): string {
  return `${SPECIAL_BASE_PATH}/${slug}`;
}

/* ============== Convocatoria Selección Española ==============
 * TODO: completar con los nombres reales de la convocatoria adjunta.
 * La estructura ya está lista para pegarlos por categoría y género.
 */

export type Roster = {
  juvenil: string[];
  junior: string[];
  senior: string[];
};

export type SpainCallup = {
  coach: string;
  noteUrl?: string;
  imageUrl?: string;
  masculino: Roster;
  femenino: Roster;
};

export const SPAIN_CALLUP: SpainCallup = {
  coach: "Garikoitz Lerga",
  imageUrl: undefined,
  masculino: {
    juvenil: [
      "Yoel Álvarez — Novares",
      "Adrià Fernández — CPV El Prat",
      "Pablo González — M Urban",
      "Adrián Portilla — Almassora",
      "Iñaki Unanua — San Juan",
    ],
    junior: [
      "Iker Bretón — Ciudad Turia",
      "Raúl Couto — SCD Rabadeira",
      "Oier Lara — CD Amaya",
      "Marc Sales — Almassora",
    ],
    senior: [
      "Adrián Alonso — Rolling Lemons",
      "Chevi Guzmán — Celta Patín",
      "Daniel Milagros — Ciudad Turia",
      "Patxi Peula — Desliza Vitoria",
      "Manuel Taibo — SCD Rabadeira",
    ],
  },
  femenino: {
    juvenil: [
      "Greta Arriezu — Txantrea",
      "Nora Carné — Paiporta",
      "Uxue Cruz — Txantrea",
      "Ane Miqueleiz — CD Amaya",
      "Emilia Ranjel — CMP Arganda",
      "Angélica Rosero — Ciudad Turia",
    ],
    junior: [
      "Sara Bedia — Astur Patín",
      "Leyre Montiel — Astur Patín",
      "Carla Plana — Nàstic",
      "Paula Rodríguez — San Juan",
      "Uxue Sola — San Juan",
    ],
    senior: [
      "Ruth Arza — Txantrea",
      "Luisa González — CPV El Prat",
      "Aura Quintana — Desliza Vitoria",
      "Ona Rodríguez — CPV El Prat",
      "Amaia Zubiri — Txantrea",
    ],
  },
};
