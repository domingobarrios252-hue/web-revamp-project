import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Calendar, MapPin, Trophy, User as UserIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type PR = { event: string; time: string; date?: string; place?: string };

type SkaterProfile = {
  id: string;
  full_name: string;
  slug: string;
  photo_url: string | null;
  birth_year: number | null;
  category: string | null;
  gender: string | null;
  total_points: number;
  bio: string | null;
  personal_records: PR[];
  active: boolean;
  clubs: { name: string; slug: string } | null;
  regions: { name: string; code: string; flag_url: string | null } | null;
};

export const Route = createFileRoute("/patinadores/$slug")({
  head: ({ loaderData }) => {
    const s = loaderData as SkaterProfile | undefined;
    const title = s ? `${s.full_name} — RollerZone` : "Patinador — RollerZone";
    const description = s?.bio
      ? s.bio.slice(0, 155)
      : `Perfil de ${s?.full_name ?? "patinador"} en RollerZone: club, comunidad y marcas personales.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        ...(s?.photo_url ? [{ property: "og:image", content: s.photo_url }] : []),
      ],
    };
  },
  loader: async ({ params }) => {
    const { data } = await supabase
      .from("skaters")
      .select(
        "id, full_name, slug, photo_url, birth_year, category, gender, total_points, bio, personal_records, active, clubs(name, slug), regions(name, code, flag_url)"
      )
      .eq("slug", params.slug)
      .maybeSingle();
    if (!data) throw notFound();
    return data as unknown as SkaterProfile;
  },
  component: SkaterPage,
  notFoundComponent: () => (
    <div className="mx-auto max-w-3xl px-6 py-20 text-center">
      <h1 className="font-display text-3xl tracking-widest">Patinador no encontrado</h1>
      <Link
        to="/"
        className="font-condensed mt-6 inline-block text-xs uppercase tracking-widest text-gold hover:text-gold-dark"
      >
        ← Volver al inicio
      </Link>
    </div>
  ),
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <div className="mx-auto max-w-3xl px-6 py-20 text-center">
        <p className="text-destructive">{error.message}</p>
        <button
          onClick={() => {
            router.invalidate();
            reset();
          }}
          className="font-condensed mt-4 inline-block text-xs uppercase tracking-widest text-gold"
        >
          Reintentar
        </button>
      </div>
    );
  },
});

function SkaterPage() {
  const initial = Route.useLoaderData() as SkaterProfile;
  const [s, setS] = useState<SkaterProfile>(initial);

  useEffect(() => {
    setS(initial);
  }, [initial]);

  const age = s.birth_year ? new Date().getFullYear() - s.birth_year : null;

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <Link
        to="/"
        className="font-condensed inline-flex items-center gap-1 text-xs uppercase tracking-widest text-muted-foreground hover:text-gold"
      >
        <ArrowLeft className="h-3 w-3" /> Volver
      </Link>

      <div className="mt-6 grid gap-8 md:grid-cols-[280px_1fr]">
        <div>
          <div className="aspect-[3/4] w-full overflow-hidden border border-border bg-surface">
            {s.photo_url ? (
              <img src={s.photo_url} alt={s.full_name} className="h-full w-full object-cover" />
            ) : (
              <div className="hero-grid-bg flex h-full w-full items-center justify-center">
                <UserIcon className="h-16 w-16 text-gold/30" />
              </div>
            )}
          </div>
        </div>

        <div>
          {s.regions && (
            <div className="font-condensed mb-2 inline-flex items-center gap-2 text-[11px] uppercase tracking-widest text-gold">
              {s.regions.flag_url ? (
                <img src={s.regions.flag_url} alt={s.regions.code} className="h-3 w-auto" />
              ) : (
                <MapPin className="h-3 w-3" />
              )}
              {s.regions.name} ({s.regions.code})
            </div>
          )}
          <h1 className="font-display text-4xl uppercase leading-none tracking-wider md:text-5xl">
            {s.full_name}
          </h1>
          <div className="font-condensed mt-3 flex flex-wrap items-center gap-3 text-xs uppercase tracking-widest text-muted-foreground">
            {s.clubs?.name && <span className="text-foreground/80">{s.clubs.name}</span>}
            {s.category && <span>· {s.category}</span>}
            {s.gender && <span>· {s.gender === "F" ? "Femenino" : "Masculino"}</span>}
            {age && (
              <span className="inline-flex items-center gap-1">
                · <Calendar className="h-3 w-3" /> {age} años
              </span>
            )}
          </div>

          <div className="mt-6 inline-flex items-center gap-3 border border-gold bg-gold/10 px-4 py-2">
            <Trophy className="h-4 w-4 text-gold" />
            <div>
              <div className="font-condensed text-[10px] uppercase tracking-widest text-muted-foreground">
                Puntos totales
              </div>
              <div className="font-display text-2xl text-gold">
                {Number(s.total_points).toLocaleString("es-ES")}
              </div>
            </div>
          </div>

          {s.bio && (
            <div className="mt-6">
              <h2 className="font-display text-sm uppercase tracking-widest text-gold">Biografía</h2>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-foreground/80">
                {s.bio}
              </p>
            </div>
          )}
        </div>
      </div>

      {s.personal_records?.length > 0 && (
        <div className="mt-12">
          <h2 className="font-display border-b border-border pb-3 text-2xl tracking-widest">
            Marcas <span className="text-gold">personales</span>
          </h2>
          <div className="mt-4 overflow-x-auto border border-border">
            <table className="w-full">
              <thead className="border-b border-border bg-surface">
                <tr className="font-condensed text-[11px] uppercase tracking-widest text-muted-foreground">
                  <th className="px-3 py-2 text-left">Prueba</th>
                  <th className="px-3 py-2 text-left">Tiempo</th>
                  <th className="px-3 py-2 text-left">Fecha</th>
                  <th className="px-3 py-2 text-left">Lugar</th>
                </tr>
              </thead>
              <tbody>
                {s.personal_records.map((pr, i) => (
                  <tr key={i} className="border-b border-border/60 last:border-0">
                    <td className="px-3 py-2 text-sm">{pr.event}</td>
                    <td className="px-3 py-2 font-display text-base text-gold">{pr.time}</td>
                    <td className="px-3 py-2 text-sm text-muted-foreground">
                      {pr.date
                        ? new Date(pr.date).toLocaleDateString("es-ES", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : "—"}
                    </td>
                    <td className="px-3 py-2 text-sm text-muted-foreground">{pr.place ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
