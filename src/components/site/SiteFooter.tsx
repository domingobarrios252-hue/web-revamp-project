import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Instagram,
  Facebook,
  Mail,
  Newspaper,
  Calendar,
  Tv,
  Trophy,
  BookOpen,
  Users,
  PenTool,
  Handshake,
  Megaphone,
  Shield,
  FileText,
  Cookie,
  Info,
  Heart,
  Star,
  type LucideIcon,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { supabase } from "@/integrations/supabase/client";

const CONTACT_EMAIL = "rollerzonespain@gmail.com";

const ICON_MAP: Record<string, LucideIcon> = {
  Info,
  Users,
  PenTool,
  Handshake,
  Megaphone,
  Mail,
  FileText,
  Heart,
  Star,
  Newspaper,
};

type AboutLink = {
  id: string;
  label: string;
  link_type: "internal" | "external" | "email";
  target: string;
  icon: string;
};

const KNOWN_INTERNAL: Record<string, string> = {
  redactores: "/redactores",
  patrocinadores: "/patrocinadores",
  noticias: "/noticias",
  eventos: "/eventos",
  tv: "/tv",
  revista: "/revista",
  "premios-mvp": "/premios-mvp",
};

export function SiteFooter() {
  const { t } = useLanguage();
  const [aboutLinks, setAboutLinks] = useState<AboutLink[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("about_links")
        .select("id, label, link_type, target, icon")
        .eq("active", true)
        .order("sort_order");
      if (!cancelled && data) setAboutLinks(data as AboutLink[]);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const navLinks = [
    { to: "/noticias", label: t("nav.news"), Icon: Newspaper },
    { to: "/eventos", label: t("nav.events"), Icon: Calendar },
    { to: "/tv", label: "RollerZone TV", Icon: Tv },
    { to: "/premios-mvp", label: t("nav.mvpAwards"), Icon: Trophy },
    { to: "/revista", label: t("nav.magazine"), Icon: BookOpen },
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
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* 1. Logo + redes */}
          <div>
            <div className="font-display text-3xl tracking-widest">
              <span className="text-[#D4A017]">Roller</span>
              <span className="text-[#F5F5F5]">Zone</span>
            </div>
            <p className="font-condensed mt-3 max-w-xs text-sm uppercase tracking-wider text-[#A0A0A0]">
              {t("footer.tagline")}
            </p>
            <div className="mt-5">
              <span className="font-condensed mb-3 block text-[11px] uppercase tracking-widest text-[#D4A017]">
                {t("footer.followUs")}
              </span>
              <div className="flex gap-2">
                <a
                  href="https://instagram.com/rollerzone_spain"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram @rollerzone_spain"
                  className="flex h-10 w-10 items-center justify-center border border-[#333] bg-transparent text-[#A0A0A0] transition-colors hover:border-[#D4A017] hover:text-[#D4A017]"
                >
                  <Instagram className="h-4 w-4" aria-hidden="true" />
                </a>
                <a
                  href="https://facebook.com/rollerzone.spain"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook @rollerzone.spain"
                  className="flex h-10 w-10 items-center justify-center border border-[#333] bg-transparent text-[#A0A0A0] transition-colors hover:border-[#D4A017] hover:text-[#D4A017]"
                >
                  <Facebook className="h-4 w-4" aria-hidden="true" />
                </a>
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  aria-label={`Enviar email a ${CONTACT_EMAIL}`}
                  className="flex h-10 w-10 items-center justify-center border border-[#333] bg-transparent text-[#A0A0A0] transition-colors hover:border-[#D4A017] hover:text-[#D4A017]"
                >
                  <Mail className="h-4 w-4" aria-hidden="true" />
                </a>
              </div>
            </div>
          </div>

          {/* 2. Navegación */}
          <div>
            <h3 className="font-display mb-4 text-base tracking-widest text-[#D4A017]">
              Navegación
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
              {aboutLinks.map((item) => {
                const Icon = ICON_MAP[item.icon] ?? Info;
                const inner = (
                  <>
                    <Icon className="h-3.5 w-3.5 text-[#D4A017]/70" aria-hidden="true" />
                    <span>{item.label}</span>
                  </>
                );
                if (item.link_type === "external") {
                  return (
                    <li key={item.id}>
                      <a
                        href={item.target}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={linkClass}
                      >
                        {inner}
                      </a>
                    </li>
                  );
                }
                if (item.link_type === "email") {
                  return (
                    <li key={item.id}>
                      <a href={`mailto:${item.target}`} className={linkClass}>
                        {inner}
                      </a>
                    </li>
                  );
                }
                const knownPath = KNOWN_INTERNAL[item.target];
                if (knownPath) {
                  return (
                    <li key={item.id}>
                      <a href={knownPath} className={linkClass}>
                        {inner}
                      </a>
                    </li>
                  );
                }
                return (
                  <li key={item.id}>
                    <Link
                      to="/sobre/$slug"
                      params={{ slug: item.target }}
                      className={linkClass}
                    >
                      {inner}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* 4. Legal */}
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
            © {new Date().getFullYear()}{" "}
            <span className="text-[#D4A017]">RollerZone</span> — {t("footer.rights")}
          </p>
          <p className="font-condensed text-[11px] uppercase tracking-widest text-[#666]">
            Hecho con pasión por el patinaje 🛼
          </p>
        </div>
      </div>
    </footer>
  );
}
