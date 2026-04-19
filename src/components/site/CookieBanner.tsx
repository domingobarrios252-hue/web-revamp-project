import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Cookie, X } from "lucide-react";

const STORAGE_KEY = "rz_cookie_consent_v1";

type Consent = "accepted" | "rejected";

export function getCookieConsent(): Consent | null {
  if (typeof window === "undefined") return null;
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    return v === "accepted" || v === "rejected" ? v : null;
  } catch {
    return null;
  }
}

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Defer to next tick so SSR doesn't flash; only show if no decision yet.
    const t = setTimeout(() => {
      if (getCookieConsent() === null) setVisible(true);
    }, 200);
    return () => clearTimeout(t);
  }, []);

  const decide = (value: Consent) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, value);
    } catch {
      /* ignore */
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Aviso de cookies"
      className="fixed inset-x-0 bottom-0 z-[60] border-t border-gold/40 bg-background/98 shadow-2xl backdrop-blur"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-6">
        <div className="flex items-start gap-3">
          <Cookie className="mt-0.5 h-5 w-5 shrink-0 text-gold" aria-hidden />
          <p className="font-ui text-sm leading-relaxed text-foreground/90">
            Usamos cookies propias y de terceros para mejorar tu experiencia y analizar el
            tráfico. Puedes aceptarlas o rechazarlas. Más info en nuestra{" "}
            <Link to="/cookies" className="text-gold underline hover:text-gold-dark">
              Política de Cookies
            </Link>
            .
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2 md:gap-3">
          <button
            onClick={() => decide("rejected")}
            className="font-ui border border-border px-4 py-2 text-xs font-semibold tracking-wide text-foreground/85 transition-colors hover:text-foreground"
          >
            Rechazar
          </button>
          <button
            onClick={() => decide("accepted")}
            className="font-ui bg-gold px-4 py-2 text-xs font-bold uppercase tracking-widest text-background transition-colors hover:bg-gold-dark"
          >
            Aceptar
          </button>
          <button
            onClick={() => decide("rejected")}
            aria-label="Cerrar (rechazar)"
            className="ml-1 text-muted-foreground hover:text-foreground md:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
