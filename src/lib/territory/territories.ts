/**
 * Delegaciones territoriales de RollerZone.
 *
 * Reutilizan la arquitectura editorial existente: news.country_code /
 * interviews.country_code = code. No hay tablas ni flujos paralelos, y las
 * políticas RLS + triggers del servidor ya son genéricas por territorio.
 */
export type TerritoryCode = "mia" | "pt";

export type Territory = {
  code: TerritoryCode;
  /** Nombre corto ("Miami", "Portugal"). */
  name: string;
  /** Bandera / emoji identificativo. */
  flag: string;
  basePath: "/usa" | "/portugal";
  newsPath: "/usa/noticias" | "/portugal/noticias";
  interviewsPath: "/usa/entrevistas" | "/portugal/entrevistas";
  dashboardPath: "/dashboard/miami" | "/dashboard/portugal";
  adminPath: "/admin/miami" | "/admin/portugal";
  subtitle: string;
};

export const MIAMI: Territory = {
  code: "mia",
  name: "USA",
  flag: "🇺🇸",
  basePath: "/usa",
  newsPath: "/usa/noticias",
  interviewsPath: "/usa/entrevistas",
  dashboardPath: "/dashboard/miami",
  adminPath: "/admin/miami",
  subtitle: "Noticias y entrevistas del patinaje de velocidad en Estados Unidos",
};

export const PORTUGAL: Territory = {
  code: "pt",
  name: "Portugal",
  flag: "🇵🇹",
  basePath: "/portugal",
  newsPath: "/portugal/noticias",
  interviewsPath: "/portugal/entrevistas",
  dashboardPath: "/dashboard/portugal",
  adminPath: "/admin/portugal",
  subtitle: "Noticias y entrevistas del patinaje de velocidade em Portugal",
};

export const TERRITORIES: Record<TerritoryCode, Territory> = {
  mia: MIAMI,
  pt: PORTUGAL,
};

/** Compatibilidad con el código previo de Miami. */
export const MIAMI_CODE = MIAMI.code;
