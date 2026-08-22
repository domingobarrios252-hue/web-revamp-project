import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Member = {
  id: string;
  full_name: string;
  role: string;
  bio: string | null;
  photo_url: string | null;
};

export const Route = createFileRoute("/equipo")({
  head: () => ({
    meta: [
      { title: "Equipo | RollerZone" },
      {
        name: "description",
        content:
          "Conoce al equipo de RollerZone: dirección, redacción y colaboradores del medio del patinaje de velocidad.",
      },
      { property: "og:title", content: "Equipo — RollerZone" },
      {
        property: "og:description",
        content: "Las personas detrás de RollerZone, el medio del patinaje de velocidad.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Equipo — RollerZone" },
      {
        name: "twitter:description",
        content: "Las personas detrás de RollerZone, el medio del patinaje de velocidad.",
      },
    ],
  }),
  component: EquipoPage,
});

function EquipoPage() {
  const [items, setItems] = useState<Member[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("team_members")
      .select("id, full_name, role, bio, photo_url")
      .eq("published", true)
      .order("sort_order", { ascending: true })
      .order("full_name", { ascending: true })
      .then(({ data }) => {
        if (!cancelled) setItems((data as Member[]) ?? []);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-8">
      <header className="mb-10 text-center">
        <div className="font-condensed inline-flex items-center gap-2 border border-gold/40 bg-gold/5 px-3 py-1 text-[10px] uppercase tracking-widest text-gold">
          <Users className="h-3.5 w-3.5" /> Equipo RollerZone
        </div>
        <h1 className="font-display mt-4 text-4xl tracking-widest md:text-6xl">
          <span className="text-gold">Equipo</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm text-muted-foreground md:text-base">
          Dirección, redacción y colaboradores que hacen posible RollerZone cada día.
        </p>
      </header>

      {items === null ? (
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-56 animate-pulse bg-surface" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="py-20 text-center text-muted-foreground">
          Aún no hay miembros del equipo publicados.
        </p>
      ) : (
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((m) => (
            <article
              key={m.id}
              className="flex flex-col border border-border bg-surface p-4 transition-colors hover:border-gold"
            >
              <h2 className="font-display text-base tracking-wider text-foreground md:text-lg">
                {m.full_name}
              </h2>
              <div className="font-condensed mt-1 text-[11px] uppercase tracking-widest text-gold">
                {m.role}
              </div>
              {m.bio && <p className="mt-2 text-xs text-foreground/75">{m.bio}</p>}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
