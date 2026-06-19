import { Link } from "@tanstack/react-router";
import {
  MapPin,
  Globe,
  Mail,
  Phone,
  Instagram,
  Facebook,
  Youtube,
  ArrowLeft,
  Calendar,
} from "lucide-react";
import { useClub, useClubNews, useClubSkaters, useClubEvents } from "@/lib/hub/useClubs";

const SCHOOL_LABEL: Record<string, string> = {
  escuela: "Escuela",
  competicion: "Competición",
  mixto: "Escuela + Competición",
};

export function ClubProfile({ slug, country }: { slug: string; country: string }) {
  const { club, loading } = useClub(slug);
  const news = useClubNews(club?.id);
  const skaters = useClubSkaters(club?.id);
  const events = useClubEvents(club?.id);

  if (loading) {
    return <div className="mx-auto max-w-7xl px-4 py-12 text-sm text-[#888]">Cargando ficha…</div>;
  }
  if (!club) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-[#F5F5F5]">Club no encontrado.</p>
        <Link
          to="/hub/$country/clubes"
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
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SportsTeam",
            name: club.name,
            sport: "Speed Skating",
            url: club.website ?? undefined,
            logo: club.logo_url ?? undefined,
            email: club.email ?? undefined,
            telephone: club.phone ?? undefined,
            address: club.address
              ? {
                  "@type": "PostalAddress",
                  streetAddress: club.address,
                  addressLocality: club.city ?? undefined,
                  addressRegion: club.regions?.name ?? undefined,
                  addressCountry: "ES",
                }
              : undefined,
          }),
        }}
      />

      {/* Hero */}
      <div className="relative h-[260px] md:h-[360px] overflow-hidden border-b border-[#333]">
        {club.cover_url ? (
          <img loading="lazy" decoding="async" src={club.cover_url} alt={club.name} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-[#1a1a1a] via-[#111] to-[#0a0a0a]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-[#111]/60 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-7xl px-4 md:px-6 pb-6">
          <Link
            to="/hub/$country/clubes"
            params={{ country }}
            className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-widest text-[#D4A017] hover:underline"
          >
            <ArrowLeft className="h-3 w-3" /> Clubes
          </Link>
          <div className="mt-3 flex items-end gap-4">
            {club.logo_url && (
              <div className="h-20 w-20 shrink-0 rounded-[6px] border border-[#333] bg-[#1A1A1A] p-2">
                <img loading="lazy" decoding="async" src={club.logo_url} alt="" className="h-full w-full object-contain" />
              </div>
            )}
            <div>
              <h1 className="font-display text-3xl md:text-5xl font-black uppercase text-white">
                {club.name}
              </h1>
              <div className="mt-2 flex flex-wrap gap-2 text-xs text-[#B5B5B5]">
                {(club.city || club.regions?.name) && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {[club.city, club.province, club.regions?.name].filter(Boolean).join(" · ")}
                  </span>
                )}
                <span className="rounded-[3px] border border-[#D4A017]/50 px-2 py-0.5 text-[10px] uppercase tracking-widest text-[#D4A017]">
                  {SCHOOL_LABEL[club.school_type] ?? club.school_type}
                </span>
                {club.founded_year && <span>Fundado {club.founded_year}</span>}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 md:px-6 py-10 grid gap-8 lg:grid-cols-[1fr_320px]">
        {/* Main */}
        <div className="space-y-10">
          {club.description && (
            <section>
              <h2 className="font-display text-xl font-black uppercase text-[#F5F5F5] mb-2">
                Sobre el club
              </h2>
              <p className="text-sm leading-relaxed text-[#D4D4D4] whitespace-pre-line">
                {club.description}
              </p>
            </section>
          )}

          {club.history && (
            <section>
              <h2 className="font-display text-xl font-black uppercase text-[#F5F5F5] mb-2">
                Historia
              </h2>
              <p className="text-sm leading-relaxed text-[#D4D4D4] whitespace-pre-line">
                {club.history}
              </p>
            </section>
          )}

          {club.categories.length > 0 && (
            <section>
              <h2 className="font-display text-xl font-black uppercase text-[#F5F5F5] mb-3">
                Categorías
              </h2>
              <div className="flex flex-wrap gap-2">
                {club.categories.map((c) => (
                  <span
                    key={c}
                    className="rounded-[3px] border border-[#333] bg-[#1A1A1A] px-3 py-1 text-xs uppercase tracking-widest text-[#D4D4D4]"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </section>
          )}

          {club.coaches.length > 0 && (
            <section>
              <h2 className="font-display text-xl font-black uppercase text-[#F5F5F5] mb-3">
                Entrenadores
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                {club.coaches.map((coach, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-[6px] border border-[#333] bg-[#1A1A1A] p-3">
                    {coach.photo && (
                      <img loading="lazy" decoding="async" src={coach.photo} alt="" className="h-10 w-10 rounded-full object-cover" />
                    )}
                    <div>
                      <div className="font-semibold text-sm text-[#F5F5F5]">{coach.name}</div>
                      {coach.role && (
                        <div className="text-[11px] uppercase tracking-widest text-[#888]">
                          {coach.role}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {skaters.length > 0 && (
            <section>
              <h2 className="font-display text-xl font-black uppercase text-[#F5F5F5] mb-3">
                Atletas destacados
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                {skaters.slice(0, 9).map((s) => (
                  <Link
                    key={s.id}
                    to="/patinadores/$slug"
                    params={{ slug: s.slug }}
                    className="flex items-center gap-3 rounded-[6px] border border-[#333] bg-[#1A1A1A] p-3 hover:border-[#D4A017]"
                  >
                    {s.photo_url ? (
                      <img loading="lazy" decoding="async" src={s.photo_url} alt="" className="h-12 w-12 rounded-full object-cover" />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-[#0d0d0d]" />
                    )}
                    <div>
                      <div className="font-semibold text-sm text-[#F5F5F5]">{s.full_name}</div>
                      <div className="text-[11px] uppercase tracking-widest text-[#888]">
                        {[s.category, s.gender].filter(Boolean).join(" · ")}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {events.length > 0 && (
            <section>
              <h2 className="font-display text-xl font-black uppercase text-[#F5F5F5] mb-3">
                Próximos eventos
              </h2>
              <div className="space-y-2">
                {events.slice(0, 6).map((e) => (
                  <Link
                    key={e.id}
                    to="/eventos/$slug"
                    params={{ slug: e.slug }}
                    className="flex items-center gap-3 rounded-[6px] border border-[#333] bg-[#1A1A1A] p-3 hover:border-[#D4A017]"
                  >
                    <Calendar className="h-4 w-4 text-[#D4A017]" />
                    <div className="flex-1">
                      <div className="font-semibold text-sm text-[#F5F5F5]">{e.name}</div>
                      <div className="text-[11px] uppercase tracking-widest text-[#888]">
                        {new Date(e.start_date).toLocaleDateString("es-ES")}
                        {e.location ? ` · ${e.location}` : ""}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
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
                      {n.excerpt && (
                        <p className="mt-1 text-xs text-[#B5B5B5] line-clamp-2">{n.excerpt}</p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {club.gallery.length > 0 && (
            <section>
              <h2 className="font-display text-xl font-black uppercase text-[#F5F5F5] mb-3">
                Galería
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {club.gallery.map((src, i) => (
                  <a key={i} href={src} target="_blank" rel="noreferrer" className="block aspect-square overflow-hidden rounded-[4px] bg-[#0d0d0d]">
                    <img src={src} alt="" className="h-full w-full object-cover hover:scale-105 transition-transform" loading="lazy" />
                  </a>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          <div className="rounded-[8px] border border-[#333] bg-[#1A1A1A] p-4">
            <h3 className="font-display text-sm font-bold uppercase tracking-widest text-[#D4A017] mb-3">
              Contacto
            </h3>
            <ul className="space-y-2 text-sm text-[#D4D4D4]">
              {club.address && (
                <li className="flex gap-2">
                  <MapPin className="h-4 w-4 shrink-0 text-[#888]" />
                  <span>{club.address}</span>
                </li>
              )}
              {club.phone && (
                <li className="flex gap-2">
                  <Phone className="h-4 w-4 shrink-0 text-[#888]" />
                  <a href={`tel:${club.phone}`} className="hover:text-[#D4A017]">
                    {club.phone}
                  </a>
                </li>
              )}
              {club.email && (
                <li className="flex gap-2">
                  <Mail className="h-4 w-4 shrink-0 text-[#888]" />
                  <a href={`mailto:${club.email}`} className="hover:text-[#D4A017] break-all">
                    {club.email}
                  </a>
                </li>
              )}
              {club.website && (
                <li className="flex gap-2">
                  <Globe className="h-4 w-4 shrink-0 text-[#888]" />
                  <a href={club.website} target="_blank" rel="noreferrer" className="hover:text-[#D4A017] break-all">
                    {club.website.replace(/^https?:\/\//, "")}
                  </a>
                </li>
              )}
            </ul>
            {club.email && (
              <a
                href={`mailto:${club.email}`}
                className="mt-4 block w-full rounded-[4px] bg-[#D4A017] py-2 text-center text-xs font-bold uppercase tracking-widest text-[#1A1A1A] hover:bg-[#b88a12]"
              >
                Contactar
              </a>
            )}
          </div>

          {(club.instagram_url || club.facebook_url || club.youtube_url || club.tiktok_url) && (
            <div className="rounded-[8px] border border-[#333] bg-[#1A1A1A] p-4">
              <h3 className="font-display text-sm font-bold uppercase tracking-widest text-[#D4A017] mb-3">
                Redes sociales
              </h3>
              <div className="flex gap-2">
                {club.instagram_url && (
                  <a href={club.instagram_url} target="_blank" rel="noreferrer" className="rounded-[4px] border border-[#333] p-2 text-[#D4D4D4] hover:border-[#D4A017] hover:text-[#D4A017]">
                    <Instagram className="h-4 w-4" />
                  </a>
                )}
                {club.facebook_url && (
                  <a href={club.facebook_url} target="_blank" rel="noreferrer" className="rounded-[4px] border border-[#333] p-2 text-[#D4D4D4] hover:border-[#D4A017] hover:text-[#D4A017]">
                    <Facebook className="h-4 w-4" />
                  </a>
                )}
                {club.youtube_url && (
                  <a href={club.youtube_url} target="_blank" rel="noreferrer" className="rounded-[4px] border border-[#333] p-2 text-[#D4D4D4] hover:border-[#D4A017] hover:text-[#D4A017]">
                    <Youtube className="h-4 w-4" />
                  </a>
                )}
              </div>
            </div>
          )}
        </aside>
      </div>
    </article>
  );
}
