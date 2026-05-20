import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Check, X, Mail, Phone, Calendar } from "lucide-react";
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
  created_at: string;
};

export const Route = createFileRoute("/admin/comunidad")({
  head: () => ({
    meta: [{ title: "Comunidad · Moderación — RollerZone" }, { name: "robots", content: "noindex" }],
  }),
  component: CommunityAdmin,
});

function CommunityAdmin() {
  const [items, setItems] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("pendiente");

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("community_submissions")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setItems((data as Submission[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function setStatus(id: string, status: "aprobada" | "rechazada") {
    const { error } = await supabase
      .from("community_submissions")
      .update({ status })
      .eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Marcada como ${status}`);
    load();
  }

  async function remove(id: string) {
    if (!confirm("¿Eliminar definitivamente?")) return;
    const { error } = await supabase
      .from("community_submissions")
      .delete()
      .eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Eliminada");
    load();
  }

  const filtered = items.filter((it) => it.status === tab);

  return (
    <div>
      <header className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl tracking-widest">Comunidad — Moderación</h1>
        <Button variant="outline" onClick={load} disabled={loading}>
          Actualizar
        </Button>
      </header>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="pendiente">
            Pendientes ({items.filter((i) => i.status === "pendiente").length})
          </TabsTrigger>
          <TabsTrigger value="aprobada">
            Aprobadas ({items.filter((i) => i.status === "aprobada").length})
          </TabsTrigger>
          <TabsTrigger value="rechazada">
            Rechazadas ({items.filter((i) => i.status === "rechazada").length})
          </TabsTrigger>
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
                          <a
                            key={i}
                            href={u}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block"
                          >
                            <img
                              src={u}
                              alt=""
                              className="h-20 w-20 border border-border object-cover"
                            />
                          </a>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <div className="flex flex-col gap-2">
                    {it.status !== "aprobada" && (
                      <Button
                        size="sm"
                        onClick={() => setStatus(it.id, "aprobada")}
                        className="bg-green-700 hover:bg-green-600"
                      >
                        <Check className="mr-1 h-4 w-4" /> Aprobar
                      </Button>
                    )}
                    {it.status !== "rechazada" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setStatus(it.id, "rechazada")}
                      >
                        <X className="mr-1 h-4 w-4" /> Rechazar
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => remove(it.id)}
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
    </div>
  );
}
