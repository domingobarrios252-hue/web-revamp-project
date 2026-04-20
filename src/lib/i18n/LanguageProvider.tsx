import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { translations, type Language } from "./translations";

const STORAGE_KEY = "rz_lang_v1";

type LanguageContextValue = {
  lang: Language;
  setLang: (l: Language) => void;
  t: (path: string) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

function readInitialLang(): Language {
  if (typeof window === "undefined") return "es";
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "es" || stored === "en") return stored;
    // Optional: detect browser language on first visit
    const nav = window.navigator?.language?.toLowerCase() ?? "";
    if (nav.startsWith("en")) return "en";
  } catch {
    /* ignore */
  }
  return "es";
}

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
  const [lang, setLangState] = useState<Language>("es");

  // Hydrate from localStorage on mount (client-only) to avoid SSR mismatch.
  useEffect(() => {
    setLangState(readInitialLang());
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = lang;
    }
  }, [lang]);

  const setLang = useCallback((l: Language) => {
    setLangState(l);
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
