import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/quienes-somos")({
  head: () => ({
    meta: [
      { title: "Quiénes somos — RollerZone" },
      { name: "description", content: "Conoce RollerZone: el medio de referencia del patinaje de velocidad en España. Nuestra historia, misión y valores." },
      { property: "og:title", content: "Quiénes somos — RollerZone" },
      { property: "og:description", content: "El medio de referencia del patinaje de velocidad en España. Nuestra historia, misión y valores." },
    ],
  }),
  component: QuienesSomosPage,
});

function QuienesSomosPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="font-display mb-6 text-4xl tracking-widest text-gold">Quiénes somos</h1>
      <div className="space-y-5 text-base leading-relaxed text-foreground">
        <p>
          <strong className="text-gold">RollerZone</strong> es el medio digital de referencia del patinaje de velocidad
          en España. Nacimos con la vocación de dar visibilidad a un deporte apasionante y a quienes lo hacen posible:
          patinadores, clubes, entrenadores, familias y aficionados.
        </p>
        <p>
          Cubrimos competiciones nacionales e internacionales, publicamos entrevistas, rankings, retransmisiones en
          directo a través de RollerZone TV y una revista digital de actualidad.
        </p>
        <h2 className="font-display mt-8 text-2xl tracking-widest text-gold">Nuestra misión</h2>
        <p>
          Profesionalizar la cobertura del patinaje de velocidad, acercarlo al gran público y servir como punto de
          encuentro de toda la comunidad patinadora hispanohablante.
        </p>
        <h2 className="font-display mt-8 text-2xl tracking-widest text-gold">Nuestros valores</h2>
        <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
          <li><span className="text-foreground">Independencia editorial</span> y rigor informativo.</li>
          <li><span className="text-foreground">Pasión</span> por el patinaje y por quienes lo practican.</li>
          <li><span className="text-foreground">Cercanía</span> con clubes, deportistas y aficionados.</li>
          <li><span className="text-foreground">Innovación</span> en formatos y narrativa deportiva.</li>
        </ul>
        <div className="mt-10 border-t border-border pt-6">
          <Link to="/contacto" className="text-gold hover:underline">¿Quieres contactar con nosotros? →</Link>
        </div>
      </div>
    </div>
  );
}
