import { MapPin, Calendar, Radio, CheckCircle2, Clock, FileDown, Image as ImageIcon, Video } from "lucide-react";
import { formatShortDate } from "@/lib/i18n/format";
import type { LeagueRound } from "@/lib/hub/useLeague";

const STATUS: Record<LeagueRound["status"], { label: string; icon: React.ReactNode; cls: string }> = {
  upcoming: {
    label: "Próximo",
    icon: <Clock className="h-3 w-3" />,
    cls: "bg-[#1F1F1F] text-[#B5B5B5] border-[#333]",
  },
  live: {
    label: "EN DIRECTO",
    icon: <Radio className="h-3 w-3 animate-pulse" />,
    cls: "bg-tv-red text-white border-tv-red",
  },
  finished: {
    label: "Finalizado",
    icon: <CheckCircle2 className="h-3 w-3" />,
    cls: "bg-[#D4A017]/15 text-[#D4A017] border-[#D4A017]/40",
  },
};

export function RoundsList({ rounds, variant = "calendar" }: { rounds: LeagueRound[]; variant?: "calendar" | "results" }) {
  if (rounds.length === 0) {
    return (
      <div className="rounded-[6px] border border-dashed border-[#333] bg-[#141414] p-8 text-center text-sm text-[#888]">
        No hay jornadas configuradas todavía.
      </div>
    );
  }

  const filtered = variant === "results" ? rounds.filter((r) => r.status === "finished") : rounds;

  return (
    <div className="space-y-3">
      {filtered.map((r) => {
        const st = STATUS[r.status];
        return (
          <article
            key={r.id}
            className="group overflow-hidden rounded-[6px] border border-[#2A2A2A] bg-[#141414] hover:border-[#D4A017]/50 transition-colors"
          >
            <div className="grid grid-cols-1 md:grid-cols-[160px_1fr] gap-0">
              <div className="bg-[#0E0E0E] border-r border-[#222] flex items-center justify-center p-4 md:p-0 md:min-h-[140px]">
                {r.poster_url ? (
                  <img
                    src={r.poster_url}
                    alt={r.name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="text-center">
                    <div className="font-display text-[10px] uppercase tracking-widest text-[#666]">Jornada</div>
                    <div className="font-display text-5xl font-black text-[#D4A017] leading-none">
                      {String(r.round_number).padStart(2, "0")}
                    </div>
                  </div>
                )}
              </div>
              <div className="p-4 md:p-5">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <div className="font-ui text-[10px] font-bold uppercase tracking-[0.18em] text-[#888]">
                      Jornada {r.round_number}
                    </div>
                    <h3 className="font-display text-lg md:text-xl font-black text-[#F5F5F5] leading-tight mt-0.5">
                      {r.name}
                    </h3>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 border px-2 py-1 rounded-[3px] text-[10px] font-bold uppercase tracking-widest whitespace-nowrap ${st.cls}`}
                  >
                    {st.icon}
                    {st.label}
                  </span>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#B5B5B5] mt-2">
                  {r.event_date && (
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="h-3 w-3 text-[#D4A017]" />
                      {formatShortDate(r.event_date, "es")}
                    </span>
                  )}
                  {(r.city || r.venue) && (
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="h-3 w-3 text-[#D4A017]" />
                      {[r.city, r.venue].filter(Boolean).join(" · ")}
                    </span>
                  )}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {r.status === "live" && (
                    <a
                      href="/resultados"
                      className="font-ui inline-flex items-center gap-1.5 bg-tv-red px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white rounded-[3px] hover:opacity-90"
                    >
                      <Radio className="h-3 w-3" /> Ver en directo
                    </a>
                  )}
                  {r.status === "finished" && r.pdf_url && (
                    <a
                      href={r.pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-ui inline-flex items-center gap-1.5 border border-[#333] px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-[#F5F5F5] rounded-[3px] hover:border-[#D4A017] hover:text-[#D4A017]"
                    >
                      <FileDown className="h-3 w-3" /> PDF Resultados
                    </a>
                  )}
                  {r.gallery && r.gallery.length > 0 && (
                    <span className="font-ui inline-flex items-center gap-1.5 border border-[#333] px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-[#B5B5B5] rounded-[3px]">
                      <ImageIcon className="h-3 w-3" /> {r.gallery.length} fotos
                    </span>
                  )}
                  {r.video_url && (
                    <a
                      href={r.video_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-ui inline-flex items-center gap-1.5 border border-[#333] px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-[#F5F5F5] rounded-[3px] hover:border-[#D4A017] hover:text-[#D4A017]"
                    >
                      <Video className="h-3 w-3" /> Vídeo
                    </a>
                  )}
                  {r.map_url && (
                    <a
                      href={r.map_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-ui inline-flex items-center gap-1.5 border border-[#333] px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-[#B5B5B5] rounded-[3px] hover:border-[#D4A017] hover:text-[#D4A017]"
                    >
                      <MapPin className="h-3 w-3" /> Cómo llegar
                    </a>
                  )}
                </div>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
