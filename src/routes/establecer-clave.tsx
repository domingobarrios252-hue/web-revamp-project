import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Página de destino de los correos de invitación y de restablecimiento de
 * contraseña del equipo interno. Supabase envía el enlace a esta ruta con los
 * tokens en el fragmento de la URL; el cliente los canjea por una sesión y aquí
 * el editor fija su contraseña definitiva.
 */
export const Route = createFileRoute("/establecer-clave")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Establecer contraseña | RollerZone" },
      { name: "description", content: "Establece tu contraseña de acceso al panel editorial de RollerZone." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: SetPasswordPage,
});

function SetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    const check = async () => {
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      setHasSession(Boolean(data.session));
      setReady(true);
    };
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!active) return;
      setHasSession(Boolean(session));
      setReady(true);
    });
    void check();
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 10) return toast.error("La contraseña debe tener al menos 10 caracteres");
    if (password !== confirm) return toast.error("Las contraseñas no coinciden");
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Contraseña establecida");
    navigate({ to: "/acceso-interno", replace: true });
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-6 py-10">
      <div className="border border-border bg-surface p-6 md:p-8">
        <h1 className="font-display text-2xl tracking-widest md:text-3xl">
          ROLLERZONE <span className="text-gold">· NUEVA CONTRASEÑA</span>
        </h1>

        {!ready ? (
          <p className="mt-4 text-sm text-muted-foreground">Validando el enlace…</p>
        ) : !hasSession ? (
          <p className="mt-4 text-sm text-muted-foreground">
            El enlace no es válido o ha caducado. Pide a un administrador de RollerZone que te
            reenvíe el enlace de acceso.
          </p>
        ) : (
          <form onSubmit={onSubmit} className="mt-6 space-y-3">
            <label className="block">
              <span className="font-condensed mb-1 block text-xs uppercase tracking-widest text-muted-foreground">
                Nueva contraseña
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                required
                className="min-h-11 w-full border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
              />
            </label>
            <label className="block">
              <span className="font-condensed mb-1 block text-xs uppercase tracking-widest text-muted-foreground">
                Repite la contraseña
              </span>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
                required
                className="min-h-11 w-full border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
              />
            </label>
            <button
              type="submit"
              disabled={saving}
              className="font-condensed mt-2 min-h-11 w-full bg-gold py-3 text-sm font-bold uppercase tracking-widest text-background transition-colors hover:bg-gold-dark disabled:opacity-50"
            >
              {saving ? "Guardando…" : "Guardar contraseña"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
