import { useState } from "react";
import { Facebook, Link2, Check } from "lucide-react";

const baseBtn =
  "inline-flex h-10 min-w-10 items-center justify-center gap-2 rounded-md border border-border bg-surface px-3 text-[11px] font-bold uppercase tracking-widest text-muted-foreground transition-colors hover:border-gold hover:text-gold";

/** Botones discretos para compartir la pieza con su URL individual. */
export function PieceShareBar({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const enc = encodeURIComponent;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* noop */
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="font-condensed mr-1 text-[10px] font-bold uppercase tracking-[2.5px] text-muted-foreground">
        Compartir
      </span>
      <a
        className={baseBtn}
        href={`https://wa.me/?text=${enc(`${title} ${url}`)}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Compartir en WhatsApp"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
          <path d="M12.04 2c-5.5 0-9.96 4.46-9.96 9.96 0 1.76.46 3.45 1.32 4.95L2 22l5.22-1.37a9.9 9.9 0 004.82 1.24h.01c5.5 0 9.96-4.46 9.96-9.96A9.9 9.9 0 0012.04 2zm5.8 14.06c-.24.68-1.4 1.3-1.93 1.35-.53.05-1.02.24-3.45-.72-2.93-1.16-4.76-4.2-4.9-4.4-.14-.2-1.15-1.53-1.15-2.92 0-1.39.73-2.07 1-2.35.26-.29.57-.36.76-.36l.54.01c.17 0 .41-.07.63.48.24.58.78 1.98.85 2.12.07.15.12.32.02.51-.1.2-.15.32-.29.5-.15.17-.31.39-.44.52-.15.15-.3.31-.13.6.17.29.76 1.26 1.63 2.04 1.12 1 2.06 1.31 2.35 1.46.29.14.46.12.63-.08.17-.19.73-.85.92-1.14.2-.29.39-.24.66-.15.27.1 1.7.8 1.99.95.29.14.48.22.55.34.07.13.07.73-.17 1.41z" />
        </svg>
        <span className="hidden sm:inline">WhatsApp</span>
      </a>
      <a
        className={baseBtn}
        href={`https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Compartir en Facebook"
      >
        <Facebook className="h-4 w-4" />
        <span className="hidden sm:inline">Facebook</span>
      </a>
      <a
        className={baseBtn}
        href={`https://twitter.com/intent/tweet?url=${enc(url)}&text=${enc(title)}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Compartir en X"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
          <path d="M18.9 2H22l-6.8 7.77L23 22h-6.9l-4.6-6.1L5.9 22H2.8l7.2-8.2L1.6 2h6.9l4.3 5.7L18.9 2zm-1.2 18h1.7L7.2 3.8H5.4L17.7 20z" />
        </svg>
        <span className="hidden sm:inline">X</span>
      </a>
      <button type="button" onClick={copy} className={baseBtn} aria-label="Copiar enlace">
        {copied ? <Check className="h-4 w-4 text-gold" /> : <Link2 className="h-4 w-4" />}
        <span className="hidden sm:inline">{copied ? "Copiado" : "Copiar enlace"}</span>
      </button>
    </div>
  );
}
