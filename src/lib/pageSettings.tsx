import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

export type PageStatus = "active" | "hidden" | "coming_soon";

export interface PageSetting {
  id: string;
  slug: string;
  label: string;
  category: string | null;
  route: string | null;
  status: PageStatus;
  sort_order: number;
}

interface Ctx {
  settings: Record<string, PageSetting>;
  loading: boolean;
  refresh: () => Promise<void>;
}

const PageSettingsCtx = createContext<Ctx>({ settings: {}, loading: true, refresh: async () => {} });

export function PageSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Record<string, PageSetting>>({});
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const { data, error } = await supabase
      .from("page_settings")
      .select("id,slug,label,category,route,status,sort_order")
      .order("sort_order", { ascending: true });
    if (!error && data) {
      const map: Record<string, PageSetting> = {};
      for (const r of data as PageSetting[]) map[r.slug] = r;
      setSettings(map);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <PageSettingsCtx.Provider value={{ settings, loading, refresh }}>{children}</PageSettingsCtx.Provider>
  );
}

export function usePageSettings() {
  return useContext(PageSettingsCtx);
}

/** Devuelve el estado de una página por slug. Si no está registrada, se considera "active". */
export function usePageStatus(slug?: string | null): PageStatus {
  const { settings } = useContext(PageSettingsCtx);
  if (!slug) return "active";
  return settings[slug]?.status ?? "active";
}
