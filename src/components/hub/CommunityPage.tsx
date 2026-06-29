import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Calendar, Send, Megaphone, Upload, MapPin, X, Newspaper, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const submissionSchema = z.object({
  type: z.enum(["noticia", "evento", "otro"]),
  name: z.string().min(2).max(120),
  email: z.string().email().max(200),
  phone: z.string().max(40).optional(),
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(5000),
});

type EventRow = {
  id: string;
  name: string;
  slug: string;
  start_date: string | null;
  location: string | null;
  cover_url: string | null;
  scope: string | null;
};

export function CommunityPage({ country }: { country: string }) {
  return (
    <div className="bg-[#111] text-white">
      <div className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-14">
        <header className="mb-8">
          <p className="font-condensed text-xs uppercase tracking-[0.3em] text-[#888]">
            Comunidad
          </p>
          <h1 className="font-display mt-1 text-3xl tracking-widest md:text-5xl">
            La voz del patinaje
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-[#aaa] md:text-base">
            Envíanos tus noticias, eventos y reportajes. Calendario comunitario, espacio
            de patrocinio y publicación abierta para clubes, atletas y federaciones.
          </p>
        </header>

        <Tabs defaultValue="publicaciones" className="w-full">
          <TabsList className="bg-[#1a1a1a] flex-wrap h-auto">
            <TabsTrigger value="publicaciones">
              <Newspaper className="mr-2 h-4 w-4" /> Publicaciones
            </TabsTrigger>
            <TabsTrigger value="calendario">
              <Calendar className="mr-2 h-4 w-4" /> Calendario
            </TabsTrigger>
            <TabsTrigger value="enviar">
              <Send className="mr-2 h-4 w-4" /> Envía tu noticia
            </TabsTrigger>
            <TabsTrigger value="patrocinio">
              <Megaphone className="mr-2 h-4 w-4" /> Patrocinio
            </TabsTrigger>
          </TabsList>

          <TabsContent value="publicaciones" className="mt-6">
            <CommunityFeed country={country} />
          </TabsContent>
          <TabsContent value="calendario" className="mt-6">
            <CommunityCalendar country={country} />
          </TabsContent>
          <TabsContent value="enviar" className="mt-6">
            <CommunityForm country={country} />
          </TabsContent>
          <TabsContent value="patrocinio" className="mt-6">
            <SponsorBlock />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function CommunityCalendar({ country }: { country: string }) {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    supabase
      .from("events")
      .select("id,name,slug,start_date,location,cover_url,scope")
      .eq("published", true)
      .eq("country_code", country)
      .gte("start_date", new Date().toISOString().slice(0, 10))
      .order("start_date", { ascending: true })
      .limit(24)
      .then(({ data }) => {
        if (cancelled) return;
        setEvents((data as EventRow[]) ?? []);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [country]);

  if (loading) {
    return <p className="text-sm text-[#888]">Cargando calendario…</p>;
  }
  if (!events.length) {
    return (
      <Card className="border-[#222] bg-[#161616] p-6 text-center text-sm text-[#888]">
        Aún no hay eventos comunitarios publicados.
      </Card>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {events.map((ev) => (
        <Link
          key={ev.id}
          to="/eventos/$slug"
          params={{ slug: ev.slug }}
          className="group block overflow-hidden border border-[#222] bg-[#161616] transition-colors hover:border-gold/60"
        >
          {ev.cover_url ? (
            <div className="aspect-video overflow-hidden bg-[#0a0a0a]">
              <img
                src={ev.cover_url}
                alt={ev.name}
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
                loading="lazy"
              />
            </div>
          ) : null}
          <div className="p-4">
            <p className="font-condensed text-[10px] uppercase tracking-widest text-gold">
              {ev.scope ?? "Evento"} ·{" "}
              {ev.start_date
                ? new Date(ev.start_date).toLocaleDateString("es-ES", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                : ""}
            </p>
            <h3 className="font-display mt-1 line-clamp-2 text-lg tracking-wide">
              {ev.name}
            </h3>
            {ev.location ? (
              <p className="mt-2 flex items-center gap-1 text-xs text-[#888]">
                <MapPin className="h-3 w-3" /> {ev.location}
              </p>
            ) : null}
          </div>
        </Link>
      ))}
    </div>
  );
}

function CommunityForm({ country }: { country: string }) {
  const [form, setForm] = useState({
    type: "noticia" as "noticia" | "evento" | "otro",
    name: "",
    email: "",
    phone: "",
    title: "",
    description: "",
  });
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    if (images.length + files.length > 6) {
      toast.error("Máximo 6 imágenes");
      return;
    }
    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of files) {
        if (file.size > 8 * 1024 * 1024) {
          toast.error(`${file.name} supera 8MB`);
          continue;
        }
        const ext = file.name.split(".").pop() ?? "jpg";
        const path = `${country}/${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage
          .from("community")
          .upload(path, file, { cacheControl: "3600", upsert: false });
        if (error) {
          toast.error(error.message);
          continue;
        }
        const { data } = supabase.storage.from("community").getPublicUrl(path);
        uploaded.push(data.publicUrl);
      }
      setImages((prev) => [...prev, ...uploaded]);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = submissionSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Revisa los campos");
      return;
    }
    setSubmitting(true);
    const { type, ...rest } = parsed.data;
    const { error } = await supabase.from("community_submissions").insert({
      ...rest,
      submission_type: type,
      country_code: country,
      image_urls: images,
      links: [],
      status: "pendiente",
    } as never);
    setSubmitting(false);
    if (error) {
      toast.error("No se pudo enviar: " + error.message);
      return;
    }
    setSent(true);
    setForm({ type: "noticia", name: "", email: "", phone: "", title: "", description: "" });
    setImages([]);
    toast.success("Envío recibido. Te avisaremos al revisarlo.");
  }

  if (sent) {
    return (
      <Card className="border-gold/40 bg-[#161616] p-8 text-center">
        <h3 className="font-display text-2xl tracking-widest text-gold">¡Gracias!</h3>
        <p className="mt-2 text-sm text-[#aaa]">
          Hemos recibido tu envío. El equipo editorial lo revisará en breve.
        </p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => setSent(false)}
        >
          Enviar otro
        </Button>
      </Card>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-5 border border-[#222] bg-[#161616] p-6 md:grid-cols-2"
    >
      <div className="md:col-span-2">
        <Label className="text-xs uppercase tracking-widest text-[#888]">Tipo</Label>
        <div className="mt-2 flex flex-wrap gap-2">
          {(["noticia", "evento", "otro"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setForm((f) => ({ ...f, type: t }))}
              className={`font-condensed px-4 py-2 text-xs uppercase tracking-widest transition-colors ${
                form.type === t
                  ? "border border-gold bg-gold/10 text-gold"
                  : "border border-[#333] text-[#aaa] hover:border-gold/50"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label>Nombre</Label>
        <Input
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          required
          className="mt-1 border-[#333] bg-[#0e0e0e]"
        />
      </div>
      <div>
        <Label>Email</Label>
        <Input
          type="email"
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          required
          className="mt-1 border-[#333] bg-[#0e0e0e]"
        />
      </div>
      <div className="md:col-span-2">
        <Label>Teléfono (opcional)</Label>
        <Input
          value={form.phone}
          onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          className="mt-1 border-[#333] bg-[#0e0e0e]"
        />
      </div>
      <div className="md:col-span-2">
        <Label>Título</Label>
        <Input
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          required
          maxLength={200}
          className="mt-1 border-[#333] bg-[#0e0e0e]"
        />
      </div>
      <div className="md:col-span-2">
        <Label>Descripción</Label>
        <Textarea
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          required
          rows={6}
          maxLength={5000}
          className="mt-1 border-[#333] bg-[#0e0e0e]"
        />
      </div>

      <div className="md:col-span-2">
        <Label className="text-xs uppercase tracking-widest text-[#888]">
          Imágenes (máx. 6)
        </Label>
        <div className="mt-2 flex flex-wrap gap-3">
          {images.map((url, i) => (
            <div key={i} className="relative h-24 w-24 overflow-hidden border border-[#333]">
              <img loading="lazy" decoding="async" src={url} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => setImages((prev) => prev.filter((_, idx) => idx !== i))}
                className="absolute right-1 top-1 rounded-full bg-black/70 p-1 text-white hover:bg-red-600"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          {images.length < 6 ? (
            <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center border border-dashed border-[#444] text-[#888] hover:border-gold hover:text-gold">
              <Upload className="h-5 w-5" />
              <span className="mt-1 text-[10px] uppercase tracking-widest">
                {uploading ? "…" : "Subir"}
              </span>
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleUpload}
                disabled={uploading}
              />
            </label>
          ) : null}
        </div>
      </div>

      <div className="md:col-span-2">
        <Button
          type="submit"
          disabled={submitting || uploading}
          className="bg-gold text-black hover:bg-gold/90"
        >
          {submitting ? "Enviando…" : "Enviar a redacción"}
        </Button>
        <p className="mt-2 text-[11px] text-[#666]">
          Al enviar aceptas que RollerZone revise y publique tu contenido si cumple con
          la línea editorial.
        </p>
      </div>
    </form>
  );
}

type Publication = {
  id: string;
  submission_type: string;
  name: string;
  title: string;
  description: string;
  image_urls: string[] | null;
  links: string[] | null;
  status: string;
  created_at: string;
};

function CommunityFeed({ country }: { country: string }) {
  const [items, setItems] = useState<Publication[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<"todos" | "noticia" | "evento" | "otro">("todos");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (supabase as unknown as { from: (t: string) => ReturnType<typeof supabase.from> })
      .from("community_submissions_public")
      .select("id,submission_type,name,title,description,image_urls,links,status,created_at")
      .eq("country_code", country)
      .order("created_at", { ascending: false })
      .limit(60)
      .then(({ data }) => {
        if (cancelled) return;
        setItems((data as unknown as Publication[]) ?? []);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [country]);

  const filtered = typeFilter === "todos" ? items : items.filter((i) => i.submission_type === typeFilter);

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-2">
        {(["todos", "noticia", "evento", "otro"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTypeFilter(t)}
            className={`font-condensed px-3 py-1.5 text-[11px] uppercase tracking-widest transition-colors ${
              typeFilter === t
                ? "border border-gold bg-gold/10 text-gold"
                : "border border-[#333] text-[#aaa] hover:border-gold/50"
            }`}
          >
            {t}
          </button>
        ))}
        <span className="ml-auto text-xs text-[#666]">
          {filtered.length} publicación{filtered.length === 1 ? "" : "es"}
        </span>
      </div>

      {loading ? (
        <p className="text-sm text-[#888]">Cargando publicaciones…</p>
      ) : filtered.length === 0 ? (
        <Card className="border-[#222] bg-[#161616] p-8 text-center">
          <p className="text-sm text-[#888]">
            Todavía no hay publicaciones aprobadas en esta categoría.
          </p>
          <p className="mt-2 text-xs text-[#666]">
            Envía la tuya desde la pestaña "Envía tu noticia".
          </p>
        </Card>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((it) => (
            <article
              key={it.id}
              className="group flex flex-col overflow-hidden border border-[#222] bg-[#161616] transition-colors hover:border-gold/60"
            >
              {it.image_urls && it.image_urls.length > 0 ? (
                <div className="aspect-video overflow-hidden bg-[#0a0a0a]">
                  <img
                    src={it.image_urls[0]}
                    alt={it.title}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                </div>
              ) : null}
              <div className="flex flex-1 flex-col p-4">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="border-gold/40 uppercase text-gold">
                    {it.submission_type}
                  </Badge>
                  <Badge className="gap-1 bg-green-700/20 text-green-400 hover:bg-green-700/20">
                    <CheckCircle2 className="h-3 w-3" /> Aprobada
                  </Badge>
                </div>
                <h3 className="font-display mt-2 line-clamp-2 text-lg tracking-wide">
                  {it.title}
                </h3>
                <p className="mt-2 line-clamp-3 text-sm text-[#aaa]">{it.description}</p>
                <div className="mt-auto flex items-center justify-between pt-3 text-[11px] text-[#666]">
                  <span>Por {it.name}</span>
                  <time>
                    {new Date(it.created_at).toLocaleDateString("es-ES", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </time>
                </div>
                {it.image_urls && it.image_urls.length > 1 ? (
                  <p className="mt-2 text-[10px] uppercase tracking-widest text-[#555]">
                    +{it.image_urls.length - 1} imagen{it.image_urls.length - 1 === 1 ? "" : "es"}
                  </p>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}


function SponsorBlock() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="border-[#222] bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] p-6">
        <Megaphone className="h-8 w-8 text-gold" />
        <h3 className="font-display mt-3 text-2xl tracking-widest">Espacios disponibles</h3>
        <ul className="mt-4 space-y-2 text-sm text-[#bbb]">
          <li>• Banner home + secciones temáticas</li>
          <li>• Patrocinio MVP España</li>
          <li>• Publirreportajes en RollerZone TV</li>
          <li>• Sponsors destacados de eventos</li>
          <li>• Promociones en Live Center</li>
        </ul>
      </Card>
      <Card className="border-[#222] bg-[#161616] p-6">
        <h3 className="font-display text-2xl tracking-widest">Contacto comercial</h3>
        <p className="mt-2 text-sm text-[#aaa]">
          Cuéntanos tu marca y diseñamos una propuesta a medida.
        </p>
        <div className="mt-4 flex flex-col gap-2">
          <a
            href="mailto:rollerzonespain@gmail.com"
            className="font-condensed inline-flex items-center gap-2 border border-gold bg-gold/10 px-4 py-2 text-xs uppercase tracking-widest text-gold hover:bg-gold hover:text-black"
          >
            rollerzonespain@gmail.com
          </a>
          <Link
            to="/patrocinadores"
            className="font-condensed inline-flex items-center gap-2 border border-[#333] px-4 py-2 text-xs uppercase tracking-widest text-[#aaa] hover:border-gold hover:text-gold"
          >
            Ver patrocinadores actuales →
          </Link>
        </div>
      </Card>
    </div>
  );
}
