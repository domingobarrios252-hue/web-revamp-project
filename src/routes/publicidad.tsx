import { createFileRoute, Link } from "@tanstack/react-router";
import { Target, Users, BarChart3, Mail } from "lucide-react";

export const Route = createFileRoute("/publicidad")({
  head: () => ({
    meta: [
      { title: "Publicidad — RollerZone" },
      { name: "description", content: "Anúnciate en RollerZone y llega a la comunidad del patinaje de velocidad en España. Banners, contenido patrocinado y patrocinios de RollerZone TV." },
      { property: "og:title", content: "Publicidad en RollerZone" },
      { property: "og:description", content: "Llega a la comunidad del patinaje de velocidad en España." },
    ],
  }),
  component: PublicidadPage,
});

const benefits = [
  { Icon: Target, title: "Audiencia segmentada", desc: "Conecta directamente con patinadores, clubes, familias y aficionados al patinaje de velocidad." },
  { Icon: Users, title: "Comunidad activa", desc: "Miles de seguidores en redes sociales y lectores fieles que confían en nuestro medio." },
  { Icon: BarChart3, title: "Visibilidad nacional", desc: "Cobertura de competiciones en toda España con presencia destacada en eventos clave." },
];

const formats = [
  { title: "Banners en web", desc: "Espacios destacados en portada, secciones de noticias y artículos." },
  { title: "Contenido patrocinado", desc: "Reportajes y notas de prensa integradas con tu marca." },
  { title: "Patrocinio RollerZone TV", desc: "Aparece en nuestras retransmisiones en directo y highlights." },
  { title: "Revista digital", desc: "Páginas publicitarias en nuestra revista trimestral." },
  { title: "Redes sociales", desc: "Colaboraciones en Instagram y Facebook." },
];

function PublicidadPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="font-display mb-3 text-4xl tracking-widest text-gold">Publicidad</h1>
      <p className="mb-10 text-lg text-muted-foreground">
        Conecta tu marca con la comunidad del patinaje de velocidad en España.
      </p>

      <section>
        <h2 className="font-display mb-4 text-xl tracking-widest text-gold">¿Por qué anunciarte con nosotros?</h2>
        <div className="grid gap-5 sm:grid-cols-3">
          {benefits.map(({ Icon, title, desc }) => (
            <div key={title} className="rounded-lg border border-border bg-surface p-5">
              <Icon className="mb-3 h-7 w-7 text-gold" />
              <h3 className="font-display text-base tracking-wide text-foreground">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="font-display mb-4 text-xl tracking-widest text-gold">Formatos disponibles</h2>
        <div className="divide-y divide-border rounded-lg border border-border bg-surface">
          {formats.map((f) => (
            <div key={f.title} className="p-5">
              <h3 className="font-display text-base tracking-wide text-foreground">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12 rounded-lg border border-gold/30 bg-gold/5 p-6">
        <div className="flex items-start gap-4">
          <Mail className="mt-1 h-6 w-6 flex-shrink-0 text-gold" />
          <div>
            <h2 className="font-display text-xl tracking-widest text-gold">Solicita información</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Cuéntanos tu proyecto y te enviaremos nuestro mediakit con tarifas, formatos y propuestas a medida.
            </p>
            <Link
              to="/contacto"
              className="font-condensed mt-4 inline-block border border-gold bg-gold px-5 py-2 text-sm uppercase tracking-widest text-background transition-colors hover:bg-transparent hover:text-gold"
            >
              Contactar
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
