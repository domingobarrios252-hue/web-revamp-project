import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Building2, FileText, Calendar, IdCard, Megaphone, Mail, Phone, Globe, MapPin, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/hub/$country/rfep")({
  head: () => ({
    meta: [
      { title: "RFEP · Real Federación Española de Patinaje · RollerZone" },
      { name: "description", content: "Información institucional de la Real Federación Española de Patinaje: normativa, calendario, convocatorias y licencias." },
    ],
  }),
  component: RfepHub,
});

type Federation = {
  id: string; name: string; short_name: string | null; slug: string;
  logo_url: string | null; cover_url: string | null; description: string | null;
  president: string | null; email: string | null; phone: string | null;
  website: string | null; city: string | null; founded_year: number | null;
};
type Doc = { id: string; title: string; doc_type: string; file_url: string; description: string | null; published_at: string };
type AutonomicaLite = { id: string; name: string; short_name: string | null; slug: string; region_name: string | null; logo_url: string | null };

const TABS: { key: string; label: string; icon: typeof FileText }[] = [
  { key: "normativa", label: "Normativa", icon: FileText },
  { key: "calendario", label: "Calendario oficial", icon: Calendar },
  { key: "convocatoria", label: "Convocatorias", icon: Megaphone },
  { key: "licencia", label: "Licencias", icon: IdCard },
];

function RfepHub() {
  const { country } = Route.useParams();
  const [fed, setFed] = useState<Federation | null>(null);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [autonomicas, setAutonomicas] = useState<AutonomicaLite[]>([]);
  const [tab, setTab] = useState("normativa");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const supa = supabase as any;
      const fedRes = await supa
        .from("federations")
        .select("*")
        .eq("country_code", country)
        .eq("type", "nacional")
        .order("featured", { ascending: false })
        .limit(1)
        .maybeSingle();
      const fedRow = (fedRes.data ?? null) as Federation | null;

      let docsRows: Doc[] = [];
      if (fedRow) {
        const r = await supa
          .from("federation_documents")
          .select("id, title, doc_type, file_url, description, published_at")
          .eq("federation_id", fedRow.id)
          .order("published_at", { ascending: false });
        docsRows = (r.data ?? []) as Doc[];
      }
      const auRes = await supa
        .from("federations")
        .select("id, name, short_name, slug, region_name, logo_url")
        .eq("country_code", country)
        .eq("type", "autonomica")
        .order("region_name");

      if (cancelled) return;
      setFed(fedRow);
      setDocs(docsRows);
      setAutonomicas((auRes.data ?? []) as AutonomicaLite[]);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [country]);

  if (loading) {
    return <div className="mx-auto max-w-7xl px-4 py-12 text-sm text-[#888] md:px-6">Cargando RFEP…</div>;
  }
  if (!fed) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center md:px-6">
        <h1 className="font-display text-3xl tracking-widest text-[#F5F5F5]">RFEP</h1>
        <p className="mt-3 text-sm text-[#B5B5B5]">Aún no hay datos institucionales registrados para la federación nacional.</p>
        <Link to="/hub/$country/federaciones" params={{ country }} className="mt-6 inline-block text-gold hover:underline">← Volver al directorio</Link>
      </div>
    );
  }

  const docsByType = TABS.reduce<Record<string, Doc[]>>((acc, t) => {
    acc[t.key] = docs.filter((d) => d.doc_type === t.key);
    return acc;
  }, {});

  return (
    <div>
      <div className="relative border-b border-[#222] bg-[#0d0d0d]">
        {fed.cover_url && (
          <div className="absolute inset-0 opacity-30">
            <img loading="lazy" decoding="async" src={fed.cover_url} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d0d] via-[#0d0d0d]/70 to-transparent" />
          </div>
        )}
        <div className="relative mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 md:flex-row md:items-end md:px-6 md:py-14">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-md border border-[#333] bg-[#0d0d0d] md:h-32 md:w-32">
            {fed.logo_url ? (
              <img loading="lazy" decoding="async" src={fed.logo_url} alt={fed.name} className="h-full w-full object-contain p-2" />
            ) : (
              <Building2 className="h-12 w-12 text-gold" />
            )}
          </div>
          <div className="flex-1">
            <div className="font-ui text-[11px] font-bold uppercase tracking-[0.2em] text-gold">Federación nacional · {country.toUpperCase()}</div>
            <h1 className="font-display mt-1 text-3xl md:text-5xl font-black uppercase text-[#F5F5F5] leading-tight">{fed.short_name ?? fed.name}</h1>
            {fed.short_name && <p className="mt-1 text-sm text-[#B5B5B5]">{fed.name}</p>}
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#B5B5B5]">
              {fed.president && <span>Presidente: <span className="text-[#F5F5F5]">{fed.president}</span></span>}
              {fed.founded_year && <span>Fundación: <span className="text-[#F5F5F5]">{fed.founded_year}</span></span>}
              {fed.city && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {fed.city}</span>}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {fed.website && <ContactPill icon={<Globe className="h-3 w-3" />} href={fed.website} label="Web oficial" />}
              {fed.email && <ContactPill icon={<Mail className="h-3 w-3" />} href={`mailto:${fed.email}`} label={fed.email} />}
              {fed.phone && <ContactPill icon={<Phone className="h-3 w-3" />} href={`tel:${fed.phone}`} label={fed.phone} />}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
        {fed.description && (
          <div className="mb-8 max-w-3xl text-sm leading-relaxed text-[#B5B5B5] whitespace-pre-line">{fed.description}</div>
        )}

        <div className="mb-6 flex flex-wrap gap-1 border-b border-[#222]">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`font-condensed inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors ${active ? "border-b-2 border-gold text-gold" : "text-[#888] hover:text-[#F5F5F5]"}`}
              >
                <Icon className="h-3.5 w-3.5" /> {t.label}
                <span className="ml-1 text-[10px] text-[#666]">({docsByType[t.key].length})</span>
              </button>
            );
          })}
        </div>

        <div className="grid gap-2">
          {docsByType[tab].length === 0 ? (
            <p className="text-sm text-[#888]">Aún no hay documentos en esta sección.</p>
          ) : (
            docsByType[tab].map((d) => (
              <a
                key={d.id}
                href={d.file_url}
                target="_blank"
                rel="noreferrer"
                className="group flex items-start gap-3 rounded-md border border-[#222] bg-[#141414] p-3 transition-colors hover:border-gold"
              >
                <FileText className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
                <div className="min-w-0 flex-1">
                  <div className="font-display text-sm uppercase text-[#F5F5F5] group-hover:text-gold">{d.title}</div>
                  {d.description && <div className="mt-0.5 text-xs text-[#B5B5B5] line-clamp-2">{d.description}</div>}
                  <div className="font-condensed mt-1 text-[10px] uppercase tracking-widest text-[#666]">
                    {new Date(d.published_at).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })}
                  </div>
                </div>
                <ExternalLink className="h-4 w-4 text-[#666] group-hover:text-gold" />
              </a>
            ))
          )}
        </div>

        {autonomicas.length > 0 && (
          <section className="mt-12">
            <h2 className="font-display mb-4 text-xl font-black uppercase text-[#F5F5F5]">Federaciones autonómicas ({autonomicas.length})</h2>
            <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
              {autonomicas.map((a) => (
                <Link
                  key={a.id}
                  to="/hub/$country/federaciones/$slug"
                  params={{ country, slug: a.slug }}
                  className="flex items-center gap-3 rounded-md border border-[#222] bg-[#141414] p-2.5 hover:border-gold"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded border border-[#333] bg-[#0d0d0d]">
                    {a.logo_url ? <img loading="lazy" decoding="async" src={a.logo_url} alt="" className="h-full w-full object-contain p-0.5" /> : <Building2 className="h-4 w-4 text-gold" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm text-[#F5F5F5]">{a.short_name ?? a.name}</div>
                    <div className="truncate text-[10px] uppercase tracking-widest text-[#666]">{a.region_name}</div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <div className="mt-10 flex flex-wrap gap-3">
          <Link to="/hub/$country/clubes" params={{ country }} className="font-condensed border border-[#333] px-4 py-2 text-xs uppercase tracking-widest text-[#B5B5B5] hover:border-gold hover:text-gold">
            Clubes afiliados →
          </Link>
          <Link to="/hub/$country/patinadores" params={{ country }} className="font-condensed border border-[#333] px-4 py-2 text-xs uppercase tracking-widest text-[#B5B5B5] hover:border-gold hover:text-gold">
            Patinadores con licencia →
          </Link>
          <Link to="/hub/$country/federaciones" params={{ country }} className="font-condensed border border-[#333] px-4 py-2 text-xs uppercase tracking-widest text-[#B5B5B5] hover:border-gold hover:text-gold">
            Volver al directorio
          </Link>
        </div>
      </div>
    </div>
  );
}

function ContactPill({ icon, href, label }: { icon: React.ReactNode; href: string; label: string }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="font-condensed inline-flex items-center gap-1.5 border border-[#333] bg-[#141414] px-3 py-1 text-[11px] uppercase tracking-widest text-[#B5B5B5] hover:border-gold hover:text-gold">
      {icon} {label}
    </a>
  );
}
