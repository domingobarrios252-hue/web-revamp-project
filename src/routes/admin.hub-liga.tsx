import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Save, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { LeagueSeason, LeagueRound, LeagueStanding } from "@/lib/hub/useLeague";

export const Route = createFileRoute("/admin/hub-liga")({
  head: () => ({ meta: [{ title: "Admin · Hub Liga Nacional" }, { name: "robots", content: "noindex" }] }),
  component: AdminHubLiga,
});

const STATUS_OPTIONS = [
  { value: "upcoming", label: "Próximo" },
  { value: "live", label: "En directo" },
  { value: "finished", label: "Finalizado" },
];

function AdminHubLiga() {
  const [country, setCountry] = useState("es");
  const [seasons, setSeasons] = useState<LeagueSeason[]>([]);
  const [activeSeasonId, setActiveSeasonId] = useState<string | null>(null);
  const [rounds, setRounds] = useState<LeagueRound[]>([]);
  const [standings, setStandings] = useState<LeagueStanding[]>([]);
  const [tab, setTab] = useState<"rounds" | "standings">("rounds");

  const loadSeasons = async () => {
    const { data } = await (supabase as any)
      .from("league_seasons").select("*").eq("country_code", country)
      .order("sort_order", { ascending: false });
    const arr = (data as LeagueSeason[]) ?? [];
    setSeasons(arr);
    if (!activeSeasonId && arr.length) setActiveSeasonId(arr.find(s => s.is_current)?.id ?? arr[0].id);
  };

  const loadRounds = async (sid: string) => {
    const { data } = await (supabase as any).from("league_rounds").select("*").eq("season_id", sid).order("round_number");
    setRounds((data as LeagueRound[]) ?? []);
  };
  const loadStandings = async (sid: string) => {
    const { data } = await (supabase as any).from("league_standings").select("*").eq("season_id", sid).order("category").order("gender").order("position");
    setStandings((data as LeagueStanding[]) ?? []);
  };

  useEffect(() => { loadSeasons(); /* eslint-disable-next-line */ }, [country]);
  useEffect(() => {
    if (activeSeasonId) { loadRounds(activeSeasonId); loadStandings(activeSeasonId); }
  }, [activeSeasonId]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl tracking-widest">Hub Liga Nacional</h1>
        <p className="text-sm text-muted-foreground">
          Gestiona temporadas, jornadas y clasificaciones del Hub <code className="text-gold">/hub/{country}/competicion/liga-nacional</code>.
        </p>
      </header>

      <div className="flex flex-wrap gap-3 items-center border border-border bg-surface p-3">
        <label className="text-xs uppercase tracking-widest text-muted-foreground">País</label>
        <input
          value={country}
          onChange={(e) => { setCountry(e.target.value.toLowerCase()); setActiveSeasonId(null); }}
          className="input w-20 uppercase"
          maxLength={3}
        />
        <Link to="/hub/$country/competicion/liga-nacional" params={{ country }} target="_blank"
          className="text-xs text-gold hover:underline">Ver Hub →</Link>
      </div>

      <SeasonsAdmin country={country} seasons={seasons} active={activeSeasonId} onSelect={setActiveSeasonId} onChange={loadSeasons} />

      {activeSeasonId && (
        <>
          <div className="flex gap-2 border-b border-border">
            <TabBtn active={tab === "rounds"} onClick={() => setTab("rounds")}>Jornadas ({rounds.length})</TabBtn>
            <TabBtn active={tab === "standings"} onClick={() => setTab("standings")}>Clasificaciones ({standings.length})</TabBtn>
          </div>
          {tab === "rounds" ? (
            <RoundsAdmin seasonId={activeSeasonId} rounds={rounds} onChange={() => loadRounds(activeSeasonId)} />
          ) : (
            <StandingsAdmin seasonId={activeSeasonId} standings={standings} onChange={() => loadStandings(activeSeasonId)} />
          )}
        </>
      )}
    </div>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={`px-4 py-2 text-xs font-bold uppercase tracking-widest ${active ? "bg-gold text-background" : "text-muted-foreground hover:text-foreground"}`}>
      {children}
    </button>
  );
}

/* ---------- SEASONS ---------- */
function SeasonsAdmin({ country, seasons, active, onSelect, onChange }: {
  country: string; seasons: LeagueSeason[]; active: string | null;
  onSelect: (id: string) => void; onChange: () => void;
}) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [yearLabel, setYearLabel] = useState("");

  const create = async () => {
    if (!name || !slug) return toast.error("Nombre y slug obligatorios");
    const { error } = await (supabase as any).from("league_seasons").insert({
      country_code: country, name, slug, year_label: yearLabel || null,
    });
    if (error) return toast.error(error.message);
    toast.success("Temporada creada"); setName(""); setSlug(""); setYearLabel(""); onChange();
  };
  const remove = async (id: string) => {
    if (!confirm("¿Eliminar temporada y todo su contenido?")) return;
    const { error } = await (supabase as any).from("league_seasons").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Eliminada"); onChange();
  };
  const setCurrent = async (id: string) => {
    await (supabase as any).from("league_seasons").update({ is_current: false }).eq("country_code", country);
    const { error } = await (supabase as any).from("league_seasons").update({ is_current: true }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Marcada como actual"); onChange();
  };

  return (
    <section className="border border-border bg-surface p-4">
      <h2 className="font-display text-lg uppercase tracking-widest text-gold mb-3">Temporadas</h2>
      <div className="grid gap-2 mb-4">
        {seasons.map((s) => (
          <div key={s.id} className={`flex items-center gap-2 border px-3 py-2 ${active === s.id ? "border-gold bg-background" : "border-border"}`}>
            <button onClick={() => onSelect(s.id)} className="flex-1 text-left">
              <div className="text-sm font-bold">{s.name} {s.is_current && <span className="ml-2 text-[10px] text-gold">ACTUAL</span>}</div>
              <div className="text-[10px] text-muted-foreground">{s.year_label} · {s.slug}</div>
            </button>
            {!s.is_current && (
              <button onClick={() => setCurrent(s.id)} className="text-[10px] uppercase tracking-widest text-gold hover:underline">
                Marcar actual
              </button>
            )}
            <button onClick={() => remove(s.id)} className="text-tv-red hover:opacity-70"><Trash2 className="h-4 w-4" /></button>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2 border-t border-border pt-3">
        <input className="input" placeholder="Nombre (Temporada 2026/27)" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="input" placeholder="Slug (2026-27)" value={slug} onChange={(e) => setSlug(e.target.value)} />
        <input className="input" placeholder="Año (2026/27)" value={yearLabel} onChange={(e) => setYearLabel(e.target.value)} />
        <button onClick={create} className="inline-flex items-center justify-center gap-2 bg-gold text-background px-4 py-2 text-xs font-bold uppercase tracking-widest">
          <Plus className="h-4 w-4" /> Crear
        </button>
      </div>
    </section>
  );
}

/* ---------- ROUNDS ---------- */
const emptyRound = {
  round_number: 1, name: "", event_date: "", city: "", venue: "",
  map_url: "", poster_url: "", status: "upcoming" as const,
  pdf_url: "", video_url: "", published: true,
};

function RoundsAdmin({ seasonId, rounds, onChange }: { seasonId: string; rounds: LeagueRound[]; onChange: () => void }) {
  const [draft, setDraft] = useState<any>({ ...emptyRound });
  const [editingId, setEditingId] = useState<string | null>(null);

  const save = async () => {
    if (!draft.name) return toast.error("Nombre obligatorio");
    const payload = {
      season_id: seasonId,
      round_number: Number(draft.round_number) || 1,
      name: draft.name,
      event_date: draft.event_date || null,
      city: draft.city || null, venue: draft.venue || null,
      map_url: draft.map_url || null, poster_url: draft.poster_url || null,
      status: draft.status, pdf_url: draft.pdf_url || null,
      video_url: draft.video_url || null, published: !!draft.published,
    };
    const { error } = editingId
      ? await (supabase as any).from("league_rounds").update(payload).eq("id", editingId)
      : await (supabase as any).from("league_rounds").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Guardada"); setDraft({ ...emptyRound, round_number: rounds.length + 1 }); setEditingId(null); onChange();
  };
  const edit = (r: LeagueRound) => { setEditingId(r.id); setDraft({ ...r, event_date: r.event_date ?? "" }); };
  const remove = async (id: string) => {
    if (!confirm("¿Eliminar jornada?")) return;
    const { error } = await (supabase as any).from("league_rounds").delete().eq("id", id);
    if (error) return toast.error(error.message);
    onChange();
  };

  return (
    <section className="border border-border bg-surface p-4 space-y-4">
      <h3 className="font-display text-lg uppercase tracking-widest text-gold">{editingId ? "Editar jornada" : "Nueva jornada"}</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <input className="input" type="number" placeholder="Nº" value={draft.round_number} onChange={(e) => setDraft({ ...draft, round_number: e.target.value })} />
        <input className="input md:col-span-3" placeholder="Nombre" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
        <input className="input" type="date" value={draft.event_date} onChange={(e) => setDraft({ ...draft, event_date: e.target.value })} />
        <input className="input" placeholder="Ciudad" value={draft.city} onChange={(e) => setDraft({ ...draft, city: e.target.value })} />
        <input className="input" placeholder="Sede" value={draft.venue} onChange={(e) => setDraft({ ...draft, venue: e.target.value })} />
        <select className="input" value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value })}>
          {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <input className="input md:col-span-2" placeholder="Mapa URL" value={draft.map_url} onChange={(e) => setDraft({ ...draft, map_url: e.target.value })} />
        <input className="input md:col-span-2" placeholder="Cartel URL" value={draft.poster_url} onChange={(e) => setDraft({ ...draft, poster_url: e.target.value })} />
        <input className="input md:col-span-2" placeholder="PDF resultados URL" value={draft.pdf_url} onChange={(e) => setDraft({ ...draft, pdf_url: e.target.value })} />
        <input className="input md:col-span-2" placeholder="Vídeo URL" value={draft.video_url} onChange={(e) => setDraft({ ...draft, video_url: e.target.value })} />
      </div>
      <div className="flex gap-2">
        <button onClick={save} className="inline-flex items-center gap-2 bg-gold text-background px-5 py-2 text-xs font-bold uppercase tracking-widest">
          <Save className="h-4 w-4" /> Guardar
        </button>
        {editingId && <button onClick={() => { setEditingId(null); setDraft({ ...emptyRound }); }} className="border border-border px-5 py-2 text-xs font-bold uppercase tracking-widest">Cancelar</button>}
      </div>

      <div className="border-t border-border pt-4">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-[10px] uppercase tracking-widest text-muted-foreground border-b border-border">
            <th className="py-2">#</th><th>Nombre</th><th>Fecha</th><th>Sede</th><th>Estado</th><th></th>
          </tr></thead>
          <tbody>
            {rounds.map((r) => (
              <tr key={r.id} className="border-b border-border/50">
                <td className="py-2 text-gold font-bold">{r.round_number}</td>
                <td>{r.name}</td>
                <td className="text-muted-foreground">{r.event_date ?? "—"}</td>
                <td className="text-muted-foreground">{[r.city, r.venue].filter(Boolean).join(" · ")}</td>
                <td><span className="text-[10px] uppercase tracking-widest text-gold">{r.status}</span></td>
                <td className="text-right">
                  <button onClick={() => edit(r)} className="text-[10px] uppercase text-gold hover:underline mr-3">Editar</button>
                  <button onClick={() => remove(r.id)} className="text-tv-red hover:opacity-70"><Trash2 className="h-4 w-4 inline" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/* ---------- STANDINGS ---------- */
const emptyStanding = {
  category: "Senior", gender: "M", group_name: "",
  position: 1, club: "", athlete_name: "",
  points: 0, rounds_played: 0, wins: 0, podiums: 0, point_diff: 0, published: true,
};

function StandingsAdmin({ seasonId, standings, onChange }: { seasonId: string; standings: LeagueStanding[]; onChange: () => void }) {
  const [draft, setDraft] = useState<any>({ ...emptyStanding });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string>("Senior-M");

  const save = async () => {
    if (!draft.club && !draft.athlete_name) return toast.error("Club o atleta obligatorio");
    const payload = {
      season_id: seasonId,
      category: draft.category || null, gender: draft.gender || null, group_name: draft.group_name || null,
      position: Number(draft.position) || 0,
      club: draft.club || null, athlete_name: draft.athlete_name || null,
      points: Number(draft.points) || 0,
      rounds_played: Number(draft.rounds_played) || 0,
      wins: Number(draft.wins) || 0, podiums: Number(draft.podiums) || 0,
      point_diff: draft.point_diff === "" ? null : Number(draft.point_diff),
      published: !!draft.published,
    };
    const { error } = editingId
      ? await (supabase as any).from("league_standings").update(payload).eq("id", editingId)
      : await (supabase as any).from("league_standings").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Guardado"); setDraft({ ...emptyStanding }); setEditingId(null); onChange();
  };
  const edit = (s: LeagueStanding) => { setEditingId(s.id); setDraft({ ...s, point_diff: s.point_diff ?? 0 }); };
  const remove = async (id: string) => {
    if (!confirm("¿Eliminar fila?")) return;
    const { error } = await (supabase as any).from("league_standings").delete().eq("id", id);
    if (error) return toast.error(error.message);
    onChange();
  };

  const groups: Record<string, LeagueStanding[]> = {};
  for (const s of standings) {
    const k = `${s.category ?? "—"}-${s.gender ?? "—"}`;
    (groups[k] ??= []).push(s);
  }

  return (
    <section className="border border-border bg-surface p-4 space-y-4">
      <h3 className="font-display text-lg uppercase tracking-widest text-gold">
        {editingId ? "Editar fila" : "Añadir fila de clasificación"}
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
        <input className="input" placeholder="Categoría" value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} />
        <select className="input" value={draft.gender} onChange={(e) => setDraft({ ...draft, gender: e.target.value })}>
          <option value="M">M</option><option value="F">F</option><option value="Mixto">Mixto</option>
        </select>
        <input className="input" placeholder="Grupo" value={draft.group_name} onChange={(e) => setDraft({ ...draft, group_name: e.target.value })} />
        <input className="input" type="number" placeholder="Pos" value={draft.position} onChange={(e) => setDraft({ ...draft, position: e.target.value })} />
        <input className="input md:col-span-2" placeholder="Club" value={draft.club} onChange={(e) => setDraft({ ...draft, club: e.target.value })} />
        <input className="input md:col-span-2" placeholder="Atleta (opcional)" value={draft.athlete_name} onChange={(e) => setDraft({ ...draft, athlete_name: e.target.value })} />
        <input className="input" type="number" step="0.5" placeholder="Pts" value={draft.points} onChange={(e) => setDraft({ ...draft, points: e.target.value })} />
        <input className="input" type="number" placeholder="J" value={draft.rounds_played} onChange={(e) => setDraft({ ...draft, rounds_played: e.target.value })} />
        <input className="input" type="number" placeholder="V" value={draft.wins} onChange={(e) => setDraft({ ...draft, wins: e.target.value })} />
        <input className="input" type="number" placeholder="Pod" value={draft.podiums} onChange={(e) => setDraft({ ...draft, podiums: e.target.value })} />
        <input className="input" type="number" step="0.5" placeholder="Dif" value={draft.point_diff} onChange={(e) => setDraft({ ...draft, point_diff: e.target.value })} />
      </div>
      <div className="flex gap-2">
        <button onClick={save} className="inline-flex items-center gap-2 bg-gold text-background px-5 py-2 text-xs font-bold uppercase tracking-widest">
          <Save className="h-4 w-4" /> Guardar
        </button>
        {editingId && <button onClick={() => { setEditingId(null); setDraft({ ...emptyStanding }); }} className="border border-border px-5 py-2 text-xs font-bold uppercase tracking-widest">Cancelar</button>}
      </div>

      <div className="border-t border-border pt-4 space-y-3">
        {Object.entries(groups).map(([k, rows]) => (
          <div key={k} className="border border-border">
            <button onClick={() => setExpanded(expanded === k ? "" : k)} className="w-full flex items-center justify-between px-3 py-2 bg-background text-left">
              <span className="text-xs uppercase tracking-widest font-bold">{k} <span className="text-muted-foreground">({rows.length})</span></span>
              {expanded === k ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            {expanded === k && (
              <table className="w-full text-sm">
                <tbody>
                  {rows.map((s) => (
                    <tr key={s.id} className="border-t border-border/50">
                      <td className="px-3 py-1.5 w-8 text-gold font-bold">{s.position}</td>
                      <td className="px-3 py-1.5">{s.club ?? s.athlete_name}</td>
                      <td className="px-3 py-1.5 text-right text-gold font-bold">{s.points}</td>
                      <td className="px-3 py-1.5 text-right text-muted-foreground">{s.rounds_played}J · {s.wins}V · {s.podiums}P</td>
                      <td className="px-3 py-1.5 text-right">
                        <button onClick={() => edit(s)} className="text-[10px] uppercase text-gold hover:underline mr-3">Editar</button>
                        <button onClick={() => remove(s.id)} className="text-tv-red hover:opacity-70"><Trash2 className="h-4 w-4 inline" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
