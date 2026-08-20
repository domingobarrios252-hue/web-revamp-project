import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { z } from "zod";

const credSchema = z.object({
  email: z.string().trim().email("Email no válido").max(255),
  password: z.string().min(6, "Mínimo 6 caracteres").max(128),
});

export const Route = createFileRoute("/acceso-interno")({
  head: () => ({
    meta: [
      { title: "Acceso al equipo | RollerZone" },
      { name: "description", content: "Acceso privado para el equipo editorial de RollerZone." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: InternalAccessPage,
});

function InternalAccessPage() {
  const { user, isAdmin, isEditor, isColaborador, signIn, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (loading || !user) return;
    if (isAdmin) navigate({ to: "/admin", replace: true });
    else if (isEditor || isColaborador) navigate({ to: "/dashboard", replace: true });
  }, [user, isAdmin, isEditor, isColaborador, loading, navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = credSchema.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Datos no válidos");
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await signIn(parsed.data.email, parsed.data.password);
      if (error) {
        toast.error(
          error.includes("Invalid login credentials") ? "Email o contraseña incorrectos" : error,
        );
      } else {
        toast.success("Sesión iniciada");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-6 py-10">
      <div className="border border-border bg-surface p-6 md:p-8">
        <h1 className="font-display text-2xl tracking-widest md:text-3xl">
          ROLLERZONE <span className="text-gold">· ACCESO AL EQUIPO</span>
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Área privada para administradores y editores autorizados. Las cuentas las crea únicamente
          un administrador de RollerZone.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-3">
          <Field
            label="Correo electrónico"
            type="email"
            value={email}
            onChange={setEmail}
            autoComplete="email"
            required
          />
          <Field
            label="Contraseña"
            type="password"
            value={password}
            onChange={setPassword}
            autoComplete="current-password"
            required
          />
          <button
            type="submit"
            disabled={submitting}
            className="font-condensed mt-2 min-h-11 w-full bg-gold py-3 text-sm font-bold uppercase tracking-widest text-background transition-colors hover:bg-gold-dark disabled:opacity-50"
          >
            {submitting ? "Procesando..." : "Iniciar sesión"}
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  type,
  value,
  onChange,
  autoComplete,
  required,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="font-condensed mb-1 block text-xs uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        required={required}
        className="min-h-11 w-full border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
      />
    </label>
  );
}
