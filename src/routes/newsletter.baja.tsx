import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { unsubscribeNewsletter } from "@/lib/security/public-forms.functions";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";

export const Route = createFileRoute("/newsletter/baja")({
  head: () => ({
    meta: [
      { title: "Darse de baja de la newsletter | RollerZone" },
      {
        name: "description",
        content:
          "Cancela en un clic tu suscripción a la newsletter de RollerZone, sin necesidad de iniciar sesión.",
      },
      { property: "og:title", content: "Darse de baja de la newsletter | RollerZone" },
      {
        property: "og:description",
        content: "Cancela tu suscripción a la newsletter de RollerZone.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: UnsubscribePage,
});

type State = "ready" | "loading" | "done" | "already" | "invalid" | "error";

function UnsubscribePage() {
  const unsubscribe = useServerFn(unsubscribeNewsletter);
  const [token, setToken] = useState("");
  const [state, setState] = useState<State>("loading");

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("token") ?? "";
    if (!/^[a-f0-9]{64}$/.test(t)) {
      setState("invalid");
      return;
    }
    setToken(t);
    setState("ready");
  }, []);

  async function handleUnsubscribe() {
    setState("loading");
    try {
      const res = await unsubscribe({ data: { token } });
      if (res.ok) setState(res.alreadyUnsubscribed ? "already" : "done");
      else if (res.error === "invalid") setState("invalid");
      else setState("error");
    } catch {
      setState("error");
    }
  }

  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-2xl flex-col justify-center px-4 py-16">
      <div className="border border-border bg-card p-6 md:p-8">
        <p className="font-condensed text-[11px] font-bold uppercase tracking-[0.2em] text-gold">
          Newsletter RollerZone
        </p>
        <h1 className="font-display mt-2 text-2xl uppercase tracking-wider text-foreground md:text-3xl">
          Darme de baja
        </h1>

        <div className="mt-6 text-sm leading-relaxed text-muted-foreground">
          {state === "loading" && (
            <p className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-gold" aria-hidden="true" />
              Procesando…
            </p>
          )}
          {state === "ready" && (
            <>
              <p>
                Pulsa el botón para cancelar tu suscripción a la newsletter. La baja se aplica de
                inmediato y no tendrás que escribir tu email ni iniciar sesión.
              </p>
              <button
                type="button"
                onClick={handleUnsubscribe}
                className="mt-5 inline-flex min-h-[44px] items-center border border-red-500 px-5 py-2 text-xs font-bold uppercase tracking-widest text-red-400 transition-colors hover:bg-red-500 hover:text-white"
              >
                Confirmar baja
              </button>
            </>
          )}
          {state === "done" && (
            <div className="flex items-start gap-2 text-foreground">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-gold" aria-hidden="true" />
              <p>
                <strong>Baja completada.</strong> Ya no recibirás más envíos de la newsletter. Si
                algún día quieres volver, podrás suscribirte de nuevo desde el pie de la web.
              </p>
            </div>
          )}
          {state === "already" && (
            <p>Tu email ya estaba dado de baja. No recibirás más envíos de la newsletter.</p>
          )}
          {state === "invalid" && (
            <div className="flex items-start gap-2">
              <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" aria-hidden="true" />
              <p>
                Este enlace de baja no es válido. Escríbenos a{" "}
                <a className="text-gold underline" href="mailto:rollerzonespain@gmail.com">
                  rollerzonespain@gmail.com
                </a>{" "}
                y lo gestionamos.
              </p>
            </div>
          )}
          {state === "error" && <p>No hemos podido procesar la baja. Inténtalo de nuevo.</p>}
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
