/**
 * Delegaciones territoriales de RollerZone.
 *
 * Reutilizan la arquitectura editorial existente: news.country_code /
 * interviews.country_code = code. No hay tablas ni flujos paralelos, y las
 * políticas RLS + triggers del servidor ya son genéricas por territorio.
 */
export type TerritoryCode = "mia" | "pt" | "fr";

export type Territory = {
  code: TerritoryCode;
  /** Nombre corto ("Miami", "Portugal"). */
  name: string;
  /** Bandera / emoji identificativo. */
  flag: string;
  basePath: "/usa" | "/portugal" | "/francia";
  newsPath: "/usa/noticias" | "/portugal/noticias" | "/francia/noticias";
  interviewsPath: "/usa/entrevistas" | "/portugal/entrevistas" | "/francia/entrevistas";
  dashboardPath: "/dashboard/miami" | "/dashboard/portugal" | "/dashboard";
  adminPath: "/admin/miami" | "/admin/portugal" | "/admin/francia";
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

export const FRANCE: Territory = {
  code: "fr",
  name: "Francia",
  flag: "🇫🇷",
  basePath: "/francia",
  newsPath: "/francia/noticias",
  interviewsPath: "/francia/entrevistas",
  dashboardPath: "/dashboard",
  adminPath: "/admin/francia",
  subtitle: "Actualidad del patinaje de velocidad francés.",
};

export const TERRITORIES: Record<TerritoryCode, Territory> = {
  mia: MIAMI,
  pt: PORTUGAL,
  fr: FRANCE,
};

/** Compatibilidad con el código previo de Miami. */
export const MIAMI_CODE = MIAMI.code;
