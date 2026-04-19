import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import { ImageUploadField } from "@/components/admin/ImageUploadField";

type Region = { id: string; name: string; code: string };
type Club = { id: string; name: string };
type PR = { event: string; time: string; date?: string; place?: string };
type Skater = {
  id: string;
  full_name: string;
  slug: string;
  photo_url: string | null;
  birth_year: number | null;
  category: string | null;
  gender: string | null;
  club_id: string | null;
  region_id: string | null;
  total_points: number;
  personal_records: PR[];
  bio: string | null;
  active: boolean;
  clubs: { name: string } | null;
  regions: { name: string; code: string } | null;
};

const skaterSchema = z.object({
  full_name: z.string().trim().min(2).max(120),
  slug: z.string().trim().min(2).max(120).regex(/^[a-z0-9-]+$/, "Solo minúsculas, números y guiones"),
  photo_url: z.string().trim().url().optional().or(z.literal("")),
  birth_year: z.number().int().min(1900).max(2030).optional(),
  category: z.string().trim().max(40).optional(),
  gender: z.string().trim().max(2).optional(),
  club_id: z.string().uuid().optional().or(z.literal("")),
  region_id: z.string().uuid().optional().or(z.literal("")),
  total_points: z.number().min(0).max(1000000),
  bio: z.string().trim().max(2000).optional(),
  active: z.boolean(),
});

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export const Route = createFileRoute("/admin/patinadores")({
  head: () => ({ meta: [{ title: "Admin · Patinadores" }, { name: "robots", content: "noindex" }] }),
  component: AdminSkaters,
});

function AdminSkaters() {
  const [items, setItems] = useState<Skater[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Skater | null>(null);
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    setLoading(true);
    const [s, c, r] = await Promise.all([
      supabase
        .from("skaters")
        .select(
          "id, full_name, slug, photo_url, birth_year, category, gender, club_id, region_id, total_points, personal_records, bio, active, clubs(name), regions(name, code)"
        )
        .order("total_points", { ascending: false }),
      supabase.from("clubs").select("id, name").order("name"),
      supabase.from("regions").select("id, name, code").order("sort_order"),
    ]);
    setItems((s.data as unknown as Skater[]) ?? []);
    setClubs((c.data as unknown as Club[]) ?? []);
    setRegions((r.data as unknown as Region[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const onDelete = async (id: string) => {
    if (!confirm("¿Eliminar patinador? También se eliminan sus resultados.")) return;
    const { error } = await supabase.from("skaters").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Patinador eliminado");
    load();
  };

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="font-display text-2xl tracking-widest">Patinadores</h1>
        <button
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
          className="font-condensed inline-flex items-center gap-2 bg-gold px-4 py-2 text-xs font-bold uppercase tracking-widest text-background hover:bg-gold-dark"
        >
          <Plus className="h-4 w-4" /> Nuevo
        </button>
      </div>

      {showForm && (
        <SkaterForm
          initial={editing}
          clubs={clubs}
          regions={regions}
          onClose={() => {
            setShowForm(false);
            setEditing(null);
          }}
          onSaved={() => {
            setShowForm(false);
            setEditing(null);
            load();
          }}
        />
      )}

      {loading ? (
        <p className="text-muted-foreground">Cargando…</p>
      ) : items.length === 0 ? (
        <p className="text-muted-foreground">Aún no hay patinadores.</p>
      ) : (
        <div className="overflow-x-auto border border-border">
          <table className="w-full">
            <thead className="border-b border-border bg-surface">
              <tr className="font-condensed text-[11px] uppercase tracking-widest text-muted-foreground">
                <th className="px-3 py-2 text-left">Patinador</th>
                <th className="px-3 py-2 text-left">Club</th>
                <th className="px-3 py-2 text-left">CCAA</th>
                <th className="px-3 py-2 text-left">Cat.</th>
                <th className="px-3 py-2 text-right">Puntos</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((s) => (
                <tr key={s.id} className="border-b border-border/60 last:border-0">
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      {s.photo_url && (
                        <img src={s.photo_url} alt="" className="h-8 w-8 object-cover" />
                      )}
                      <div>
                        <div className="font-display text-sm uppercase">{s.full_name}</div>
                        <div className="font-condensed text-[10px] text-muted-foreground">
                          /{s.slug} {!s.active && "· INACTIVO"}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-sm text-foreground/80">{s.clubs?.name ?? "—"}</td>
                  <td className="px-3 py-2 text-sm text-foreground/80">{s.regions?.name ?? "—"}</td>
                  <td className="px-3 py-2 text-sm text-foreground/80">{s.category ?? "—"}</td>
                  <td className="px-3 py-2 text-right font-display text-base text-gold">
                    {Number(s.total_points).toLocaleString("es-ES")}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      onClick={() => {
                        setEditing(s);
                        setShowForm(true);
                      }}
                      className="mr-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-gold"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => onDelete(s.id)}
                      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function SkaterForm({
  initial,
  clubs,
  regions,
  onClose,
  onSaved,
}: {
  initial: Skater | null;
  clubs: Club[];
  regions: Region[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [full_name, setFullName] = useState(initial?.full_name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [photo_url, setPhotoUrl] = useState(initial?.photo_url ?? "");
  const [birth_year, setBirthYear] = useState<string>(initial?.birth_year?.toString() ?? "");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [gender, setGender] = useState(initial?.gender ?? "");
  const [club_id, setClubId] = useState(initial?.club_id ?? "");
  const [region_id, setRegionId] = useState(initial?.region_id ?? "");
  const [total_points, setTotalPoints] = useState<string>(
    initial?.total_points?.toString() ?? "0"
  );
  const [bio, setBio] = useState(initial?.bio ?? "");
  const [active, setActive] = useState(initial?.active ?? true);
  const [prs, setPrs] = useState<PR[]>(initial?.personal_records ?? []);
  const [saving, setSaving] = useState(false);

  const onSlugAuto = () => {
    if (!slug && full_name) setSlug(slugify(full_name));
  };

  const onSave = async () => {
    const parsed = skaterSchema.safeParse({
      full_name,
      slug,
      photo_url: photo_url || undefined,
      birth_year: birth_year ? Number(birth_year) : undefined,
      category: category || undefined,
      gender: gender || undefined,
      club_id: club_id || undefined,
      region_id: region_id || undefined,
      total_points: Number(total_points),
      bio: bio || undefined,
      active,
    });
    if (!parsed.success) {
      toast.error(parsed.error.errors[0]?.message ?? "Datos inválidos");
      return;
    }
    setSaving(true);
    const payload = {
      full_name: parsed.data.full_name,
      slug: parsed.data.slug,
      photo_url: parsed.data.photo_url || null,
      birth_year: parsed.data.birth_year ?? null,
      category: parsed.data.category ?? null,
      gender: parsed.data.gender ?? null,
      club_id: parsed.data.club_id || null,
      region_id: parsed.data.region_id || null,
      total_points: parsed.data.total_points,
      bio: parsed.data.bio ?? null,
      active: parsed.data.active,
      personal_records: prs.filter((p) => p.event && p.time),
    };
    const { error } = initial
      ? await supabase.from("skaters").update(payload).eq("id", initial.id)
      : await supabase.from("skaters").insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(initial ? "Patinador actualizado" : "Patinador creado");
    onSaved();
  };

  return (
    <div className="mb-6 border border-gold bg-surface p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-lg tracking-widest text-gold">
          {initial ? "Editar patinador" : "Nuevo patinador"}
        </h2>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Nombre completo *">
          <input
            value={full_name}
            onChange={(e) => setFullName(e.target.value)}
            onBlur={onSlugAuto}
            className="input"
          />
        </Field>
        <Field label="Slug (URL) *">
          <input value={slug} onChange={(e) => setSlug(e.target.value)} className="input" />
        </Field>
        <Field label="Foto (carnet — vertical 3:4)">
          <ImageUploadField
            value={photo_url}
            onChange={setPhotoUrl}
            bucket="skaters"
            folder="photos"
            nameHint={slug || slugify(full_name)}
            previewClassName="mt-2 h-24 w-18 border border-border object-cover"
          />
        </Field>
        <Field label="Año nacimiento">
          <input
            type="number"
            value={birth_year}
            onChange={(e) => setBirthYear(e.target.value)}
            className="input"
          />
        </Field>
        <Field label="Categoría">
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Senior / Junior / Cadete…"
            className="input"
          />
        </Field>
        <Field label="Género">
          <select value={gender} onChange={(e) => setGender(e.target.value)} className="input">
            <option value="">—</option>
            <option value="F">Femenino</option>
            <option value="M">Masculino</option>
          </select>
        </Field>
        <Field label="Club">
          <select value={club_id} onChange={(e) => setClubId(e.target.value)} className="input">
            <option value="">— Sin club —</option>
            {clubs.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Comunidad autónoma">
          <select value={region_id} onChange={(e) => setRegionId(e.target.value)} className="input">
            <option value="">— Sin comunidad —</option>
            {regions.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Puntos totales">
          <input
            type="number"
            step="0.01"
            value={total_points}
            onChange={(e) => setTotalPoints(e.target.value)}
            className="input"
          />
        </Field>
        <Field label="Activo">
          <label className="flex h-9 items-center gap-2 text-sm">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
            Mostrar en ranking público
          </label>
        </Field>
        <div className="md:col-span-2">
          <Field label="Biografía">
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              className="input"
            />
          </Field>
        </div>
      </div>

      {/* Marcas personales */}
      <div className="mt-5 border-t border-border pt-4">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-display text-sm tracking-widest text-gold">Marcas personales</h3>
          <button
            type="button"
            onClick={() => setPrs([...prs, { event: "", time: "" }])}
            className="font-condensed inline-flex items-center gap-1 text-xs uppercase text-gold hover:text-gold-dark"
          >
            <Plus className="h-3.5 w-3.5" /> Añadir marca
          </button>
        </div>
        <div className="space-y-2">
          {prs.map((pr, i) => (
            <div key={i} className="grid gap-2 md:grid-cols-[1fr_120px_140px_1fr_40px]">
              <input
                value={pr.event}
                onChange={(e) => {
                  const next = [...prs];
                  next[i] = { ...pr, event: e.target.value };
                  setPrs(next);
                }}
                placeholder="Prueba (300m CR…)"
                className="input"
              />
              <input
                value={pr.time}
                onChange={(e) => {
                  const next = [...prs];
                  next[i] = { ...pr, time: e.target.value };
                  setPrs(next);
                }}
                placeholder="Tiempo"
                className="input"
              />
              <input
                type="date"
                value={pr.date ?? ""}
                onChange={(e) => {
                  const next = [...prs];
                  next[i] = { ...pr, date: e.target.value };
                  setPrs(next);
                }}
                className="input"
              />
              <input
                value={pr.place ?? ""}
                onChange={(e) => {
                  const next = [...prs];
                  next[i] = { ...pr, place: e.target.value };
                  setPrs(next);
                }}
                placeholder="Lugar"
                className="input"
              />
              <button
                type="button"
                onClick={() => setPrs(prs.filter((_, idx) => idx !== i))}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 flex gap-2">
        <button
          onClick={onSave}
          disabled={saving}
          className="font-condensed bg-gold px-5 py-2 text-xs font-bold uppercase tracking-widest text-background hover:bg-gold-dark disabled:opacity-50"
        >
          {saving ? "Guardando…" : initial ? "Guardar cambios" : "Crear patinador"}
        </button>
        <button
          onClick={onClose}
          className="font-condensed border border-border px-5 py-2 text-xs font-bold uppercase tracking-widest text-muted-foreground"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="font-condensed mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}
