import { createContext, useCallback, useContext, useEffect, useMemo, useRef } from "react";
import { translations, type Language } from "./translations";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { languageFromPath } from "./paths";

const STORAGE_KEY = "rz_lang_v1";

type LanguageContextValue = {
  lang: Language;
  setLang: (l: Language) => void;
  t: (path: string) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

function resolve(obj: unknown, path: string): string {
  const parts = path.split(".");
  let cur: unknown = obj;
  for (const p of parts) {
    if (cur && typeof cur === "object" && p in (cur as Record<string, unknown>)) {
      cur = (cur as Record<string, unknown>)[p];
    } else {
      return path;
    }
  }
  return typeof cur === "string" ? cur : path;
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: state => state.location.pathname });
  const lang = languageFromPath(pathname);
  const navigate = useNavigate();
  const restored = useRef(false);

  // Hydrate from localStorage on mount (client-only) to avoid SSR mismatch.
  useEffect(() => {
    try {
      if (!restored.current) {
        restored.current = true;
        // Respect explicit deep links; only the entry homepage restores preference.
        if (pathname === "/" && window.localStorage.getItem(STORAGE_KEY) === "en") {
          void navigate({ to: "/en" });
          return;
        }
      }
      window.localStorage.setItem(STORAGE_KEY, lang);
    } catch { /* optional preference */ }
  }, [lang, pathname, navigate]);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = lang;
    }
  }, [lang]);

  const setLang = useCallback((l: Language) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* ignore */
    }
  }, []);

  const t = useCallback(
    (path: string) => resolve(translations[lang], path),
    [lang],
  );

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    // Safe fallback so components don't crash if used outside provider (e.g. SSR boundaries).
    return {
      lang: "es",
      setLang: () => {},
      t: (p: string) => resolve(translations.es, p),
    };
  }
  return ctx;
}

export function useT() {
  return useLanguage().t;
}
