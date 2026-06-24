import { Link, useRouterState } from "@tanstack/react-router";
import { ChevronRight, Home } from "lucide-react";

const LABELS: Record<string, string> = {
  noticias: "Noticias",
  articulo: "Artículo",
  eventos: "Eventos",
  resultados: "Resultados",
  revista: "Revista",
  leer: "Leer",
  tv: "RollerZone TV",
  "premios-mvp": "Premios MVP",
  patinadores: "Patinadores",
  patrocinadores: "Patrocinadores",
  redactores: "Redactores",
  entrevistas: "Entrevistas",
  hub: "Hub",
  es: "España",
  co: "Colombia",
  clubes: "Clubes",
  federaciones: "Federaciones",
  comunidad: "Comunidad",
  competicion: "Competición",
  "liga-nacional": "Liga Nacional",
  calendario: "Calendario",
  clasificaciones: "Clasificaciones",
  noticias_: "Noticias",
  mvp: "MVP",
  live: "En directo",
  archivo: "Archivo",
  legal: "Legal",
  cookies: "Cookies",
  privacidad: "Privacidad",
  "aviso-legal": "Aviso legal",
  sobre: "Sobre",
  paises: "Países",
  dashboard: "Mi panel",
  "mi-biblioteca": "Mi biblioteca",
  auth: "Acceder",
  "camino-al-europeo-2026": "Camino al Europeo 2026",
  "presentacion-europeo-2026": "Presentación",
  "convocatoria-seleccion-espanola": "Convocatoria de España",
  "calendario-y-sedes": "Calendario y sedes",
  "entrevista-seleccionador": "Entrevista al seleccionador",
  "informacion-campeonato": "Información del campeonato",
  "resultados-y-medallero": "Resultados y medallero",
  "galeria-rollerzone-tv": "Galería / RollerZone TV",
};

const HIDDEN_PREFIXES = ["/admin", "/auth"];

function humanize(seg: string) {
  if (LABELS[seg]) return LABELS[seg];
  const decoded = decodeURIComponent(seg).replace(/-/g, " ");
  return decoded.charAt(0).toUpperCase() + decoded.slice(1);
}

export function Breadcrumbs() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  if (pathname === "/" || HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))) return null;

  const parts = pathname.split("/").filter(Boolean);
  const crumbs = parts.map((seg, i) => {
    const href = "/" + parts.slice(0, i + 1).join("/");
    return { label: humanize(seg), href, last: i === parts.length - 1 };
  });

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: "https://rollerzone.lovable.app/" },
      ...crumbs.map((c, i) => ({
        "@type": "ListItem",
        position: i + 2,
        name: c.label,
        item: `https://rollerzone.lovable.app${c.href}`,
      })),
    ],
  };

  return (
    <nav
      aria-label="Migas de pan"
      className="border-b border-[#2A2A2A] bg-[#141414]/60"
    >
      <ol className="mx-auto flex max-w-7xl flex-wrap items-center gap-1 px-4 py-2 text-[11px] text-[#A0A0A0] md:px-6">
        <li className="flex items-center">
          <Link
            to="/"
            className="inline-flex items-center gap-1 rounded px-1 py-0.5 text-[#A0A0A0] hover:text-[#D4A017] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4A017]"
          >
            <Home className="h-3 w-3" aria-hidden />
            <span className="sr-only sm:not-sr-only">Inicio</span>
          </Link>
        </li>
        {crumbs.map((c) => (
          <li key={c.href} className="flex items-center gap-1">
            <ChevronRight className="h-3 w-3 text-[#555]" aria-hidden />
            {c.last ? (
              <span aria-current="page" className="font-semibold text-[#F5F5F5]">
                {c.label}
              </span>
            ) : (
              <a
                href={c.href}
                className="rounded px-1 py-0.5 hover:text-[#D4A017] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4A017]"
              >
                {c.label}
              </a>
            )}
          </li>
        ))}
      </ol>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </nav>
  );
}
