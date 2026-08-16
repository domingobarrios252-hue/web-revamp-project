import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ShieldAlert, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type State = "loading" | "no-factor" | "aal1" | "aal2";

/**
 * Aviso de doble factor para administradores.
 * Solo informa: la protección real se aplica en servidor (RLS + funciones).
 */
export function MfaStatusBanner() {
  const [state, setState] = useState<State>("loading");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [{ data: factors }, { data: aal }] = await Promise.all([
        supabase.auth.mfa.listFactors(),
        supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
      ]);
      if (cancelled) return;
      const verified = (factors?.totp ?? []).some((f) => f.status === "verified");
      if (!verified) setState("no-factor");
      else setState(aal?.currentLevel === "aal2" ? "aal2" : "aal1");
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (state === "loading" || state === "aal2") return null;

  return (
    <div className="mb-4 flex flex-col gap-2 border border-gold/60 bg-gold/10 p-3 text-sm sm:flex-row sm:items-center sm:justify-between">
      <p className="flex items-start gap-2 text-foreground">
        {state === "no-factor" ? (
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
        ) : (
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
        )}
        <span>
          {state === "no-factor"
            ? "Por seguridad, debes activar la autenticación en dos pasos para continuar utilizando las funciones administrativas sensibles."
            : "Tienes el doble factor activado, pero esta sesión no está verificada (AAL1). Verifica tu código para realizar operaciones sensibles."}
        </span>
      </p>
      <Link
        to="/admin/seguridad"
        className="font-condensed shrink-0 bg-gold px-3 py-2 text-center text-xs font-bold uppercase tracking-widest text-background hover:bg-gold-dark"
      >
        {state === "no-factor" ? "Activar doble factor" : "Verificar sesión"}
      </Link>
    </div>
  );
}
