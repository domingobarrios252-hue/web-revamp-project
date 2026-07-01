import { useEffect, useRef } from "react";
import { useRouterState } from "@tanstack/react-router";

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

const GA_ID = "G-2ZLN80RMTW";

export function GoogleAnalytics() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const search = useRouterState({ select: (s) => s.location.searchStr });
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.gtag !== "function") return;
    const url = pathname + (search ? (search.startsWith("?") ? search : `?${search}`) : "");
    if (lastPath.current === url) return;
    lastPath.current = url;
    window.gtag("event", "page_view", {
      page_path: url,
      page_location: window.location.origin + url,
      page_title: document.title,
    });
  }, [pathname, search]);

  return null;
}

export { GA_ID };
