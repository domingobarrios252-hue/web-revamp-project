export type Medal = "oro" | "plata" | "bronce" | null;

export type MemberResult = {
  id: string;
  member_id: string;
  competition: string;
  event_name: string | null;
  result: string | null;
  medal: Medal;
  result_date: string | null;
  sort_order: number;
};

export type PieceMember = {
  id: string;
  piece_id: string;
  first_name: string;
  last_name: string;
  display_name?: string | null;
  category: string | null;
  club: string | null;
  specialty: string | null;
  image_url: string | null;
  alt_image_url: string | null;
  country_code: string | null;
  sort_order: number;
  published: boolean;
  bio: string | null;
  button_label: string | null;
  link_url: string | null;
  skater_id: string | null;
  /** Próxima prueba ASU26 (schedule_items); opcional. */
  next_schedule_item_id?: string | null;
  results?: MemberResult[];
};

export type FeatureData = {
  summary?: {
    total?: string;
    categories?: string;
    venue?: string;
    competition?: string;
    junior?: string;
    senior?: string;
  };
  closing?: { title?: string; text?: string; image_url?: string };
};

export function parseFeatureData(v: unknown): FeatureData {
  if (!v || typeof v !== "object") return {};
  return v as FeatureData;
}

export function hasSummary(f: FeatureData): boolean {
  const s = f.summary ?? {};
  return Object.values(s).some((x) => typeof x === "string" && x.trim());
}

export function hasClosing(f: FeatureData): boolean {
  const c = f.closing ?? {};
  return Boolean(c.title?.trim() || c.text?.trim() || c.image_url?.trim());
}

export const MEDAL_LABEL: Record<string, string> = { oro: "Oro", plata: "Plata", bronce: "Bronce" };

/** Bandera emoji a partir de código ISO de 2 letras. */
export function flagEmoji(code?: string | null): string {
  const c = (code ?? "").trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(c)) return "";
  return String.fromCodePoint(...[...c].map((ch) => 0x1f1e6 + ch.charCodeAt(0) - 65));
}
