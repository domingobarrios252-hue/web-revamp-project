import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type HomeSectionKey =
  | "podios"
  | "atletas"
  | "ranking"
  | "entrevistas"
  | "eventos"
  | "revista"
  | "patrocinadores"
  | "equipo"
  | "redactores";

export const HOME_SECTIONS: { key: HomeSectionKey; label: string; description: string }[] = [
  { key: "podios", label: "Podios destacados", description: "Carrusel de podios bajo la zona dinámica." },
  { key: "atletas", label: "Atletas destacados", description: "Bloque de patinadores destacados." },
  { key: "ranking", label: "Ranking MVP", description: "Previa del ranking MVP." },
  { key: "entrevistas", label: "Entrevistas", description: "Previa de entrevistas recientes." },
  { key: "eventos", label: "Próximos eventos", description: "Previa del calendario." },
  { key: "revista", label: "Revista", description: "Previa de la revista digital." },
  { key: "patrocinadores", label: "Patrocinadores", description: "Carrusel de patrocinadores." },
  { key: "equipo", label: "Equipo", description: "Sección del equipo." },
];

const PREFIX = "home_section_";
const keyFor = (k: HomeSectionKey) => `${PREFIX}${k}`;

export function useHomeSectionVisibility() {
  const [visibility, setVisibility] = useState<Record<HomeSectionKey, boolean>>(() => {
    const init: Record<string, boolean> = {};
    HOME_SECTIONS.forEach((s) => (init[s.key] = true));
    return init as Record<HomeSectionKey, boolean>;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const sb = supabase as any;
      const { data } = await sb
        .from("home_modules")
        .select("key,value")
        .like("key", `${PREFIX}%`);
      if (cancelled) return;
      const next: Record<string, boolean> = {};
      HOME_SECTIONS.forEach((s) => (next[s.key] = true));
      (data ?? []).forEach((row: { key: string; value: string }) => {
        const k = row.key.replace(PREFIX, "") as HomeSectionKey;
        next[k] = row.value !== "false";
      });
      setVisibility(next as Record<HomeSectionKey, boolean>);
      setLoading(false);
    };
    load();
    const ch = supabase
      .channel("home-section-visibility")
      .on("postgres_changes", { event: "*", schema: "public", table: "home_modules" }, load)
      .subscribe();
    return () => {
      cancelled = true;
      supabase.removeChannel(ch);
    };
  }, []);

  return { visibility, loading };
}

export async function setHomeSectionVisibility(key: HomeSectionKey, visible: boolean) {
  const sb = supabase as any;
  return sb.from("home_modules").upsert(
    { key: keyFor(key), value: visible ? "true" : "false" },
    { onConflict: "key" },
  );
}
