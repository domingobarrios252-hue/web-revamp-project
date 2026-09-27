import { useEffect, useRef } from "react";
import { useConsent } from "@/lib/consent";

/**
 * Envía el evento GA4 `tv_play` una sola vez cuando el reproductor de
 * Rollerzone TV se carga realmente (tras pulsar Play y permitir el contenido
 * externo). Solo se envía con consentimiento de Analíticas. Sin datos
 * personales: únicamente el nombre y el identificador de la emisión/evento.
 */
export function TvPlayBeacon({ title, eventRef, status }: { title: string; eventRef: string | null; status: string }) {
  const { categories, ready } = useConsent();
  const sent = useRef(false);
  useEffect(() => {
    if (sent.current || !ready || !categories.analytics) return;
    if (typeof window === "undefined" || typeof window.gtag !== "function") return;
    sent.current = true;
    window.gtag("event", "tv_play", {
      stream_title: title.slice(0, 100),
      stream_ref: (eventRef ?? "sin-evento").slice(0, 100),
      stream_status: status,
    });
  }, [ready, categories.analytics, title, eventRef, status]);
  return null;
}
