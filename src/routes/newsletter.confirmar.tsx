import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { confirmNewsletter } from "@/lib/security/public-forms.functions";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";

export const Route = createFileRoute("/newsletter/confirmar")({
  head: () => ({
    meta: [
      { title: "Confirmar suscripción a la newsletter | RollerZone" },
      {
        name: "description",
        content:
          "Confirma tu suscripción a la newsletter de RollerZone para recibir las noticias del patinaje de velocidad.",
      },
      { property: "og:title", content: "Confirmar suscripción a la newsletter | RollerZone" },
      {
        property: "og:description",
        content: "Activa tu suscripción a la newsletter de RollerZone.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ConfirmNewsletterPage,
});

type State = "loading" | "ok" | "expired" | "invalid" | "error";

function ConfirmNewsletterPage() {
  const confirm = useServerFn(confirmNewsletter);
  const [state, setState] = useState<State>("loading");
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    const token = new URLSearchParams(window.location.search).get("token") ?? "";
    if (!/^[a-f0-9]{64}$/.test(token)) {
      setState("invalid");
      return;
    }
    confirm({ data: { token } })
      .then((res) => {
        if (res.ok) setState("ok");
        else if (res.error === "expired") setState("expired");
        else if (res.error === "invalid") setState("invalid");
        else setState("error");
      })
      .catch(() => setState("error"));
  }, [confirm]);

  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-2xl flex-col justify-center px-4 py-16">
      <div className="border border-border bg-card p-6 md:p-8">
        <p className="font-condensed text-[11px] font-bold uppercase tracking-[0.2em] text-gold">
          Newsletter RollerZone
        </p>
        <h1 className="font-display mt-2 text-2xl uppercase tracking-wider text-foreground md:text-3xl">
          Confirmación de suscripción
        </h1>

        <div className="mt-6 text-sm leading-relaxed text-muted-foreground">
          {state === "loading" && (
            <p className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-gold" aria-hidden="true" />
              Comprobando tu enlace…
            </p>
          )}
          {state === "ok" && (
            <div className="flex items-start gap-2 text-foreground">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-gold" aria-hidden="true" />
              <p>
                <strong>Suscripción activada.</strong> Ya recibirás la newsletter de RollerZone.
                Puedes darte de baja en cualquier momento desde el enlace del pie de cada envío.
              </p>
            </div>
          )}
          {state === "expired" && (
            <div className="flex items-start gap-2">
              <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" aria-hidden="true" />
              <p>
                Este enlace de confirmación ha caducado. Vuelve a suscribirte desde el formulario
                del pie de la web y te enviaremos uno nuevo.
              </p>
            </div>
          )}
          {state === "invalid" && (
            <div className="flex items-start gap-2">
              <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" aria-hidden="true" />
              <p>
                Este enlace no es válido o ya se ha utilizado. Si ya confirmaste antes, tu
                suscripción está activa y no hace falta hacer nada más.
              </p>
            </div>
          )}
          {state === "error" && (
            <p>No hemos podido procesar la confirmación. Inténtalo de nuevo en unos minutos.</p>
          )}
        </div>

        <div className="mt-8 flex flex-wrap gap-3 text-xs uppercase tracking-widest">
          <Link
            to="/"
            className="inline-flex min-h-[44px] items-center border border-gold px-4 py-2 font-bold text-gold transition-colors hover:bg-gold hover:text-background"
          >
            Ir a la portada
          </Link>
          <Link
            to="/legal/$slug"
            params={{ slug: "privacidad" }}
            className="inline-flex min-h-[44px] items-center px-2 py-2 text-muted-foreground underline hover:text-gold"
          >
            Política de Privacidad
          </Link>
        </div>
      </div>
    </main>
  );
}
