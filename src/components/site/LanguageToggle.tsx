import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useNavigate, useRouterState } from "@tanstack/react-router";

export function LanguageToggle({ className = "" }: { className?: string }) {
  const { lang, setLang } = useLanguage();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const choose = (target: "es" | "en") => {
    setLang(target);
    // En un artículo, el selector lleva al mismo artículo en el otro idioma.
    const esMatch = pathname.match(/^\/noticias\/articulo\/([^/]+)$/);
    const enMatch = pathname.match(/^\/en\/news\/([^/]+)$/);
    if (target === "en" && esMatch) {
      void navigate({ to: "/en/news/$slug", params: { slug: esMatch[1] } });
    } else if (target === "es" && enMatch) {
      void navigate({ to: "/noticias/articulo/$slug", params: { slug: enMatch[1] } });
    }
  };

  return (
    <div
      role="group"
      aria-label="Idioma / Language"
      className={`font-ui inline-flex items-center border border-border text-[11px] font-semibold uppercase tracking-widest ${className}`}
    >
      <button
        type="button"
        onClick={() => choose("es")}
        aria-pressed={lang === "es"}
        className={`px-2 py-1.5 transition-colors ${
          lang === "es" ? "bg-gold text-background" : "text-foreground/70 hover:text-gold"
        }`}
      >
        ES
      </button>
      <span aria-hidden className="h-4 w-px bg-border" />
      <button
        type="button"
        onClick={() => choose("en")}
        aria-pressed={lang === "en"}
        className={`px-2 py-1.5 transition-colors ${
          lang === "en" ? "bg-gold text-background" : "text-foreground/70 hover:text-gold"
        }`}
      >
        EN
      </button>
    </div>
  );
}
