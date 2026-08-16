import { useEffect, useRef } from "react";
import { useRouterState } from "@tanstack/react-router";
import { useConsent } from "@/lib/consent";

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

const GA_ID = "G-2ZLN80RMTW";

/**
 * Carga GA4 SOLO cuando el visitante ha aceptado la categoría "Analíticas".
 * El stub de Consent Mode (definido en __root) arranca con
 * analytics_storage: 'denied', por lo que sin consentimiento no se almacenan
 * cookies analíticas. Si el consentimiento se retira, se envía un update a
 * 'denied' y se dejan de enviar page_view.
 */
export function GoogleAnalytics() {
  const { categories, ready } = useConsent();
  const allowed = ready && categories.analytics;
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const search = useRouterState({ select: (s) => s.location.searchStr });
  const lastPath = useRef<string | null>(null);
  const loaded = useRef(false);

  // 1. Inyecta la librería una única vez, tras el consentimiento.
  useEffect(() => {
    if (!allowed || loaded.current || typeof window === "undefined") return;
    if (document.querySelector(`script[data-rz-ga="${GA_ID}"]`)) {
      loaded.current = true;
      return;
    }
    loaded.current = true;
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
    script.dataset.rzGa = GA_ID;
    document.head.appendChild(script);
    window.gtag?.("config", GA_ID, { send_page_view: false });
  }, [allowed]);

  // 2. Page views SPA (sin duplicar): solo con consentimiento.
  useEffect(() => {
    if (!allowed) {
      lastPath.current = null;
      return;
    }
    if (typeof window === "undefined" || typeof window.gtag !== "function") return;
    const url = pathname + (search ? (search.startsWith("?") ? search : `?${search}`) : "");
    if (lastPath.current === url) return;
    lastPath.current = url;
    window.gtag("event", "page_view", {
      page_path: url,
      page_location: window.location.origin + url,
      page_title: document.title,
    });
  }, [allowed, pathname, search]);

  return null;
}

export { GA_ID };
