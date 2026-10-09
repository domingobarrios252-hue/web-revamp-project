import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ResultadosHubTabs } from "@/components/admin/ResultadosHubTabs";
import { syncResultsNow } from "@/lib/results/resultsSync.functions";

export const Route = createFileRoute("/admin/resultados-sync")({
  head: () => ({ meta: [{ title: "Admin · Sincronización resultados ASU26" }, { name: "robots", content: "noindex" }] }),
  component: SyncAdmin,
});

const KEY = "asu26_speed";
type St = Record<string, any>;
type Link = { source_competition_id: string; label: string; competition_date: string | null; source_state: string | null; schedule_item_id: string | null; link_status: string; priority: string | null };
type Sched = { id: string; event_name: string; phase: string | null; category: string | null; scheduled_at: string | null };

const fmt = (v?: string | null) => (v ? new Date(v).toLocaleString("es-ES", { timeZone: "Europe/Madrid" }) : "—");
const LINK_LABEL: Record<string, string> = { pending: "Pendiente", auto: "Propuesta automática", confirmed: "Confirmada", ignored: "Ignorada" };

function SyncAdmin() {
  const [st, setSt] = useState<St | null>(null);
  const [links, setLinks] = useState<Link[]>([]);
  const [sched, setSched] = useState<Sched[]>([]);
  const [busy, setBusy] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const run = useServerFn(syncResultsNow);

  const load = useCallback(async () => {
    const { data: s } = await supabase.from("results_sync_state").select("*").eq("key", KEY).maybeSingle();
    setSt(s);
    const { data: l } = await supabase.from("asu26_results_links").select("*").eq("sync_key", KEY).order("competition_date");
    setLinks((l as Link[]) ?? []);
    if (s?.target_result_event_id) {
      const { data: si } = await supabase.from("schedule_items").select("id,event_name,phase,category,scheduled_at").eq("result_event_id", s.target_result_event_id).order("scheduled_at");
      setSched((si as Sched[]) ?? []);
    }
    const { data: u } = await supabase.auth.getUser();
    if (u.user) {
      const { data: a } = await supabase.rpc("has_role", { _user_id: u.user.id, _role: "admin" });
      setIsAdmin(!!a);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const control = async (action: string, value?: string) => {
    if (action === "reactivate" && !confirm("¿Autorizas reactivar las consultas a la web oficial de ASU26?")) return;
    setBusy(true);
    const { error } = await supabase.rpc("results_sync_control", { _key: KEY, _action: action, _value: value });
    setBusy(false);
    if (error) toast.error("No se pudo aplicar el cambio");
    else toast.success("Cambio aplicado");
    load();
  };

  const syncNow = async () => {
    setBusy(true);
    try {
      const r: any = await run({ data: { key: KEY } });
      if (r.ok && r.skipped) toast.message(r.skipped);
      else if (r.ok) toast.success(`Sincronizado: ${r.rows ?? 0} filas (${r.inserted ?? 0} nuevas)`);
      else toast.error(r.halted ? `Detenida: ${r.error}` : r.error);
    } catch {
      toast.error("No se pudo sincronizar");
    }
    setBusy(false);
    load();
  };

  const saveLink = async (l: Link, patch: Partial<Link>) => {
    const { error } = await supabase.from("asu26_results_links").update(patch).eq("sync_key", KEY).eq("source_competition_id", l.source_competition_id);
    if (error) toast.error("No se pudo guardar");
    load();
  };

  const blocked = st?.emergency_stop || st?.halted;
  const btn = "font-condensed inline-flex min-h-10 items-center border px-3 text-[11px] font-bold uppercase tracking-widest disabled:opacity-50";

  return (
    <div>
      <ResultadosHubTabs active="sync" />
      {!st ? (
        <p className="text-sm text-muted-foreground">Cargando…</p>
      ) : (
        <>
          <section className={"border p-4 " + (blocked ? "border-destructive bg-destructive/10" : "border-border bg-surface")}>
            <h2 className="font-display text-lg uppercase tracking-widest text-gold">{st.label}</h2>
            <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
              <Item k="Estado" v={st.emergency_stop ? "BLOQUEO DE EMERGENCIA" : st.halted ? "DETENIDA" : st.enabled ? "Automática activa" : "Automática desactivada"} />
              <Item k="Último intento" v={fmt(st.last_attempt_at)} />
              <Item k="Última sincronización correcta" v={fmt(st.last_success_at)} />
              <Item k="Filas en la última pasada" v={st.last_rows ?? "—"} />
              <Item k="Errores seguidos" v={`${st.consecutive_failures} / 5`} />
              <Item k="Jornadas activas" v={`${st.active_from} → ${st.active_to} (hora PY)`} />
              {st.halt_reason && <Item k="Motivo de la parada" v={`${st.halt_reason} · ${fmt(st.halted_at)}`} />}
              {st.last_error && <Item k="Último error" v={st.last_error} />}
              {st.reactivated_at && <Item k="Última reactivación" v={fmt(st.reactivated_at)} />}
            </dl>
            {isAdmin ? (
              <div className="mt-4 flex flex-wrap gap-2">
                <button disabled={busy || blocked} onClick={syncNow} className={btn + " border-gold text-gold"}>Sincronizar ahora</button>
                <button disabled={busy} onClick={() => control("set_enabled", st.enabled ? "false" : "true")} className={btn + " border-border"}>
                  {st.enabled ? "Desactivar automática" : "Activar automática"}
                </button>
                {!st.emergency_stop && (
                  <button disabled={busy} onClick={() => control("emergency_on")} className={btn + " border-destructive bg-destructive text-destructive-foreground"}>
                    Interruptor de emergencia
                  </button>
                )}
                {blocked && (
                  <button disabled={busy} onClick={() => control("reactivate")} className={btn + " border-gold bg-gold text-background"}>Reactivar (autorizar)</button>
                )}
              </div>
            ) : (
              <p className="mt-3 text-xs text-muted-foreground">Solo los administradores pueden sincronizar, bloquear o reactivar.</p>
            )}
            {isAdmin && (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="text-xs">
                  <span className="font-condensed uppercase tracking-widest text-muted-foreground">Prioridad por defecto</span>
                  <select value={st.default_priority} onChange={(e) => control("set_priority", e.target.value)} className="mt-1 block w-full border border-border bg-background p-2 text-sm">
                    <option value="official">Oficiales sobre manuales</option>
                    <option value="manual">Manuales sobre oficiales</option>
                  </select>
                </label>
                <label className="text-xs">
                  <span className="font-condensed uppercase tracking-widest text-muted-foreground">Fuera de jornada</span>
                  <select value={st.off_window_mode} onChange={(e) => control("set_off_window", e.target.value)} className="mt-1 block w-full border border-border bg-background p-2 text-sm">
                    <option value="paused">En pausa</option>
                    <option value="every6h">Una vez cada 6 horas</option>
                  </select>
                </label>
              </div>
            )}
          </section>

          <section className="mt-6 border border-border bg-surface">
            <div className="border-b border-border px-4 py-3 font-display text-sm uppercase tracking-widest text-gold">Equivalencias con el calendario</div>
            {links.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">Aparecerán tras la primera sincronización.</p>
            ) : (
              <ul className="divide-y divide-border">
                {links.map((l) => (
                  <li key={l.source_competition_id} className="grid gap-2 p-3 text-sm lg:grid-cols-[1fr_1.4fr_auto]">
                    <div className="min-w-0">
                      <div className="font-semibold">{l.label || l.source_competition_id}</div>
                      <div className="text-xs text-muted-foreground">{l.competition_date} · fuente: {l.source_state ?? "—"} · {LINK_LABEL[l.link_status]}</div>
                    </div>
                    <select
                      value={l.schedule_item_id ?? ""}
                      onChange={(e) => saveLink(l, { schedule_item_id: e.target.value || null, link_status: e.target.value ? "confirmed" : "pending" })}
                      className="min-w-0 border border-border bg-background p-2 text-xs"
                    >
                      <option value="">— Sin vincular —</option>
                      {sched.map((x) => (
                        <option key={x.id} value={x.id}>
                          {[x.scheduled_at ? new Date(x.scheduled_at).toLocaleString("es-ES", { timeZone: "America/Asuncion", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "", x.event_name, x.phase, x.category].filter(Boolean).join(" · ")}
                        </option>
                      ))}
                    </select>
                    <div className="flex flex-wrap gap-1">
                      {l.link_status === "auto" && <button onClick={() => saveLink(l, { link_status: "confirmed" })} className={btn + " border-gold text-gold"}>Confirmar</button>}
                      <button onClick={() => saveLink(l, { link_status: l.link_status === "ignored" ? "pending" : "ignored" })} className={btn + " border-border"}>
                        {l.link_status === "ignored" ? "Recuperar" : "Ignorar"}
                      </button>
                      <select value={l.priority ?? ""} onChange={(e) => saveLink(l, { priority: e.target.value || null })} className="border border-border bg-background p-1 text-xs">
                        <option value="">Prioridad por defecto</option>
                        <option value="official">Oficial</option>
                        <option value="manual">Manual</option>
                      </select>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <p className="border-t border-border p-3 text-xs text-muted-foreground">
              Solo se publican los resultados de competiciones con equivalencia confirmada o propuesta automática. Los cambios se aplican en la siguiente sincronización.
            </p>
          </section>
        </>
      )}
    </div>
  );
}

function Item({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="font-condensed text-[10px] uppercase tracking-widest text-muted-foreground">{k}</dt>
      <dd className="break-words">{v}</dd>
    </div>
  );
}
