import { Link } from "@tanstack/react-router";
import { BarChart3, Calendar, FileText, FileType2, Radio, Medal, LayoutDashboard } from "lucide-react";

export type ResultadosTab =
  | "resumen"
  | "eventos"
  | "manual"
  | "csv"
  | "pdfs"
  | "live"
  | "medallero";

const TABS: { id: ResultadosTab; label: string; to: string; icon: React.ReactNode }[] = [
  { id: "resumen", label: "Resumen", to: "/admin/resultados", icon: <LayoutDashboard className="h-3.5 w-3.5" /> },
  { id: "eventos", label: "Eventos", to: "/admin/resultados-eventos", icon: <Calendar className="h-3.5 w-3.5" /> },
  { id: "manual", label: "Resultados manuales", to: "/admin/live-results", icon: <BarChart3 className="h-3.5 w-3.5" /> },
  { id: "csv", label: "Importar CSV", to: "/admin/resultados-importar", icon: <FileText className="h-3.5 w-3.5" /> },
  { id: "pdfs", label: "PDFs oficiales", to: "/admin/resultados-pdfs", icon: <FileType2 className="h-3.5 w-3.5" /> },
  { id: "live", label: "Live Center", to: "/admin/live-center", icon: <Radio className="h-3.5 w-3.5" /> },
  { id: "medallero", label: "Medallero", to: "/admin/medallero", icon: <Medal className="h-3.5 w-3.5" /> },
];

export function ResultadosHubTabs({ active }: { active: ResultadosTab }) {
  return (
    <div className="mb-6 border border-border bg-surface">
      <div className="border-b border-border px-4 py-3">
        <h1 className="font-display text-lg tracking-widest text-gold">GESTOR DE RESULTADOS</h1>
        <p className="text-xs text-muted-foreground">
          Organiza resultados por evento, PDF, CSV, clasificación manual y directo.
        </p>
      </div>
      <nav className="flex flex-wrap gap-1 p-2">
        {TABS.map((t) => {
          const isActive = t.id === active;
          return (
            <Link
              key={t.id}
              to={t.to as any}
              className={`font-condensed inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest transition-colors ${
                isActive
                  ? "bg-gold text-background"
                  : "text-muted-foreground hover:bg-background hover:text-gold"
              }`}
            >
              {t.icon} {t.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
