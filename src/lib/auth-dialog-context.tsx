import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { z } from "zod";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";

type Ctx = { openAuthDialog: () => void; closeAuthDialog: () => void };
const AuthDialogContext = createContext<Ctx | undefined>(undefined);

const credSchema = z.object({
  email: z.string().trim().email("Email no válido").max(255),
  password: z.string().min(6, "Mínimo 6 caracteres").max(128),
  displayName: z.string().trim().min(2, "Nombre demasiado corto").max(80).optional(),
});

export function AuthDialogProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const openAuthDialog = useCallback(() => setOpen(true), []);
  const closeAuthDialog = useCallback(() => setOpen(false), []);

  return (
    <AuthDialogContext.Provider value={{ openAuthDialog, closeAuthDialog }}>
      {children}
      <AuthModal open={open} onOpenChange={setOpen} />
    </AuthDialogContext.Provider>
  );
}

export function useAuthDialog() {
  const ctx = useContext(AuthDialogContext);
  if (!ctx) throw new Error("useAuthDialog must be used within AuthDialogProvider");
  return ctx;
}

function AuthModal({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setEmail(""); setPassword(""); setDisplayName(""); setSubmitting(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = credSchema.safeParse({
      email, password,
      displayName: mode === "signup" ? displayName : undefined,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Datos no válidos");
      return;
    }
    setSubmitting(true);
    const { error } =
      mode === "login"
        ? await signIn(parsed.data.email, parsed.data.password)
        : await signUp(parsed.data.email, parsed.data.password, parsed.data.displayName);
    setSubmitting(false);
    if (error) {
      toast.error(
        error.includes("Invalid login credentials")
          ? "Email o contraseña incorrectos"
          : error
      );
      return;
    }
    toast.success(mode === "login" ? "Sesión iniciada" : "Cuenta creada");
    onOpenChange(false);
    reset();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display tracking-widest">Mi cuenta</DialogTitle>
          <DialogDescription>
            Accede o crea una cuenta para comprar revistas y gestionar tu biblioteca.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={mode} onValueChange={(v) => setMode(v as "login" | "signup")} className="mt-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Iniciar sesión</TabsTrigger>
            <TabsTrigger value="signup">Crear cuenta</TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="mt-4">
            <form onSubmit={handleSubmit} className="space-y-3">
              <Field label="Email" type="email" value={email} onChange={setEmail} autoComplete="email" required />
              <Field label="Contraseña" type="password" value={password} onChange={setPassword} autoComplete="current-password" required />
              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? "Procesando..." : "Entrar"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup" className="mt-4">
            <form onSubmit={handleSubmit} className="space-y-3">
              <Field label="Nombre" type="text" value={displayName} onChange={setDisplayName} autoComplete="name" />
              <Field label="Email" type="email" value={email} onChange={setEmail} autoComplete="email" required />
              <Field label="Contraseña" type="password" value={password} onChange={setPassword} autoComplete="new-password" required />
              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? "Procesando..." : "Crear cuenta"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label, type, value, onChange, autoComplete, required,
}: {
  label: string; type: string; value: string;
  onChange: (v: string) => void; autoComplete?: string; required?: boolean;
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
