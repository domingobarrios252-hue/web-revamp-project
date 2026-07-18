import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X, Crown, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { GalleryUploadField } from "@/components/admin/GalleryUploadField";

type AchievementCategory =
  | "mundial"
  | "europeo"
  | "nacional"
  | "campeonato-mundial"
  | "premio-individual"
  | "maraton-internacional"
  | "world-inline-cup"
  | "otro";
type Achievement = { year?: number; title: string; description?: string; category?: AchievementCategory };
type ClubStint = { name: string; years?: string };
type Legend = {
  id: string;
  full_name: string;
  nickname: string | null;
  slug: string;
  photo_url: string | null;
  cover_url: string | null;
  country_code: string;
  birth_year: number | null;
  birth_date: string | null;
  birth_place: string | null;
  death_year: number | null;
  induction_year: number | null;
  specialty: string | null;
  club: string | null;
  nationality: string | null;
  national_team: string | null;
  career_years: string | null;
  bio: string | null;
  achievements: Achievement[];
  highlights: string[];
  gallery: string[];
  clubs_history: ClubStint[];
  sort_order: number;
  published: boolean;
};

const CATEGORY_OPTIONS: { value: AchievementCategory; label: string }[] = [
  { value: "campeonato-mundial", label: "Campeonato Mundial" },
  { value: "mundial", label: "Mundial (general)" },
  { value: "europeo", label: "Europeo" },
  { value: "nacional", label: "Nacional" },
  { value: "premio-individual", label: "Premio individual" },
  { value: "maraton-internacional", label: "Maratón internacional" },
  { value: "world-inline-cup", label: "World Inline Cup" },
  { value: "otro", label: "Otro" },
];


const schema = z.object({
  full_name: z.string().trim().min(2).max(120),
  nickname: z.string().trim().max(80).optional(),
  slug: z.string().trim().min(2).max(120).regex(/^[a-z0-9-]+$/, "Solo minúsculas, números y guiones"),
  photo_url: z.string().trim().url().optional().or(z.literal("")),
  cover_url: z.string().trim().url().optional().or(z.literal("")),
  country_code: z.string().trim().min(2).max(2),
  birth_year: z.number().int().min(1900).max(2030).optional(),
  birth_date: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato AAAA-MM-DD").optional().or(z.literal("")),
  birth_place: z.string().trim().max(160).optional(),
  death_year: z.number().int().min(1900).max(2100).optional(),
  induction_year: z.number().int().min(1900).max(2100).optional(),
  specialty: z.string().trim().max(120).optional(),
  club: z.string().trim().max(160).optional(),
  nationality: z.string().trim().max(80).optional(),
  national_team: z.string().trim().max(80).optional(),
  career_years: z.string().trim().max(60).optional(),
  bio: z.string().trim().max(10000).optional(),
  sort_order: z.number().int().min(0).max(9999),
  published: z.boolean(),
});

function slugify(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}

export const Route = createFileRoute("/admin/salon-de-la-fama")({
  head: () => ({ meta: [{ title: "Admin · Salón de la Fama" }, { name: "robots", content: "noindex" }] }),
  component: AdminHallOfFame,
});

function AdminHallOfFame() {
  const [items, setItems] = useState<Legend[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Legend | null>(null);
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("hall_of_fame")
      .select("*")
      .order("sort_order")
      .order("full_name");
    if (error) toast.error(error.message);
    setItems((data as unknown as Legend[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const onDelete = async (id: string) => {
    if (!confirm("¿Eliminar leyenda del Salón de la Fama?")) return;
    const { error } = await supabase.from("hall_of_fame").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Leyenda eliminada");
    load();
  };

  const togglePublished = async (l: Legend) => {
    const { error } = await supabase.from("hall_of_fame").update({ published: !l.published }).eq("id", l.id);
    if (error) return toast.error(error.message);
    load();
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl tracking-widest text-gold flex items-center gap-2">
            <Crown className="h-6 w-6" /> SALÓN DE LA FAMA
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Gestiona las leyendas del patinaje.</p>
        </div>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="font-condensed inline-flex items-center gap-2 rounded border border-gold bg-gold/10 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-gold hover:bg-gold/20"
        >
          <Plus className="h-4 w-4" /> Nueva leyenda
        </button>
      </div>

      {loading ? (
        <div className="text-muted-foreground">Cargando…</div>
      ) : items.length === 0 ? (
        <div className="border border-border bg-surface p-6 text-sm text-muted-foreground">
          Aún no hay leyendas. Crea la primera.
        </div>
      ) : (
        <div className="overflow-x-auto border border-border bg-surface">
          <table className="w-full text-sm">
            <thead className="bg-background text-[11px] uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left">Foto</th>
                <th className="px-3 py-2 text-left">Nombre</th>
                <th className="px-3 py-2 text-left">País</th>
                <th className="px-3 py-2 text-left">Inducción</th>
                <th className="px-3 py-2 text-left">Especialidad</th>
                <th className="px-3 py-2 text-center">Orden</th>
                <th className="px-3 py-2 text-center">Estado</th>
                <th className="px-3 py-2 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.map((l) => (
                <tr key={l.id} className="border-t border-border">
                  <td className="px-3 py-2">
                    {l.photo_url ? (
                      <img src={l.photo_url} alt="" className="h-10 w-10 rounded object-cover" />
                    ) : (
                      <div className="h-10 w-10 rounded bg-background flex items-center justify-center text-gold font-bold">
                        {l.full_name.charAt(0)}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2 font-semibold">{l.full_name}<div className="text-xs text-muted-foreground">/{l.slug}</div></td>
                  <td className="px-3 py-2 uppercase">{l.country_code}</td>
                  <td className="px-3 py-2">{l.induction_year ?? "—"}</td>
                  <td className="px-3 py-2">{l.specialty ?? "—"}</td>
                  <td className="px-3 py-2 text-center">{l.sort_order}</td>
                  <td className="px-3 py-2 text-center">
                    <button onClick={() => togglePublished(l)} title={l.published ? "Publicado" : "Oculto"}>
                      {l.published
                        ? <Eye className="h-4 w-4 text-green-500 inline" />
                        : <EyeOff className="h-4 w-4 text-muted-foreground inline" />}
                    </button>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      onClick={() => { setEditing(l); setShowForm(true); }}
                      className="mr-2 inline-flex items-center gap-1 rounded border border-border px-2 py-1 text-xs hover:bg-background"
                    >
                      <Pencil className="h-3 w-3" /> Editar
                    </button>
                    <button
                      onClick={() => onDelete(l.id)}
                      className="inline-flex items-center gap-1 rounded border border-destructive/40 px-2 py-1 text-xs text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-3 w-3" /> Borrar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <LegendForm
          initial={editing}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSaved={() => { setShowForm(false); setEditing(null); load(); }}
        />
      )}
    </div>
  );
}

function LegendForm({ initial, onClose, onSaved }: {
  initial: Legend | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [full_name, setFullName] = useState(initial?.full_name ?? "");
  const [nickname, setNickname] = useState(initial?.nickname ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [photo_url, setPhoto] = useState(initial?.photo_url ?? "");
  const [cover_url, setCover] = useState(initial?.cover_url ?? "");
  const [country_code, setCountry] = useState(initial?.country_code ?? "es");
  const [birth_year, setBirth] = useState<string>(initial?.birth_year?.toString() ?? "");
  const [birth_date, setBirthDate] = useState<string>(initial?.birth_date ?? "");
  const [birth_place, setBirthPlace] = useState(initial?.birth_place ?? "");
  const [death_year, setDeath] = useState<string>(initial?.death_year?.toString() ?? "");
  const [induction_year, setInduction] = useState<string>(initial?.induction_year?.toString() ?? "");
  const [specialty, setSpecialty] = useState(initial?.specialty ?? "");
  const [club, setClub] = useState(initial?.club ?? "");
  const [nationality, setNationality] = useState(initial?.nationality ?? "");
  const [national_team, setNationalTeam] = useState(initial?.national_team ?? "");
  const [career_years, setCareerYears] = useState(initial?.career_years ?? "");
  const [bio, setBio] = useState(initial?.bio ?? "");
  const [achievements, setAchievements] = useState<Achievement[]>(initial?.achievements ?? []);
  const [highlights, setHighlights] = useState<string[]>(initial?.highlights ?? []);
  const [gallery, setGallery] = useState<string[]>(initial?.gallery ?? []);
  const [clubs_history, setClubsHistory] = useState<ClubStint[]>(initial?.clubs_history ?? []);
  const [sort_order, setSort] = useState<string>(initial?.sort_order?.toString() ?? "0");
  const [published, setPublished] = useState(initial?.published ?? true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!initial && full_name && !slug) setSlug(slugify(full_name));
  }, [full_name, initial, slug]);

  const save = async () => {
    const parsed = schema.safeParse({
      full_name, nickname, slug, photo_url, cover_url, country_code: country_code.toLowerCase(),
      birth_year: birth_year ? Number(birth_year) : undefined,
      birth_date,
      birth_place,
      death_year: death_year ? Number(death_year) : undefined,
      induction_year: induction_year ? Number(induction_year) : undefined,
      specialty, club, nationality, national_team, career_years, bio,
      sort_order: Number(sort_order) || 0,
      published,
    });
    if (!parsed.success) {
      return toast.error(parsed.error.issues[0]?.message ?? "Datos inválidos");
    }
    setSaving(true);
    const payload = {
      ...parsed.data,
      nickname: parsed.data.nickname || null,
      photo_url: parsed.data.photo_url || null,
      cover_url: parsed.data.cover_url || null,
      birth_date: parsed.data.birth_date || null,
      birth_place: parsed.data.birth_place || null,
      specialty: parsed.data.specialty || null,
      club: parsed.data.club || null,
      nationality: parsed.data.nationality || null,
      national_team: parsed.data.national_team || null,
      career_years: parsed.data.career_years || null,
      bio: parsed.data.bio || null,
      achievements,
      highlights,
      gallery,
      clubs_history,
    };
    const { error } = initial
      ? await supabase.from("hall_of_fame").update(payload).eq("id", initial.id)
      : await supabase.from("hall_of_fame").insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(initial ? "Leyenda actualizada" : "Leyenda creada");
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4">
      <div className="w-full max-w-3xl border border-gold bg-surface p-5 my-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl tracking-widest text-gold">
            {initial ? "EDITAR LEYENDA" : "NUEVA LEYENDA"}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Nombre completo *">
            <input className={inp} value={full_name} onChange={(e) => setFullName(e.target.value)} />
          </Field>
          <Field label="Slug *">
            <input className={inp} value={slug} onChange={(e) => setSlug(e.target.value)} />
          </Field>
          <Field label="País (código 2 letras)">
            <input className={inp} value={country_code} onChange={(e) => setCountry(e.target.value)} maxLength={2} />
          </Field>
          <Field label="Nacionalidad (texto)">
            <input className={inp} value={nationality} onChange={(e) => setNationality(e.target.value)} />
          </Field>
          <Field label="Especialidad">
            <input className={inp} value={specialty} onChange={(e) => setSpecialty(e.target.value)} placeholder="Velocidad, Artístico…" />
          </Field>
          <Field label="Club">
            <input className={inp} value={club} onChange={(e) => setClub(e.target.value)} />
          </Field>
          <Field label="Año nacimiento">
            <input className={inp} type="number" value={birth_year} onChange={(e) => setBirth(e.target.value)} />
          </Field>
          <Field label="Año fallecimiento">
            <input className={inp} type="number" value={death_year} onChange={(e) => setDeath(e.target.value)} />
          </Field>
          <Field label="Año inducción">
            <input className={inp} type="number" value={induction_year} onChange={(e) => setInduction(e.target.value)} />
          </Field>
          <Field label="Orden">
            <input className={inp} type="number" value={sort_order} onChange={(e) => setSort(e.target.value)} />
          </Field>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Field label="Foto principal">
            <ImageUploadField value={photo_url} onChange={setPhoto} bucket="skaters" folder="hall-of-fame" />
          </Field>
          <Field label="Portada (cover)">
            <ImageUploadField value={cover_url} onChange={setCover} bucket="skaters" folder="hall-of-fame" />
          </Field>
        </div>

        <div className="mt-4">
          <Field label="Biografía">
            <textarea className={`${inp} min-h-[120px]`} value={bio} onChange={(e) => setBio(e.target.value)} />
          </Field>
        </div>

        <div className="mt-4">
          <label className="font-condensed text-[11px] uppercase tracking-widest text-muted-foreground mb-1 block">
            Datos destacados (uno por línea)
          </label>
          <textarea
            className={`${inp} min-h-[80px]`}
            value={highlights.join("\n")}
            onChange={(e) => setHighlights(e.target.value.split("\n").map(s => s.trim()).filter(Boolean))}
            placeholder="3x campeón mundial&#10;Récord nacional 200m"
          />
        </div>

        <div className="mt-4">
          <label className="font-condensed text-[11px] uppercase tracking-widest text-muted-foreground mb-2 block">
            Palmarés
          </label>
          <div className="space-y-2">
            {achievements.map((a, i) => (
              <div key={i} className="grid gap-2 md:grid-cols-[80px_120px_1fr_1fr_auto] items-start">
                <input
                  className={inp} type="number" placeholder="Año"
                  value={a.year ?? ""}
                  onChange={(e) => {
                    const v = [...achievements];
                    v[i] = { ...a, year: e.target.value ? Number(e.target.value) : undefined };
                    setAchievements(v);
                  }}
                />
                <select
                  className={inp}
                  value={a.category ?? "otro"}
                  onChange={(e) => { const v = [...achievements]; v[i] = { ...a, category: e.target.value as AchievementCategory }; setAchievements(v); }}
                >
                  <option value="mundial">Mundial</option>
                  <option value="europeo">Europeo</option>
                  <option value="nacional">Nacional</option>
                  <option value="otro">Otro</option>
                </select>
                <input
                  className={inp} placeholder="Título"
                  value={a.title}
                  onChange={(e) => { const v = [...achievements]; v[i] = { ...a, title: e.target.value }; setAchievements(v); }}
                />
                <input
                  className={inp} placeholder="Descripción"
                  value={a.description ?? ""}
                  onChange={(e) => { const v = [...achievements]; v[i] = { ...a, description: e.target.value }; setAchievements(v); }}
                />
                <button
                  type="button"
                  className="rounded border border-destructive/40 px-2 py-1 text-xs text-destructive"
                  onClick={() => setAchievements(achievements.filter((_, j) => j !== i))}
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setAchievements([...achievements, { title: "", category: "otro" }])}
              className="font-condensed inline-flex items-center gap-1 rounded border border-border px-2 py-1 text-xs uppercase tracking-widest hover:bg-background"
            >
              <Plus className="h-3 w-3" /> Añadir logro
            </button>
          </div>
        </div>

        <div className="mt-4">
          <label className="font-condensed text-[11px] uppercase tracking-widest text-muted-foreground mb-2 block">
            Trayectoria por clubes
          </label>
          <div className="space-y-2">
            {clubs_history.map((c, i) => (
              <div key={i} className="grid gap-2 md:grid-cols-[1fr_180px_auto] items-start">
                <input
                  className={inp} placeholder="Nombre del club"
                  value={c.name}
                  onChange={(e) => { const v = [...clubs_history]; v[i] = { ...c, name: e.target.value }; setClubsHistory(v); }}
                />
                <input
                  className={inp} placeholder="Años (ej. 2010–2015)"
                  value={c.years ?? ""}
                  onChange={(e) => { const v = [...clubs_history]; v[i] = { ...c, years: e.target.value }; setClubsHistory(v); }}
                />
                <button
                  type="button"
                  className="rounded border border-destructive/40 px-2 py-1 text-xs text-destructive"
                  onClick={() => setClubsHistory(clubs_history.filter((_, j) => j !== i))}
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setClubsHistory([...clubs_history, { name: "" }])}
              className="font-condensed inline-flex items-center gap-1 rounded border border-border px-2 py-1 text-xs uppercase tracking-widest hover:bg-background"
            >
              <Plus className="h-3 w-3" /> Añadir club
            </button>
          </div>
        </div>

        <div className="mt-4">
          <Field label="Galería de fotos">
            <GalleryUploadField value={gallery} onChange={setGallery} bucket="skaters" folder="hall-of-fame" />
          </Field>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <input id="pub" type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} />
          <label htmlFor="pub" className="text-sm">Publicado (visible en la web)</label>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2">
          <button onClick={onClose} className="font-condensed rounded border border-border px-3 py-1.5 text-xs uppercase tracking-widest hover:bg-background">
            Cancelar
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="font-condensed rounded border border-gold bg-gold/10 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-gold hover:bg-gold/20 disabled:opacity-50"
          >
            {saving ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}

const inp = "w-full rounded border border-border bg-background px-2 py-1.5 text-sm focus:border-gold focus:outline-none";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="font-condensed text-[11px] uppercase tracking-widest text-muted-foreground mb-1 block">
        {label}
      </label>
      {children}
    </div>
  );
}
