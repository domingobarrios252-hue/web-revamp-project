import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { translations, type Language } from "./translations";

const STORAGE_KEY = "rz_lang_v1";

type LanguageContextValue = {
  lang: Language;
  setLang: (l: Language) => void;
  t: (path: string) => string;
  /** Get an array of strings (e.g. months). Returns [] if not found. */
  tArr: (path: string) => string[];
  /** BCP 47 locale string for Intl APIs (toLocaleDateString, etc.). */
  locale: string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

function readInitialLang(): Language {
  if (typeof window === "undefined") return "es";
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "es" || stored === "en") return stored;
    const nav = window.navigator?.language?.toLowerCase() ?? "";
    if (nav.startsWith("en")) return "en";
  } catch {
    /* ignore */
  }
  return "es";
}

function resolveRaw(obj: unknown, path: string): unknown {
  const parts = path.split(".");
  let cur: unknown = obj;
  for (const p of parts) {
    if (cur && typeof cur === "object" && p in (cur as Record<string, unknown>)) {
      cur = (cur as Record<string, unknown>)[p];
    } else {
      return undefined;
    }
  }
  return cur;
}

function resolve(obj: unknown, path: string): string {
  const v = resolveRaw(obj, path);
  return typeof v === "string" ? v : path;
}

function resolveArr(obj: unknown, path: string): string[] {
  const v = resolveRaw(obj, path);
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>("es");

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

  const tArr = useCallback(
    (path: string) => resolveArr(translations[lang], path),
    [lang],
  );

  const locale = lang === "en" ? "en-GB" : "es-ES";

  const value = useMemo(
    () => ({ lang, setLang, t, tArr, locale }),
    [lang, setLang, t, tArr, locale],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    return {
      lang: "es",
      setLang: () => {},
      t: (p: string) => resolve(translations.es, p),
      tArr: (p: string) => resolveArr(translations.es, p),
      locale: "es-ES",
    };
  }
  return ctx;
}

export function useT() {
  return useLanguage().t;
}
