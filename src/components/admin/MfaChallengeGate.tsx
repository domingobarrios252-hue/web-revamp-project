import { useCallback, useEffect, useState, type ReactNode } from "react";
import { ShieldCheck, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

type Status = "checking" | "needs-challenge" | "ok";

/**
 * Exige completar el segundo factor (TOTP) antes de usar el panel administrativo
 * cuando la cuenta ya tiene un factor verificado y la sesión sigue en AAL1.
 * No muestra QR ni enrolamiento: solo el desafío del factor existente.
 * La protección real (RLS + funciones) sigue exigiendo AAL2 en servidor.
 */
export function MfaChallengeGate({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth();
  const [status, setStatus] = useState<Status>("checking");
  const [factorId, setFactorId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const check = useCallback(async () => {
    if (!user) {
      setStatus("ok");
      return;
    }
    const [{ data: factors }, { data: aal }] = await Promise.all([
      supabase.auth.mfa.listFactors(),
      supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
    ]);
    const verified = (factors?.totp ?? []).filter((f) => f.status === "verified");
    if (verified.length === 0) {
      setStatus("ok");
      return;
    }
    if (aal?.currentLevel === "aal2") {
      setStatus("ok");
      return;
    }
    setFactorId(verified[0]?.id ?? null);
    setStatus("needs-challenge");
  }, [user]);

  useEffect(() => {
    void check();
  }, [check]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!factorId) return;
    const clean = code.replace(/\D/g, "");
    if (clean.length !== 6) {
      setError("Introduce el código de 6 dígitos.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const { data: challenge, error: cErr } = await supabase.auth.mfa.challenge({ factorId });
      if (cErr || !challenge) {
        setError(cErr?.message ?? "No se pudo iniciar la verificación.");
        return;
      }
      const { error: vErr } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.id,
        code: clean,
      });
      if (vErr) {
        setError("Código incorrecto o caducado. Inténtalo de nuevo.");
        setCode("");
        return;
      }
      setCode("");
      setStatus("checking");
      await check();
    } finally {
      setSubmitting(false);
    }
  };

  if (status === "ok") return <>{children}</>;

  if (status === "checking") {
    return (
      <div className="flex items-center gap-2 px-6 py-16 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Verificando sesión…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <div className="border border-gold/60 bg-surface p-6">
        <h1 className="font-display flex items-center gap-2 text-2xl tracking-widest">
          <ShieldCheck className="h-5 w-5 text-gold" /> Verificación en dos pasos
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Introduce el código de 6 dígitos de tu aplicación de autenticación para acceder al panel
          administrativo.
        </p>
        <form onSubmit={onSubmit} className="mt-5 space-y-3">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus
            placeholder="000000"
            aria-label="Código de verificación"
            className="w-full border border-border bg-background px-3 py-3 text-center text-lg tracking-[0.4em] text-foreground focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <button
            type="submit"
            disabled={submitting || code.length !== 6}
            className="font-condensed w-full bg-gold py-3 text-sm font-bold uppercase tracking-widest text-background hover:bg-gold-dark disabled:opacity-50"
          >
            {submitting ? "Verificando…" : "Verificar y continuar"}
          </button>
        </form>
        <button
          type="button"
          onClick={() => void signOut()}
          className="mt-4 w-full text-xs uppercase tracking-widest text-muted-foreground hover:text-gold"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}
