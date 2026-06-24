import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { SPECIAL_BASE_PATH } from "@/lib/specials/europeo-2026";

export function BackToSpecial() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      <Link
        to={SPECIAL_BASE_PATH}
        className="font-condensed inline-flex items-center gap-2 rounded-md border border-gold/60 bg-black/20 px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-gold transition-all hover:bg-black/40"
      >
        <ArrowLeft className="h-4 w-4" /> Volver al especial
      </Link>
    </div>
  );
}
