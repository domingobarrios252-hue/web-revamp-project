import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { z } from "zod";

const credSchema = z.object({
  email: z.string().trim().email("Email no válido").max(255),
  password: z.string().min(6, "Mínimo 6 caracteres").max(128),
  displayName: z.string().trim().min(2, "Nombre demasiado corto").max(80).optional(),
});

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Acceso administrador — RollerZone" },
      { name: "description", content: "Acceso al panel de administración de RollerZone." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { user, signIn, signUp, loading } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      navigate({ to: "/admin" });
    }
  }, [user, loading, navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = credSchema.safeParse({
      email,
      password,
      displayName: mode === "signup" ? displayName : undefined,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Datos no válidos");
      return;
    }
    setSubmitting(true);
    try {
      const { error } =
        mode === "login"
          ? await signIn(parsed.data.email, parsed.data.password)
          : await signUp(parsed.data.email, parsed.data.password, parsed.data.displayName);
      if (error) {
        toast.error(
          error.includes("Invalid login credentials")
            ? "Email o contraseña incorrectos"
            : error
        );
      } else {
        toast.success(mode === "login" ? "Sesión iniciada" : "Cuenta creada");
        navigate({ to: "/admin" });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-6 py-10">
      <div className="border border-border bg-surface p-6 md:p-8">
        <h1 className="font-display text-3xl tracking-widest">
          {mode === "login" ? "Acceso" : "Crear cuenta"} <span className="text-gold">admin</span>
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {mode === "login"
            ? "Inicia sesión para gestionar contenido."
            : "Regístrate. Un administrador deberá asignarte el rol después."}
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-3">
          {mode === "signup" && (
            <Field
              label="Nombre"
              type="text"
              value={displayName}
              onChange={setDisplayName}
              autoComplete="name"
            />
          )}
          <Field label="Email" type="email" value={email} onChange={setEmail} autoComplete="email" required />
          <Field
            label="Contraseña"
            type="password"
            value={password}
            onChange={setPassword}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            required
          />
          <button
            type="submit"
            disabled={submitting}
            className="font-condensed mt-2 w-full bg-gold py-3 text-sm font-bold uppercase tracking-widest text-background transition-colors hover:bg-gold-dark disabled:opacity-50"
          >
            {submitting
              ? "Procesando..."
              : mode === "login"
              ? "Entrar"
              : "Crear cuenta"}
          </button>
        </form>

        <div className="mt-4 text-center text-sm text-muted-foreground">
          {mode === "login" ? "¿No tienes cuenta?" : "¿Ya tienes cuenta?"}{" "}
          <button
            type="button"
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
            className="text-gold hover:underline"
          >
            {mode === "login" ? "Crear cuenta" : "Iniciar sesión"}
          </button>
        </div>
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
        className="w-full border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
      />
    </label>
  );
}
