import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type CountryHub = {
  id: string;
  country_code: string;
  name: string;
  flag_url: string | null;
  accent_color: string | null;
  federation_name: string | null;
  federation_url: string | null;
  hero_image_url: string | null;
  tagline: string | null;
  active_sections: string[];
  active: boolean;
};

export type HubSectionKey =
  | "inicio"
  | "competicion"
  | "clubes"
  | "patinadores"
  | "federaciones"
  | "tv"
  | "live"
  | "mvp"
  | "archivo"
  | "comunidad";

export const HUB_SECTIONS: { key: HubSectionKey; label: string }[] = [
  { key: "inicio", label: "Inicio" },
  { key: "competicion", label: "Competición" },
  { key: "clubes", label: "Clubs & Escuelas" },
  { key: "patinadores", label: "Patinadores" },
  { key: "federaciones", label: "Federaciones" },
  { key: "tv", label: "RollerZone TV" },
  { key: "mvp", label: "MVP" },
  { key: "archivo", label: "Archivo" },
  { key: "comunidad", label: "Comunidad" },
];

export function useCountryHub(countryCode: string) {
  const [hub, setHub] = useState<CountryHub | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    supabase
      .from("country_hubs")
      .select("*")
      .eq("country_code", countryCode)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        setHub((data as unknown as CountryHub) ?? null);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [countryCode]);

  return { hub, loading };
}
