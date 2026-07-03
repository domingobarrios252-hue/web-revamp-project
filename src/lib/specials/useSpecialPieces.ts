import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PIECES, SPECIAL_FALLBACK_IMAGE, type SpecialPiece } from "@/lib/specials/europeo-2026";

export type DbSpecialPiece = {
  id: string;
  special_slug: string;
  slug: string;
  number: string;
  kicker: string;
  title: string;
  description: string;
  image_url: string;
  sort_order: number;
  featured: boolean;
  visible: boolean;
  status: string;
};

function toSpecialPiece(r: DbSpecialPiece): SpecialPiece {
  return {
    slug: r.slug as SpecialPiece["slug"],
    number: r.number,
    kicker: r.kicker,
    title: r.title,
    description: r.description,
    image: r.image_url?.trim() ? r.image_url : SPECIAL_FALLBACK_IMAGE,
    featured: r.featured,
    status: (r.status as SpecialPiece["status"]) ?? "live",
  };
}

/**
 * Devuelve las piezas visibles del especial, ordenadas por sort_order.
 * Si la consulta falla o no hay filas, cae al array hardcodeado PIECES
 * para evitar dejar la home en blanco.
 */
export function useSpecialPieces(specialSlug = "camino-al-europeo-2026") {
  const [pieces, setPieces] = useState<SpecialPiece[]>(PIECES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("special_pieces")
        .select("*")
        .eq("special_slug", specialSlug)
        .eq("visible", true)
        .order("sort_order", { ascending: true });
      if (cancelled) return;
      if (!error && data && data.length > 0) {
        setPieces((data as DbSpecialPiece[]).map(toSpecialPiece));
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [specialSlug]);

  return { pieces, loading };
}
