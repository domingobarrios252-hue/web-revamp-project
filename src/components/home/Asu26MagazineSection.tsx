import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { getAsu26Release } from "@/lib/magazine/asu26Release.functions";
import type { Asu26Edition } from "@/lib/magazine/asu26Release";
import esCover from "@/assets/asu26-cover-es.webp.asset.json";
import enCover from "@/assets/asu26-cover-en.webp.asset.json";

export function Asu26MagazineSection() {
  const { lang } = useLanguage();
  const checkRelease = useServerFn(getAsu26Release);
  const [state, setState] = useState<Awaited<ReturnType<typeof getAsu26Release>> | null>(null);

  useEffect(() => {
    let disposed = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let running = false;
    const refresh = async () => {
      if (running || disposed) return;
      running = true;
      clearTimeout(timer);
      try {
        const next = await checkRelease();
        if (disposed) return;
        setState(next);
        const untilRelease = Date.parse(next.releaseAt) - next.serverNow;
        timer = setTimeout(refresh, untilRelease > 0 ? Math.min(untilRelease, 60_000) : 60_000);
      } catch {
        if (!disposed) {
          setState(null); // Fail closed; redirect also independently checks the server clock.
          timer = setTimeout(refresh, 15_000);
        }
      } finally { running = false; }
    };
    const onVisible = () => { if (document.visibilityState === "visible") void refresh(); };
    void refresh();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    return () => {
      disposed = true;
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, [checkRelease]);

  const editions: { edition: Asu26Edition; cover: string; label: string; alt: string }[] = [
    { edition: "es", cover: esCover.url, label: "Leer en español", alt: "Portada Especial ASU26 · Edición española" },
    { edition: "en", cover: enCover.url, label: "Read in English", alt: "ASU26 Special Edition · English cover" },
  ];
  return (
    <section id="especial-asu26" aria-labelledby="especial-asu26-title" className="border-b border-border bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-5 py-14 md:px-6 md:py-16">
        <h2 id="especial-asu26-title" className="font-display text-3xl tracking-normal md:text-4xl">
          {lang === "en" ? "ASU26 Special Edition · World Skate Games 2026" : "Especial ASU26 · World Skate Games 2026"}
        </h2>
        <p className="mt-3 text-base text-muted-foreground">
          {lang === "en" ? "Free digital magazine · 56 pages with race reports, interviews, photos and race videos" : "Revista digital gratuita · 56 páginas con crónicas, entrevistas, fotos y vídeos de las carreras"}
        </p>
        <div className="mx-auto mt-8 grid max-w-3xl grid-cols-1 gap-6 min-[360px]:grid-cols-2 md:gap-10">
          {editions.map(({ edition, cover, label, alt }) => (
            <div key={edition} className="mx-auto w-full max-w-sm min-w-0">
              <img src={cover} alt={alt} width={960} height={1352} loading="lazy" decoding="async" className="aspect-[960/1352] h-auto w-full object-contain" />
              {state?.editions[edition] ? (
                <Button asChild className="mt-4 h-12 w-full whitespace-normal px-2 font-condensed text-base font-bold">
                  <a href={`/especial-asu26/leer/${edition}`} target="_blank" rel="noopener noreferrer" lang={edition}><BookOpen aria-hidden="true" />{label}</a>
                </Button>
              ) : (
                <Button disabled variant="secondary" lang={edition} className="mt-4 h-12 w-full whitespace-normal px-2 font-condensed text-base font-bold"><BookOpen aria-hidden="true" />{label}</Button>
              )}
            </div>
          ))}
        </div>
        {!state?.released && <p role="status" className="mt-6 text-center text-sm text-gold">
          {lang === "en" ? "Checking edition availability…" : "Comprobando disponibilidad de las ediciones…"}
        </p>}
      </div>
    </section>
  );
}