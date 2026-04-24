import { useState, type FormEvent } from "react";
import { Mail, Send, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

/**
 * Bloque de captación de usuarios — newsletter.
 * Por ahora se valida en cliente y se muestra confirmación.
 * Se puede integrar con un servicio externo (Brevo, Resend, etc.) más adelante.
 */
export function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Introduce un email válido");
      return;
    }
    setStatus("loading");
    // Simulación de suscripción
    await new Promise((r) => setTimeout(r, 600));
    setStatus("done");
    toast.success("¡Bienvenido a la comunidad RollerZone!");
  };

  return (
    <div className="relative overflow-hidden rounded-lg border border-gold/40 bg-gradient-to-br from-surface via-background to-surface p-6 shadow-lg shadow-gold/5 md:p-8">
      {/* Acento dorado */}
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-gold to-transparent" />
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gold/10 blur-3xl" />

      <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <div className="font-condensed inline-flex items-center gap-2 bg-gold/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[3px] text-gold">
            <Mail className="h-3 w-3" />
            Newsletter semanal
          </div>
          <h3 className="font-display mt-3 text-2xl uppercase leading-tight tracking-wider text-foreground md:text-3xl">
            No te pierdas <span className="text-gold">ni una carrera</span>
          </h3>
          <p className="font-condensed mt-2 max-w-md text-sm uppercase tracking-wider text-muted-foreground">
            Recibe cada semana lo más importante del patinaje de velocidad: resultados, entrevistas y eventos.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex w-full flex-col gap-2 sm:flex-row md:w-auto">
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="email"
              required
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={status !== "idle"}
              className="font-condensed h-11 w-full border border-border bg-background px-3 pl-9 text-sm uppercase tracking-wider text-foreground placeholder:text-muted-foreground/60 focus:border-gold focus:outline-none disabled:opacity-60 sm:w-[260px]"
            />
          </div>
          <button
            type="submit"
            disabled={status !== "idle"}
            className="font-condensed inline-flex h-11 items-center justify-center gap-2 bg-gold px-5 text-xs font-bold uppercase tracking-[2.5px] text-background transition-colors hover:bg-gold-dark disabled:cursor-not-allowed disabled:opacity-70"
          >
            {status === "done" ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Suscrito
              </>
            ) : (
              <>
                Suscribirme
                <Send className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
