import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ShieldCheck, KeyRound, ScrollText, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/admin/seguridad")({
  component: SecurityAdminPage,
  head: () => ({
    meta: [
      { title: "Seguridad y accesos | RollerZone" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

type Factor = { id: string; status: string; friendly_name?: string | null };
type AuditRow = {
  id: string;
  action: string;
  resource: string | null;
  actor_id: string | null;
  result: string;
  created_at: string;
};
type CspRow = {
  id: string;
  effective_directive: string | null;
  violated_directive: string | null;
  blocked_uri: string | null;
  document_uri: string | null;
  created_at: string;
};

function MfaPanel() {
  const [factors, setFactors] = useState<Factor[]>([]);
  const [enrolling, setEnrolling] = useState<{ id: string; qr: string; secret: string } | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const { data } = await supabase.auth.mfa.listFactors();
    setFactors((data?.totp ?? []) as Factor[]);
  };

  useEffect(() => {
    void load();
  }, []);

  const startEnroll = async () => {
    setBusy(true);
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: `RollerZone ${new Date().toISOString().slice(0, 10)}`,
    });
    setBusy(false);
    if (error || !data) {
      toast.error(error?.message ?? "No se pudo iniciar el registro");
      return;
    }
    setEnrolling({ id: data.id, qr: data.totp.qr_code, secret: data.totp.secret });
  };

  const confirm = async () => {
    if (!enrolling) return;
    setBusy(true);
    const { data: challenge, error: cErr } = await supabase.auth.mfa.challenge({
      factorId: enrolling.id,
    });
    if (cErr || !challenge) {
      setBusy(false);
      toast.error(cErr?.message ?? "Error al verificar");
      return;
    }
    const { error } = await supabase.auth.mfa.verify({
      factorId: enrolling.id,
      challengeId: challenge.id,
      code: code.trim(),
    });
    setBusy(false);
    if (error) {
      toast.error("Código incorrecto. Inténtalo de nuevo.");
      return;
    }
    toast.success("Doble factor activado correctamente");
    setEnrolling(null);
    setCode("");
    void load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.auth.mfa.unenroll({ factorId: id });
    if (error) return toast.error(error.message);
    toast.success("Factor eliminado");
    void load();
  };

  const verified = factors.filter((f) => f.status === "verified");

  return (
    <Card className="border-border bg-surface p-5">
      <div className="flex items-center gap-2">
        <KeyRound className="h-4 w-4 text-gold" />
        <h2 className="font-display text-lg tracking-widest">DOBLE FACTOR (2FA)</h2>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        Protege tu cuenta de administrador con una app de autenticación (Google Authenticator,
        1Password, Authy…). Con el 2FA activo, los cambios de roles exigen una sesión verificada.
      </p>

      {verified.length > 0 ? (
        <div className="mt-4 space-y-2">
          {verified.map((f) => (
            <div
              key={f.id}
              className="flex flex-wrap items-center justify-between gap-2 border border-border bg-background px-3 py-2"
            >
              <span className="text-sm">
                <ShieldCheck className="mr-1 inline h-4 w-4 text-emerald-400" />
                {f.friendly_name || "Autenticador"} · activo
              </span>
              <Button variant="outline" size="sm" onClick={() => remove(f.id)}>
                Eliminar
              </Button>
            </div>
          ))}
        </div>
      ) : enrolling ? (
        <div className="mt-4 space-y-3">
          <img
            src={enrolling.qr}
            alt="Código QR para configurar la verificación en dos pasos"
            className="h-44 w-44 border border-border bg-white p-2"
          />
          <p className="text-xs text-muted-foreground">
            Clave manual: <code className="text-gold">{enrolling.secret}</code>
          </p>
          <div className="flex flex-wrap gap-2">
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Código de 6 dígitos"
              inputMode="numeric"
              className="max-w-[180px]"
            />
            <Button onClick={confirm} disabled={busy || code.trim().length < 6}>
              Confirmar
            </Button>
            <Button variant="outline" onClick={() => setEnrolling(null)}>
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <Button className="mt-4 bg-gold text-black hover:bg-gold/90" onClick={startEnroll} disabled={busy}>
          Activar doble factor
        </Button>
      )}
    </Card>
  );
}

function AuditPanel() {
  const [rows, setRows] = useState<AuditRow[]>([]);
  useEffect(() => {
    void (async () => {
      const { data } = await supabase
        .from("security_audit_log")
        .select("id, action, resource, actor_id, result, created_at")
        .order("created_at", { ascending: false })
        .limit(200);
      setRows((data as AuditRow[]) ?? []);

    })();
  }, []);

  return (
    <Card className="border-border bg-surface p-5">
      <div className="flex items-center gap-2">
        <ScrollText className="h-4 w-4 text-gold" />
        <h2 className="font-display text-lg tracking-widest">REGISTRO DE ACTIVIDAD</h2>
      </div>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">Todavía no hay eventos registrados.</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[11px] uppercase tracking-widest text-muted-foreground">
                <th className="py-2 pr-3">Fecha</th>
                <th className="py-2 pr-3">Acción</th>
                <th className="py-2 pr-3">Recurso</th>
                <th className="py-2 pr-3">Usuario</th>
                <th className="py-2">Resultado</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-border/50">
                  <td className="py-2 pr-3 whitespace-nowrap text-muted-foreground">
                    {new Date(r.created_at).toLocaleString("es-ES")}
                  </td>
                  <td className="py-2 pr-3 font-medium">{r.action}</td>
                  <td className="py-2 pr-3 text-muted-foreground">{r.resource ?? "—"}</td>
                  <td className="py-2 pr-3 font-mono text-xs text-muted-foreground">
                    {r.actor_id ? `${r.actor_id.slice(0, 8)}…` : "—"}
                  </td>

                  <td className="py-2 text-muted-foreground">{r.result}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

function CspPanel() {
  const [rows, setRows] = useState<CspRow[]>([]);
  useEffect(() => {
    void (async () => {
      const { data } = await supabase
        .from("csp_reports")
        .select("id, effective_directive, violated_directive, blocked_uri, document_uri, created_at")
        .order("created_at", { ascending: false })
        .limit(200);
      setRows((data as CspRow[]) ?? []);
    })();
  }, []);

  return (
    <Card className="border-border bg-surface p-5">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-gold" />
        <h2 className="font-display text-lg tracking-widest">AVISOS DE CONTENIDO EXTERNO</h2>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        Recursos externos que la política de seguridad bloquearía. Está en modo aviso: nada se
        bloquea todavía. Si ves un dominio legítimo (un reproductor, por ejemplo), añádelo antes de
        activar el bloqueo real.
      </p>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">Sin avisos. Todo el contenido es de origen permitido.</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[11px] uppercase tracking-widest text-muted-foreground">
                <th className="py-2 pr-3">Fecha</th>
                <th className="py-2 pr-3">Tipo</th>
                <th className="py-2 pr-3">Recurso</th>
                <th className="py-2">Página</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-border/50">
                  <td className="py-2 pr-3 whitespace-nowrap text-muted-foreground">
                    {new Date(r.created_at).toLocaleString("es-ES")}
                  </td>
                  <td className="py-2 pr-3">{r.effective_directive ?? r.violated_directive ?? "—"}</td>
                  <td className="py-2 pr-3 break-all">{r.blocked_uri ?? "—"}</td>
                  <td className="py-2 break-all text-muted-foreground">{r.document_uri ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

function SecurityAdminPage() {
  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-2xl tracking-widest text-gold">SEGURIDAD Y ACCESOS</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Doble factor, registro de actividad sensible y avisos de contenido externo.
        </p>
      </header>

      <Tabs defaultValue="mfa">
        <TabsList className="flex w-full flex-wrap justify-start">
          <TabsTrigger value="mfa">Doble factor</TabsTrigger>
          <TabsTrigger value="audit">Actividad</TabsTrigger>
          <TabsTrigger value="csp">Contenido externo</TabsTrigger>
        </TabsList>
        <TabsContent value="mfa" className="mt-4">
          <MfaPanel />
        </TabsContent>
        <TabsContent value="audit" className="mt-4">
          <AuditPanel />
        </TabsContent>
        <TabsContent value="csp" className="mt-4">
          <CspPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
