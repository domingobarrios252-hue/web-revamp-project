import { createFileRoute } from "@tanstack/react-router";
import { Mail, Instagram, Facebook } from "lucide-react";

export const Route = createFileRoute("/contacto")({
  head: () => ({
    meta: [
      { title: "Contacto — RollerZone" },
      { name: "description", content: "Contacta con RollerZone: redacción, colaboraciones, publicidad y sugerencias. Estamos para ayudarte." },
      { property: "og:title", content: "Contacto — RollerZone" },
      { property: "og:description", content: "Ponte en contacto con el equipo de RollerZone." },
    ],
  }),
  component: ContactoPage,
});

function ContactoPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="font-display mb-3 text-4xl tracking-widest text-gold">Contacto</h1>
      <p className="mb-10 text-lg text-muted-foreground">
        ¿Tienes una noticia, propuesta o consulta? Escríbenos y te responderemos lo antes posible.
      </p>

      <div className="space-y-5">
        <a
          href="mailto:info@rollerzone.es"
          className="flex items-center gap-4 rounded-lg border border-border bg-surface p-5 transition-colors hover:border-gold"
        >
          <Mail className="h-7 w-7 flex-shrink-0 text-gold" />
          <div>
            <h3 className="font-display text-base tracking-wide text-foreground">Correo electrónico</h3>
            <p className="text-sm text-muted-foreground">info@rollerzone.es</p>
          </div>
        </a>

        <a
          href="https://instagram.com/rollerzone_spain"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-4 rounded-lg border border-border bg-surface p-5 transition-colors hover:border-gold"
        >
          <Instagram className="h-7 w-7 flex-shrink-0 text-gold" />
          <div>
            <h3 className="font-display text-base tracking-wide text-foreground">Instagram</h3>
            <p className="text-sm text-muted-foreground">@rollerzone_spain</p>
          </div>
        </a>

        <a
          href="https://facebook.com/rollerzone.spain"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-4 rounded-lg border border-border bg-surface p-5 transition-colors hover:border-gold"
        >
          <Facebook className="h-7 w-7 flex-shrink-0 text-gold" />
          <div>
            <h3 className="font-display text-base tracking-wide text-foreground">Facebook</h3>
            <p className="text-sm text-muted-foreground">@rollerzone.spain</p>
          </div>
        </a>
      </div>

      <div className="mt-10 rounded-lg border border-border bg-surface p-6">
        <h2 className="font-display mb-3 text-lg tracking-widest text-gold">Tipos de consulta</h2>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li><span className="text-foreground">Redacción:</span> noticias, eventos, resultados.</li>
          <li><span className="text-foreground">Colaboraciones:</span> únete al equipo como redactor, fotógrafo o videógrafo.</li>
          <li><span className="text-foreground">Publicidad:</span> banners, patrocinios y contenido patrocinado.</li>
          <li><span className="text-foreground">Sugerencias:</span> ideas y mejoras para el medio.</li>
        </ul>
      </div>
    </div>
  );
}
