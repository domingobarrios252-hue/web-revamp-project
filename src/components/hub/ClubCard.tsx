import { Link } from "@tanstack/react-router";
import { MapPin, Star } from "lucide-react";
import type { Club } from "@/lib/hub/useClubs";

const SCHOOL_LABEL: Record<string, string> = {
  escuela: "Escuela",
  competicion: "Competición",
  mixto: "Escuela + Competición",
};

export function ClubCard({ club, country }: { club: Club; country: string }) {
  return (
    <Link
      to="/hub/$country/clubes/$slug"
      params={{ country, slug: club.slug }}
      className="group relative flex flex-col overflow-hidden rounded-[8px] border border-[#333] bg-[#1A1A1A] transition-colors hover:border-[#D4A017]"
    >
      <div className="relative aspect-[16/9] bg-[#0d0d0d] overflow-hidden">
        {club.cover_url ? (
          <img
            src={club.cover_url}
            alt={club.name}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a]" />
        )}
        {club.featured && (
          <span className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-[3px] bg-[#D4A017] px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A]">
            <Star className="h-3 w-3" /> Destacado
          </span>
        )}
        {club.logo_url && (
          <div className="absolute -bottom-6 left-4 h-12 w-12 rounded-[4px] border border-[#333] bg-[#1A1A1A] p-1">
            <img loading="lazy" decoding="async" src={club.logo_url} alt="" className="h-full w-full object-contain" />
          </div>
        )}
      </div>
      <div className="flex-1 p-4 pt-8">
        <h3 className="font-display text-lg font-black uppercase leading-tight text-[#F5F5F5] group-hover:text-[#D4A017]">
          {club.name}
        </h3>
        <div className="mt-2 flex flex-wrap gap-1 text-[11px] text-[#B5B5B5]">
          {(club.city || club.regions?.name) && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {[club.city, club.regions?.name].filter(Boolean).join(", ")}
            </span>
          )}
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <span className="rounded-[3px] border border-[#D4A017]/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-[#D4A017]">
            {SCHOOL_LABEL[club.school_type] ?? club.school_type}
          </span>
          {club.categories.slice(0, 3).map((c) => (
            <span
              key={c}
              className="rounded-[3px] bg-[#0d0d0d] px-2 py-0.5 text-[10px] uppercase tracking-widest text-[#888]"
            >
              {c}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}
