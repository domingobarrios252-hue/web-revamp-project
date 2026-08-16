import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/**
 * Gestión de consentimiento de cookies de RollerZone.
 *
 * Categorías:
 *  - necessary: siempre activa (sesión, seguridad, preferencias esenciales).
 *  - analytics: Google Analytics 4. Denegada por defecto.
 *  - external: iframes de terceros (YouTube, World Skate Europe TV, otros
 *    reproductores, mapas). Denegada por defecto.
 *
 * Sube CONSENT_VERSION si cambian las categorías o la política: los usuarios
 * volverán a ver el banner y deberán elegir de nuevo.
 */
export const CONSENT_VERSION = 2;

const STORAGE_KEY = "rz_cookie_consent_v2";
const LEGACY_KEY = "rz_cookie_consent_v1";
export const OPEN_PREFERENCES_EVENT = "rz:open-cookie-preferences";

export type ConsentCategories = {
  necessary: true;
  analytics: boolean;
  external: boolean;
};

export type ConsentRecord = {
  version: number;
  decidedAt: string;
  categories: ConsentCategories;
};

export const DEFAULT_CATEGORIES: ConsentCategories = {
  necessary: true,
  analytics: false,
  external: false,
};

function readStored(): ConsentRecord | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as ConsentRecord;
      if (
        parsed &&
        parsed.version === CONSENT_VERSION &&
        parsed.categories &&
        typeof parsed.categories.analytics === "boolean" &&
        typeof parsed.categories.external === "boolean"
      ) {
        return { ...parsed, categories: { ...parsed.categories, necessary: true } };
      }
      return null;
    }
    // Migración desde el banner anterior (aceptar/rechazar global).
    const legacy = window.localStorage.getItem(LEGACY_KEY);
    if (legacy === "accepted" || legacy === "rejected") {
      const granted = legacy === "accepted";
      return {
        version: CONSENT_VERSION,
        decidedAt: new Date().toISOString(),
        categories: { necessary: true, analytics: granted, external: granted },
      };
    }
  } catch {
    /* almacenamiento no disponible */
  }
  return null;
}

function persist(record: ConsentRecord) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
    window.localStorage.removeItem(LEGACY_KEY);
  } catch {
    /* almacenamiento no disponible */
  }
}

/** Aplica el estado al Consent Mode de Google (si el stub existe). */
function syncGoogleConsent(categories: ConsentCategories) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  window.gtag("consent", "update", {
    analytics_storage: categories.analytics ? "granted" : "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  });
}

type ConsentState = {
  /** true cuando el visitante ya ha tomado una decisión válida para esta versión. */
  decided: boolean;
  categories: ConsentCategories;
  /** Guarda una decisión concreta por categorías. */
  save: (categories: Partial<Omit<ConsentCategories, "necessary">>) => void;
  acceptAll: () => void;
  rejectNonNecessary: () => void;
  /** Abre el panel de preferencias. */
  openPreferences: () => void;
  preferencesOpen: boolean;
  setPreferencesOpen: (open: boolean) => void;
  /** Solo true tras hidratar en el navegador (evita desajustes de SSR). */
  ready: boolean;
};

const ConsentContext = createContext<ConsentState | undefined>(undefined);

export function ConsentProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<ConsentCategories>(DEFAULT_CATEGORIES);
  const [decided, setDecided] = useState(false);
  const [ready, setReady] = useState(false);
  const [preferencesOpen, setPreferencesOpen] = useState(false);

  useEffect(() => {
    const stored = readStored();
    if (stored) {
      setCategories(stored.categories);
      setDecided(true);
      syncGoogleConsent(stored.categories);
    } else {
      syncGoogleConsent(DEFAULT_CATEGORIES);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    const open = () => setPreferencesOpen(true);
    window.addEventListener(OPEN_PREFERENCES_EVENT, open);
    return () => window.removeEventListener(OPEN_PREFERENCES_EVENT, open);
  }, []);

  const save = useCallback((next: Partial<Omit<ConsentCategories, "necessary">>) => {
    setCategories((prev) => {
      const merged: ConsentCategories = {
        necessary: true,
        analytics: next.analytics ?? prev.analytics,
        external: next.external ?? prev.external,
      };
      persist({
        version: CONSENT_VERSION,
        decidedAt: new Date().toISOString(),
        categories: merged,
      });
      syncGoogleConsent(merged);
      return merged;
    });
    setDecided(true);
    setPreferencesOpen(false);
  }, []);

  const acceptAll = useCallback(() => save({ analytics: true, external: true }), [save]);
  const rejectNonNecessary = useCallback(
    () => save({ analytics: false, external: false }),
    [save],
  );
  const openPreferences = useCallback(() => setPreferencesOpen(true), []);

  const value = useMemo<ConsentState>(
    () => ({
      decided,
      categories,
      save,
      acceptAll,
      rejectNonNecessary,
      openPreferences,
      preferencesOpen,
      setPreferencesOpen,
      ready,
    }),
    [decided, categories, save, acceptAll, rejectNonNecessary, openPreferences, preferencesOpen, ready],
  );

  return <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>;
}

export function useConsent(): ConsentState {
  const ctx = useContext(ConsentContext);
  if (!ctx) throw new Error("useConsent debe usarse dentro de ConsentProvider");
  return ctx;
}

/** Abre el panel de preferencias desde cualquier parte (incluido código no React). */
export function openCookiePreferences() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(OPEN_PREFERENCES_EVENT));
}
