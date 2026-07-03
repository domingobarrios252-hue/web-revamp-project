import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth-context";
import { AuthDialogProvider } from "@/lib/auth-dialog-context";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { LiveBar } from "@/components/site/LiveBar";
import { CookieBanner } from "@/components/site/CookieBanner";
import { GoogleAnalytics } from "@/components/site/GoogleAnalytics";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { AutoCanonical } from "@/components/site/AutoCanonical";
import { Toaster } from "@/components/ui/sonner";
import { PageSettingsProvider } from "@/lib/pageSettings";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="font-display text-7xl text-gold">404</div>
      <h2 className="font-display mt-4 text-2xl tracking-widest">Página no encontrada</h2>
      <p className="mt-2 text-sm text-muted-foreground">La página que buscas no existe.</p>
      <Link
        to="/"
        className="font-condensed mt-6 inline-flex items-center bg-gold px-5 py-2 text-xs font-bold uppercase tracking-widest text-background hover:bg-gold-dark"
      >
        Volver al inicio
      </Link>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "RollerZone — Patinaje de Velocidad" },
      {
        name: "description",
        content:
          "RollerZone — El medio del patinaje de velocidad en España. Noticias, rankings, eventos y entrevistas.",
      },
      { property: "og:title", content: "RollerZone — Patinaje de Velocidad" },
      {
        property: "og:description",
        content: "Noticias, rankings, eventos y entrevistas del patinaje de velocidad.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: "RollerZone — Patinaje de Velocidad" },
      { name: "description", content: "La pagina oficial de Rollerzone para las noticias del patinaje de Velocidad Nacional e internacional." },
      { property: "og:description", content: "La pagina oficial de Rollerzone para las noticias del patinaje de Velocidad Nacional e internacional." },
      { name: "twitter:description", content: "La pagina oficial de Rollerzone para las noticias del patinaje de Velocidad Nacional e internacional." },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/96e18c62-051f-45d8-b718-d61cb204c1d5" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/96e18c62-051f-45d8-b718-d61cb204c1d5" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "dns-prefetch", href: "https://dkxlqpjhipecevcknznj.supabase.co" },
      { rel: "preconnect", href: "https://dkxlqpjhipecevcknznj.supabase.co", crossOrigin: "anonymous" },
      { rel: "dns-prefetch", href: "https://www.googletagmanager.com" },
      {
        rel: "preload",
        as: "style",
        href: "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow+Condensed:wght@400;600;700&family=Barlow:wght@400;500;600&family=Inter:wght@400;500;600;700&family=Audiowide&display=swap",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow+Condensed:wght@400;600;700&family=Barlow:wght@400;500;600&family=Inter:wght@400;500;600;700&family=Audiowide&display=swap",
      },
    ],
    scripts: [
      {
        src: "https://www.googletagmanager.com/gtag/js?id=G-2ZLN80RMTW",
        async: true,
      },
      {
        children:
          "window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('js',new Date());gtag('config','G-2ZLN80RMTW',{send_page_view:false});",
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "RollerZone",
          alternateName: "RollerZone Spain",
          url: "https://rollerzone.es",
          logo: "https://rollerzone.es/favicon.ico",
          sameAs: [
            "https://www.instagram.com/rollerzone",
            "https://www.facebook.com/rollerzone",
          ],
        }).replace(/</g, "\\u003c"),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "RollerZone",
          url: "https://rollerzone.es",
          inLanguage: "es-ES",
          potentialAction: {
            "@type": "SearchAction",
            target: "https://rollerzone.es/noticias?q={search_term_string}",
            "query-input": "required name=search_term_string",
          },
        }).replace(/</g, "\\u003c"),
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <HeadContent />
      </head>
      <body className="premium-noise-bg">
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <AuthDialogProvider>
          <a href="#main-content" className="skip-link">Saltar al contenido</a>
          <AutoCanonical />
          <LiveBar />
          <SiteHeader />
          <Breadcrumbs />
          <main id="main-content" tabIndex={-1} className="min-h-[60vh]">
            <Outlet />
          </main>
          <SiteFooter />
          <CookieBanner />
          <GoogleAnalytics />
          <Toaster />
        </AuthDialogProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
