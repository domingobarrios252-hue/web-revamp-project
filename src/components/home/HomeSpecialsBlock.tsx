import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import specialFallback from "@/assets/special-fallback.svg";
import { useHomeSectionVisibility } from "@/lib/home/useHomeSectionVisibility";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { formatDate } from "@/lib/i18n/format";
import { SectionHeading } from "@/components/home/SectionHeading";

type Special = {
  slug: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  cover_url: string | null;
  status: string;
  featured_home: boolean;
  sort_order: number;
  start_date: string | null;
  end_date: string | null;
};

const SELECTED_KEY = "home_specials_selected";

function formatRange(a: string | null, b: string | null, lang: "es" | "en") {
  if (!a && !b) return "";
  if (a && b) return `${formatDate(a, lang, { day: "2-digit", month: "short" })} – ${formatDate(b, lang, { day: "2-digit", month: "short", year: "numeric" })}`;
  return formatDate(a ?? b, lang);
}

export function HomeSpecialsBlock() {
  const { visibility, loading: visLoading } = useHomeSectionVisibility();
  const { lang } = useLanguage();
  const [items, setItems] = useState<Special[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const sb = supabase as any;
      const [{ data: sel }, { data: specials }] = await Promise.all([
        sb.from("home_modules").select("value").eq("key", SELECTED_KEY).maybeSingle(),
        sb.from("special_editorials").select("*").eq("status", "active").order("sort_order", { ascending: true }),
      ]);
      if (cancelled) return;
      const selectedSlugs: string[] = (sel?.value ?? "")
        .split(",")
        .map((s: string) => s.trim())
        .filter(Boolean);
      const rows: Special[] = (specials ?? []) as Special[];
      const filtered = selectedSlugs.length > 0 ? rows.filter((r) => selectedSlugs.includes(r.slug)) : rows;
      filtered.sort((a, b) => {
        if (a.featured_home !== b.featured_home) return a.featured_home ? -1 : 1;
        return (a.sort_order ?? 0) - (b.sort_order ?? 0);
      });
      setItems(filtered);
    };
    load();
    const ch = supabase
      .channel("home-specials-block")
      .on("postgres_changes", { event: "*", schema: "public", table: "home_modules" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "special_editorials" }, load)
      .subscribe();
    return () => {
      cancelled = true;
      supabase.removeChannel(ch);
    };
  }, []);

  if (visLoading) return null;
  if (!visibility.especiales) return null;
  if (!items || items.length === 0) return null;

  return (
    <section className="bg-background py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <SectionHeading
          kicker="Especiales RollerZone"
          icon={<Sparkles className="h-3 w-3" />}
          title="Especiales"
          accent="Editoriales"
          action={{ to: "/especiales", label: "Ver todos" }}
        />

        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((s) => (
            <li key={s.slug}>
              <Link
                to="/especiales/$slug"
                params={{ slug: s.slug }}
                className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-lg transition-all hover:-translate-y-1 hover:border-gold hover:shadow-[0_15px_40px_-10px_rgba(212,160,23,0.35)]"
              >
                <div className="relative aspect-[16/9] overflow-hidden bg-surface-2">
                  <img
                    src={s.cover_url?.trim() ? s.cover_url : (specialFallback as string)}
                    alt={s.title}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 to-transparent" />
                  {s.featured_home && (
                    <span className="font-condensed absolute left-3 top-3 inline-block bg-gold px-2.5 py-1 text-[10px] font-bold uppercase tracking-[2.5px] text-background shadow-md">
                      Destacado
                    </span>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-5">
                  {s.subtitle && (
                    <div className="font-condensed text-[10px] font-bold uppercase tracking-[2.5px] text-gold/90">
                      {s.subtitle}
                    </div>
                  )}
                  <h3 className="font-display mt-2 text-lg uppercase leading-snug tracking-wider text-foreground transition-colors group-hover:text-gold md:text-xl">
                    {s.title}
                  </h3>
                  {s.description && (
                    <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                      {s.description}
                    </p>
                  )}
                  {(s.start_date || s.end_date) && (
                    <div className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5 text-gold/80" />
                      <span>{formatRange(s.start_date, s.end_date, lang)}</span>
                    </div>
                  )}
                  <div className="mt-auto pt-5">
                    <span className="font-condensed inline-flex items-center gap-2 rounded-md bg-gold px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-background transition-all group-hover:bg-gold-light">
                      Ver especial <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
