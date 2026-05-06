import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ShieldCheck, FileText, Cookie, ArrowUp, Mail, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { renderMarkdown } from "@/lib/markdown";

const SLUGS = ["privacidad", "aviso-legal", "cookies"] as const;
type LegalSlug = (typeof SLUGS)[number];

export const Route = createFileRoute("/legal/$slug")({
  loader: async ({ params }) => {
    const slug = params.slug;
    if (!SLUGS.includes(slug as LegalSlug)) throw notFound();
    const { data, error } = await supabase
      .from("legal_pages")
      .select("title, content, updated_at")
      .eq("slug", slug)
      .maybeSingle();
    if (error || !data) throw notFound();
    return { page: data };
  },
  head: ({ loaderData }) => {
    const title = loaderData?.page.title ?? "Página legal";
    return {
      meta: [
        { title: `${title} — RollerZone` },
        { name: "description", content: `${title} de RollerZone.` },
        { name: "robots", content: "index, follow" },
        { property: "og:title", content: `${title} — RollerZone` },
        { property: "og:description", content: `${title} de RollerZone.` },
      ],
    };
  },
  component: LegalPage,
  notFoundComponent: () => (
    <div className="mx-auto max-w-2xl px-6 py-16 text-center">
      <h1 className="font-display text-3xl tracking-widest text-gold">Página no encontrada</h1>
      <Link
        to="/"
        className="font-condensed mt-6 inline-flex items-center bg-gold px-5 py-2 text-xs font-bold uppercase tracking-widest text-background hover:bg-gold-dark"
      >
        Volver al inicio
      </Link>
    </div>
  ),
});

const SLUG_META: Record<
  LegalSlug,
  { eyebrow: string; intro: string; icon: typeof ShieldCheck; label: string }
> = {
  privacidad: {
    eyebrow: "Tu privacidad importa",
    intro:
      "En RollerZone tratamos tus datos con transparencia. Aquí explicamos qué recogemos, por qué lo hacemos y cómo puedes ejercer tus derechos.",
    icon: ShieldCheck,
    label: "Privacidad",
  },
  "aviso-legal": {
    eyebrow: "Información legal",
    intro:
      "Quién está detrás de RollerZone, condiciones de uso del medio e información legal exigida por la normativa vigente.",
    icon: FileText,
    label: "Aviso legal",
  },
  cookies: {
    eyebrow: "Política de cookies",
    intro:
      "Usamos cookies para que la experiencia sea fluida y entender qué contenidos funcionan mejor. Tú decides qué aceptar.",
    icon: Cookie,
    label: "Cookies",
  },
};

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function LegalPage() {
  const { page } = Route.useLoaderData();
  const { slug } = Route.useParams();
  const meta = SLUG_META[slug as LegalSlug] ?? {
    eyebrow: "RollerZone",
    intro: "",
    icon: FileText,
    label: "Legal",
  };

  // Render markdown then inject ids on h2/h3 to enable a TOC
  const { html, toc } = useMemo(() => {
    const raw = renderMarkdown(page.content);
    const items: { id: string; text: string; level: 2 | 3 }[] = [];
    const out = raw.replace(
      /<h([23])([^>]*)>([\s\S]*?)<\/h\1>/g,
      (_m, lvl: string, attrs: string, inner: string) => {
        const text = inner.replace(/<[^>]+>/g, "").trim();
        const id = slugify(text) || `h-${items.length}`;
        items.push({ id, text, level: Number(lvl) as 2 | 3 });
        return `<h${lvl}${attrs} id="${id}">${inner}</h${lvl}>`;
      },
    );
    return { html: out, toc: items };
  }, [page.content]);

  const [progress, setProgress] = useState(0);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      setProgress(max > 0 ? Math.min(100, (h.scrollTop / max) * 100) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (toc.length === 0) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-20% 0px -70% 0px", threshold: 0 },
    );
    toc.forEach((t) => {
      const el = document.getElementById(t.id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, [toc]);

  const updated = new Date(page.updated_at).toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const Icon = meta.icon;

  return (
    <div className="bg-background">
      {/* Reading progress bar */}
      <div className="fixed left-0 right-0 top-0 z-40 h-[2px] bg-transparent">
        <div
          className="h-full bg-gradient-to-r from-gold via-gold-light to-gold transition-[width] duration-150"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* HERO */}
      <section className="relative overflow-hidden border-b border-border">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(1200px 500px at 20% -10%, rgba(212,160,23,0.18), transparent 60%), radial-gradient(900px 400px at 100% 0%, rgba(212,160,23,0.08), transparent 60%), linear-gradient(180deg, #1F1F1F 0%, #181818 100%)",
          }}
          aria-hidden
        />
        <div className="diagonal-lines-bg absolute inset-0 opacity-50" aria-hidden />
        <div
          className="absolute inset-x-0 bottom-0 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(212,160,23,0.55), transparent)",
          }}
          aria-hidden
        />

        <div className="relative mx-auto max-w-6xl px-6 py-14 md:py-20">
          {/* Breadcrumb */}
          <nav
            aria-label="Breadcrumb"
            className="font-ui mb-6 flex items-center gap-2 text-[11px] uppercase tracking-widest text-muted-foreground"
          >
            <Link to="/" className="hover:text-gold">
              Inicio
            </Link>
            <span className="opacity-50">/</span>
            <span className="text-foreground/80">Legal</span>
            <span className="opacity-50">/</span>
            <span className="text-gold">{meta.label}</span>
          </nav>

          <div className="flex flex-col items-start gap-6 md:flex-row md:items-end md:justify-between">
            <div className="max-w-3xl">
              <div className="font-condensed mb-4 inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[3px] text-gold">
                <Icon className="h-3.5 w-3.5" />
                {meta.eyebrow}
              </div>
              <h1 className="font-display text-4xl uppercase leading-[1.05] tracking-wider text-foreground md:text-6xl">
                {page.title}
              </h1>
              <div className="mt-4 h-[3px] w-20 bg-gradient-to-r from-gold to-transparent" />
              {meta.intro && (
                <p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
                  {meta.intro}
                </p>
              )}
              <div className="font-ui mt-6 inline-flex items-center gap-2 text-[11px] uppercase tracking-widest text-muted-foreground">
                <Clock className="h-3.5 w-3.5 text-gold" />
                Última actualización: <span className="text-foreground/80">{updated}</span>
              </div>
            </div>
          </div>

          {/* Pills nav between legal pages */}
          <div className="mt-10 flex flex-wrap gap-2">
            {(Object.keys(SLUG_META) as LegalSlug[]).map((s) => {
              const m = SLUG_META[s];
              const active = s === slug;
              const I = m.icon;
              return (
                <Link
                  key={s}
                  to="/legal/$slug"
                  params={{ slug: s }}
                  className={`font-condensed group inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[11px] font-bold uppercase tracking-[2.5px] transition-all ${
                    active
                      ? "border-gold bg-gold text-background shadow-[0_8px_24px_-12px_rgba(212,160,23,0.65)]"
                      : "border-border bg-surface/60 text-muted-foreground hover:border-gold/60 hover:text-gold"
                  }`}
                >
                  <I className="h-3.5 w-3.5" />
                  {m.label}
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* CONTENT + TOC */}
      <div className="mx-auto max-w-6xl px-6 py-10 md:py-14">
        <div className="grid gap-10 lg:grid-cols-[1fr_240px]">
          <article className="min-w-0">
            {html ? (
              <div className="rounded-[10px] border border-border bg-surface/40 p-6 md:p-10">
                <div
                  className="font-ui legal-prose text-[15px] leading-relaxed text-foreground/90 md:text-base"
                  // eslint-disable-next-line react/no-danger
                  dangerouslySetInnerHTML={{ __html: html }}
                />
              </div>
            ) : (
              <div className="rounded-[10px] border border-dashed border-border bg-surface p-10 text-center">
                <p className="font-ui text-sm text-muted-foreground">
                  Esta página aún no tiene contenido. El equipo editorial la publicará pronto.
                </p>
              </div>
            )}

            {/* Contact */}
            <aside className="mt-10 overflow-hidden rounded-[10px] border border-gold/30 bg-gradient-to-br from-surface to-background p-6 md:p-8">
              <div className="flex flex-col items-start gap-5 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="font-condensed text-[10px] font-bold uppercase tracking-[3px] text-gold">
                    ¿Tienes dudas?
                  </div>
                  <h2 className="font-display mt-2 text-2xl uppercase tracking-widest text-foreground">
                    Habla con nosotros
                  </h2>
                  <p className="mt-2 max-w-md text-sm text-muted-foreground">
                    Para preguntas sobre este documento o ejercer tus derechos, escríbenos.
                  </p>
                </div>
                <a
                  href="mailto:rollerzonespain@gmail.com"
                  className="font-condensed inline-flex items-center gap-2 rounded-md bg-gold px-5 py-3 text-[11px] font-bold uppercase tracking-[2.5px] text-background transition-all hover:bg-gold-light hover:shadow-[0_10px_30px_-10px_rgba(212,160,23,0.6)]"
                >
                  <Mail className="h-4 w-4" />
                  rollerzonespain@gmail.com
                </a>
              </div>
            </aside>

            <div className="mt-10 flex items-center justify-between border-t border-border pt-6">
              <Link
                to="/"
                className="font-ui text-xs uppercase tracking-widest text-muted-foreground hover:text-gold"
              >
                ← Volver al inicio
              </Link>
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="font-ui inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-muted-foreground hover:text-gold"
              >
                <ArrowUp className="h-3.5 w-3.5" /> Subir
              </button>
            </div>
          </article>

          {/* TOC sidebar */}
          {toc.length > 0 && (
            <aside className="hidden lg:block">
              <div className="sticky top-24">
                <div className="font-condensed mb-3 text-[10px] font-bold uppercase tracking-[3px] text-gold">
                  En esta página
                </div>
                <ul className="space-y-1.5 border-l border-border pl-4">
                  {toc.map((t) => (
                    <li key={t.id} className={t.level === 3 ? "pl-3" : ""}>
                      <a
                        href={`#${t.id}`}
                        className={`font-ui block text-[12.5px] leading-snug transition-colors ${
                          activeId === t.id
                            ? "text-gold"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {t.text}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
