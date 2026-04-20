import { useLanguage } from "@/lib/i18n/LanguageProvider";

export function LanguageToggle({ className = "" }: { className?: string }) {
  const { lang, setLang } = useLanguage();
  return (
    <div
      role="group"
      aria-label="Idioma / Language"
      className={`font-ui inline-flex items-center border border-border text-[11px] font-semibold uppercase tracking-widest ${className}`}
    >
      <button
        type="button"
        onClick={() => setLang("es")}
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
        onClick={() => setLang("en")}
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
