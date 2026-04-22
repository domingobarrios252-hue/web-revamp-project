import { createFileRoute, Link } from "@tanstack/react-router";
import { PenLine, Camera, Video, Megaphone } from "lucide-react";

export const Route = createFileRoute("/colabora")({
  head: () => ({
    meta: [
      { title: "Colabora — RollerZone" },
      { name: "description", content: "Únete a RollerZone como redactor, fotógrafo, videógrafo o colaborador. Buscamos personas apasionadas por el patinaje de velocidad." },
      { property: "og:title", content: "Colabora con RollerZone" },
      { property: "og:description", content: "Únete a nuestro equipo: redactores, fotógrafos, videógrafos y colaboradores." },
    ],
  }),
  component: ColaboraPage,
});

const roles = [
  { Icon: PenLine, title: "Redactor/a", desc: "Escribe crónicas, previas y análisis de competiciones nacionales e internacionales." },
  { Icon: Camera, title: "Fotógrafo/a", desc: "Cubre pruebas y eventos, aportando imágenes de calidad para nuestras publicaciones." },
  { Icon: Video, title: "Videógrafo/a", desc: "Produce highlights, reportajes y contenido para RollerZone TV." },
  { Icon: Megaphone, title: "Comunicación", desc: "Ayúdanos en redes sociales, difusión y community management." },
];

function ColaboraPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="font-display mb-3 text-4xl tracking-widest text-gold">Colabora</h1>
      <p className="mb-10 text-lg text-muted-foreground">
        Buscamos personas apasionadas por el patinaje de velocidad para crecer juntos.
      </p>

      <div className="grid gap-5 sm:grid-cols-2">
        {roles.map(({ Icon, title, desc }) => (
          <div key={title} className="rounded-lg border border-border bg-surface p-6 transition-colors hover:border-gold">
            <Icon className="mb-3 h-8 w-8 text-gold" />
            <h3 className="font-display text-lg tracking-wide text-foreground">{title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-lg border border-gold/30 bg-gold/5 p-6">
        <h2 className="font-display text-xl tracking-widest text-gold">¿Te interesa?</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Escríbenos contándonos quién eres, tu experiencia y en qué te gustaría colaborar. Valoramos todas las
          propuestas y te responderemos lo antes posible.
        </p>
        <Link
          to="/contacto"
          className="font-condensed mt-4 inline-block border border-gold bg-gold px-5 py-2 text-sm uppercase tracking-widest text-background transition-colors hover:bg-transparent hover:text-gold"
        >
          Escríbenos
        </Link>
      </div>
    </div>
  );
}
