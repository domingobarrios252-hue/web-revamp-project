import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Building2, Eye, EyeOff, Save, Star, Trophy, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { HUB_SECTIONS, type HubSectionKey } from "@/lib/hub/useCountryHub";

export const Route = createFileRoute("/admin/espana")({
  head: () => ({
    meta: [
      { title: "Control de España — RollerZone" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminEspanaPage,
});

const COUNTRY = "es";

type HubRow = {
  id: string;
  country_code: string;
  name: string;
  tagline: string | null;
  hero_image_url: string | null;
  flag_url: string | null;
  accent_color: string | null;
  federation_name: string | null;
  federation_url: string | null;
  active_sections: string[];
  section_labels: Record<string, string> | null;
  active: boolean;
};

type StandingsGroup = {
  id: string;
  title: string | null;
  division_name: string;
  competition_group: string;
  season: string;
  display_order: number;
  visible: boolean;
};

type DynamicMode = "liga" | "live" | "both" | "none";

function AdminEspanaPage() {
  const [hub, setHub] = useState<HubRow | null>(null);
  const [groups, setGroups] = useState<StandingsGroup[]>([]);
  const [mode, setMode] = useState<DynamicMode>("liga");
  const [loading, setLoading] = useState(true);

  const reload = async () => {
    setLoading(true);
    const sb = supabase as any;
    const [hubRes, gRes, mRes] = await Promise.all([
      sb.from("country_hubs").select("*").eq("country_code", COUNTRY).maybeSingle(),
      sb
        .from("home_standings_groups")
        .select("id,title,division_name,competition_group,season,display_order,visible")
        .order("display_order", { ascending: true }),
      sb.from("home_modules").select("value").eq("key", "dynamic_zone_mode").maybeSingle(),
    ]);
    setHub((hubRes.data as HubRow) ?? null);
    setGroups((gRes.data as StandingsGroup[]) ?? []);
    if (mRes.data?.value && ["liga", "live", "both", "none"].includes(mRes.data.value)) {
      setMode(mRes.data.value as DynamicMode);
    }
    setLoading(false);
  };

  useEffect(() => {
    reload();
  }, []);

  if (loading) return <div className="text-muted-foreground">Cargando…</div>;
  if (!hub)
    return (
      <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm">
        No se ha encontrado el hub de España. Pídele al equipo que cree la fila con
        country_code = <code>es</code>.
      </div>
    );

  return (
    <div className="space-y-10">
      <header className="space-y-1">
        <h1 className="font-display text-3xl uppercase tracking-widest text-gold">
          Control de España
        </h1>
        <p className="text-sm text-muted-foreground">
          Todo en un sitio: hero, subsecciones visibles, contenidos destacados y
          resultados que aparecen en la Home.
        </p>
      </header>

      <HeroEditor hub={hub} onSaved={reload} />

      <SectionsEditor hub={hub} onSaved={reload} />

      <FeaturedShortcuts />

      <HomeResultsControl
        mode={mode}
        groups={groups}
        onModeChange={setMode}
        onReload={reload}
      />
    </div>
  );
}

/* ------------------------------- Hero ------------------------------- */

function HeroEditor({ hub, onSaved }: { hub: HubRow; onSaved: () => void }) {
  const [name, setName] = useState(hub.name);
  const [tagline, setTagline] = useState(hub.tagline ?? "");
  const [heroImage, setHeroImage] = useState(hub.hero_image_url ?? "");
  const [flag, setFlag] = useState(hub.flag_url ?? "");
  const [accent, setAccent] = useState(hub.accent_color ?? "#D4A017");
  const [fedName, setFedName] = useState(hub.federation_name ?? "");
  const [fedUrl, setFedUrl] = useState(hub.federation_url ?? "");
  const [active, setActive] = useState(hub.active);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const sb = supabase as any;
    const { error } = await sb
      .from("country_hubs")
      .update({
        name,
        tagline: tagline || null,
        hero_image_url: heroImage || null,
        flag_url: flag || null,
        accent_color: accent || null,
        federation_name: fedName || null,
        federation_url: fedUrl || null,
        active,
      })
      .eq("id", hub.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Hero actualizado");
    onSaved();
  };

  return (
    <section className="rounded-xl border border-border bg-surface p-5">
      <SectionTitle title="Identidad & Hero" hint="Texto, imagen y colores del hub de España." />
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Field label="Nombre" value={name} onChange={setName} />
        <Field label="Tagline" value={tagline} onChange={setTagline} />
        <div>
          <Label>Imagen de fondo (hero)</Label>
          <ImageUploadField
            value={heroImage}
            onChange={setHeroImage}
            folder="hubs"
            nameHint="es-hero"
            previewClassName="mt-2 h-32 w-full rounded object-cover"
          />
        </div>
        <div>
          <Label>Bandera / logo</Label>
          <ImageUploadField
            value={flag}
            onChange={setFlag}
            folder="hubs"
            nameHint="es-flag"
            previewClassName="mt-2 h-16 w-24 object-contain bg-black/40 rounded"
          />
        </div>
        <div>
          <Label>Color de acento</Label>
          <div className="mt-1 flex items-center gap-2">
            <input
              type="color"
              value={accent}
              onChange={(e) => setAccent(e.target.value)}
              className="h-10 w-14 cursor-pointer rounded border border-border bg-background"
            />
            <input
              type="text"
              value={accent}
              onChange={(e) => setAccent(e.target.value)}
              className="flex-1 rounded border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
        </div>
        <Field label="Federación (nombre)" value={fedName} onChange={setFedName} />
        <Field label="Federación (URL)" value={fedUrl} onChange={setFedUrl} />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            className="h-4 w-4"
          />
          Hub activo (visible públicamente)
        </label>
      </div>
      <div className="mt-5 flex justify-end">
        <SaveBtn onClick={save} loading={saving} />
      </div>
    </section>
  );
}

/* ----------------------------- Sections ----------------------------- */

function SectionsEditor({ hub, onSaved }: { hub: HubRow; onSaved: () => void }) {
  const initial = hub.active_sections.filter((k) =>
    HUB_SECTIONS.some((s) => s.key === k),
  ) as HubSectionKey[];
  const [order, setOrder] = useState<HubSectionKey[]>(initial);
  const [labels, setLabels] = useState<Record<string, string>>(
    () => ({ ...(hub.section_labels ?? {}) }),
  );
  const [saving, setSaving] = useState(false);

  const allKeys = HUB_SECTIONS.map((s) => s.key);
  const inactive = allKeys.filter((k) => !order.includes(k));

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= order.length) return;
    const next = [...order];
    [next[i], next[j]] = [next[j], next[i]];
    setOrder(next);
  };

  const toggle = (key: HubSectionKey, on: boolean) => {
    setOrder(on ? [...order, key] : order.filter((k) => k !== key));
  };

  const setLabel = (key: HubSectionKey, value: string) => {
    setLabels((prev) => ({ ...prev, [key]: value }));
  };

  const resetLabel = (key: HubSectionKey) => {
    setLabels((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const save = async () => {
    setSaving(true);
    // Strip empty labels and labels for inactive keys
    const cleanLabels: Record<string, string> = {};
    for (const k of order) {
      const v = (labels[k] ?? "").trim();
      if (v) cleanLabels[k] = v;
    }
    const sb = supabase as any;
    const { error } = await sb
      .from("country_hubs")
      .update({ active_sections: order, section_labels: cleanLabels })
      .eq("id", hub.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Subsecciones actualizadas");
    onSaved();
  };

  return (
    <section className="rounded-xl border border-border bg-surface p-5">
      <SectionTitle
        title="Subsecciones del hub"
        hint="Activa, oculta, reordena y renombra las pestañas que se publican en la barra de navegación."
      />
      <div className="mt-4 grid gap-6 md:grid-cols-2">
        <div>
          <h3 className="font-condensed mb-2 text-[11px] font-bold uppercase tracking-widest text-gold">
            Activas (en orden)
          </h3>
          {order.length === 0 ? (
            <p className="text-xs text-muted-foreground">Ninguna activa.</p>
          ) : (
            <ul className="space-y-1">
              {order.map((key, i) => {
                const s = HUB_SECTIONS.find((x) => x.key === key)!;
                const current = labels[key] ?? "";
                return (
                  <li
                    key={key}
                    className="flex flex-col gap-2 rounded border border-border bg-background px-3 py-2 sm:flex-row sm:items-center"
                  >
                    <span className="font-condensed w-6 text-center text-xs font-bold text-gold">
                      {i + 1}
                    </span>
                    <div className="flex-1">
                      <div className="font-condensed text-[10px] uppercase tracking-widest text-muted-foreground">
                        {s.label}
                      </div>
                      <div className="mt-1 flex items-center gap-1">
                        <input
                          value={current}
                          onChange={(e) => setLabel(key, e.target.value)}
                          placeholder={s.label}
                          className="w-full rounded border border-border bg-background px-2 py-1 text-sm"
                        />
                        {current && (
                          <button
                            type="button"
                            onClick={() => resetLabel(key)}
                            className="font-condensed text-[10px] uppercase tracking-widest text-muted-foreground hover:text-gold"
                            title="Restaurar nombre"
                          >
                            Reset
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <IconBtn title="Subir" onClick={() => move(i, -1)}>
                        <ArrowUp className="h-4 w-4" />
                      </IconBtn>
                      <IconBtn title="Bajar" onClick={() => move(i, 1)}>
                        <ArrowDown className="h-4 w-4" />
                      </IconBtn>
                      <IconBtn title="Eliminar de la barra" onClick={() => toggle(key, false)}>
                        <EyeOff className="h-4 w-4 text-destructive" />
                      </IconBtn>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        <div>
          <h3 className="font-condensed mb-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
            Ocultas
          </h3>
          {inactive.length === 0 ? (
            <p className="text-xs text-muted-foreground">Todas activas.</p>
          ) : (
            <ul className="space-y-1">
              {inactive.map((key) => {
                const s = HUB_SECTIONS.find((x) => x.key === key)!;
                return (
                  <li
                    key={key}
                    className="flex items-center gap-2 rounded border border-dashed border-border px-3 py-2"
                  >
                    <span className="flex-1 text-sm text-muted-foreground">{s.label}</span>
                    <IconBtn title="Añadir a la barra" onClick={() => toggle(key, true)}>
                      <Eye className="h-4 w-4 text-gold" />
                    </IconBtn>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
      <div className="mt-5 flex justify-end">
        <SaveBtn onClick={save} loading={saving} />
      </div>
    </section>
  );
}

/* --------------------------- Featured shortcuts --------------------------- */

function FeaturedShortcuts() {
  const items: Array<{
    to:
      | "/admin"
      | "/admin/clubes"
      | "/admin/patinadores"
      | "/admin/federaciones"
      | "/admin/eventos"
      | "/admin/entrevistas";
    label: string;
    hint: string;
    Icon: typeof Star;
  }> = [
    { to: "/admin", label: "Noticias destacadas", hint: "Marca con ⭐ las que van al hero.", Icon: Star },
    { to: "/admin/clubes", label: "Clubes destacados", hint: "Toggle 'featured' por club.", Icon: Building2 },
    { to: "/admin/patinadores", label: "Patinadores destacados", hint: "Visibles en el hub.", Icon: Users },
    { to: "/admin/federaciones", label: "Federaciones destacadas", hint: "Aparecen primero en el listado.", Icon: Building2 },
    { to: "/admin/eventos", label: "Eventos del hub", hint: "Próximos eventos del país.", Icon: Trophy },
    { to: "/admin/entrevistas", label: "Entrevista destacada", hint: "Sidebar 'Perfil destacado'.", Icon: Star },
  ];
  return (
    <section className="rounded-xl border border-border bg-surface p-5">
      <SectionTitle
        title="Contenidos destacados"
        hint="Atajos para marcar/desmarcar lo que aparece en cada subsección."
      />
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((it) => (
          <Link
            key={it.to + it.label}
            to={it.to}
            className="group flex items-start gap-3 rounded-lg border border-border bg-background p-4 transition-all hover:border-gold"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded border border-border bg-black/30 text-gold">
              <it.Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="font-condensed text-sm font-bold uppercase tracking-wide text-foreground group-hover:text-gold">
                {it.label}
              </div>
              <div className="mt-0.5 text-xs text-muted-foreground">{it.hint}</div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

/* ------------------------- Home results control ------------------------- */

function HomeResultsControl({
  mode,
  groups,
  onModeChange,
  onReload,
}: {
  mode: DynamicMode;
  groups: StandingsGroup[];
  onModeChange: (m: DynamicMode) => void;
  onReload: () => void;
}) {
  const [savingMode, setSavingMode] = useState(false);

  const setMode = async (next: DynamicMode) => {
    setSavingMode(true);
    const sb = supabase as any;
    const { error } = await sb
      .from("home_modules")
      .upsert({ key: "dynamic_zone_mode", value: next }, { onConflict: "key" });
    setSavingMode(false);
    if (error) return toast.error(error.message);
    onModeChange(next);
    toast.success("Zona dinámica actualizada");
  };

  const toggleVisible = async (g: StandingsGroup) => {
    const sb = supabase as any;
    const { error } = await sb
      .from("home_standings_groups")
      .update({ visible: !g.visible })
      .eq("id", g.id);
    if (error) return toast.error(error.message);
    onReload();
  };

  const moveGroup = async (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= groups.length) return;
    const a = groups[i];
    const b = groups[j];
    const sb = supabase as any;
    const [r1, r2] = await Promise.all([
      sb.from("home_standings_groups").update({ display_order: b.display_order }).eq("id", a.id),
      sb.from("home_standings_groups").update({ display_order: a.display_order }).eq("id", b.id),
    ]);
    if (r1.error || r2.error) return toast.error((r1.error || r2.error)!.message);
    onReload();
  };

  const MODES: Array<{ value: DynamicMode; label: string; hint: string }> = [
    { value: "liga", label: "Solo Liga Nacional", hint: "Carrusel de clasificaciones." },
    { value: "live", label: "Solo Live Event", hint: "Cobertura de evento destacado." },
    { value: "both", label: "Ambos", hint: "Live arriba, Liga debajo." },
    { value: "none", label: "Ninguno", hint: "Oculta toda la zona." },
  ];

  return (
    <section className="rounded-xl border border-border bg-surface p-5">
      <SectionTitle
        title="Resultados en la Home"
        hint="Decide qué se ve bajo el ticker EN DIRECTO y qué clasificaciones entran en el carrusel."
      />

      <div className="mt-4">
        <Label>Zona dinámica de la Home</Label>
        <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {MODES.map((m) => {
            const active = mode === m.value;
            return (
              <button
                key={m.value}
                type="button"
                onClick={() => setMode(m.value)}
                disabled={savingMode}
                className={
                  "rounded-lg border p-3 text-left transition-all " +
                  (active
                    ? "border-gold bg-gold/10"
                    : "border-border bg-background hover:border-gold/60")
                }
              >
                <div className="font-condensed text-xs font-bold uppercase tracking-widest text-foreground">
                  {m.label}
                </div>
                <div className="mt-1 text-[11px] text-muted-foreground">{m.hint}</div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6">
        <div className="mb-2 flex items-center justify-between">
          <Label>Clasificaciones disponibles en el carrusel</Label>
          <Link
            to="/admin/clasificaciones"
            className="font-condensed text-[11px] font-bold uppercase tracking-widest text-gold hover:underline"
          >
            Crear / editar →
          </Link>
        </div>
        {groups.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            Aún no hay clasificaciones. Créalas en <em>Clasificaciones (home)</em>.
          </p>
        ) : (
          <ul className="space-y-1">
            {groups.map((g, i) => (
              <li
                key={g.id}
                className={
                  "flex items-center gap-2 rounded border bg-background px-3 py-2 " +
                  (g.visible ? "border-border" : "border-dashed border-border opacity-60")
                }
              >
                <span className="font-condensed w-6 text-center text-xs font-bold text-gold">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-foreground">
                    {g.title || g.division_name}
                  </div>
                  <div className="truncate text-[11px] text-muted-foreground">
                    {g.competition_group} · {g.season}
                  </div>
                </div>
                <IconBtn title="Subir" onClick={() => moveGroup(i, -1)}>
                  <ArrowUp className="h-4 w-4" />
                </IconBtn>
                <IconBtn title="Bajar" onClick={() => moveGroup(i, 1)}>
                  <ArrowDown className="h-4 w-4" />
                </IconBtn>
                <IconBtn
                  title={g.visible ? "Quitar de Home" : "Mostrar en Home"}
                  onClick={() => toggleVisible(g)}
                >
                  {g.visible ? (
                    <Eye className="h-4 w-4 text-gold" />
                  ) : (
                    <EyeOff className="h-4 w-4" />
                  )}
                </IconBtn>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

/* --------------------------------- UI --------------------------------- */

function SectionTitle({ title, hint }: { title: string; hint?: string }) {
  return (
    <div>
      <h2 className="font-display text-lg uppercase tracking-widest text-gold">{title}</h2>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-condensed text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
      {children}
    </span>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded border border-border bg-background px-3 py-2 text-sm"
      />
    </div>
  );
}

function IconBtn({
  children,
  title,
  onClick,
}: {
  children: React.ReactNode;
  title: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="border border-border bg-background p-1.5 text-muted-foreground transition-colors hover:border-gold hover:text-gold"
    >
      {children}
    </button>
  );
}

function SaveBtn({ onClick, loading }: { onClick: () => void; loading: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="font-condensed inline-flex items-center gap-1.5 bg-gold px-4 py-2 text-xs font-bold uppercase tracking-widest text-background hover:bg-gold-dark disabled:opacity-50"
    >
      <Save className="h-3.5 w-3.5" />
      {loading ? "Guardando…" : "Guardar"}
    </button>
  );
}
