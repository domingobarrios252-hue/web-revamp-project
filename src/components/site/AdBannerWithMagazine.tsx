import { useEffect, useState } from "react";
import { BookOpen, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Banner = {
  id: string;
  name: string;
  image_url: string;
  link_url: string | null;
  alt_text: string | null;
};

type Magazine = {
  id: string;
  title: string;
  slug: string;
  issue_number: string | null;
  cover_url: string | null;
  edition_date: string;
};

type CtaConfig = {
  label_top: string;
  subtitle: string;
  button_text: string;
  button_url: string;
  enabled: boolean;
};

const DEFAULT_CTA: CtaConfig = {
  label_top: "Edición digital",
  subtitle: "RollerZone Colombia",
  button_text: "Ver edición digital",
  button_url: "",
  enabled: true,
};

/**
 * Sección de dos columnas: a la izquierda banner publicitario,
 * a la derecha la última edición digital de RollerZone con CTA editable.
 * En móvil se apilan verticalmente.
 */
export function AdBannerWithMagazine({ placement = "home_top" }: { placement?: string }) {
  const [banner, setBanner] = useState<Banner | null>(null);
  const [magazine, setMagazine] = useState<Magazine | null>(null);
  const [cta, setCta] = useState<CtaConfig>(DEFAULT_CTA);

  useEffect(() => {
    let cancelled = false;

    const loadBanner = () => {
      supabase
        .from("ad_banners")
        .select("id, name, image_url, link_url, alt_text")
        .eq("active", true)
        .eq("placement", placement)
        .order("sort_order", { ascending: true })
        .limit(1)
        .maybeSingle()
        .then(({ data }) => {
          if (!cancelled) setBanner((data as Banner) ?? null);
        });
    };

    const loadMagazine = () => {
      supabase
        .from("magazines")
        .select("id, title, slug, issue_number, cover_url, edition_date")
        .eq("published", true)
        .order("edition_date", { ascending: false })
        .order("sort_order", { ascending: true })
        .limit(1)
        .maybeSingle()
        .then(({ data }) => {
          if (!cancelled) setMagazine((data as Magazine) ?? null);
        });
    };

    const loadCta = () => {
      supabase
        .from("site_settings")
        .select("value")
        .eq("key", "magazine_cta")
        .maybeSingle()
        .then(({ data }) => {
          if (cancelled) return;
          if (data?.value) {
            setCta({ ...DEFAULT_CTA, ...(data.value as Partial<CtaConfig>) });
          }
        });
    };

    loadBanner();
    loadMagazine();
    loadCta();

    const channel = supabase
      .channel(`ad-banner-magazine-${placement}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ad_banners" },
        () => loadBanner()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "magazines" },
        () => loadMagazine()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "site_settings" },
        () => loadCta()
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [placement]);

  const showMagazine = cta.enabled && magazine;

  // Si no hay nada que mostrar, ocultamos toda la sección
  if (!banner && !showMagazine) return null;

  return (
    <div className="mx-auto max-w-7xl px-4 pt-3 sm:px-6 sm:pt-4 md:pt-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
        {/* IZQUIERDA — Banner publicidad */}
        {banner ? <BannerCard banner={banner} /> : <div className="hidden md:block" />}

        {/* DERECHA — Última edición digital */}
        {showMagazine ? (
          <MagazineCard magazine={magazine!} cta={cta} />
        ) : (
          <div className="hidden md:block" />
        )}
      </div>
    </div>
  );
}

function BannerCard({ banner }: { banner: Banner }) {
  const img = (
    <img
      src={banner.image_url}
      alt={banner.alt_text ?? banner.name}
      className="h-full w-full object-cover"
      loading="lazy"
    />
  );

  const card = (
    <div className="flex h-full min-h-[140px] items-center justify-center overflow-hidden border border-border bg-surface transition-opacity hover:opacity-90 md:min-h-[180px]">
      {img}
    </div>
  );

  return (
    <div className="flex flex-col">
      <div className="font-condensed mb-1 text-[10px] uppercase tracking-widest text-muted-foreground/60 md:mb-2">
        Publicidad
      </div>
      {banner.link_url ? (
        /^https?:\/\//i.test(banner.link_url) ? (
          <a
            href={banner.link_url}
            target="_blank"
            rel="noopener noreferrer sponsored"
            aria-label={banner.alt_text ?? banner.name}
            className="block h-full"
          >
            {card}
          </a>
        ) : (
          <a
            href={banner.link_url}
            aria-label={banner.alt_text ?? banner.name}
            className="block h-full"
          >
            {card}
          </a>
        )
      ) : (
        card
      )}
    </div>
  );
}

function MagazineCard({ magazine, cta }: { magazine: Magazine; cta: CtaConfig }) {
  const targetUrl = cta.button_url.trim() || "/revista";
  const isExternal = /^https?:\/\//i.test(targetUrl);

  const ctaButton = (
    <span className="font-condensed mt-3 inline-flex w-fit items-center gap-2 bg-gold px-4 py-2 text-[11px] font-bold uppercase tracking-[2px] text-background transition-colors hover:bg-gold-dark md:mt-4 md:px-5 md:py-2.5">
      {cta.button_text || "Ver edición digital"} <ArrowRight className="h-3.5 w-3.5" />
    </span>
  );

  return (
    <div className="flex flex-col">
      <div className="font-condensed mb-1 text-[10px] uppercase tracking-widest text-gold/80 md:mb-2">
        {cta.label_top || "Edición digital"}
      </div>
      <div className="group relative flex h-full min-h-[140px] items-center gap-4 overflow-hidden border border-gold/30 bg-gradient-to-br from-surface via-surface-2 to-background p-4 transition-colors hover:border-gold md:min-h-[180px] md:gap-5 md:p-5">
        {/* Cover */}
        <div className="relative h-[120px] w-[90px] shrink-0 overflow-hidden border border-border bg-background shadow-lg shadow-black/40 md:h-[160px] md:w-[120px]">
          {magazine.cover_url ? (
            <img
              src={magazine.cover_url}
              alt={magazine.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="hero-grid-bg flex h-full w-full items-center justify-center">
              <BookOpen className="h-8 w-8 text-gold/60" />
            </div>
          )}
        </div>

        {/* Info + CTA */}
        <div className="flex min-w-0 flex-1 flex-col">
          {magazine.issue_number && (
            <div className="font-condensed text-[10px] font-bold uppercase tracking-[3px] text-gold">
              Nº {magazine.issue_number}
            </div>
          )}
          <h3 className="font-display mt-1 line-clamp-2 text-lg uppercase leading-tight tracking-wider text-foreground md:text-xl">
            {magazine.title}
          </h3>
          {cta.subtitle && (
            <p className="font-condensed mt-1 text-[11px] uppercase tracking-widest text-muted-foreground">
              {cta.subtitle}
            </p>
          )}

          {isExternal ? (
            <a
              href={targetUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={cta.button_text || "Ver edición digital"}
            >
              {ctaButton}
            </a>
          ) : (
            <a href={targetUrl} aria-label={cta.button_text || "Ver edición digital"}>
              {ctaButton}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
