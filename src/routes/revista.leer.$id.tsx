import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useAuthDialog } from "@/lib/auth-dialog-context";

export const Route = createFileRoute("/revista/leer/$id")({
  component: MagazineReader,
});

const SIGNED_URL_TTL = 300; // 5 minutes
const REFRESH_INTERVAL = 4 * 60 * 1000; // 4 minutes
const BUCKET = "magazine-pages";

function MagazineReader() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { openAuthDialog } = useAuthDialog();

  const [pages, setPages] = useState<string[]>([]);
  const [magTitle, setMagTitle] = useState("");
  const [current, setCurrent] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);

  const goHome = useCallback(
    (msg: string, variant: "error" | "info" = "error") => {
      if (variant === "info") toast.info(msg);
      else toast.error(msg);
      navigate({ to: "/revista" });
    },
    [navigate],
  );

  const loadPages = useCallback(async () => {
    // 1) Auth check
    if (!user) {
      openAuthDialog();
      goHome("Inicia sesión para leer esta revista.", "info");
      return;
    }

    // 2) Magazine exists + purchase or free
    const { data: mag, error: magErr } = await supabase
      .from("magazines")
      .select("id, title, is_free, published")
      .eq("id", id)
      .maybeSingle();

    if (magErr || !mag || !mag.published) {
      goHome("Revista no disponible.");
      return;
    }
    setMagTitle(mag.title);

    if (!mag.is_free) {
      const { data: purchase } = await supabase
        .from("magazine_purchases")
        .select("id")
        .eq("user_id", user.id)
        .eq("magazine_id", id)
        .maybeSingle();
      if (!purchase) {
        goHome("Debes comprar esta revista para leerla.");
        return;
      }
    }

    // 3) List files
    const { data: files, error: listErr } = await supabase.storage
      .from(BUCKET)
      .list(id, { limit: 500, sortBy: { column: "name", order: "asc" } });

    if (listErr || !files || files.length === 0) {
      goHome("Esta revista aún no tiene páginas publicadas.");
      return;
    }

    const imageFiles = files
      .filter((f) => /\.(jpe?g|png|webp)$/i.test(f.name))
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

    // 4) Signed URLs (5 min)
    const paths = imageFiles.map((f) => `${id}/${f.name}`);
    const { data: signed, error: signErr } = await supabase.storage
      .from(BUCKET)
      .createSignedUrls(paths, SIGNED_URL_TTL);

    if (signErr || !signed) {
      goHome("No se pudieron cargar las páginas.");
      return;
    }

    setPages(signed.map((s) => s.signedUrl).filter(Boolean) as string[]);
    setLoading(false);
  }, [id, user, openAuthDialog, goHome]);

  useEffect(() => {
    if (authLoading) return;
    void loadPages();
    const interval = setInterval(() => void loadPages(), REFRESH_INTERVAL);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, id, user]);

  const total = pages.length;
  const goPrev = useCallback(() => setCurrent((p) => Math.max(0, p - 1)), []);
  const goNext = useCallback(
    () => setCurrent((p) => Math.min(total - 1, p + 1)),
    [total],
  );

  // Keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "ArrowRight") goNext();
      else if (e.key === "Escape") navigate({ to: "/revista" });
      else if (e.key === "+" || e.key === "=") setZoom((z) => Math.min(3, z + 0.25));
      else if (e.key === "-") setZoom((z) => Math.max(1, z - 0.25));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goPrev, goNext, navigate]);

  // Swipe
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const endX = e.changedTouches[0]?.clientX ?? 0;
    const dx = endX - touchStartX.current;
    if (Math.abs(dx) > 50) {
      if (dx < 0) goNext();
      else goPrev();
    }
    touchStartX.current = null;
  };

  const blockContext = (e: React.SyntheticEvent) => e.preventDefault();

  const currentUrl = useMemo(() => pages[current], [pages, current]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[100] bg-black text-white select-none"
      onContextMenu={blockContext}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Top bar */}
      <div className="absolute top-0 inset-x-0 z-20 flex items-center justify-between gap-3 px-4 py-3 bg-gradient-to-b from-black/80 to-transparent">
        <div className="text-xs md:text-sm uppercase tracking-[0.18em] text-white/80 truncate">
          {magTitle}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(1, z - 0.25))}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-white/20 hover:bg-white/10"
            aria-label="Reducir zoom"
            disabled={zoom <= 1}
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <span className="text-xs tabular-nums w-10 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-white/20 hover:bg-white/10"
            aria-label="Aumentar zoom"
            disabled={zoom >= 3}
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => navigate({ to: "/revista" })}
            className="ml-2 inline-flex h-9 w-9 items-center justify-center rounded-md border border-white/20 hover:bg-white/10"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Page viewer */}
      <div className="absolute inset-0 flex items-center justify-center overflow-auto">
        {loading || !currentUrl ? (
          <Loader2 className="h-8 w-8 animate-spin text-white/70" />
        ) : (
          <img loading="lazy" decoding="async"
            src={currentUrl}
            alt={`Página ${current + 1}`}
            draggable={false}
            onContextMenu={blockContext}
            onDragStart={blockContext}
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: "center center",
              transition: "transform 0.2s ease",
            }}
            className="max-h-[100vh] max-w-[100vw] object-contain pointer-events-auto"
          />
        )}
      </div>

      {/* Prev/Next */}
      {!loading && total > 1 && (
        <>
          <button
            type="button"
            onClick={goPrev}
            disabled={current === 0}
            className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 z-20 inline-flex h-12 w-12 items-center justify-center rounded-full bg-black/50 border border-white/20 hover:bg-black/80 disabled:opacity-30"
            aria-label="Página anterior"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            type="button"
            onClick={goNext}
            disabled={current === total - 1}
            className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 z-20 inline-flex h-12 w-12 items-center justify-center rounded-full bg-black/50 border border-white/20 hover:bg-black/80 disabled:opacity-30"
            aria-label="Página siguiente"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}

      {/* Page counter */}
      {!loading && total > 0 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 rounded-full bg-black/70 border border-white/20 px-4 py-1.5 text-xs md:text-sm tabular-nums tracking-wider">
          Página {current + 1} de {total}
        </div>
      )}
    </div>
  );
}
