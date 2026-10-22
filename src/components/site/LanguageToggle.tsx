import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { localizedPath } from "@/lib/i18n/paths";
import { Button } from "@/components/ui/button";

export function LanguageToggle({ className = "" }: { className?: string }) {
  const { lang, setLang } = useLanguage();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const search = useRouterState({ select: (s) => s.location.search });

  const choose = (target: "es" | "en") => {
    setLang(target);
    const next = localizedPath(pathname, target);
    void navigate({ to: next === pathname && target !== lang ? (target === "en" ? "/en" : "/") : next, search });
  };

  return (
    <div
      role="group"
      aria-label="Idioma / Language"
      className={`font-ui inline-flex items-center border border-border text-[11px] font-semibold uppercase tracking-widest ${className}`}
    >
      <Button variant="ghost" size="sm"
        type="button"
        onClick={() => choose("es")}
        aria-pressed={lang === "es"}
        className={`px-2 py-1.5 transition-colors ${
          lang === "es" ? "bg-gold text-background" : "text-foreground/70 hover:text-gold"
        }`}
      >
        ES
      </Button>
      <span aria-hidden className="h-4 w-px bg-border" />
      <Button variant="ghost" size="sm"
        type="button"
        onClick={() => choose("en")}
        aria-pressed={lang === "en"}
        className={`px-2 py-1.5 transition-colors ${
          lang === "en" ? "bg-gold text-background" : "text-foreground/70 hover:text-gold"
        }`}
      >
        EN
      </Button>
    </div>
  );
}
