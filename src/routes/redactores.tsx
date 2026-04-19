import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PenLine } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Writer = {
  id: string;
  full_name: string;
  bio: string | null;
  photo_url: string | null;
};

export const Route = createFileRoute("/redactores")({
  head: () => ({
    meta: [
      { title: "Redactores — RollerZone" },
      { name: "description", content: "Conoce al equipo de redactores de RollerZone que cubre el patinaje de velocidad nacional e internacional." },
      { property: "og:title", content: "Redactores — RollerZone" },
      { property: "og:description", content: "El equipo de redactores que cubre el patinaje de velocidad para RollerZone." },
    ],
  }),
  component: RedactoresPage,
});

function RedactoresPage() {
  const [items, setItems] = useState<Writer[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("writers")
      .select("id, full_name, bio, photo_url")
      .eq("published", true)
      .order("sort_order", { ascending: true })
      .order("full_name", { ascending: true })
      .then(({ data }) => {
        if (!cancelled) setItems((data as Writer[]) ?? []);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-8">
      <header className="mb-10 text-center">
        <div className="font-condensed inline-flex items-center gap-2 border border-gold/40 bg-gold/5 px-3 py-1 text-[10px] uppercase tracking-widest text-gold">
          <PenLine className="h-3.5 w-3.5" /> Equipo editorial
        </div>
        <h1 className="font-display mt-4 text-4xl tracking-widest md:text-6xl">
          <span className="text-gold">Redactores</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm text-muted-foreground md:text-base">
          Las voces que dan vida a RollerZone. Conoce a quienes cuentan, día a día, el patinaje de velocidad.
        </p>
      </header>

      {items === null ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-80 animate-pulse bg-surface" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="py-20 text-center text-muted-foreground">
          Aún no hay redactores publicados.
        </p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((w) => (
            <WriterCard key={w.id} writer={w} />
          ))}
        </div>
      )}
    </div>
  );
}

function WriterCard({ writer }: { writer: Writer }) {
  return (
    <article className="flex flex-col border border-border bg-surface p-4 transition-colors hover:border-gold">
      <div className="relative aspect-square overflow-hidden border border-border bg-background">
        {writer.photo_url ? (
          <img
            src={writer.photo_url}
            alt={writer.full_name}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-gold/30">
            <PenLine className="h-16 w-16" />
          </div>
        )}
      </div>
      <h2 className="font-display mt-4 text-center text-lg tracking-wider md:text-xl">
        {writer.full_name}
      </h2>
      {writer.bio && (
        <p className="mt-2 text-center text-sm text-foreground/80">{writer.bio}</p>
      )}
    </article>
  );
}
