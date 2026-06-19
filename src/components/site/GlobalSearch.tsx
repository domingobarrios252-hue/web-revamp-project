import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Search, X, Newspaper, Calendar, User as UserIcon, BookOpen, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Result =
  | { kind: "news"; id: string; title: string; slug: string; image_url: string | null }
  | { kind: "event"; id: string; name: string; slug: string }
  | { kind: "skater"; id: string; full_name: string; slug: string; photo_url: string | null }
  | { kind: "magazine"; id: string; title: string; slug: string | null; cover_url: string | null };

const ICONS = {
  news: Newspaper,
  event: Calendar,
  skater: UserIcon,
  magazine: BookOpen,
} as const;

const LABELS = {
  news: "Noticias",
  event: "Eventos",
  skater: "Patinadores",
  magazine: "Revista",
} as const;

export function GlobalSearch({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 30);
    else {
      setQ("");
      setResults([]);
      setActive(0);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const term = q.trim();
    if (term.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const ctrl = { cancelled: false };
    const t = setTimeout(async () => {
      const like = `%${term}%`;
      const [news, events, skaters, magazines] = await Promise.all([
        supabase
          .from("news")
          .select("id, title, slug, image_url")
          .eq("published", true)
          .ilike("title", like)
          .limit(5),
        supabase
          .from("events")
          .select("id, name, slug")
          .eq("published", true)
          .ilike("name", like)
          .limit(5),
        supabase
          .from("skaters")
          .select("id, full_name, slug, photo_url")
          .eq("published", true)
          .ilike("full_name", like)
          .limit(5),
        supabase
          .from("magazines")
          .select("id, title, slug, cover_url")
          .eq("published", true)
          .ilike("title", like)
          .limit(5),
      ]);
      if (ctrl.cancelled) return;
      const merged: Result[] = [
        ...((news.data ?? []) as { id: string; title: string; slug: string; image_url: string | null }[]).map(
          (n) => ({ kind: "news" as const, ...n }),
        ),
        ...((events.data ?? []) as { id: string; name: string; slug: string }[]).map((e) => ({
          kind: "event" as const,
          ...e,
        })),
        ...((skaters.data ?? []) as { id: string; full_name: string; slug: string; photo_url: string | null }[]).map(
          (s) => ({ kind: "skater" as const, ...s }),
        ),
        ...((magazines.data ?? []) as { id: string; title: string; slug: string | null; cover_url: string | null }[]).map(
          (m) => ({ kind: "magazine" as const, ...m }),
        ),
      ];
      setResults(merged);
      setActive(0);
      setLoading(false);
    }, 220);
    return () => {
      ctrl.cancelled = true;
      clearTimeout(t);
    };
  }, [q, open]);

  const go = (r: Result) => {
    onClose();
    if (r.kind === "news") navigate({ to: "/noticias/articulo/$slug", params: { slug: r.slug } });
    else if (r.kind === "event") navigate({ to: "/eventos/$slug", params: { slug: r.slug } });
    else if (r.kind === "skater") navigate({ to: "/patinadores/$slug", params: { slug: r.slug } });
    else if (r.kind === "magazine") navigate({ to: "/revista" });
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[active]) {
      e.preventDefault();
      go(results[active]);
    }
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Buscador global"
      className="fixed inset-0 z-[70] flex items-start justify-center bg-black/70 px-4 pt-[10vh] backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl overflow-hidden rounded-lg border border-[#333] bg-[#1A1A1A] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-[#2A2A2A] px-3 py-2.5">
          <Search className="h-4 w-4 text-[#A0A0A0]" aria-hidden />
          <input
            ref={inputRef}
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Buscar noticias, eventos, patinadores, revistas…"
            aria-label="Buscar en RollerZone"
            className="flex-1 bg-transparent text-sm text-[#F5F5F5] placeholder:text-[#666] focus:outline-none"
          />
          {loading && <Loader2 className="h-4 w-4 animate-spin text-[#A0A0A0]" />}
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar buscador"
            className="rounded p-1 text-[#A0A0A0] hover:text-[#F5F5F5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4A017]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {q.trim().length < 2 ? (
            <p className="px-4 py-6 text-center text-xs text-[#888]">
              Escribe al menos 2 caracteres para buscar.
            </p>
          ) : !loading && results.length === 0 ? (
            <p className="px-4 py-6 text-center text-xs text-[#888]">Sin resultados para «{q}».</p>
          ) : (
            <ul className="py-1">
              {results.map((r, i) => {
                const Icon = ICONS[r.kind];
                const title = r.kind === "skater" ? r.full_name : (r as { title?: string; name?: string }).title ?? (r as { name?: string }).name ?? "";
                return (
                  <li key={`${r.kind}-${r.id}`}>
                    <button
                      type="button"
                      onClick={() => go(r)}
                      onMouseEnter={() => setActive(i)}
                      className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors focus-visible:outline-none ${
                        i === active ? "bg-[#242424] text-[#F5F5F5]" : "text-[#D5D5D5] hover:bg-[#222]"
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0 text-[#D4A017]" aria-hidden />
                      <span className="min-w-0 flex-1 truncate">{title}</span>
                      <span className="shrink-0 rounded border border-[#333] px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-[#888]">
                        {LABELS[r.kind]}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="border-t border-[#2A2A2A] px-3 py-1.5 text-[10px] uppercase tracking-wider text-[#666]">
          ↑↓ navegar · ↵ abrir · esc cerrar
        </div>
      </div>
    </div>
  );
}
