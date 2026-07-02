import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";

const SITE = "https://rollerzone.es";

/**
 * Injects <link rel="canonical"> and <meta property="og:url"> for every route,
 * unless the route already declared its own canonical via head(). Keeps a single
 * source of truth for URL identity and prevents duplicate content signals.
 */
export function AutoCanonical() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const search = useRouterState({ select: (s) => s.location.searchStr });

  useEffect(() => {
    if (typeof document === "undefined") return;

    // Normalise: drop trailing slash (except root), strip query — canonical
    // should be the clean, indexable version of the URL.
    const cleanPath =
      pathname !== "/" && pathname.endsWith("/")
        ? pathname.slice(0, -1)
        : pathname;
    const href = `${SITE}${cleanPath}`;

    // Canonical -----------------------------------------------------------
    const existingCanonicals = Array.from(
      document.head.querySelectorAll('link[rel="canonical"]'),
    );
    const routeOwned = existingCanonicals.find(
      (n) => !n.hasAttribute("data-auto-canonical"),
    );

    if (routeOwned) {
      // Leaf route already owns the canonical — remove any auto duplicate.
      existingCanonicals
        .filter((n) => n.hasAttribute("data-auto-canonical"))
        .forEach((n) => n.remove());
    } else {
      let auto = existingCanonicals.find((n) =>
        n.hasAttribute("data-auto-canonical"),
      ) as HTMLLinkElement | undefined;
      if (!auto) {
        auto = document.createElement("link");
        auto.setAttribute("rel", "canonical");
        auto.setAttribute("data-auto-canonical", "true");
        document.head.appendChild(auto);
      }
      auto.setAttribute("href", href);
    }

    // og:url --------------------------------------------------------------
    const ogUrls = Array.from(
      document.head.querySelectorAll('meta[property="og:url"]'),
    );
    const routeOwnedOg = ogUrls.find((n) => !n.hasAttribute("data-auto-og-url"));
    if (routeOwnedOg) {
      ogUrls
        .filter((n) => n.hasAttribute("data-auto-og-url"))
        .forEach((n) => n.remove());
    } else {
      let autoOg = ogUrls.find((n) =>
        n.hasAttribute("data-auto-og-url"),
      ) as HTMLMetaElement | undefined;
      if (!autoOg) {
        autoOg = document.createElement("meta");
        autoOg.setAttribute("property", "og:url");
        autoOg.setAttribute("data-auto-og-url", "true");
        document.head.appendChild(autoOg);
      }
      autoOg.setAttribute("content", href);
    }
  }, [pathname, search]);

  return null;
}
