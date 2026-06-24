import { useState } from "react";
import { z } from "zod";
import { Loader2, Check, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const schema = z.object({
  full_name: z.string().trim().min(2, "Nombre demasiado corto").max(120),
  email: z.string().trim().email("Email no válido").max(255),
  country: z.string().trim().min(2, "Indica tu país").max(80),
  region: z.string().trim().max(120).optional().or(z.literal("")),
  club_or_federation: z.string().trim().max(160).optional().or(z.literal("")),
  topics: z.string().trim().min(2, "Indica qué quieres cubrir").max(500),
  role_type: z.enum(["redactor", "corresponsal", "fotografo", "otro"]),
  message: z.string().trim().max(3000).optional().or(z.literal("")),
});

type State = "idle" | "sending" | "ok" | "error";

export function ContributorSignupForm() {
  const [state, setState] = useState<State>("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const raw = Object.fromEntries(fd.entries());
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Revisa los campos");
      return;
    }
    setState("sending");
    const { error: err } = await supabase.from("contributor_signups").insert({
      full_name: parsed.data.full_name,
      email: parsed.data.email,
      country: parsed.data.country,
      region: parsed.data.region || null,
      club_or_federation: parsed.data.club_or_federation || null,
      topics: parsed.data.topics,
      role_type: parsed.data.role_type,
      message: parsed.data.message || null,
      language: "es",
      status: "nuevo",
    });
    if (err) {
      setState("error");
      setError("No se ha podido enviar. Inténtalo más tarde.");
      return;
    }
    setState("ok");
    (e.target as HTMLFormElement).reset();
  }

  if (state === "ok") {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-gold/40 bg-surface/80 p-8 text-center backdrop-blur">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gold/15 text-gold">
          <Check className="h-6 w-6" />
        </div>
        <h3 className="font-display mt-4 text-xl uppercase tracking-wider text-foreground">
          ¡Solicitud enviada!
        </h3>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Hemos recibido tus datos. El equipo editorial de RollerZone te contactará en breve.
        </p>
        <button
          type="button"
          onClick={() => setState("idle")}
          className="font-condensed mt-5 text-xs font-bold uppercase tracking-widest text-gold hover:text-gold-light"
        >
          Enviar otra solicitud
        </button>
      </div>
    );
  }

  const inputCls =
    "h-10 w-full rounded-md border border-border bg-background/80 px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold";

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-xl border border-border bg-surface/80 p-5 backdrop-blur md:p-6"
    >
      <div className="font-condensed mb-4 text-[10px] font-bold uppercase tracking-[3px] text-gold">
        Formulario de colaboración
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <input name="full_name" placeholder="Nombre y apellidos *" className={inputCls} required maxLength={120} />
        <input name="email" type="email" placeholder="Email *" className={inputCls} required maxLength={255} />
        <input name="country" placeholder="País *" className={inputCls} required maxLength={80} />
        <input name="region" placeholder="Zona / ciudad" className={inputCls} maxLength={120} />
        <input
          name="club_or_federation"
          placeholder="Club o federación (opcional)"
          className={`${inputCls} md:col-span-2`}
          maxLength={160}
        />
        <select name="role_type" defaultValue="redactor" className={`${inputCls} md:col-span-2`}>
          <option value="redactor">Redactor/a</option>
          <option value="corresponsal">Corresponsal local</option>
          <option value="fotografo">Fotógrafo/a</option>
          <option value="otro">Otro</option>
        </select>
        <input
          name="topics"
          placeholder="Temas que quieres cubrir (ej. ruta, pista, marathon, RFEP...) *"
          className={`${inputCls} md:col-span-2`}
          required
          maxLength={500}
        />
        <textarea
          name="message"
          placeholder="Cuéntanos brevemente tu experiencia o motivación"
          rows={3}
          maxLength={3000}
          className="w-full resize-y rounded-md border border-border bg-background/80 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold md:col-span-2"
        />
      </div>

      {error && (
        <p className="mt-3 text-xs font-medium text-destructive">{error}</p>
      )}

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[11px] text-muted-foreground">
          Al enviar aceptas que RollerZone te contacte sobre tu solicitud.
        </p>
        <button
          type="submit"
          disabled={state === "sending"}
          className="font-condensed inline-flex items-center gap-2 rounded-md bg-gold px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-background shadow-lg transition-all hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-60"
        >
          {state === "sending" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Enviando…
            </>
          ) : (
            <>
              Quiero colaborar <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </div>
    </form>
  );
}
