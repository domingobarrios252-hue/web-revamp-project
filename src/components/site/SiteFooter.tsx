import { Link } from "@tanstack/react-router";
import {
  Instagram,
  Facebook,
  Mail,
  Newspaper,
  Calendar,
  Tv,
  Trophy,
  BookOpen,
  Shield,
  FileText,
  Cookie,
  Users,
  PenLine,
  Megaphone,
  AtSign,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { NewsletterForm } from "./NewsletterForm";
import { usePageSettings } from "@/lib/pageSettings";

const CONTACT_EMAIL = "rollerzonespain@gmail.com";

export function SiteFooter() {
  const { t } = useLanguage();
  const { settings } = usePageSettings();
  const isVisible = (slug: string) => settings[slug]?.status !== "hidden";

  const navLinks = [
    { to: "/noticias", label: t("nav.news"), Icon: Newspaper, slug: "noticias" },
    { to: "/eventos", label: t("nav.events"), Icon: Calendar, slug: "eventos" },
    { to: "/tv", label: "RollerZone TV", Icon: Tv, slug: "rollerzone-tv" },
    { to: "/premios-mvp", label: t("nav.mvpAwards"), Icon: Trophy, slug: "premios-mvp" },
    { to: "/revista", label: t("nav.magazine"), Icon: BookOpen, slug: "revista" },
  ].filter((l) => isVisible(l.slug));

  const aboutLinks = [
    { to: "/sobre/$slug", params: { slug: "quienes-somos" }, label: "Quiénes somos", Icon: Users },
    { to: "/redactores", params: undefined, label: "Redactores", Icon: PenLine },
    { to: "/sobre/$slug", params: { slug: "publicidad" }, label: "Publicidad", Icon: Megaphone },
    { to: "/sobre/$slug", params: { slug: "contacto" }, label: "Contacto", Icon: AtSign },
  ] as const;

  const legalLinks = [
    { slug: "aviso-legal", label: t("footer.legalNotice"), Icon: FileText },
    { slug: "privacidad", label: t("footer.privacy"), Icon: Shield },
    { slug: "cookies", label: t("footer.cookies"), Icon: Cookie },
  ] as const;

  const linkClass =
    "group/link flex items-center gap-2.5 text-[#A0A0A0] hover:text-[#D4A017] transition-colors";

  return (
    <footer
      className="mt-16 border-t border-[#333] bg-[#0F0F0F] text-[#A0A0A0]"
      aria-labelledby="footer-heading"
    >
      <h2 id="footer-heading" className="sr-only">
        Pie de página
      </h2>
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
          {/* 1. Logo + descripción */}
          <div>
            <div className="font-display text-3xl tracking-widest">
              <span className="text-[#D4A017]">Roller</span>
              <span className="text-[#F5F5F5]">Zone</span>
            </div>
            <p className="font-condensed mt-3 max-w-xs text-sm uppercase tracking-wider text-[#A0A0A0]">
              {t("footer.tagline")}
            </p>
          </div>

          {/* 2. Navegación */}
          <div>
            <h3 className="font-display mb-4 text-base tracking-widest text-[#D4A017]">
              {t("footer.navigation")}
            </h3>
            <ul className="font-condensed space-y-2.5 text-sm uppercase tracking-wider">
              {navLinks.map(({ to, label, Icon }) => (
                <li key={to + label}>
                  <Link to={to} className={linkClass}>
                    <Icon className="h-3.5 w-3.5 text-[#D4A017]/70" aria-hidden="true" />
                    <span>{label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* 3. Sobre nosotros */}
          <div>
            <h3 className="font-display mb-4 text-base tracking-widest text-[#D4A017]">
              Sobre nosotros
            </h3>
            <ul className="font-condensed space-y-2.5 text-sm uppercase tracking-wider">
              {aboutLinks.map(({ to, params, label, Icon }) => (
                <li key={label}>
                  {params ? (
                    <Link to={to} params={params} className={linkClass}>
                      <Icon className="h-3.5 w-3.5 text-[#D4A017]/70" aria-hidden="true" />
                      <span>{label}</span>
                    </Link>
                  ) : (
                    <Link to={to} className={linkClass}>
                      <Icon className="h-3.5 w-3.5 text-[#D4A017]/70" aria-hidden="true" />
                      <span>{label}</span>
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* 4. Comunidad */}
          <div>
            <h3 className="font-display mb-4 text-base tracking-widest text-[#D4A017]">
              Comunidad
            </h3>
            <ul className="font-condensed space-y-2.5 text-sm uppercase tracking-wider">
              <li>
                <a
                  href="https://instagram.com/rollerzone_spain"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram @rollerzone_spain"
                  className={linkClass}
                >
                  <Instagram className="h-3.5 w-3.5 text-[#D4A017]/70" aria-hidden="true" />
                  <span>Instagram</span>
                </a>
              </li>
              <li>
                <a
                  href="https://facebook.com/rollerzone.spain"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook @rollerzone.spain"
                  className={linkClass}
                >
                  <Facebook className="h-3.5 w-3.5 text-[#D4A017]/70" aria-hidden="true" />
                  <span>Facebook</span>
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  aria-label={`Enviar email a ${CONTACT_EMAIL}`}
                  className={linkClass}
                >
                  <Mail className="h-3.5 w-3.5 text-[#D4A017]/70" aria-hidden="true" />
                  <span>Email</span>
                </a>
              </li>
            </ul>
            <div className="mt-5">
              <span className="font-condensed mb-2 block text-[11px] uppercase tracking-widest text-[#D4A017]">
                Newsletter
              </span>
              <NewsletterForm source="footer" />
            </div>
          </div>

          {/* 5. Legal */}
          <div>
            <h3 className="font-display mb-4 text-base tracking-widest text-[#D4A017]">
              {t("footer.legal")}
            </h3>
            <ul className="font-condensed space-y-2.5 text-sm uppercase tracking-wider">
              {legalLinks.map(({ slug, label, Icon }) => (
                <li key={slug}>
                  <Link to="/legal/$slug" params={{ slug }} className={linkClass}>
                    <Icon className="h-3.5 w-3.5 text-[#D4A017]/70" aria-hidden="true" />
                    <span>{label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center gap-2 border-t border-[#333] pt-6 text-center">
          <p className="text-xs text-[#A0A0A0]">
            © 2026 <span className="text-[#D4A017]">RollerZone</span> — {t("footer.rights")}
          </p>
        </div>
      </div>
    </footer>
  );
}

