import { Link } from "@tanstack/react-router";
import { ArrowLeft, Trophy, MapPin, Instagram, Twitter, Youtube, Facebook, Calendar } from "lucide-react";
import {
  useSkater,
  useSkaterNews,
  useSkaterVideos,
  useSkaterResults,
} from "@/lib/hub/useSkaters";

export function SkaterProfile({ slug, country }: { slug: string; country: string }) {
  const { skater, loading } = useSkater(slug);
  const news = useSkaterNews(skater?.id);
  const videos = useSkaterVideos(skater?.id);
  const results = useSkaterResults(skater?.id);

  if (loading) {
    return <div className="mx-auto max-w-7xl px-4 py-12 text-sm text-[#888]">Cargando ficha…</div>;
  }
  if (!skater) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-[#F5F5F5]">Patinador no encontrado.</p>
        <Link
          to="/hub/$country/patinadores"
          params={{ country }}
          className="mt-4 inline-block text-sm text-[#D4A017] hover:underline"
        >
          ← Volver al directorio
        </Link>
      </div>
    );
  }

  const age = skater.birth_year ? new Date().getFullYear() - skater.birth_year : null;

  return (
    <article className="bg-[#111]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Person",
            name: skater.full_name,
            image: skater.photo_url ?? undefined,
            description: skater.bio ?? undefined,
            jobTitle: "Patinador de velocidad",
            affiliation: skater.clubs ? { "@type": "SportsTeam", name: skater.clubs.name } : undefined,
            nationality: "ES",
          }),
        }}
      />

      {/* Hero */}
      <div className="relative h-[300px] md:h-[420px] overflow-hidden border-b border-[#333]">
        {skater.cover_url ? (
          <img loading="lazy" decoding="async" src={skater.cover_url} alt="" className="h-full w-full object-cover" />
        ) : skater.photo_url ? (
          <img loading="lazy" decoding="async" src={skater.photo_url} alt="" className="h-full w-full object-cover blur-2xl scale-110 opacity-40" />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-[#1a1a1a] via-[#111] to-[#0a0a0a]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-[#111]/70 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-7xl px-4 md:px-6 pb-6">
          <Link
            to="/hub/$country/patinadores"
            params={{ country }}
            className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-widest text-[#D4A017] hover:underline"
          >
            <ArrowLeft className="h-3 w-3" /> Patinadores
          </Link>
          <div className="mt-3 flex items-end gap-4">
            {skater.photo_url && (
              <div className="h-24 w-24 md:h-32 md:w-32 shrink-0 overflow-hidden rounded-[8px] border border-[#333] bg-[#1A1A1A]">
                <img loading="lazy" decoding="async" src={skater.photo_url} alt={skater.full_name} className="h-full w-full object-cover" />
              </div>
            )}
            <div>
              <h1 className="font-display text-3xl md:text-5xl font-black uppercase text-white">
                {skater.full_name}
              </h1>
              <div className="mt-2 flex flex-wrap gap-2 text-xs text-[#B5B5B5]">
                {skater.clubs && (
                  <Link
                    to="/hub/$country/clubes/$slug"
                    params={{ country, slug: skater.clubs.slug }}
                    className="rounded-[3px] border border-[#D4A017]/50 px-2 py-0.5 text-[10px] uppercase tracking-widest text-[#D4A017] hover:bg-[#D4A017]/10"
                  >
                    {skater.clubs.name}
                  </Link>
                )}
                {skater.specialty && (
                  <span className="rounded-[3px] border border-[#333] px-2 py-0.5 text-[10px] uppercase tracking-widest text-[#D4D4D4]">
                    {skater.specialty}
                  </span>
                )}
                {skater.category && (
                  <span className="rounded-[3px] border border-[#333] px-2 py-0.5 text-[10px] uppercase tracking-widest text-[#D4D4D4]">
                    {skater.category}
                  </span>
                )}
                {age && <span>{age} años</span>}
                {skater.province && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {skater.province}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 md:px-6 py-10 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-10">
          {skater.bio && (
            <section>
              <h2 className="font-display text-xl font-black uppercase text-[#F5F5F5] mb-2">
                Biografía
              </h2>
              <p className="text-sm leading-relaxed text-[#D4D4D4] whitespace-pre-line">
                {skater.bio}
              </p>
            </section>
          )}

          {skater.palmares.length > 0 && (
            <section>
              <h2 className="font-display text-xl font-black uppercase text-[#F5F5F5] mb-3 flex items-center gap-2">
                <Trophy className="h-5 w-5 text-[#D4A017]" /> Palmarés
              </h2>
              <ul className="divide-y divide-[#333] rounded-[6px] border border-[#333] bg-[#1A1A1A]">
                {skater.palmares
                  .sort((a, b) => b.year - a.year)
                  .map((p, i) => (
                    <li key={i} className="flex items-center justify-between gap-4 px-4 py-3">
                      <div>
                        <div className="font-semibold text-sm text-[#F5F5F5]">{p.event}</div>
                        <div className="text-[11px] uppercase tracking-widest text-[#888]">{p.year}</div>
                      </div>
                      <div
                        className={`font-display text-2xl font-black ${
                          p.position === 1 ? "text-[#D4A017]" : p.position === 2 ? "text-[#C0C0C0]" : p.position === 3 ? "text-[#CD7F32]" : "text-[#666]"
                        }`}
                      >
                        {p.position}º
                      </div>
                    </li>
                  ))}
              </ul>
            </section>
          )}

          {results.length > 0 && (
            <section>
              <h2 className="font-display text-xl font-black uppercase text-[#F5F5F5] mb-3">
                Resultados recientes
              </h2>
              <ul className="divide-y divide-[#333] rounded-[6px] border border-[#333] bg-[#1A1A1A]">
                {results.slice(0, 10).map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
                    <div>
                      <div className="font-semibold text-[#F5F5F5]">{r.race?.name ?? "Carrera"}</div>
                      {r.race?.date && (
                        <div className="text-[11px] uppercase tracking-widest text-[#888]">
                          {new Date(r.race.date).toLocaleDateString("es-ES")}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      {r.time && <span className="text-[#D4D4D4] tabular-nums">{r.time}</span>}
                      <span className="font-display text-xl font-black text-[#D4A017]">{r.position}º</span>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {videos.length > 0 && (
            <section>
              <h2 className="font-display text-xl font-black uppercase text-[#F5F5F5] mb-3">
                Vídeos
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {videos.map((v) => (
                  <a
                    key={v.id}
                    href={v.youtube_id ? `https://www.youtube.com/watch?v=${v.youtube_id}` : "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="group block overflow-hidden rounded-[6px] border border-[#333] bg-[#1A1A1A] hover:border-[#D4A017]"
                  >
                    {v.thumbnail_url && (
                      <div className="aspect-video overflow-hidden bg-[#0d0d0d]">
                        <img loading="lazy" decoding="async" src={v.thumbnail_url} alt="" className="h-full w-full object-cover group-hover:scale-105 transition-transform" />
                      </div>
                    )}
                    <div className="p-3">
                      <h3 className="font-display text-sm font-bold text-[#F5F5F5] group-hover:text-[#D4A017]">
                        {v.title}
                      </h3>
                    </div>
                  </a>
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
                      <div className="mt-1 text-[11px] uppercase tracking-widest text-[#888] inline-flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(n.published_at).toLocaleDateString("es-ES")}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {skater.gallery.length > 0 && (
            <section>
              <h2 className="font-display text-xl font-black uppercase text-[#F5F5F5] mb-3">
                Galería
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {skater.gallery.map((src, i) => (
                  <a key={i} href={src} target="_blank" rel="noreferrer" className="block aspect-square overflow-hidden rounded-[4px] bg-[#0d0d0d]">
                    <img src={src} alt="" className="h-full w-full object-cover hover:scale-105 transition-transform" loading="lazy" />
                  </a>
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="space-y-4">
          <div className="rounded-[8px] border border-[#333] bg-[#1A1A1A] p-4">
            <h3 className="font-display text-sm font-bold uppercase tracking-widest text-[#D4A017] mb-3">
              Datos
            </h3>
            <dl className="space-y-2 text-sm">
              {skater.birth_year && (
                <div className="flex justify-between"><dt className="text-[#888]">Año nacimiento</dt><dd className="text-[#F5F5F5]">{skater.birth_year}</dd></div>
              )}
              {skater.height_cm && (
                <div className="flex justify-between"><dt className="text-[#888]">Altura</dt><dd className="text-[#F5F5F5]">{skater.height_cm} cm</dd></div>
              )}
              {skater.weight_kg && (
                <div className="flex justify-between"><dt className="text-[#888]">Peso</dt><dd className="text-[#F5F5F5]">{skater.weight_kg} kg</dd></div>
              )}
              {skater.dominant_foot && (
                <div className="flex justify-between"><dt className="text-[#888]">Pie dominante</dt><dd className="text-[#F5F5F5]">{skater.dominant_foot}</dd></div>
              )}
              {skater.total_points > 0 && (
                <div className="flex justify-between"><dt className="text-[#888]">Puntos liga</dt><dd className="text-[#D4A017] font-bold">{skater.total_points}</dd></div>
              )}
            </dl>
          </div>

          {skater.personal_records.length > 0 && (
            <div className="rounded-[8px] border border-[#333] bg-[#1A1A1A] p-4">
              <h3 className="font-display text-sm font-bold uppercase tracking-widest text-[#D4A017] mb-3">
                Marcas personales
              </h3>
              <ul className="space-y-2 text-sm">
                {skater.personal_records.map((pr, i) => (
                  <li key={i} className="flex justify-between">
                    <span className="text-[#D4D4D4]">{pr.event}</span>
                    <span className="text-[#F5F5F5] tabular-nums">{pr.time}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {skater.sponsors.length > 0 && (
            <div className="rounded-[8px] border border-[#333] bg-[#1A1A1A] p-4">
              <h3 className="font-display text-sm font-bold uppercase tracking-widest text-[#D4A017] mb-3">
                Patrocinadores
              </h3>
              <div className="flex flex-wrap gap-2">
                {skater.sponsors.map((s, i) => (
                  <span key={i} className="rounded-[3px] border border-[#333] bg-[#0d0d0d] px-2 py-1 text-xs text-[#D4D4D4]">{s}</span>
                ))}
              </div>
            </div>
          )}

          {(skater.social.instagram || skater.social.twitter || skater.social.facebook || skater.social.youtube) && (
            <div className="rounded-[8px] border border-[#333] bg-[#1A1A1A] p-4">
              <h3 className="font-display text-sm font-bold uppercase tracking-widest text-[#D4A017] mb-3">
                Redes sociales
              </h3>
              <div className="flex gap-2">
                {skater.social.instagram && (
                  <a href={`https://instagram.com/${skater.social.instagram.replace("@", "")}`} target="_blank" rel="noreferrer" className="rounded-[4px] border border-[#333] p-2 text-[#D4D4D4] hover:border-[#D4A017] hover:text-[#D4A017]">
                    <Instagram className="h-4 w-4" />
                  </a>
                )}
                {skater.social.twitter && (
                  <a href={`https://twitter.com/${skater.social.twitter.replace("@", "")}`} target="_blank" rel="noreferrer" className="rounded-[4px] border border-[#333] p-2 text-[#D4D4D4] hover:border-[#D4A017] hover:text-[#D4A017]">
                    <Twitter className="h-4 w-4" />
                  </a>
                )}
                {skater.social.facebook && (
                  <a href={skater.social.facebook} target="_blank" rel="noreferrer" className="rounded-[4px] border border-[#333] p-2 text-[#D4D4D4] hover:border-[#D4A017] hover:text-[#D4A017]">
                    <Facebook className="h-4 w-4" />
                  </a>
                )}
                {skater.social.youtube && (
                  <a href={skater.social.youtube} target="_blank" rel="noreferrer" className="rounded-[4px] border border-[#333] p-2 text-[#D4D4D4] hover:border-[#D4A017] hover:text-[#D4A017]">
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
