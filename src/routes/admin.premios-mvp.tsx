import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Trash2, X, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import { ImageUploadField } from "@/components/admin/ImageUploadField";

type Season = { id: string; year: number; label: string; is_current: boolean };
type AwardRow = {
  id: string;
  season_id: string;
  tier: "elite" | "estrella" | "promesa";
  gender: "masculino" | "femenino";
  position: number;
  full_name: string;
  photo_url: string | null;
  club: string | null;
  region: string | null;
  category_age: string | null;
  merit: string | null;
  published: boolean;
};

const TIERS = ["elite", "estrella", "promesa"] as const;
const GENDERS = ["masculino", "femenino"] as const;
const TIER_LABEL: Record<string, string> = { elite: "Élite", estrella: "Estrella", promesa: "Promesa" };

const awardSchema = z.object({
  season_id: z.string().uuid(),
  tier: z.enum(TIERS),
  gender: z.enum(GENDERS),
  position: z.literal(1),
  full_name: z.string().trim().min(2).max(160),
  photo_url: z.string().trim().url().optional().or(z.literal("")),
  club: z.string().trim().max(120).optional().or(z.literal("")),
  region: z.string().trim().max(120).optional().or(z.literal("")),
  category_age: z.string().trim().max(60).optional().or(z.literal("")),
  merit: z.string().trim().max(500).optional().or(z.literal("")),
  published: z.boolean(),
});

const seasonSchema = z.object({
  year: z.coerce.number().int().min(1900).max(2100),
  label: z.string().trim().min(2).max(60),
  is_current: z.boolean(),
});

export const Route = createFileRoute("/admin/premios-mvp")({
  head: () => ({ meta: [{ title: "Admin · Premios MVP" }, { name: "robots", content: "noindex" }] }),
  component: AdminPremiosMvp,
});

function AdminPremiosMvp() {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [awards, setAwards] = useState<AwardRow[]>([]);
  const [activeSeasonId, setActiveSeasonId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<AwardRow | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showSeasonForm, setShowSeasonForm] = useState(false);
  const [editingSeason, setEditingSeason] = useState<Season | null>(null);

  const load = async () => {
    setLoading(true);
    const [s, a] = await Promise.all([
      supabase.from("mvp_seasons").select("*").order("year", { ascending: false }),
      supabase.from("mvp_awards").select("*").order("position", { ascending: true }),
    ]);
    const seasonsData = (s.data as Season[]) ?? [];
    setSeasons(seasonsData);
    setAwards((a.data as AwardRow[]) ?? []);
    if (!activeSeasonId && seasonsData.length > 0) {
      setActiveSeasonId(seasonsData.find((x) => x.is_current)?.id ?? seasonsData[0].id);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filteredAwards = useMemo(
    () => awards.filter((a) => a.season_id === activeSeasonId),
    [awards, activeSeasonId]
  );

  const removeAward = async (id: string) => {
    if (!confirm("¿Eliminar este premio?")) return;
    const { error } = await supabase.from("mvp_awards").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Premio eliminado");
    load();
  };

  const removeSeason = async (id: string) => {
    if (!confirm("¿Eliminar esta temporada y todos sus premios?")) return;
    const { error } = await supabase.from("mvp_seasons").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Temporada eliminada");
    if (activeSeasonId === id) setActiveSeasonId("");
    load();
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <h1 className="font-display text-2xl tracking-widest">Premios MVP</h1>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => { setEditingSeason(null); setShowSeasonForm(true); }}
            className="font-condensed inline-flex items-center gap-1.5 border border-border px-3 py-2 text-xs font-bold uppercase tracking-widest text-foreground/80 hover:border-gold hover:text-gold"
          >
            <Plus className="h-3.5 w-3.5" /> Temporada
          </button>
          <button
            disabled={!activeSeasonId}
            onClick={() => { setEditing(null); setShowForm(true); }}
            className="font-condensed inline-flex items-center gap-1.5 bg-gold px-3 py-2 text-xs font-bold uppercase tracking-widest text-background hover:bg-gold-dark disabled:opacity-50"
          >
            <Plus className="h-3.5 w-3.5" /> Premio
          </button>
        </div>
      </div>

      {/* Seasons strip */}
      <div className="space-y-2">
        <h2 className="font-condensed text-xs uppercase tracking-widest text-muted-foreground">Temporadas</h2>
        {seasons.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aún no hay temporadas. Crea la primera para empezar.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {seasons.map((s) => (
              <div key={s.id} className={`group flex items-center gap-2 border px-3 py-2 ${s.id === activeSeasonId ? "border-gold bg-gold/10" : "border-border bg-surface"}`}>
                <button
                  onClick={() => setActiveSeasonId(s.id)}
                  className="font-condensed flex items-center gap-1.5 text-xs uppercase tracking-widest"
                >
                  {s.is_current && <Star className="h-3 w-3 fill-gold text-gold" />}
                  <span className={s.id === activeSeasonId ? "text-gold" : "text-foreground/80"}>{s.label}</span>
                </button>
                <button onClick={() => { setEditingSeason(s); setShowSeasonForm(true); }} className="text-muted-foreground hover:text-gold" aria-label="Editar">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => removeSeason(s.id)} className="text-muted-foreground hover:text-destructive" aria-label="Eliminar">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Awards grid by tier × gender */}
      {activeSeasonId && (
        <div className="space-y-8">
          {TIERS.map((tier) => (
            <div key={tier}>
              <h3 className="font-display mb-3 text-lg tracking-widest text-gold">{TIER_LABEL[tier]}</h3>
              <div className="grid gap-4 lg:grid-cols-2">
                {GENDERS.map((gender) => {
                  const a = filteredAwards.find((x) => x.tier === tier && x.gender === gender && x.position === 1);
                  return (
                    <div key={gender} className="border border-border bg-surface p-4">
                      <div className="font-condensed mb-3 text-xs uppercase tracking-widest text-muted-foreground">{gender}</div>
                      {a ? (
                        <button
                          onClick={() => { setEditing(a); setShowForm(true); }}
                          className="group flex w-full items-center gap-3 border border-border bg-background p-3 text-left hover:border-gold"
                        >
                          <div className="h-20 w-20 shrink-0 overflow-hidden border border-border bg-surface">
                            {a.photo_url ? (
                              <img src={a.photo_url} alt={a.full_name} className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground">Sin foto</div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-display text-sm tracking-wider text-foreground">{a.full_name}</div>
                            {a.club && <div className="font-condensed mt-0.5 text-[11px] uppercase tracking-widest text-gold">{a.club}</div>}
                            {(a.region || a.category_age) && (
                              <div className="font-condensed mt-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                                {[a.region, a.category_age].filter(Boolean).join(" · ")}
                              </div>
                            )}
                            {!a.published && (
                              <span className="font-condensed mt-1 inline-block border border-border px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-muted-foreground">Borrador</span>
                            )}
                          </div>
                          <Pencil className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-gold" />
                        </button>
                      ) : (
                        <button
                          onClick={() => { setEditing({ id: "", season_id: activeSeasonId, tier, gender, position: 1, full_name: "", photo_url: null, club: null, region: null, category_age: null, merit: null, published: true }); setShowForm(true); }}
                          className="flex h-24 w-full flex-col items-center justify-center gap-1 border border-dashed border-border bg-background text-muted-foreground hover:border-gold hover:text-gold"
                        >
                          <Plus className="h-5 w-5" />
                          <span className="font-condensed text-[10px] uppercase tracking-widest">Asignar MVP</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {loading && <p className="text-sm text-muted-foreground">Cargando…</p>}

      {showForm && activeSeasonId && (
        <AwardForm
          initial={editing}
          seasonId={activeSeasonId}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSaved={() => { setShowForm(false); setEditing(null); load(); }}
        />
      )}
      {showSeasonForm && (
        <SeasonForm
          initial={editingSeason}
          onClose={() => { setShowSeasonForm(false); setEditingSeason(null); }}
          onSaved={() => { setShowSeasonForm(false); setEditingSeason(null); load(); }}
        />
      )}
    </div>
  );
}

function AwardForm({ initial, seasonId, onClose, onSaved }: { initial: AwardRow | null; seasonId: string; onClose: () => void; onSaved: () => void }) {
  const isEdit = !!initial?.id;
  const [tier, setTier] = useState<AwardRow["tier"]>(initial?.tier ?? "elite");
  const [gender, setGender] = useState<AwardRow["gender"]>(initial?.gender ?? "masculino");
  const [fullName, setFullName] = useState(initial?.full_name ?? "");
  const [photoUrl, setPhotoUrl] = useState(initial?.photo_url ?? "");
  const [club, setClub] = useState(initial?.club ?? "");
  const [region, setRegion] = useState(initial?.region ?? "");
  const [categoryAge, setCategoryAge] = useState(initial?.category_age ?? "");
  const [merit, setMerit] = useState(initial?.merit ?? "");
  const [published, setPublished] = useState(initial?.published ?? true);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const parsed = awardSchema.safeParse({
      season_id: seasonId, tier, gender, position: 1, full_name: fullName,
      photo_url: photoUrl, club, region, category_age: categoryAge, merit, published,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Datos inválidos");
      return;
    }
    setSaving(true);
    const payload = {
      season_id: seasonId,
      tier,
      gender,
      position: 1,
      full_name: fullName.trim(),
      photo_url: photoUrl.trim() || null,
      club: club.trim() || null,
      region: region.trim() || null,
      category_age: categoryAge.trim() || null,
      merit: merit.trim() || null,
      published,
    };
    const res = isEdit
      ? await supabase.from("mvp_awards").update(payload).eq("id", initial!.id)
      : await supabase.from("mvp_awards").insert(payload);
    setSaving(false);
    if (res.error) {
      if (res.error.code === "23505") {
        toast.error("Ya existe un premio en esa categoría/género/posición para esta temporada");
      } else {
        toast.error(res.error.message);
      }
      return;
    }
    toast.success(isEdit ? "Premio actualizado" : "Premio creado");
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur">
      <div className="relative my-8 w-full max-w-3xl border border-border bg-background p-6">
        <button onClick={onClose} className="absolute right-3 top-3 text-muted-foreground hover:text-foreground" aria-label="Cerrar">
          <X className="h-5 w-5" />
        </button>
        <h2 className="font-display mb-5 text-xl tracking-widest text-gold">
          {isEdit ? "Editar premio" : "Nuevo premio"}
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Categoría">
            <select value={tier} onChange={(e) => setTier(e.target.value as AwardRow["tier"])} className="input">
              {TIERS.map((t) => <option key={t} value={t}>{TIER_LABEL[t]}</option>)}
            </select>
          </Field>
          <Field label="Género">
            <select value={gender} onChange={(e) => setGender(e.target.value as AwardRow["gender"])} className="input">
              {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </Field>
          <Field label="Estado">
            <label className="flex h-9 items-center gap-2 text-sm">
              <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} />
              Publicado
            </label>
          </Field>
          <Field label="Nombre completo *" full>
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="input" placeholder="Ana García López" />
          </Field>
          <Field label="Club">
            <input value={club} onChange={(e) => setClub(e.target.value)} className="input" placeholder="CPV Madrid" />
          </Field>
          <Field label="Región">
            <input value={region} onChange={(e) => setRegion(e.target.value)} className="input" placeholder="Madrid" />
          </Field>
          <Field label="Categoría / Edad">
            <input value={categoryAge} onChange={(e) => setCategoryAge(e.target.value)} className="input" placeholder="Senior · 22 años" />
          </Field>
          <Field label="Foto" full>
            <ImageUploadField value={photoUrl} onChange={setPhotoUrl} folder="mvp" nameHint={fullName} />
          </Field>
          <Field label="Mérito / Motivo del premio" full>
            <textarea value={merit} onChange={(e) => setMerit(e.target.value)} rows={3} className="input" placeholder="Campeón nacional 500m y récord histórico…" />
          </Field>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose} className="font-condensed border border-border px-4 py-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground">
            Cancelar
          </button>
          <button onClick={save} disabled={saving} className="font-condensed bg-gold px-5 py-2 text-xs font-bold uppercase tracking-widest text-background hover:bg-gold-dark disabled:opacity-50">
            {saving ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}

function SeasonForm({ initial, onClose, onSaved }: { initial: Season | null; onClose: () => void; onSaved: () => void }) {
  const isEdit = !!initial;
  const [year, setYear] = useState<number>(initial?.year ?? new Date().getFullYear());
  const [label, setLabel] = useState(initial?.label ?? `Temporada ${new Date().getFullYear()}`);
  const [isCurrent, setIsCurrent] = useState(initial?.is_current ?? false);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const parsed = seasonSchema.safeParse({ year, label, is_current: isCurrent });
    if (!parsed.success) return toast.error(parsed.error.issues[0]?.message ?? "Datos inválidos");
    setSaving(true);
    const payload = { year, label: label.trim(), is_current: isCurrent };
    const res = isEdit
      ? await supabase.from("mvp_seasons").update(payload).eq("id", initial!.id)
      : await supabase.from("mvp_seasons").insert(payload);
    setSaving(false);
    if (res.error) {
      if (res.error.code === "23505") toast.error("Ya existe una temporada con ese año");
      else toast.error(res.error.message);
      return;
    }
    toast.success(isEdit ? "Temporada actualizada" : "Temporada creada");
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 backdrop-blur">
      <div className="relative my-12 w-full max-w-md border border-border bg-background p-6">
        <button onClick={onClose} className="absolute right-3 top-3 text-muted-foreground hover:text-foreground" aria-label="Cerrar">
          <X className="h-5 w-5" />
        </button>
        <h2 className="font-display mb-5 text-xl tracking-widest text-gold">
          {isEdit ? "Editar temporada" : "Nueva temporada"}
        </h2>
        <div className="space-y-4">
          <Field label="Año *">
            <input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} className="input" />
          </Field>
          <Field label="Etiqueta *">
            <input value={label} onChange={(e) => setLabel(e.target.value)} className="input" placeholder="Temporada 2025" />
          </Field>
          <Field label="Temporada actual">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={isCurrent} onChange={(e) => setIsCurrent(e.target.checked)} />
              Mostrar como actual en la web pública
            </label>
          </Field>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose} className="font-condensed border border-border px-4 py-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground">Cancelar</button>
          <button onClick={save} disabled={saving} className="font-condensed bg-gold px-5 py-2 text-xs font-bold uppercase tracking-widest text-background hover:bg-gold-dark disabled:opacity-50">
            {saving ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={full ? "md:col-span-2" : ""}>
      <label className="font-condensed mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}
