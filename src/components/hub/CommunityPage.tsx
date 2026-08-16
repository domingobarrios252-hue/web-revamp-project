import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { submitCommunitySubmission } from "@/lib/security/public-forms.functions";
import { TurnstileWidget } from "@/components/security/TurnstileWidget";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Calendar, Send, Megaphone, Upload, MapPin, X, Newspaper, CheckCircle2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import {
  COMMUNITY_ALLOWED_EXTENSIONS,
  COMMUNITY_ALLOWED_IMAGE_TYPES,
  COMMUNITY_CONTACT_EMAIL,
  COMMUNITY_DECLARATIONS,
  COMMUNITY_DECLARATIONS_VERSION,
  COMMUNITY_MAX_IMAGES,
  COMMUNITY_MAX_IMAGE_MB,
  COMMUNITY_RETENTION_DAYS,
} from "@/lib/community/declarations";

const submissionSchema = z.object({
  type: z.enum(["noticia", "evento", "otro"]),
  name: z.string().min(2).max(120),
  email: z.string().email().max(200),
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(5000),
  photoCredit: z.string().max(160).optional(),
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

function DeclarationCheck({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 border border-[#2a2a2a] bg-[#121212] p-3 text-xs leading-relaxed text-[#bbb] hover:border-gold/40">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 accent-[color:var(--gold,#c9a227)]"
      />
      <span>{children}</span>
    </label>
  );
}

function CommunityForm({ country }: { country: string }) {
  const [form, setForm] = useState({
    type: "noticia" as "noticia" | "evento" | "otro",
    name: "",
    email: "",
    title: "",
    description: "",
    photoCredit: "",
  });
  const [images, setImages] = useState<{ path: string; preview: string }[]>([]);
  const [hasMinors, setHasMinors] = useState<"" | "no" | "si">("");
  const [decl, setDecl] = useState({
    age14: false,
    rights: false,
    editorialUse: false,
    peopleImages: false,
    minorsAuth: false,
  });
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const sendSubmission = useServerFn(submitCommunitySubmission);

  const hasImages = images.length > 0;

  const canSubmit =
    decl.age14 &&
    decl.rights &&
    decl.editorialUse &&
    (!hasImages || (hasMinors !== "" && decl.peopleImages)) &&
    (!hasImages || hasMinors !== "si" || decl.minorsAuth);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    if (images.length + files.length > COMMUNITY_MAX_IMAGES) {
      toast.error(`Máximo ${COMMUNITY_MAX_IMAGES} imágenes`);
      return;
    }
    setUploading(true);
    try {
      const uploaded: { path: string; preview: string }[] = [];
      for (const file of files) {
        if (!(COMMUNITY_ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
          toast.error(`${file.name}: formato no permitido (JPG, PNG o WEBP)`);
          continue;
        }
        if (file.size > COMMUNITY_MAX_IMAGE_MB * 1024 * 1024) {
          toast.error(`${file.name} supera ${COMMUNITY_MAX_IMAGE_MB}MB`);
          continue;
        }
        const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase();
        const safeExt = (COMMUNITY_ALLOWED_EXTENSIONS as readonly string[]).includes(ext)
          ? ext
          : "jpg";
        const path = `${country}/${crypto.randomUUID()}.${safeExt}`;
        // Almacén privado: el material pendiente de revisión nunca es público.
        const { error } = await supabase.storage
          .from("community-pending")
          .upload(path, file, { cacheControl: "3600", upsert: false });
        if (error) {
          toast.error(error.message);
          continue;
        }
        uploaded.push({ path, preview: URL.createObjectURL(file) });
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
    if (!canSubmit) {
      toast.error("Debes aceptar las declaraciones obligatorias para enviar el material.");
      return;
    }
    setSubmitting(true);
    const { type, ...rest } = parsed.data;
    let res: { ok: boolean; error?: string };
    try {
      res = await sendSubmission({
        data: {
          submission_type: type,
          name: rest.name,
          email: rest.email,
          title: rest.title,
          description: rest.description,
          country_code: country,
          image_paths: images.map((i) => i.path),
          photo_credit: form.photoCredit || null,
          has_minors: hasImages ? hasMinors === "si" : null,
          declaration_age14: true as const,
          declaration_rights: true as const,
          declaration_editorial_use: true as const,
          declaration_people_images: hasImages ? decl.peopleImages : false,
          declaration_minors_auth: hasImages && hasMinors === "si" ? decl.minorsAuth : false,
          declarations_version: COMMUNITY_DECLARATIONS_VERSION,
          turnstileToken: captchaToken,
        },
      });
    } catch {
      res = { ok: false, error: "No se pudo enviar. Inténtalo más tarde." };
    }
    setSubmitting(false);
    if (!res.ok) {
      toast.error(res.error ?? "No se pudo enviar. Inténtalo más tarde.");
      return;
    }
    setSent(true);
    setForm({ type: "noticia", name: "", email: "", title: "", description: "", photoCredit: "" });
    setImages([]);
    setHasMinors("");
    setDecl({ age14: false, rights: false, editorialUse: false, peopleImages: false, minorsAuth: false });
    toast.success("Envío recibido. Te avisaremos al revisarlo.");
  }

  if (sent) {
    return (
      <Card className="border-gold/40 bg-[#161616] p-8 text-center">
        <h3 className="font-display text-2xl tracking-widest text-gold">¡Gracias!</h3>
        <p className="mt-2 text-sm text-[#aaa]">
          Hemos recibido tu envío. El equipo editorial lo revisará en breve. El envío de
          material no implica su publicación.
        </p>
        <Button variant="outline" className="mt-4" onClick={() => setSent(false)}>
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
      {/* Primera capa informativa de protección de datos */}
      <div className="md:col-span-2 border border-[#2a2a2a] bg-[#121212] p-4">
        <p className="font-condensed flex items-center gap-2 text-[11px] uppercase tracking-[0.25em] text-gold">
          <ShieldCheck className="h-3.5 w-3.5" /> Información básica de privacidad
        </p>
        <ul className="mt-2 space-y-1 text-xs leading-relaxed text-[#aaa]">
          <li>
            <strong className="text-[#ddd]">Responsable:</strong> RollerZone Spain.
          </li>
          <li>
            <strong className="text-[#ddd]">Finalidad:</strong> recibir, revisar y gestionar
            la información, noticias, eventos, fotografías y demás material remitido
            voluntariamente a RollerZone para valorar su posible utilización editorial.
          </li>
          <li>
            <strong className="text-[#ddd]">Derechos:</strong> acceso, rectificación,
            supresión y demás derechos aplicables, escribiendo a{" "}
            <a href={`mailto:${COMMUNITY_CONTACT_EMAIL}`} className="text-gold hover:underline">
              {COMMUNITY_CONTACT_EMAIL}
            </a>
            .
          </li>
          <li>
            <strong className="text-[#ddd]">Conservación:</strong> el material no publicado
            se conserva únicamente el tiempo necesario para revisar y gestionar el envío
            (orientativamente {COMMUNITY_RETENTION_DAYS} días) y después se elimina, salvo
            obligación o justificación legítima. El material publicado puede conservarse
            como parte del archivo periodístico de RollerZone cuando exista base jurídica.
          </li>
        </ul>
        <Link
          to="/legal/$slug"
          params={{ slug: "privacidad" }}
          className="mt-3 inline-block text-xs font-semibold text-gold hover:underline"
        >
          Política de Privacidad y Protección de Datos
        </Link>
      </div>

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
          Imágenes (máx. {COMMUNITY_MAX_IMAGES} · JPG, PNG o WEBP · {COMMUNITY_MAX_IMAGE_MB}MB)
        </Label>
        <p className="mt-1 text-[11px] leading-relaxed text-[#777]">
          Si la fotografía ha sido realizada por otra persona, debes disponer de autorización
          suficiente para enviarla y permitir su utilización por RollerZone. Las imágenes
          enviadas quedan en un almacenamiento privado hasta que la redacción las revisa.
        </p>
        <div className="mt-3 flex flex-wrap gap-3">
          {images.map((img, i) => (
            <div key={img.path} className="relative h-24 w-24 overflow-hidden border border-[#333]">
              <img loading="lazy" decoding="async" src={img.preview} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                aria-label="Quitar imagen"
                onClick={() => setImages((prev) => prev.filter((_, idx) => idx !== i))}
                className="absolute right-1 top-1 rounded-full bg-black/70 p-1 text-white hover:bg-red-600"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          {images.length < COMMUNITY_MAX_IMAGES ? (
            <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center border border-dashed border-[#444] text-[#888] hover:border-gold hover:text-gold">
              <Upload className="h-5 w-5" />
              <span className="mt-1 text-[10px] uppercase tracking-widest">
                {uploading ? "…" : "Subir"}
              </span>
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                multiple
                className="hidden"
                onChange={handleUpload}
                disabled={uploading}
              />
            </label>
          ) : null}
        </div>
      </div>

      {hasImages ? (
        <>
          <div className="md:col-span-2">
            <Label>Autor/a de la fotografía o crédito (opcional)</Label>
            <Input
              value={form.photoCredit}
              onChange={(e) => setForm((f) => ({ ...f, photoCredit: e.target.value }))}
              maxLength={160}
              placeholder="Foto: Nombre del fotógrafo / Club"
              className="mt-1 border-[#333] bg-[#0e0e0e]"
            />
          </div>

          <div className="md:col-span-2">
            <Label className="text-xs uppercase tracking-widest text-[#888]">
              ¿Aparecen menores de edad identificables en las imágenes?
            </Label>
            <div className="mt-2 flex gap-2">
              {(["no", "si"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => {
                    setHasMinors(v);
                    if (v === "no") setDecl((d) => ({ ...d, minorsAuth: false }));
                  }}
                  className={`font-condensed min-h-[44px] px-5 text-xs uppercase tracking-widest transition-colors ${
                    hasMinors === v
                      ? "border border-gold bg-gold/10 text-gold"
                      : "border border-[#333] text-[#aaa] hover:border-gold/50"
                  }`}
                >
                  {v === "no" ? "No" : "Sí"}
                </button>
              ))}
            </div>
          </div>
        </>
      ) : null}

      <div className="md:col-span-2 space-y-2">
        <DeclarationCheck checked={decl.age14} onChange={(v) => setDecl((d) => ({ ...d, age14: v }))}>
          {COMMUNITY_DECLARATIONS.age14}
        </DeclarationCheck>
        {!decl.age14 ? (
          <p className="text-[11px] leading-relaxed text-[#777]">
            Si eres menor de 14 años y quieres enviarnos información o fotografías, pide a tu
            padre, madre o tutor legal que realice el envío.
          </p>
        ) : null}
        <DeclarationCheck checked={decl.rights} onChange={(v) => setDecl((d) => ({ ...d, rights: v }))}>
          {COMMUNITY_DECLARATIONS.rights}
        </DeclarationCheck>
        <DeclarationCheck
          checked={decl.editorialUse}
          onChange={(v) => setDecl((d) => ({ ...d, editorialUse: v }))}
        >
          {COMMUNITY_DECLARATIONS.editorialUse}
        </DeclarationCheck>
        {hasImages ? (
          <DeclarationCheck
            checked={decl.peopleImages}
            onChange={(v) => setDecl((d) => ({ ...d, peopleImages: v }))}
          >
            {COMMUNITY_DECLARATIONS.peopleImages}
          </DeclarationCheck>
        ) : null}
        {hasImages && hasMinors === "si" ? (
          <DeclarationCheck
            checked={decl.minorsAuth}
            onChange={(v) => setDecl((d) => ({ ...d, minorsAuth: v }))}
          >
            {COMMUNITY_DECLARATIONS.minorsAuth}
          </DeclarationCheck>
        ) : null}
        <p className="text-[11px] leading-relaxed text-[#777]">
          Conservas tus derechos de autor y de imagen: esta autorización se limita a la
          utilización del material por RollerZone en su actividad editorial e informativa y no
          supone una cesión total, exclusiva, perpetua ni irrevocable.
        </p>
      </div>

      <div className="md:col-span-2">
        <TurnstileWidget onToken={setCaptchaToken} />
        <Button
          type="submit"
          disabled={submitting || uploading || !canSubmit}
          className="min-h-[44px] bg-gold text-black hover:bg-gold/90"
        >
          {submitting ? "Enviando…" : "Enviar a redacción"}
        </Button>
        <p className="mt-3 text-[11px] leading-relaxed text-[#666]">
          El envío de material no implica su publicación. RollerZone podrá valorar su interés
          editorial, verificar la información y decidir si procede su publicación. Para
          consultas, problemas con una fotografía, correcciones, cuestiones de derechos de
          imagen o ejercicio de derechos de protección de datos, escribe a{" "}
          <a href={`mailto:${COMMUNITY_CONTACT_EMAIL}`} className="text-gold hover:underline">
            {COMMUNITY_CONTACT_EMAIL}
          </a>
          .
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
