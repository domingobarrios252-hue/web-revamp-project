import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getCountryBySlug } from "@/lib/countries";

export const Route = createFileRoute("/$country/eventos")({ component: Page });

type Row = { id: string; name: string; slug: string; start_date: string; location: string | null; cover_url: string | null };

function Page() {
  const { country: slug } = Route.useParams();
  const c = getCountryBySlug(slug)!;
  const [rows, setRows] = useState<Row[]>([]);
  useEffect(() => {
    supabase.from("events").select("id,name,slug,start_date,location,cover_url")
      .eq("published", true).eq("country_code", c.code)
      .order("start_date", { ascending: true }).limit(50)
      .then(({ data }) => setRows((data as Row[]) ?? []));
  }, [c.code]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
      <h1 className="font-display mb-6 text-3xl tracking-widest">Eventos <span className="text-gold">{c.name}</span></h1>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No hay eventos publicados para {c.name}.</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {rows.map((e) => (
            <Link key={e.id} to="/eventos/$slug" params={{ slug: e.slug }}
              className="rounded-lg border border-border bg-surface p-4 hover:border-gold">
              <div className="font-display text-lg tracking-wide">{e.name}</div>
              <div className="text-xs text-muted-foreground">{new Date(e.start_date).toLocaleDateString("es")} · {e.location ?? "—"}</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
