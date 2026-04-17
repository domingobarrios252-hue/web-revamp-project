import { Link } from "@tanstack/react-router";
import { Instagram, Facebook, Youtube } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border bg-surface">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <div className="font-display text-2xl tracking-widest">
              <span className="text-gold">Roller</span>
              <span className="text-foreground">Zone</span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              El medio del patinaje de velocidad en España. Noticias, rankings, eventos y entrevistas.
            </p>
          </div>
          <div>
            <h4 className="font-display mb-3 text-sm tracking-widest text-gold">Secciones</h4>
            <ul className="font-condensed space-y-1.5 text-sm uppercase tracking-wider text-muted-foreground">
              <li><Link to="/noticias" className="hover:text-gold">Noticias</Link></li>
              <li><a href="/#eventos" className="hover:text-gold">Eventos</a></li>
              <li><a href="/#ranking" className="hover:text-gold">Ranking</a></li>
              <li><a href="/#revista" className="hover:text-gold">Revista</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-display mb-3 text-sm tracking-widest text-gold">Síguenos</h4>
            <div className="flex gap-3">
              <a href="https://instagram.com/rollerzone" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="border border-border p-2 text-muted-foreground transition-colors hover:border-gold hover:text-gold">
                <Instagram className="h-4 w-4" />
              </a>
              <a href="https://facebook.com/rollerzone" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="border border-border p-2 text-muted-foreground transition-colors hover:border-gold hover:text-gold">
                <Facebook className="h-4 w-4" />
              </a>
              <a href="https://youtube.com/@rollerzone" target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="border border-border p-2 text-muted-foreground transition-colors hover:border-gold hover:text-gold">
                <Youtube className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
        <div className="mt-8 border-t border-border pt-4 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} RollerZone — Todos los derechos reservados
        </div>
      </div>
    </footer>
  );
}
