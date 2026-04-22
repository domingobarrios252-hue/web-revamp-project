import { Link } from "@tanstack/react-router";
import { Instagram, Facebook, Mail, Newspaper, Calendar, Tv, Trophy, BookOpen, Users, PenTool, Handshake, Megaphone, Shield, FileText, Cookie, Info } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

const CONTACT_EMAIL = "info@rollerzone.es";

export function SiteFooter() {
  const { t } = useLanguage();

  const navLinks = [
    { to: "/noticias", label: t("nav.news"), Icon: Newspaper },
    { to: "/eventos", label: t("nav.events"), Icon: Calendar },
    { to: "/tv", label: "RollerZone TV", Icon: Tv },
    { to: "/premios-mvp", label: t("nav.mvpAwards"), Icon: Trophy },
    { to: "/revista", label: t("nav.magazine"), Icon: BookOpen },
  ] as const;

  const aboutLinks = [
    { href: `mailto:${CONTACT_EMAIL}?subject=Quiénes somos`, label: "Quiénes somos", Icon: Info },
    { to: "/redactores", label: "Equipo", Icon: Users },
    { to: "/redactores", label: t("nav.writers"), Icon: PenTool },
    { href: `mailto:${CONTACT_EMAIL}?subject=Quiero colaborar`, label: "Colabora", Icon: Handshake },
    { href: `mailto:${CONTACT_EMAIL}?subject=Publicidad en RollerZone`, label: "Publicidad", Icon: Megaphone },
    { href: `mailto:${CONTACT_EMAIL}?subject=Contacto`, label: "Contacto", Icon: Mail },
  ] as const;

  const legalLinks = [
    { slug: "aviso-legal", label: t("footer.legalNotice"), Icon: FileText },
    { slug: "privacidad", label: t("footer.privacy"), Icon: Shield },
    { slug: "cookies", label: t("footer.cookies"), Icon: Cookie },
  ] as const;

  return (
    <footer className="mt-16 border-t-2 border-gold/30 bg-gradient-to-b from-surface to-background">
      <div className="mx-auto max-w-7xl px-6 py-12">
        {/* Top: brand + tagline */}
        <div className="mb-10 flex flex-col items-start gap-4 border-b border-border/60 pb-8 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="font-display text-3xl tracking-widest">
              <span className="text-gold">Roller</span>
              <span className="text-foreground">Zone</span>
            </div>
            <p className="font-condensed mt-2 max-w-md text-sm uppercase tracking-wider text-muted-foreground">
              {t("footer.tagline")}
            </p>
          </div>
          <div className="flex flex-col items-start gap-3 md:items-end">
            <span className="font-condensed text-[11px] uppercase tracking-widest text-gold">
              {t("footer.followUs")}
            </span>
            <div className="flex gap-2">
              <a
                href="https://instagram.com/rollerzone_spain"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram @rollerzone_spain"
                className="group flex h-10 w-10 items-center justify-center border border-border bg-background/60 text-muted-foreground shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-gold hover:bg-gold hover:text-background hover:shadow-lg hover:shadow-gold/30"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a
                href="https://facebook.com/rollerzone.spain"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook @rollerzone.spain"
                className="group flex h-10 w-10 items-center justify-center border border-border bg-background/60 text-muted-foreground shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-gold hover:bg-gold hover:text-background hover:shadow-lg hover:shadow-gold/30"
              >
                <Facebook className="h-4 w-4" />
              </a>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                aria-label="Email RollerZone"
                className="group flex h-10 w-10 items-center justify-center border border-border bg-background/60 text-muted-foreground shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-gold hover:bg-gold hover:text-background hover:shadow-lg hover:shadow-gold/30"
              >
                <Mail className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>

        {/* 3-column cards */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* Navegación */}
          <div className="group/card relative overflow-hidden rounded-lg border border-border bg-background/60 p-6 shadow-md transition-all duration-300 hover:-translate-y-1 hover:border-gold/60 hover:shadow-xl hover:shadow-gold/10">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-gold via-gold-dark to-gold" />
            <h4 className="font-display mb-4 flex items-center gap-2 text-base tracking-widest text-gold">
              <span className="inline-block h-2 w-2 bg-gold" />
              Navegación
            </h4>
            <ul className="font-condensed space-y-2.5 text-sm uppercase tracking-wider">
              {navLinks.map(({ to, label, Icon }) => (
                <li key={to + label}>
                  <Link
                    to={to}
                    className="group/link flex items-center gap-2.5 text-muted-foreground transition-colors hover:text-gold"
                  >
                    <Icon className="h-3.5 w-3.5 text-gold/60 transition-transform group-hover/link:translate-x-0.5" />
                    <span>{label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Sobre nosotros */}
          <div className="group/card relative overflow-hidden rounded-lg border border-border bg-background/60 p-6 shadow-md transition-all duration-300 hover:-translate-y-1 hover:border-gold/60 hover:shadow-xl hover:shadow-gold/10">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-gold via-gold-dark to-gold" />
            <h4 className="font-display mb-4 flex items-center gap-2 text-base tracking-widest text-gold">
              <span className="inline-block h-2 w-2 bg-gold" />
              Sobre nosotros
            </h4>
            <ul className="font-condensed space-y-2.5 text-sm uppercase tracking-wider">
              {aboutLinks.map((item, idx) => (
                <li key={item.label + idx}>
                  {"to" in item ? (
                    <Link
                      to={item.to}
                      className="group/link flex items-center gap-2.5 text-muted-foreground transition-colors hover:text-gold"
                    >
                      <item.Icon className="h-3.5 w-3.5 text-gold/60 transition-transform group-hover/link:translate-x-0.5" />
                      <span>{item.label}</span>
                    </Link>
                  ) : (
                    <a
                      href={item.href}
                      className="group/link flex items-center gap-2.5 text-muted-foreground transition-colors hover:text-gold"
                    >
                      <item.Icon className="h-3.5 w-3.5 text-gold/60 transition-transform group-hover/link:translate-x-0.5" />
                      <span>{item.label}</span>
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div className="group/card relative overflow-hidden rounded-lg border border-border bg-background/60 p-6 shadow-md transition-all duration-300 hover:-translate-y-1 hover:border-gold/60 hover:shadow-xl hover:shadow-gold/10">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-gold via-gold-dark to-gold" />
            <h4 className="font-display mb-4 flex items-center gap-2 text-base tracking-widest text-gold">
              <span className="inline-block h-2 w-2 bg-gold" />
              {t("footer.legal")}
            </h4>
            <ul className="font-condensed space-y-2.5 text-sm uppercase tracking-wider">
              {legalLinks.map(({ slug, label, Icon }) => (
                <li key={slug}>
                  <Link
                    to="/legal/$slug"
                    params={{ slug }}
                    className="group/link flex items-center gap-2.5 text-muted-foreground transition-colors hover:text-gold"
                  >
                    <Icon className="h-3.5 w-3.5 text-gold/60 transition-transform group-hover/link:translate-x-0.5" />
                    <span>{label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-border/60 pt-6 text-center md:flex-row md:text-left">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} <span className="text-gold">RollerZone</span> — {t("footer.rights")}
          </p>
          <p className="font-condensed text-[11px] uppercase tracking-widest text-muted-foreground">
            Hecho con pasión por el patinaje 🛼
          </p>
        </div>
      </div>
    </footer>
  );
}
