import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Calendar, FileText, Upload, Radio, BarChart3, Plus, FileType2, Medal } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ResultadosHubTabs } from "@/components/admin/ResultadosHubTabs";

export const Route = createFileRoute("/admin/resultados")({
  head: () => ({
    meta: [{ title: "Admin · Gestor de Resultados" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminResultadosHub,
});

type Stats = {
  activeEvents: number;
  publishedRows: number;
  draftRows: number;
  officialEvents: number;
  provisionalEvents: number;
  eventsWithPdf: number;
  medalRows: number;
  latest: { event_name: string; athlete_name: string; created_at: string }[];
};

function AdminResultadosHub() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    (async () => {
      const [events, published, draft, official, provisional, pdfs, medals, latest] = await Promise.all([
        supabase.from("result_events").select("id", { count: "exact", head: true }).eq("published", true),
        supabase.from("live_results").select("id", { count: "exact", head: true }).eq("published", true),
        supabase.from("live_results").select("id", { count: "exact", head: true }).eq("published", false),
        supabase.from("result_events").select("id", { count: "exact", head: true }).eq("status", "finalizado"),
        supabase.from("result_events").select("id", { count: "exact", head: true }).eq("status", "en_vivo"),
        supabase.from("result_events").select("id", { count: "exact", head: true }).not("pdf_url", "is", null),
        supabase.from("medal_standings").select("id", { count: "exact", head: true }),
        supabase.from("live_results").select("event_name, athlete_name, created_at").order("created_at", { ascending: false }).limit(6),
      ]);
      setStats({
        activeEvents: events.count ?? 0,
        publishedRows: published.count ?? 0,
        draftRows: draft.count ?? 0,
        officialEvents: official.count ?? 0,
        provisionalEvents: provisional.count ?? 0,
        eventsWithPdf: pdfs.count ?? 0,
        medalRows: medals.count ?? 0,
        latest: (latest.data as Stats["latest"]) ?? [],
      });
    })();
  }, []);

  return (
    <div>
      <ResultadosHubTabs active="resumen" />

      {/* Stat cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Eventos publicados" value={stats?.activeEvents} icon={<Calendar className="h-4 w-4" />} />
        <StatCard label="Resultados publicados" value={stats?.publishedRows} icon={<BarChart3 className="h-4 w-4" />} />
        <StatCard label="En borrador" value={stats?.draftRows} icon={<FileText className="h-4 w-4" />} />
        <StatCard label="Oficiales (finalizados)" value={stats?.officialEvents} icon={<FileType2 className="h-4 w-4" />} />
        <StatCard label="Provisionales (en vivo)" value={stats?.provisionalEvents} icon={<Radio className="h-4 w-4" />} />
        <StatCard label="Eventos con PDF" value={stats?.eventsWithPdf} icon={<FileType2 className="h-4 w-4" />} />
        <StatCard label="Filas medallero" value={stats?.medalRows} icon={<Medal className="h-4 w-4" />} />
      </div>

      {/* Quick actions */}
      <section className="mt-6 border border-border bg-surface">
        <div className="border-b border-border px-4 py-3 font-display text-sm uppercase tracking-widest text-gold">Accesos rápidos</div>
        <div className="grid gap-2 p-4 sm:grid-cols-2 lg:grid-cols-3">
          <QuickAction to="/admin/live-results" icon={<Plus className="h-4 w-4" />} label="Nuevo resultado manual" />
          <QuickAction to="/admin/resultados-importar" icon={<Upload className="h-4 w-4" />} label="Importar CSV" />
          <QuickAction to="/admin/resultados-pdfs" icon={<FileType2 className="h-4 w-4" />} label="Subir PDF oficial" />
          <QuickAction to="/admin/live-center" icon={<Radio className="h-4 w-4" />} label="Abrir Live Center" />
          <QuickAction to="/admin/resultados-eventos" icon={<Calendar className="h-4 w-4" />} label="Crear / editar evento" />
          <QuickAction to="/admin/medallero" icon={<Medal className="h-4 w-4" />} label="Editar medallero" />
        </div>
      </section>

      {/* Latest published */}
      <section className="mt-6 border border-border bg-surface">
        <div className="border-b border-border px-4 py-3 font-display text-sm uppercase tracking-widest text-gold">Últimos resultados publicados</div>
        {!stats ? (
          <p className="p-4 text-sm text-muted-foreground">Cargando…</p>
        ) : stats.latest.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">Aún no hay resultados.</p>
        ) : (
          <ul className="divide-y divide-border">
            {stats.latest.map((r, i) => (
              <li key={i} className="flex items-center justify-between gap-4 px-4 py-2 text-sm">
                <div className="min-w-0">
                  <div className="truncate font-semibold">{r.athlete_name}</div>
                  <div className="truncate text-xs text-muted-foreground">{r.event_name}</div>
                </div>
                <div className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString("es-ES")}</div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value?: number; icon: React.ReactNode }) {
  return (
    <div className="border border-border bg-surface p-4">
      <div className="flex items-center justify-between">
        <span className="font-condensed text-[10px] uppercase tracking-widest text-muted-foreground">{label}</span>
        <span className="text-gold">{icon}</span>
      </div>
      <div className="mt-2 font-display text-2xl text-foreground">{value ?? "—"}</div>
    </div>
  );
}

function QuickAction({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      to={to as any}
      className="font-condensed flex items-center gap-2 border border-border bg-background px-4 py-3 text-xs font-bold uppercase tracking-widest text-foreground hover:border-gold hover:text-gold"
    >
      <span className="text-gold">{icon}</span> {label}
    </Link>
  );
}
