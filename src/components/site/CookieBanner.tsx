import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Cookie, X, Lock, BarChart3, MonitorPlay } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useConsent } from "@/lib/consent";

export function CookieBanner() {
  const { t, lang } = useLanguage();
  const {
    ready,
    decided,
    categories,
    acceptAll,
    rejectNonNecessary,
    save,
    preferencesOpen,
    setPreferencesOpen,
    openPreferences,
  } = useConsent();

  const en = lang === "en";
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!ready) return;
    const timer = setTimeout(() => setVisible(!decided), 200);
    return () => clearTimeout(timer);
  }, [ready, decided]);

  return (
    <>
      {visible && !decided && (
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
                    to="/legal/$slug"
                    params={{ slug: "cookies" }}
                    className="text-gold underline underline-offset-2 hover:text-gold-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    {t("cookies.learnMore")}
                  </Link>
                  .
                </p>
                <div className="mt-3 flex flex-col gap-2">
                  <div className="flex gap-2">
                    <button
                      onClick={acceptAll}
                      className="font-ui min-h-[40px] flex-1 rounded bg-gold px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-background transition-colors hover:bg-gold-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    >
                      {en ? "Accept all" : "Aceptar todas"}
                    </button>
                    <button
                      onClick={rejectNonNecessary}
                      className="font-ui min-h-[40px] flex-1 rounded border border-gold/70 px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-gold transition-colors hover:bg-gold hover:text-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                    >
                      {en ? "Reject non-essential" : "Rechazar no necesarias"}
                    </button>
                  </div>
                  <button
                    onClick={openPreferences}
                    className="font-ui min-h-[36px] rounded border border-border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-foreground/85 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                  >
                    {en ? "Configure" : "Configurar"}
                  </button>
                </div>
              </div>
              <button
                onClick={openPreferences}
                aria-label={en ? "Configure cookies" : "Configurar cookies"}
                className="-mr-1 -mt-1 rounded p-1 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {preferencesOpen && (
        <CookiePreferencesPanel
          initial={categories}
          en={en}
          onClose={() => setPreferencesOpen(false)}
          onSave={save}
          onAcceptAll={acceptAll}
          onRejectAll={rejectNonNecessary}
        />
      )}
    </>
  );
}

function CookiePreferencesPanel({
  initial,
  en,
  onClose,
  onSave,
  onAcceptAll,
  onRejectAll,
}: {
  initial: { analytics: boolean; external: boolean };
  en: boolean;
  onClose: () => void;
  onSave: (c: { analytics?: boolean; external?: boolean }) => void;
  onAcceptAll: () => void;
  onRejectAll: () => void;
}) {
  const [analytics, setAnalytics] = useState(initial.analytics);
  const [external, setExternal] = useState(initial.external);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-3 sm:items-center sm:p-6">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cookie-prefs-title"
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto border border-border bg-background p-5 shadow-2xl sm:p-6"
      >
        <div className="flex items-start justify-between gap-3">
          <h2
            id="cookie-prefs-title"
            className="font-display text-xl uppercase tracking-widest text-foreground"
          >
            {en ? "Cookie " : "Preferencias de "}
            <span className="text-gold">{en ? "preferences" : "cookies"}</span>
          </h2>
          <button
            onClick={onClose}
            aria-label={en ? "Close" : "Cerrar"}
            className="rounded p-1 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 space-y-3">
          <Category
            Icon={Lock}
            title={en ? "Necessary cookies" : "Cookies necesarias"}
            description={
              en
                ? "Required for the operation, security, authentication and essential preferences of RollerZone.es."
                : "Necesarias para el funcionamiento, seguridad, autenticación y preferencias esenciales de RollerZone.es."
            }
            checked
            locked
            lockedLabel={en ? "Always on" : "Siempre activadas"}
          />
          <Category
            Icon={BarChart3}
            title={en ? "Analytics" : "Analíticas"}
            description={
              en
                ? "Help us understand in aggregate how RollerZone is used so we can improve the service (Google Analytics 4)."
                : "Nos permiten conocer de forma agregada cómo se utiliza RollerZone y mejorar el servicio (Google Analytics 4)."
            }
            checked={analytics}
            onChange={setAnalytics}
          />
          <Category
            Icon={MonitorPlay}
            title={en ? "External content" : "Contenido externo"}
            description={
              en
                ? "Embedded players and third-party content: YouTube, World Skate Europe TV, other players and maps. They may set their own cookies."
                : "Reproductores y contenidos de terceros: YouTube, World Skate Europe TV, otros reproductores y mapas. Pueden instalar sus propias cookies."
            }
            checked={external}
            onChange={setExternal}
          />
        </div>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <button
            onClick={() => onSave({ analytics, external })}
            className="font-condensed min-h-[44px] flex-1 bg-gold px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-background transition-colors hover:bg-gold-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            {en ? "Save preferences" : "Guardar preferencias"}
          </button>
          <button
            onClick={onAcceptAll}
            className="font-condensed min-h-[44px] flex-1 border border-gold/70 px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-gold transition-colors hover:bg-gold hover:text-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          >
            {en ? "Accept all" : "Aceptar todas"}
          </button>
          <button
            onClick={onRejectAll}
            className="font-condensed min-h-[44px] flex-1 border border-border px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-foreground/85 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          >
            {en ? "Reject non-essential" : "Rechazar no necesarias"}
          </button>
        </div>

        <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
          {en
            ? "You can change this choice at any time from “Manage cookies” in the footer."
            : "Puedes cambiar esta elección en cualquier momento desde «Gestionar cookies», en el pie de página."}{" "}
          <Link
            to="/legal/$slug"
            params={{ slug: "cookies" }}
            className="text-gold underline underline-offset-2 hover:text-gold-dark"
          >
            {en ? "Cookie Policy" : "Política de cookies"}
          </Link>
        </p>
      </div>
    </div>
  );
}

function Category({
  Icon,
  title,
  description,
  checked,
  onChange,
  locked,
  lockedLabel,
}: {
  Icon: typeof Lock;
  title: string;
  description: string;
  checked: boolean;
  onChange?: (v: boolean) => void;
  locked?: boolean;
  lockedLabel?: string;
}) {
  return (
    <div className="border border-border bg-surface p-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2.5">
          <Icon className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden="true" />
          <div className="min-w-0">
            <p className="font-condensed text-sm font-bold uppercase tracking-wider text-foreground">
              {title}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-foreground/75">{description}</p>
          </div>
        </div>
        {locked ? (
          <span className="font-condensed shrink-0 whitespace-nowrap text-[10px] font-bold uppercase tracking-widest text-gold">
            {lockedLabel}
          </span>
        ) : (
          <label className="flex shrink-0 cursor-pointer items-center gap-2">
            <span className="sr-only">{title}</span>
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => onChange?.(e.target.checked)}
              className="h-5 w-5 accent-[#D4A017] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            />
          </label>
        )}
      </div>
    </div>
  );
}
