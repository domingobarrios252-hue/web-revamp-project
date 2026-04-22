import { Link } from "@tanstack/react-router";
import { Instagram, Facebook, Youtube } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

export function SiteFooter() {
  const { t } = useLanguage();
  return (
    <footer className="mt-16 border-t border-border bg-surface">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <div className="font-display text-2xl tracking-widest">
              <span className="text-gold">Roller</span>
              <span className="text-foreground">Zone</span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">{t("footer.tagline")}</p>
          </div>
          <div>
            <h4 className="font-display mb-3 text-sm tracking-widest text-gold">{t("footer.sections")}</h4>
            <ul className="font-condensed space-y-1.5 text-sm uppercase tracking-wider text-muted-foreground">
              <li><Link to="/noticias" className="hover:text-gold">{t("nav.news")}</Link></li>
              <li><Link to="/eventos" className="hover:text-gold">{t("nav.events")}</Link></li>
              <li><Link to="/tv" className="hover:text-tv-red">RollerZone TV</Link></li>
              <li><Link to="/premios-mvp" className="hover:text-gold">{t("nav.mvpAwards")}</Link></li>
              <li><Link to="/revista" className="hover:text-gold">{t("nav.magazine")}</Link></li>
              <li><Link to="/redactores" className="hover:text-gold">{t("nav.writers")}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-display mb-3 text-sm tracking-widest text-gold">{t("footer.legal")}</h4>
            <ul className="font-ui space-y-1.5 text-sm text-muted-foreground">
              <li><Link to="/legal/$slug" params={{ slug: "aviso-legal" }} className="hover:text-gold">{t("footer.legalNotice")}</Link></li>
              <li><Link to="/legal/$slug" params={{ slug: "privacidad" }} className="hover:text-gold">{t("footer.privacy")}</Link></li>
              <li><Link to="/legal/$slug" params={{ slug: "cookies" }} className="hover:text-gold">{t("footer.cookies")}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-display mb-3 text-sm tracking-widest text-gold">{t("footer.followUs")}</h4>
            <div className="flex gap-3">
              <a href="https://instagram.com/rollerzone_spain" target="_blank" rel="noopener noreferrer" aria-label="Instagram @rollerzone_spain" className="border border-border p-2 text-muted-foreground transition-colors hover:border-gold hover:text-gold">
                <Instagram className="h-4 w-4" />
              </a>
              <a href="https://facebook.com/rollerzonespain" target="_blank" rel="noopener noreferrer" aria-label="Facebook RollerZone Spain" className="border border-border p-2 text-muted-foreground transition-colors hover:border-gold hover:text-gold">
                <Facebook className="h-4 w-4" />
              </a>
              <a href="https://www.youtube.com/@rollerzonespain" target="_blank" rel="noopener noreferrer" aria-label="YouTube @rollerzonespain" className="border border-border p-2 text-muted-foreground transition-colors hover:border-gold hover:text-gold">
                <Youtube className="h-4 w-4" />
              </a>
            </div>
            <p className="font-condensed mt-3 text-[11px] uppercase tracking-widest text-muted-foreground">
              @rollerzone_spain
            </p>
          </div>
        </div>
        <div className="mt-8 border-t border-border pt-4 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} RollerZone — {t("footer.rights")}
        </div>
      </div>
    </footer>
  );
}
