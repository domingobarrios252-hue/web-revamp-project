/**
 * «Finalización sugerida» (solo informativo): cruza el calendario con las páginas VeloPro ya
 * guardadas (asu26_results_links → vensport_pages). Nunca cambia estados ni consulta VeloPro.
 * La hora de publicación de un resultado NO se usa como fecha de celebración.
 */
export type HintItem = {
  id: string;
  event_name: string;
  phase: string | null;
  status: string;
  scheduled_at: string;
  original_scheduled_at?: string | null;
};
export type HintPage = { schedule_item_id: string; title: string; complete: boolean; row_count: number | null };
export type HintKind = "sugerida" | "incompleta" | "revisar" | "ok";
export type Hint = { kind: HintKind; pages: HintPage[]; warnings: string[]; source: "propia" | "final" | null };

const STOPPED = new Set(["aplazada", "suspendida", "cancelada"]);
export const isCeremony = (name: string) => /ceremon/i.test(name);
const isFinalPhase = (p: string | null) => !p || /^(final|marat)/i.test(p.trim());
const norm = (s: string) => s.toLowerCase().replace(/[.\s]/g, "");

export function computeHints(items: HintItem[], pages: HintPage[], tz: string): Map<string, Hint> {
  const byItem = new Map<string, HintPage[]>();
  for (const p of pages) {
    const list = byItem.get(p.schedule_item_id) ?? [];
    if (!list.some((x) => x.title === p.title)) list.push(p);
    byItem.set(p.schedule_item_id, list);
  }
  const races = items.filter((i) => !isCeremony(i.event_name));
  const out = new Map<string, Hint>();

  for (const it of items) {
    const warnings: string[] = [];
    // Hora inusual (00:00–05:59 en la sede): posible error de escritura.
    const h = Number(new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "2-digit", hourCycle: "h23" }).format(new Date(it.scheduled_at)));
    if (h < 6) warnings.push("Hora inusual (madrugada): revisar horario");
    if (it.original_scheduled_at && new Date(it.original_scheduled_at).getTime() === new Date(it.scheduled_at).getTime())
      warnings.push("Reprogramación sin cambio de horario");

    if (isCeremony(it.event_name)) {
      // Nombre y cronología: cada «distancia + palabra» citada debe existir y celebrarse antes.
      for (const m of it.event_name.matchAll(/(\d+m)\s+([A-Za-z]+)/g)) {
        const [dist, word] = [m[1].toLowerCase(), m[2].toLowerCase()];
        const related = races.filter((r) => norm(r.event_name).startsWith(dist) && r.event_name.toLowerCase().includes(word));
        if (related.length === 0) warnings.push(`La ceremonia cita «${m[1]} ${m[2]}», que no existe en el calendario`);
        else if (related.some((r) => new Date(r.scheduled_at) > new Date(it.scheduled_at)))
          warnings.push(`Programada antes de «${m[1]} ${m[2]}»: revisar orden`);
      }
      const kind: HintKind = it.status === "finalizada" ? "revisar" : warnings.length ? "revisar" : "ok";
      if (it.status === "finalizada") warnings.push("Ceremonia finalizada: sin datos que confirmen su celebración");
      out.set(it.id, { kind, pages: [], warnings, source: null });
      continue;
    }

    let own = byItem.get(it.id) ?? [];
    let source: Hint["source"] = own.length ? "propia" : null;
    if (!own.length && !isFinalPhase(it.phase)) {
      // Fases previas: la evidencia es la final de la misma prueba.
      const fin = races.find((r) => r.event_name === it.event_name && isFinalPhase(r.phase) && (byItem.get(r.id)?.length ?? 0) > 0);
      if (fin) { own = byItem.get(fin.id) ?? []; source = "final"; }
    }
    const total = own.length;
    const complete = own.filter((p) => p.complete).length;
    let kind: HintKind = "ok";

    if (STOPPED.has(it.status)) {
      kind = warnings.length ? "revisar" : "ok";
    } else if (total === 0) {
      if (it.status === "finalizada") { kind = "revisar"; warnings.push("Finalizada sin resultados guardados que lo confirmen"); }
      else if (warnings.length) kind = "revisar";
    } else if (complete < total) {
      kind = it.status === "finalizada" ? "revisar" : "incompleta";
      warnings.push(`${total - complete} de ${total} clasificaciones incompletas`);
    } else {
      kind = it.status === "finalizada" ? (warnings.length ? "revisar" : "ok") : "sugerida";
    }
    out.set(it.id, { kind, pages: own, warnings, source });
  }
  return out;
}

export const HINT_LABEL: Record<HintKind, string> = {
  sugerida: "Finalización sugerida",
  incompleta: "Resultados incompletos",
  revisar: "Revisar estado",
  ok: "Sin incidencias",
};
