import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type RedactoresContent = {
  badge: string;
  title_line1: string;
  title_highlight: string;
  title_line2: string;
  description: string;
  item1_label: string;
  item1_text: string;
  item2_label: string;
  item2_text: string;
  item3_label: string;
  item3_text: string;
  item4_label: string;
  item4_text: string;
  form_kicker: string;
  form_placeholder_name: string;
  form_placeholder_email: string;
  form_placeholder_country: string;
  form_placeholder_region: string;
  form_placeholder_club: string;
  form_placeholder_topics: string;
  form_placeholder_message: string;
  form_consent: string;
  form_submit: string;
  success_title: string;
  success_text: string;
};

export const DEFAULT_REDACTORES: RedactoresContent = {
  badge: "Red de redactores RollerZone",
  title_line1: "Cuenta el patinaje de",
  title_highlight: "tu ciudad, tu club",
  title_line2: "o tu país.",
  description:
    "RollerZone está construyendo una red internacional de redactores, corresponsales y fotógrafos para cubrir el patinaje de velocidad allí donde ocurre. Si te apasiona el deporte y quieres firmar en el medio de referencia, este es tu sitio.",
  item1_label: "Redactores",
  item1_text: "Crónicas y análisis",
  item2_label: "Entrevistas",
  item2_text: "Voces del patinaje",
  item3_label: "Fotografía",
  item3_text: "Imágenes de carrera",
  item4_label: "Corresponsales",
  item4_text: "Cobertura local",
  form_kicker: "Formulario de colaboración",
  form_placeholder_name: "Nombre y apellidos *",
  form_placeholder_email: "Email *",
  form_placeholder_country: "País *",
  form_placeholder_region: "Zona / ciudad",
  form_placeholder_club: "Club o federación (opcional)",
  form_placeholder_topics: "Temas que quieres cubrir (ej. ruta, pista, marathon, RFEP...) *",
  form_placeholder_message: "Cuéntanos brevemente tu experiencia o motivación",
  form_consent: "Al enviar aceptas que RollerZone te contacte sobre tu solicitud.",
  form_submit: "Quiero colaborar",
  success_title: "¡Solicitud enviada!",
  success_text: "Hemos recibido tus datos. El equipo editorial de RollerZone te contactará en breve.",
};

const PREFIX = "redactores_home_";
export const REDACTORES_FIELDS = Object.keys(DEFAULT_REDACTORES) as (keyof RedactoresContent)[];

// ---- Singleton store to avoid duplicate realtime channels across components ----
let cached: RedactoresContent = DEFAULT_REDACTORES;
let loaded = false;
let loadingPromise: Promise<void> | null = null;
const listeners = new Set<(c: RedactoresContent) => void>();
let channelStarted = false;

async function loadOnce() {
  if (loadingPromise) return loadingPromise;
  loadingPromise = (async () => {
    try {
      const sb = supabase as any;
      const { data } = await sb.from("home_modules").select("key,value").like("key", `${PREFIX}%`);
      const next = { ...DEFAULT_REDACTORES };
      (data ?? []).forEach((row: { key: string; value: string }) => {
        const k = row.key.replace(PREFIX, "") as keyof RedactoresContent;
        if (k in next && typeof row.value === "string" && row.value.length) {
          (next as any)[k] = row.value;
        }
      });
      cached = next;
      loaded = true;
      listeners.forEach((l) => l(cached));
    } catch {
      // keep defaults
    } finally {
      loadingPromise = null;
    }
  })();
  return loadingPromise;
}

function ensureChannel() {
  if (channelStarted) return;
  channelStarted = true;
  try {
    supabase
      .channel("redactores-content-singleton")
      .on("postgres_changes", { event: "*", schema: "public", table: "home_modules" }, () => {
        loadOnce();
      })
      .subscribe();
  } catch {
    // ignore realtime failures — content still loads via fetch
  }
}

export function useRedactoresContent() {
  const [content, setContent] = useState<RedactoresContent>(cached);
  const [loading, setLoading] = useState(!loaded);

  useEffect(() => {
    let cancelled = false;
    const listener = (c: RedactoresContent) => {
      if (!cancelled) {
        setContent(c);
        setLoading(false);
      }
    };
    listeners.add(listener);
    if (loaded) {
      setContent(cached);
      setLoading(false);
    } else {
      loadOnce();
    }
    ensureChannel();
    return () => {
      cancelled = true;
      listeners.delete(listener);
    };
  }, []);

  return { content, loading };
}

export async function saveRedactoresContent(content: RedactoresContent) {
  const sb = supabase as any;
  const rows = REDACTORES_FIELDS.map((k) => ({ key: `${PREFIX}${k}`, value: String(content[k] ?? "") }));
  return sb.from("home_modules").upsert(rows, { onConflict: "key" });
}
