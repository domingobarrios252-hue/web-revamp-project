import { Link } from "@tanstack/react-router";
import { ArrowLeft, Building2, MapPin, Mail, Phone, Globe, FileText, Calendar, Instagram, Facebook, Youtube } from "lucide-react";
import { useFederation, useFederationDocuments, useFederationNews } from "@/lib/hub/useFederations";
import { toJsonLd } from "@/lib/jsonLd";

const DOC_LABEL: Record<string, string> = {
  estatuto: "Estatutos",
  reglamento: "Reglamento",
  circular: "Circular",
  calendario: "Calendario",
  documento: "Documento",
};

export function FederationProfile({ slug, country }: { slug: string; country: string }) {
  const { federation, loading } = useFederation(slug);
  const docs = useFederationDocuments(federation?.id);
  const news = useFederationNews(federation?.id);

  if (loading) {
    return <div className="mx-auto max-w-7xl px-4 py-12 text-sm text-[#888]">Cargando ficha…</div>;
  }
  if (!federation) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-[#F5F5F5]">Federación no encontrada.</p>
        <Link
          to="/hub/$country/federaciones"
          params={{ country }}
          className="mt-4 inline-block text-sm text-[#D4A017] hover:underline"
        >
          ← Volver al directorio
        </Link>
      </div>
    );
  }

  return (
    <article className="bg-[#111]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: toJsonLd({
            "@context": "https://schema.org",
            "@type": "SportsOrganization",
            name: federation.name,
            alternateName: federation.short_name ?? undefined,
            url: federation.website ?? undefined,
            logo: federation.logo_url ?? undefined,
            email: federation.email ?? undefined,
            telephone: federation.phone ?? undefined,
            sport: "Roller Skating",
            address: federation.address
              ? {
                  "@type": "PostalAddress",
                  streetAddress: federation.address,
                  addressLocality: federation.city ?? undefined,
                  addressRegion: federation.region_name ?? undefined,
                  addressCountry: "ES",
                }
              : undefined,
          }),
        }}
      />

      <div className="relative h-[240px] md:h-[320px] overflow-hidden border-b border-[#333]">
        {federation.cover_url ? (
          <img loading="lazy" decoding="async" src={federation.cover_url} alt={federation.name} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-[#1a1a1a] via-[#111] to-[#0a0a0a]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-[#111]/70 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-7xl px-4 md:px-6 pb-6">
          <Link
            to="/hub/$country/federaciones"
            params={{ country }}
            className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-widest text-[#D4A017] hover:underline"
          >
            <ArrowLeft className="h-3 w-3" /> Federaciones
          </Link>
          <div className="mt-3 flex items-end gap-4">
            <div className="h-20 w-20 shrink-0 rounded-[6px] border border-[#333] bg-[#1A1A1A] p-2 flex items-center justify-center">
              {federation.logo_url ? (
                <img loading="lazy" decoding="async" src={federation.logo_url} alt="" className="h-full w-full object-contain" />
              ) : (
                <Building2 className="h-10 w-10 text-[#D4A017]" />
              )}
            </div>
            <div>
              <h1 className="font-display text-3xl md:text-5xl font-black uppercase text-white">
                {federation.short_name ?? federation.name}
              </h1>
              {federation.short_name && (
                <p className="text-sm text-[#B5B5B5] mt-1">{federation.name}</p>
              )}
              <div className="mt-2 flex flex-wrap gap-2 text-xs text-[#B5B5B5]">
                <span className="rounded-[3px] border border-[#D4A017]/50 px-2 py-0.5 text-[10px] uppercase tracking-widest text-[#D4A017]">
                  {federation.type === "nacional" ? "Federación Nacional" : "Federación Autonómica"}
                </span>
                {federation.region_name && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {federation.region_name}
                  </span>
                )}
                {federation.founded_year && <span>Fundada {federation.founded_year}</span>}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 md:px-6 py-10 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-10">
          {federation.description && (
            <section>
              <h2 className="font-display text-xl font-black uppercase text-[#F5F5F5] mb-2">
                Sobre la federación
              </h2>
              <p className="text-sm leading-relaxed text-[#D4D4D4] whitespace-pre-line">
                {federation.description}
              </p>
            </section>
          )}

          {docs.length > 0 && (
            <section>
              <h2 className="font-display text-xl font-black uppercase text-[#F5F5F5] mb-3">
                Documentos oficiales
              </h2>
              <ul className="divide-y divide-[#333] rounded-[6px] border border-[#333] bg-[#1A1A1A]">
                {docs.map((d) => (
                  <li key={d.id}>
                    <a
                      href={d.file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-3 px-4 py-3 hover:bg-[#222]"
                    >
                      <FileText className="h-5 w-5 text-[#D4A017] shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm text-[#F5F5F5]">{d.title}</div>
                        <div className="text-[11px] uppercase tracking-widest text-[#888]">
                          {DOC_LABEL[d.doc_type] ?? d.doc_type} · {new Date(d.published_at).toLocaleDateString("es-ES")}
                        </div>
                      </div>
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {news.length > 0 && (
            <section>
              <h2 className="font-display text-xl font-black uppercase text-[#F5F5F5] mb-3">
                Noticias relacionadas
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {news.map((n) => (
                  <Link
                    key={n.id}
                    to="/noticias/articulo/$slug"
                    params={{ slug: n.slug }}
                    className="group block rounded-[6px] border border-[#333] bg-[#1A1A1A] overflow-hidden hover:border-[#D4A017]"
                  >
                    {n.image_url && (
                      <div className="aspect-[16/9] overflow-hidden bg-[#0d0d0d]">
                        <img loading="lazy" decoding="async" src={n.image_url} alt="" className="h-full w-full object-cover group-hover:scale-105 transition-transform" />
                      </div>
                    )}
                    <div className="p-3">
                      <h3 className="font-display text-sm font-bold text-[#F5F5F5] group-hover:text-[#D4A017]">
                        {n.title}
                      </h3>
                      <div className="mt-1 text-[11px] uppercase tracking-widest text-[#888] inline-flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> {new Date(n.published_at).toLocaleDateString("es-ES")}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="space-y-4">
          <div className="rounded-[8px] border border-[#333] bg-[#1A1A1A] p-4">
            <h3 className="font-display text-sm font-bold uppercase tracking-widest text-[#D4A017] mb-3">
              Contacto
            </h3>
            <ul className="space-y-2 text-sm text-[#D4D4D4]">
              {federation.president && (
                <li><span className="text-[#888]">Presidente:</span> <span className="text-[#F5F5F5]">{federation.president}</span></li>
              )}
              {federation.address && (
                <li className="flex gap-2"><MapPin className="h-4 w-4 shrink-0 text-[#888]" /><span>{federation.address}{federation.city ? `, ${federation.city}` : ""}</span></li>
              )}
              {federation.phone && (
                <li className="flex gap-2"><Phone className="h-4 w-4 shrink-0 text-[#888]" /><a href={`tel:${federation.phone}`} className="hover:text-[#D4A017]">{federation.phone}</a></li>
              )}
              {federation.email && (
                <li className="flex gap-2"><Mail className="h-4 w-4 shrink-0 text-[#888]" /><a href={`mailto:${federation.email}`} className="hover:text-[#D4A017] break-all">{federation.email}</a></li>
              )}
              {federation.website && (
                <li className="flex gap-2"><Globe className="h-4 w-4 shrink-0 text-[#888]" /><a href={federation.website} target="_blank" rel="noreferrer" className="hover:text-[#D4A017] break-all">{federation.website.replace(/^https?:\/\//, "")}</a></li>
              )}
            </ul>
          </div>

          {(federation.social.instagram || federation.social.facebook || federation.social.youtube) && (
            <div className="rounded-[8px] border border-[#333] bg-[#1A1A1A] p-4">
              <h3 className="font-display text-sm font-bold uppercase tracking-widest text-[#D4A017] mb-3">
                Redes
              </h3>
              <div className="flex gap-2">
                {federation.social.instagram && (
                  <a href={federation.social.instagram} target="_blank" rel="noreferrer" className="rounded-[4px] border border-[#333] p-2 text-[#D4D4D4] hover:border-[#D4A017] hover:text-[#D4A017]"><Instagram className="h-4 w-4" /></a>
                )}
                {federation.social.facebook && (
                  <a href={federation.social.facebook} target="_blank" rel="noreferrer" className="rounded-[4px] border border-[#333] p-2 text-[#D4D4D4] hover:border-[#D4A017] hover:text-[#D4A017]"><Facebook className="h-4 w-4" /></a>
                )}
                {federation.social.youtube && (
                  <a href={federation.social.youtube} target="_blank" rel="noreferrer" className="rounded-[4px] border border-[#333] p-2 text-[#D4D4D4] hover:border-[#D4A017] hover:text-[#D4A017]"><Youtube className="h-4 w-4" /></a>
                )}
              </div>
            </div>
          )}
        </aside>
      </div>
    </article>
  );
}
