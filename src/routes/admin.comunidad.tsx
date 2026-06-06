import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Check,
  X,
  Mail,
  Phone,
  Calendar,
  Pencil,
  EyeOff,
  Eye,
  Globe,
  History,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

type Submission = {
  id: string;
  submission_type: string;
  name: string;
  email: string;
  phone: string | null;
  title: string;
  description: string;
  image_urls: string[] | null;
  links: string[] | null;
  status: string;
  country_code: string;
  admin_notes: string | null;
  news_id: string | null;
  created_at: string;
};

type LogRow = {
  id: string;
  action: string;
  details: Record<string, unknown>;
  user_id: string | null;
  created_at: string;
};

const STATUS_TABS = [
  { value: "pendiente", label: "Pendientes" },
  { value: "aprobada", label: "Aprobadas" },
  { value: "publicada", label: "Publicadas" },
  { value: "oculta", label: "Ocultas" },
  { value: "rechazada", label: "Rechazadas" },
] as const;

export const Route = createFileRoute("/admin/comunidad")({
  head: () => ({
    meta: [
      { title: "Comunidad · Moderación — RollerZone" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CommunityAdmin,
});

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80);
}

function CommunityAdmin() {
  const { user } = useAuth();
  const [items, setItems] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<string>("pendiente");
  const [editing, setEditing] = useState<Submission | null>(null);
  const [historyOf, setHistoryOf] = useState<Submission | null>(null);
  const [logs, setLogs] = useState<LogRow[]>([]);

  async function load() {
    setLoading(true);
    const { data, error } = await (supabase as unknown as { rpc: (n: string) => Promise<{ data: Submission[] | null; error: { message: string } | null }> })
      .rpc("admin_list_community_submissions");
    if (error) toast.error(error.message);
    setItems((data as Submission[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function logAction(submissionId: string, action: string, details: Record<string, unknown> = {}) {
    await (supabase.from("community_submission_logs") as any).insert({
      submission_id: submissionId,
      action,
      details,
      user_id: user?.id ?? null,
    });
  }

  async function setStatus(it: Submission, status: string) {
    const { error } = await supabase
      .from("community_submissions")
      .update({ status })
      .eq("id", it.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    await logAction(it.id, `status:${status}`, { from: it.status, to: status });
    toast.success(`Marcada como ${status}`);
    load();
  }

  async function remove(it: Submission) {
    if (!confirm("¿Eliminar definitivamente?")) return;
    await logAction(it.id, "deleted", { title: it.title });
    const { error } = await supabase.from("community_submissions").delete().eq("id", it.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Eliminada");
    load();
  }

  async function openHistory(it: Submission) {
    setHistoryOf(it);
    const { data } = await supabase
      .from("community_submission_logs")
      .select("*")
      .eq("submission_id", it.id)
      .order("created_at", { ascending: false });
    setLogs((data as LogRow[]) ?? []);
  }

  async function publishToWeb(it: Submission) {
    if (it.news_id) {
      toast.info("Ya está publicada en la web.");
      return;
    }
    if (!confirm("¿Publicar este envío como noticia en la web?")) return;
    const slugBase = slugify(it.title) || `comunidad-${it.id.slice(0, 8)}`;
    const slug = `${slugBase}-${it.id.slice(0, 6)}`;
    const image = it.image_urls?.[0] ?? null;
    const excerpt = it.description.slice(0, 200);
    const content = `${it.description}\n\n*Enviado por la comunidad — ${it.name}*`;

    const { data: news, error } = await supabase
      .from("news")
      .insert({
        title: it.title,
        slug,
        excerpt,
        content,
        image_url: image,
        country_code: it.country_code,
        author: `Comunidad · ${it.name}`,
        published: true,
        status: "published",
      })
      .select("id,slug")
      .single();

    if (error || !news) {
      toast.error(error?.message ?? "No se pudo crear la noticia");
      return;
    }

    await supabase
      .from("community_submissions")
      .update({ status: "publicada", news_id: news.id })
      .eq("id", it.id);

    await logAction(it.id, "published_to_web", { news_id: news.id, slug: news.slug });
    toast.success("Publicada en la web");
    load();
  }

  const counts = useMemo(() => {
    const out: Record<string, number> = {};
    for (const t of STATUS_TABS) out[t.value] = 0;
    for (const it of items) out[it.status] = (out[it.status] ?? 0) + 1;
    return out;
  }, [items]);

  const filtered = items.filter((it) => it.status === tab);

  return (
    <div>
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl tracking-widest">Comunidad — Moderación</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Aprueba, edita, oculta o publica envíos. Cada acción queda en el historial.
          </p>
        </div>
        <Button variant="outline" onClick={load} disabled={loading}>
          Actualizar
        </Button>
      </header>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex flex-wrap h-auto">
          {STATUS_TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>
              {t.label} ({counts[t.value] ?? 0})
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={tab} className="mt-6 space-y-4">
          {loading ? (
            <p className="text-sm text-muted-foreground">Cargando…</p>
          ) : filtered.length === 0 ? (
            <Card className="p-6 text-center text-sm text-muted-foreground">
              Sin envíos en este estado.
            </Card>
          ) : (
            filtered.map((it) => (
              <Card key={it.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="uppercase">
                        {it.submission_type}
                      </Badge>
                      <Badge variant="secondary">{it.country_code}</Badge>
                      <StatusBadge status={it.status} />
                      {it.news_id && (
                        <Badge className="bg-emerald-700 hover:bg-emerald-600">
                          <Globe className="mr-1 h-3 w-3" /> En la web
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        <Calendar className="mr-1 inline h-3 w-3" />
                        {new Date(it.created_at).toLocaleString("es-ES")}
                      </span>
                    </div>
                    <h3 className="font-display mt-2 text-xl tracking-wide">{it.title}</h3>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
                      {it.description}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
                      <span>
                        <strong>{it.name}</strong>
                      </span>
                      <a href={`mailto:${it.email}`} className="hover:text-gold">
                        <Mail className="mr-1 inline h-3 w-3" />
                        {it.email}
                      </a>
                      {it.phone ? (
                        <span>
                          <Phone className="mr-1 inline h-3 w-3" />
                          {it.phone}
                        </span>
                      ) : null}
                    </div>
                    {it.image_urls && it.image_urls.length > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {it.image_urls.map((u, i) => (
                          <a key={i} href={u} target="_blank" rel="noopener noreferrer">
                            <img src={u} alt="" className="h-20 w-20 border border-border object-cover" />
                          </a>
                        ))}
                      </div>
                    ) : null}
                    {it.news_id && (
                      <a
                        href={`/noticias/${it.id}`}
                        className="mt-3 inline-flex items-center gap-1 text-xs text-gold hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" /> Ver noticia publicada
                      </a>
                    )}
                  </div>

                  <div className="flex w-full flex-col gap-2 md:w-44">
                    {it.status !== "aprobada" && (
                      <Button
                        size="sm"
                        onClick={() => setStatus(it, "aprobada")}
                        className="bg-green-700 hover:bg-green-600"
                      >
                        <Check className="mr-1 h-4 w-4" /> Aprobar
                      </Button>
                    )}
                    {it.status !== "publicada" && (
                      <Button
                        size="sm"
                        onClick={() => publishToWeb(it)}
                        className="bg-amber-600 hover:bg-amber-500"
                        disabled={!!it.news_id}
                      >
                        <Globe className="mr-1 h-4 w-4" /> Publicar en web
                      </Button>
                    )}
                    {it.status !== "oculta" ? (
                      <Button size="sm" variant="outline" onClick={() => setStatus(it, "oculta")}>
                        <EyeOff className="mr-1 h-4 w-4" /> Ocultar
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => setStatus(it, "aprobada")}>
                        <Eye className="mr-1 h-4 w-4" /> Mostrar
                      </Button>
                    )}
                    {it.status !== "rechazada" && (
                      <Button size="sm" variant="outline" onClick={() => setStatus(it, "rechazada")}>
                        <X className="mr-1 h-4 w-4" /> Rechazar
                      </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => setEditing(it)}>
                      <Pencil className="mr-1 h-4 w-4" /> Editar
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => openHistory(it)}>
                      <History className="mr-1 h-4 w-4" /> Historial
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => remove(it)}
                      className="text-red-500 hover:text-red-400"
                    >
                      Eliminar
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      <EditDialog
        item={editing}
        onClose={() => setEditing(null)}
        onSaved={async (changes) => {
          if (!editing) return;
          const { error } = await supabase
            .from("community_submissions")
            .update(changes as never)
            .eq("id", editing.id);
          if (error) {
            toast.error(error.message);
            return;
          }
          await logAction(editing.id, "edited", { changes });
          toast.success("Cambios guardados");
          setEditing(null);
          load();
        }}
      />

      <HistoryDialog item={historyOf} logs={logs} onClose={() => setHistoryOf(null)} />
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    pendiente: { label: "Pendiente", cls: "bg-yellow-600 hover:bg-yellow-500" },
    aprobada: { label: "Aprobada", cls: "bg-green-700 hover:bg-green-600" },
    publicada: { label: "Publicada", cls: "bg-emerald-700 hover:bg-emerald-600" },
    oculta: { label: "Oculta", cls: "bg-zinc-600 hover:bg-zinc-500" },
    rechazada: { label: "Rechazada", cls: "bg-red-700 hover:bg-red-600" },
  };
  const m = map[status] ?? { label: status, cls: "bg-zinc-600" };
  return <Badge className={m.cls}>{m.label}</Badge>;
}

function EditDialog({
  item,
  onClose,
  onSaved,
}: {
  item: Submission | null;
  onClose: () => void;
  onSaved: (changes: Partial<Submission>) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("noticia");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (item) {
      setTitle(item.title);
      setDescription(item.description);
      setType(item.submission_type);
      setNotes(item.admin_notes ?? "");
    }
  }, [item]);

  return (
    <Dialog open={!!item} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar envío de la comunidad</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Tipo</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="noticia">Noticia</SelectItem>
                <SelectItem value="evento">Evento</SelectItem>
                <SelectItem value="otro">Otro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Título</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} />
          </div>
          <div>
            <Label>Descripción</Label>
            <Textarea
              rows={8}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={5000}
            />
          </div>
          <div>
            <Label>Notas internas (no se publican)</Label>
            <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={() =>
              onSaved({
                title,
                description,
                submission_type: type,
                admin_notes: notes || null,
              })
            }
          >
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function HistoryDialog({
  item,
  logs,
  onClose,
}: {
  item: Submission | null;
  logs: LogRow[];
  onClose: () => void;
}) {
  return (
    <Dialog open={!!item} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Historial de cambios</DialogTitle>
        </DialogHeader>
        {item && (
          <div className="mb-3 text-xs text-muted-foreground">
            <strong className="text-foreground">{item.title}</strong>
          </div>
        )}
        {logs.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin acciones registradas aún.</p>
        ) : (
          <ul className="max-h-[60vh] space-y-2 overflow-auto">
            {logs.map((l) => (
              <li key={l.id} className="border-l-2 border-gold pl-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs uppercase tracking-wider text-gold">
                    {l.action}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {new Date(l.created_at).toLocaleString("es-ES")}
                  </span>
                </div>
                {Object.keys(l.details ?? {}).length > 0 && (
                  <pre className="mt-1 whitespace-pre-wrap rounded bg-muted/30 p-2 text-[11px] text-muted-foreground">
                    {JSON.stringify(l.details, null, 2)}
                  </pre>
                )}
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
