import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { BookOpen, Calendar, ShoppingCart, BookOpenCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { EmptyState } from "@/components/site/EmptyState";
import { useAuth } from "@/lib/auth-context";
import { useAuthDialog } from "@/lib/auth-dialog-context";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

type Magazine = {
  id: string;
  title: string;
  slug: string;
  issue_number: string | null;
  edition_number: number | null;
  edition_date: string;
  description: string | null;
  cover_url: string | null;
  cover_image_url: string | null;
  pdf_url: string | null;
  read_url: string | null;
  price: number | null;
  is_free: boolean | null;
  is_active: boolean | null;
  country: string | null;
};

export const Route = createFileRoute("/revista")({
  head: () => ({
    meta: [
      { title: "Revista — RollerZone" },
      { name: "description", content: "Ediciones digitales de la revista RollerZone: España y Colombia." },
      { property: "og:title", content: "Revista RollerZone" },
      { property: "og:description", content: "Ediciones digitales de la revista RollerZone." },
    ],
  }),
  component: RevistaPage,
});

function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("es-ES", { month: "long", year: "numeric" });
}

function formatPrice(p: number | null) {
  const v = Number(p ?? 0);
  return v.toLocaleString("es-ES", { style: "currency", currency: "EUR" });
}

function RevistaPage() {
  const { user } = useAuth();
  const [issues, setIssues] = useState<Magazine[] | null>(null);
  const [purchased, setPurchased] = useState<Set<string>>(new Set());
  const [authOpen, setAuthOpen] = useState(false);
  const [tab, setTab] = useState<"spain" | "colombia">("spain");

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("magazines")
      .select("id, title, slug, issue_number, edition_number, edition_date, description, cover_url, cover_image_url, pdf_url, read_url, price, is_free, is_active, country")
      .eq("published", true)
      .order("edition_number", { ascending: false, nullsFirst: false })
      .order("edition_date", { ascending: false })
      .limit(200)
      .then(({ data, error }) => {
        if (!cancelled) setIssues(error ? [] : ((data as Magazine[]) ?? []));
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!user) { setPurchased(new Set()); return; }
    let cancelled = false;
    supabase
      .from("magazine_purchases")
      .select("magazine_id")
      .eq("user_id", user.id)
      .then(({ data }) => {
        if (!cancelled) setPurchased(new Set((data ?? []).map((r: { magazine_id: string }) => r.magazine_id)));
      });
    return () => { cancelled = true; };
  }, [user]);

  const { spain, colombia } = useMemo(() => {
    const s: Magazine[] = [];
    const c: Magazine[] = [];
    (issues ?? []).forEach((m) => {
      if (m.country === "colombia") c.push(m);
      else s.push(m);
    });
    return { spain: s, colombia: c };
  }, [issues]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-8">
      <div className="mb-8 flex items-center gap-3 border-b border-border pb-4">
        <BookOpen className="h-7 w-7 text-gold" />
        <h1 className="font-display text-3xl tracking-widest">REVISTA</h1>
      </div>

      {issues === null ? (
        <Skeleton />
      ) : issues.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Próximamente"
          message="Aún no hay ediciones publicadas. Estamos preparando el primer número — vuelve pronto para hojearlo."
        />
      ) : (
        <Tabs value={tab} onValueChange={(v) => setTab(v as "spain" | "colombia")}>
          <TabsList className="mb-8 bg-surface">
            <TabsTrigger value="spain" className="font-condensed tracking-widest uppercase">
              🇪🇸 RollerZone España <span className="ml-2 text-xs opacity-70">({spain.length})</span>
            </TabsTrigger>
            <TabsTrigger value="colombia" className="font-condensed tracking-widest uppercase">
              🇨🇴 RollerZone Colombia <span className="ml-2 text-xs opacity-70">({colombia.length})</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="spain">
            <MagazineGrid
              items={spain}
              user={user}
              purchased={purchased}
              onRequireAuth={() => setAuthOpen(true)}
            />
          </TabsContent>
          <TabsContent value="colombia">
            <MagazineGrid
              items={colombia}
              user={user}
              purchased={purchased}
              onRequireAuth={() => setAuthOpen(true)}
            />
          </TabsContent>
        </Tabs>
      )}

      <Dialog open={authOpen} onOpenChange={setAuthOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display tracking-widest flex items-center gap-2">
              <Lock className="h-5 w-5 text-gold" /> Inicia sesión para comprar
            </DialogTitle>
            <DialogDescription>
              Necesitas una cuenta para comprar y leer las ediciones digitales de la revista RollerZone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setAuthOpen(false)}>Cancelar</Button>
            <Button asChild>
              <Link to="/auth">Iniciar sesión / Registrarse</Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="flex flex-col">
          <div className="aspect-[3/4] animate-pulse border border-border bg-surface-2" />
          <div className="mt-3 space-y-2">
            <div className="h-4 w-3/4 animate-pulse bg-surface-2" />
            <div className="h-3 w-1/2 animate-pulse bg-surface-2" />
          </div>
        </div>
      ))}
    </div>
  );
}

function MagazineGrid({
  items,
  user,
  purchased,
  onRequireAuth,
}: {
  items: Magazine[];
  user: ReturnType<typeof useAuth>["user"];
  purchased: Set<string>;
  onRequireAuth: () => void;
}) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon={BookOpen}
        title="Próximamente"
        message="Aún no hay ediciones publicadas para esta región. Vuelve pronto."
      />
    );
  }
  return (
    <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {items.map((m) => (
        <MagazineCard
          key={m.id}
          magazine={m}
          user={user}
          hasPurchased={purchased.has(m.id)}
          onRequireAuth={onRequireAuth}
        />
      ))}
    </div>
  );
}

function MagazineCard({
  magazine: m,
  user,
  hasPurchased,
  onRequireAuth,
}: {
  magazine: Magazine;
  user: ReturnType<typeof useAuth>["user"];
  hasPurchased: boolean;
  onRequireAuth: () => void;
}) {
  const [buying, setBuying] = useState(false);
  const [localPurchased, setLocalPurchased] = useState(hasPurchased);
  const cover = m.cover_image_url || m.cover_url;
  const isFree = !!m.is_free;
  const owns = localPurchased || isFree;
  const editionLabel = m.edition_number != null ? `Nº ${m.edition_number}` : m.issue_number ? `Nº ${m.issue_number}` : null;

  const handleBuy = async () => {
    if (!user) { onRequireAuth(); return; }
    setBuying(true);
    const { error } = await supabase.from("magazine_purchases").insert({
      user_id: user.id,
      magazine_id: m.id,
      amount_paid: Number(m.price ?? 0),
    });
    setBuying(false);
    if (!error) setLocalPurchased(true);
  };

  const readHref = m.read_url || m.pdf_url || "#";

  return (
    <article className="group flex flex-col">
      <div className="relative aspect-[3/4] overflow-hidden border border-border bg-surface">
        {cover ? (
          <img src={cover} alt={`Portada ${m.title}`} loading="lazy" className="h-full w-full object-cover transition-transform group-hover:scale-105" />
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
        {isFree && (
          <span className="font-condensed absolute right-2 top-3 bg-green-600 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-white">
            Gratis
          </span>
        )}
      </div>
      <div className="mt-3 flex flex-1 flex-col">
        <h3 className="font-display text-base leading-tight tracking-wide">{m.title}</h3>
        <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" /> {formatDate(m.edition_date)}
        </div>
        {m.description && <p className="mt-2 line-clamp-2 text-xs text-foreground/70">{m.description}</p>}

        <div className="mt-auto pt-4">
          {owns ? (
            <Button
              asChild
              className="w-full bg-green-600 text-white hover:bg-green-700"
            >
              <a href={readHref} target="_blank" rel="noopener noreferrer">
                <BookOpenCheck className="h-4 w-4" /> Leer ahora
              </a>
            </Button>
          ) : (
            <Button
              onClick={handleBuy}
              disabled={buying}
              className="w-full"
            >
              <ShoppingCart className="h-4 w-4" />
              {user ? `Comprar ${formatPrice(m.price)}` : "Comprar"}
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
