import { Link } from "@tanstack/react-router";
import { Trophy, MapPin } from "lucide-react";
import type { Skater } from "@/lib/hub/useSkaters";

export function SkaterCard({ skater, country }: { skater: Skater; country: string }) {
  const age = skater.birth_year ? new Date().getFullYear() - skater.birth_year : null;
  return (
    <Link
      to="/hub/$country/patinadores/$slug"
      params={{ country, slug: skater.slug }}
      className="group block overflow-hidden rounded-[8px] border border-[#333] bg-[#1A1A1A] hover:border-[#D4A017] transition-colors"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-[#0d0d0d]">
        {skater.photo_url ? (
          <img
            src={skater.photo_url}
            alt={skater.full_name}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[#333] font-display text-6xl font-black">
            {skater.full_name.charAt(0)}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-transparent to-transparent" />
        {skater.featured && (
          <div className="absolute top-2 right-2 rounded-[3px] bg-[#D4A017] px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[#111]">
            Destacado
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 p-3">
          <h3 className="font-display text-lg font-black uppercase text-white leading-tight">
            {skater.full_name}
          </h3>
          {skater.clubs && (
            <div className="text-[11px] uppercase tracking-widest text-[#D4A017]">
              {skater.clubs.name}
            </div>
          )}
        </div>
      </div>
      <div className="p-3 space-y-1 text-xs text-[#B5B5B5]">
        <div className="flex justify-between">
          <span>{[skater.category, skater.gender === "F" ? "Femenino" : skater.gender === "M" ? "Masculino" : null].filter(Boolean).join(" · ")}</span>
          {age && <span className="text-[#888]">{age} años</span>}
        </div>
        {skater.specialty && (
          <div className="flex items-center gap-1 text-[#888]">
            <Trophy className="h-3 w-3" /> {skater.specialty}
          </div>
        )}
        {skater.province && (
          <div className="flex items-center gap-1 text-[#888]">
            <MapPin className="h-3 w-3" /> {skater.province}
          </div>
        )}
      </div>
    </Link>
  );
}
