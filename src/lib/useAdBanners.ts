import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type AdBanner = {
  id: string;
  name: string;
  image_url: string;
  link_url: string | null;
  alt_text: string | null;
  sponsor?: string | null;
  active: boolean;
  starts_at?: string | null;
  ends_at?: string | null;
};

type PlacementJoinRow = {
  sort_order: number;
  ad_banners: AdBanner | null;
};

/**
 * Centralized ad banners hook.
 * Returns all active banners assigned to `placement`, filtered by
 * optional start/end date window, ordered by sort_order.
 *
 * One banner can be assigned to many placements via ad_banner_placements.
 */
export function useAdBanners(placement: string) {
  const [banners, setBanners] = useState<AdBanner[]>([]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const { data } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from("ad_banner_placements" as any)
        .select(
          "sort_order, ad_banners!inner(id,name,image_url,link_url,alt_text,active,sponsor,starts_at,ends_at)",
        )
        .eq("placement", placement)
        .eq("ad_banners.active", true)
        .order("sort_order", { ascending: true });

      if (cancelled) return;
      const now = Date.now();
      const rows = ((data as unknown as PlacementJoinRow[]) ?? [])
        .map((r) => r.ad_banners)
        .filter((b): b is AdBanner => Boolean(b))
        .filter((b) => {
          if (b.starts_at && new Date(b.starts_at).getTime() > now) return false;
          if (b.ends_at && new Date(b.ends_at).getTime() < now) return false;
          return true;
        });
      setBanners(rows);
    };

    load();

    const ch = supabase
      .channel(`ad-banners-placement-${placement}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ad_banners" },
        load,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ad_banner_placements" },
        load,
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(ch);
    };
  }, [placement]);

  return banners;
}

export type PlacementDef = {
  value: string;
  label: string;
  group: string;
};

export const AD_PLACEMENTS: PlacementDef[] = [
  { group: "Home", value: "home_top", label: "Home — banner superior (entre ticker y noticias)" },
  { group: "Home", value: "home_middle", label: "Home — entre secciones" },
  { group: "Home", value: "home_bottom", label: "Home — pie antes del footer" },
  { group: "RollerZone TV", value: "tv_sidebar", label: "TV — banners laterales (300×200)" },
  { group: "RollerZone TV", value: "tv_premium", label: "TV — banner premium horizontal" },
  { group: "RollerZone TV", value: "tv_side", label: "TV — lateral 300×100" },
  { group: "Noticias", value: "noticias_side", label: "Noticias (listado) — lateral 300×100" },
  { group: "Noticias", value: "noticias_article", label: "Noticias (dentro del artículo)" },
  { group: "Eventos", value: "eventos_side", label: "Eventos (listado) — lateral" },
  { group: "Eventos", value: "eventos_detail", label: "Eventos (detalle) — lateral" },
  { group: "Revista", value: "revista_side", label: "Revista — lateral / destacado" },
  { group: "Hub España", value: "hub_espana_top", label: "Hub España — cabecera" },
  { group: "Hub España", value: "hub_espana_side", label: "Hub España — lateral" },
  { group: "Hub Colombia", value: "hub_colombia_top", label: "Hub Colombia — cabecera" },
  { group: "Hub Colombia", value: "hub_colombia_side", label: "Hub Colombia — lateral" },
  { group: "Live", value: "live_top", label: "Live Center — cabecera" },
  { group: "Live", value: "live_side", label: "Live Center — lateral" },
  { group: "MVP", value: "mvp_side", label: "Premios MVP — lateral" },
  { group: "Directorios", value: "clubes_side", label: "Clubes (listado) — lateral" },
  { group: "Directorios", value: "clubes_detail", label: "Club (ficha) — lateral" },
  { group: "Directorios", value: "patinadores_side", label: "Patinadores (listado) — lateral" },
  { group: "Directorios", value: "patinadores_detail", label: "Patinador (ficha) — lateral" },
  { group: "Directorios", value: "federaciones_side", label: "Federaciones — lateral" },
  { group: "Directorios", value: "entrevistas_side", label: "Entrevistas — lateral" },
  { group: "Directorios", value: "salon_fama_side", label: "Salón de la Fama — lateral" },
  { group: "Directorios", value: "resultados_side", label: "Resultados — lateral" },
  { group: "Footer", value: "footer", label: "Footer / zona inferior" },
];
