import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Cookie, X } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

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
  const { t } = useLanguage();

  useEffect(() => {
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
      role="region"
      aria-live="polite"
      aria-label={t("cookies.title")}
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-3 pb-3 sm:justify-end sm:px-4 sm:pb-4"
    >
      <div className="pointer-events-auto w-full max-w-sm rounded-lg border border-border bg-background/95 p-3 shadow-lg backdrop-blur-md sm:p-4">
        <div className="flex items-start gap-2.5">
          <Cookie className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="font-ui text-xs leading-relaxed text-foreground/90">
              {t("cookies.message")}{" "}
              <Link
                to="/cookies"
                className="text-gold underline underline-offset-2 hover:text-gold-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                {t("cookies.learnMore")}
              </Link>
              .
            </p>
            <div className="mt-2.5 flex items-center justify-end gap-2">
              <button
                onClick={() => decide("rejected")}
                className="font-ui rounded border border-border px-2.5 py-1 text-[11px] font-semibold text-foreground/85 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              >
                {t("cookies.reject")}
              </button>
              <button
                onClick={() => decide("accepted")}
                className="font-ui rounded bg-gold px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-background transition-colors hover:bg-gold-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                {t("cookies.accept")}
              </button>
            </div>
          </div>
          <button
            onClick={() => decide("rejected")}
            aria-label={t("cookies.reject")}
            className="-mr-1 -mt-1 rounded p-1 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
