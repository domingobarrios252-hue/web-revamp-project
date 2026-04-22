import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type TeamMember = {
  id: string;
  full_name: string;
  role: string;
  bio: string | null;
  photo_url: string | null;
};

export const Route = createFileRoute("/equipo")({
  head: () => ({
    meta: [
      { title: "Equipo — RollerZone" },
      { name: "description", content: "Conoce al equipo de RollerZone: las personas detrás del medio de referencia del patinaje de velocidad en España." },
      { property: "og:title", content: "Equipo — RollerZone" },
      { property: "og:description", content: "Las personas detrás de RollerZone." },
    ],
  }),
  component: EquipoPage,
});

function EquipoPage() {
  const [items, setItems] = useState<TeamMember[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("team_members")
      .select("id, full_name, role, bio, photo_url")
      .eq("published", true)
      .order("sort_order", { ascending: true })
      .order("full_name", { ascending: true })
      .then(({ data }) => {
        if (!cancelled) setItems((data as TeamMember[]) ?? []);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="font-display mb-2 text-4xl tracking-widest text-gold">Equipo</h1>
      <p className="mb-10 text-muted-foreground">Las personas detrás de RollerZone.</p>

      {items === null && <p className="text-muted-foreground">Cargando…</p>}
      {items && items.length === 0 && (
        <div className="rounded-lg border border-border bg-surface p-10 text-center">
          <Users className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <p className="text-muted-foreground">Aún no hay miembros del equipo publicados.</p>
        </div>
      )}
      {items && items.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((m) => (
            <article key={m.id} className="overflow-hidden rounded-lg border border-border bg-surface transition-colors hover:border-gold">
              {m.photo_url ? (
                <img src={m.photo_url} alt={m.full_name} className="aspect-[4/3] w-full object-cover" loading="lazy" />
              ) : (
                <div className="flex aspect-[4/3] w-full items-center justify-center bg-muted">
                  <Users className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
              <div className="p-5">
                <h3 className="font-display text-lg tracking-wide text-foreground">{m.full_name}</h3>
                <p className="font-condensed mt-1 text-xs uppercase tracking-widest text-gold">{m.role}</p>
                {m.bio && <p className="mt-3 line-clamp-4 text-sm text-muted-foreground">{m.bio}</p>}
              </div>
            </article>
          ))}
        </div>
      )}

      <div className="mt-12 border-t border-border pt-6">
        <Link to="/colabora" className="text-gold hover:underline">¿Quieres formar parte del equipo? →</Link>
      </div>
    </div>
  );
}
