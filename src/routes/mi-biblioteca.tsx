import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { BookOpen, BookOpenCheck, Calendar, Lock, LogOut, History, Mail, User as UserIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useAuthDialog } from "@/lib/auth-dialog-context";
import { EmptyState } from "@/components/site/EmptyState";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Magazine = {
  id: string;
  title: string;
  slug: string | null;
  edition_number: number | null;
  issue_number: string | null;
  edition_date: string;
  description: string | null;
  cover_image_url: string | null;
  cover_url: string | null;
  read_url: string | null;
  pdf_url: string | null;
  country: string | null;
  is_free: boolean | null;
  price: number | null;
};

type Purchase = { magazine_id: string };
type ReadLog = { magazine_id: string; last_read_at: string; read_count: number };

export const Route = createFileRoute("/mi-biblioteca")({
  head: () => ({
    meta: [
      { title: "Mi biblioteca — RollerZone" },
      { name: "description", content: "Tus revistas RollerZone: portadas, historial y ediciones disponibles." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MiBibliotecaPage,
});

function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("es-ES", { month: "long", year: "numeric" });
}

function formatDateTime(d: string) {
  return new Date(d).toLocaleString("es-ES", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function MiBibliotecaPage() {
  const { user, loading, signOut } = useAuth();
  const { openAuthDialog } = useAuthDialog();
  const navigate = useNavigate();
  const [magazines, setMagazines] = useState<Magazine[] | null>(null);
  const [purchased, setPurchased] = useState<Set<string>>(new Set());
  const [reads, setReads] = useState<Map<string, ReadLog>>(new Map());

  useEffect(() => {
    if (!user) { setMagazines([]); return; }
    let cancelled = false;
    (async () => {
      const [mag, pur, rd] = await Promise.all([
        supabase
          .from("magazines")
          .select("id,title,slug,edition_number,issue_number,edition_date,description,cover_image_url,cover_url,read_url,pdf_url,country,is_free,price")
          .eq("published", true)
          .order("edition_number", { ascending: false, nullsFirst: false })
          .order("edition_date", { ascending: false }),
        supabase.from("magazine_purchases").select("magazine_id").eq("user_id", user.id),
        supabase.from("magazine_reads").select("magazine_id,last_read_at,read_count").eq("user_id", user.id),
      ]);
      if (cancelled) return;
      setMagazines((mag.data as Magazine[]) ?? []);
      setPurchased(new Set(((pur.data as Purchase[]) ?? []).map((p) => p.magazine_id)));
      const map = new Map<string, ReadLog>();
      ((rd.data as ReadLog[]) ?? []).forEach((r) => map.set(r.magazine_id, r));
      setReads(map);
    })();
    return () => { cancelled = true; };
  }, [user]);

  const canRead = (m: Magazine) => m.is_free || purchased.has(m.id);

  const logRead = async (m: Magazine) => {
    if (!user) return;
    const existing = reads.get(m.id);
    if (existing) {
      await supabase
        .from("magazine_reads")
        .update({ last_read_at: new Date().toISOString(), read_count: existing.read_count + 1 })
        .eq("user_id", user.id).eq("magazine_id", m.id);
    } else {
      await supabase.from("magazine_reads").insert({ user_id: user.id, magazine_id: m.id });
    }
    setReads((prev) => {
      const next = new Map(prev);
      next.set(m.id, {
        magazine_id: m.id,
        last_read_at: new Date().toISOString(),
        read_count: (existing?.read_count ?? 0) + 1,
      });
      return next;
    });
  };

  const history = useMemo(() => {
    if (!magazines) return [];
    return [...reads.values()]
      .sort((a, b) => (a.last_read_at < b.last_read_at ? 1 : -1))
      .map((r) => ({ log: r, mag: magazines.find((m) => m.id === r.magazine_id) }))
      .filter((x): x is { log: ReadLog; mag: Magazine } => Boolean(x.mag));
  }, [reads, magazines]);

  const handleSignOut = async () => {
    await signOut();
    toast.success("Sesión cerrada");
    navigate({ to: "/" });
  };

  const displayName =
    (user?.user_metadata as { full_name?: string; name?: string; display_name?: string } | undefined)?.display_name ||
    (user?.user_metadata as { full_name?: string; name?: string } | undefined)?.full_name ||
    (user?.user_metadata as { full_name?: string; name?: string } | undefined)?.name ||
    user?.email?.split("@")[0] ||
    "Lector";

  if (loading) return <div className="mx-auto max-w-7xl px-4 py-10 text-muted-foreground md:px-8">Cargando…</div>;

  if (!user) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 md:px-8">
        <div className="mb-8 flex items-center gap-3 border-b border-border pb-4">
          <BookOpen className="h-7 w-7 text-gold" />
          <h1 className="font-display text-3xl tracking-widest">MI BIBLIOTECA</h1>
        </div>
        <EmptyState
          icon={Lock}
          title="Inicia sesión"
          message="Accede a tu cuenta para consultar tus revistas y tu historial de lectura."
          action={<Button onClick={openAuthDialog}>Iniciar sesión</Button>}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-8">
      {/* Cabecera con datos del usuario */}
      <div className="mb-8 flex flex-col gap-4 border-b border-border pb-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <BookOpen className="h-7 w-7 shrink-0 text-gold" />
          <div className="min-w-0">
            <h1 className="font-display text-2xl tracking-widest md:text-3xl">MI BIBLIOTECA</h1>
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5"><UserIcon className="h-3.5 w-3.5 text-gold" />{displayName}</span>
              <span className="inline-flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-gold" />{user.email}</span>
            </div>
          </div>
        </div>
        <Button variant="outline" onClick={handleSignOut} className="min-h-11 self-start md:self-auto">
          <LogOut className="h-4 w-4" /> Cerrar sesión
        </Button>
      </div>

      {/* Ediciones disponibles */}
      <section className="mb-12">
        <h2 className="font-display mb-4 text-xl tracking-widest text-gold">EDICIONES DISPONIBLES</h2>
        {magazines === null ? (
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="aspect-[3/4] animate-pulse border border-border bg-surface-2" />
            ))}
          </div>
        ) : magazines.length === 0 ? (
          <EmptyState icon={BookOpen} title="Sin ediciones publicadas" message="Aún no hay revistas disponibles." />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {magazines.map((m) => {
              const cover = m.cover_image_url || m.cover_url;
              const href = m.read_url || m.pdf_url || "#";
              const editionLabel = m.edition_number != null ? `Nº ${m.edition_number}` : m.issue_number ? `Nº ${m.issue_number}` : null;
              const unlocked = canRead(m);
              return (
                <article key={m.id} className="group flex flex-col">
                  <div className={`relative aspect-[3/4] overflow-hidden border ${unlocked ? "border-border" : "border-destructive/30"} bg-surface`}>
                    {cover ? (
                      <img
                        src={cover}
                        alt={`Portada ${m.title}`}
                        loading="lazy"
                        decoding="async"
                        className={`h-full w-full object-cover transition-transform group-hover:scale-105 ${unlocked ? "" : "grayscale"}`}
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-muted-foreground/40">
                        <BookOpen className="h-12 w-12" />
                      </div>
                    )}
                    {editionLabel && (
                      <span className="font-condensed absolute left-0 top-3 bg-gold px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-background">
                        {editionLabel}
                      </span>
                    )}
                    {!unlocked && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 text-center">
                        <Lock className="h-8 w-8 text-destructive" />
                        <span className="font-condensed mt-2 bg-destructive/90 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-white">
                          Edición bloqueada
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="mt-3 flex flex-1 flex-col">
                    <h3 className="font-display text-base leading-tight tracking-wide">{m.title}</h3>
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" /> {formatDate(m.edition_date)}
                    </div>
                    <div className="mt-auto pt-4">
                      {unlocked ? (
                        <Button asChild className="min-h-11 w-full bg-green-600 text-white hover:bg-green-700">
                          <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => logRead(m)}
                          >
                            <BookOpenCheck className="h-4 w-4" /> Leer revista
                          </a>
                        </Button>
                      ) : (
                        <Button variant="outline" className="min-h-11 w-full border-destructive/50 text-destructive hover:bg-destructive/10" disabled>
                          <Lock className="h-4 w-4" /> Bloqueada
                        </Button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Historial */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <History className="h-5 w-5 text-gold" />
          <h2 className="font-display text-xl tracking-widest text-gold">HISTORIAL DE LECTURA</h2>
        </div>
        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aún no has abierto ninguna revista. Cuando pulses "Leer revista" aparecerá aquí.</p>
        ) : (
          <ul className="divide-y divide-border border border-border bg-surface">
            {history.map(({ log, mag }) => (
              <li key={log.magazine_id} className="flex items-center gap-3 p-3">
                {mag.cover_image_url || mag.cover_url ? (
                  <img
                    src={(mag.cover_image_url || mag.cover_url) as string}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="h-14 w-10 shrink-0 object-cover"
                  />
                ) : (
                  <div className="grid h-14 w-10 shrink-0 place-items-center bg-surface-2 text-muted-foreground/40">
                    <BookOpen className="h-5 w-5" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold text-foreground">{mag.title}</div>
                  <div className="text-xs text-muted-foreground">
                    Última consulta: {formatDateTime(log.last_read_at)} · {log.read_count} vez{log.read_count === 1 ? "" : "es"}
                  </div>
                </div>
                {canRead(mag) ? (
                  <Button asChild size="sm" variant="outline" className="min-h-11 shrink-0">
                    <a href={mag.read_url || mag.pdf_url || "#"} target="_blank" rel="noopener noreferrer" onClick={() => logRead(mag)}>
                      Volver a leer
                    </a>
                  </Button>
                ) : (
                  <span className="font-condensed shrink-0 bg-destructive/20 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-destructive">
                    Bloqueada
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
