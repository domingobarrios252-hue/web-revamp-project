import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Radio, Trophy, Layers, EyeOff, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/home-control")({
  head: () => ({
    meta: [
      { title: "Home Control Center — RollerZone" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: HomeControlPage,
});

type Mode = "liga" | "live" | "both" | "none";

const OPTIONS: Array<{
  value: Mode;
  label: string;
  description: string;
  Icon: typeof Trophy;
}> = [
  {
    value: "liga",
    label: "Liga Nacional",
    description: "Solo clasificaciones nacionales en la home.",
    Icon: Trophy,
  },
  {
    value: "live",
    label: "Evento en directo",
    description: "Solo cobertura live del evento destacado.",
    Icon: Radio,
  },
  {
    value: "both",
    label: "Ambos",
    description: "Live Event Center arriba y Liga Nacional debajo.",
    Icon: Layers,
  },
  {
    value: "none",
    label: "Ninguno",
    description: "Oculta toda la zona dinámica de la home.",
    Icon: EyeOff,
  },
];

function HomeControlPage() {
  const [mode, setMode] = useState<Mode>("liga");
  const [saving, setSaving] = useState<Mode | null>(null);
  const [loading, setLoading] = useState(true);
  const [featuredEvent, setFeaturedEvent] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    (async () => {
      const sb = supabase as any;
      const { data } = await sb
        .from("home_modules")
        .select("value")
        .eq("key", "dynamic_zone_mode")
        .maybeSingle();
      if (data?.value) setMode(data.value as Mode);
      const { data: ev } = await sb
        .from("events")
        .select("id,name")
        .eq("is_featured", true)
        .eq("live_center_enabled", true)
        .limit(1)
        .maybeSingle();
      setFeaturedEvent(ev ?? null);
      setLoading(false);
    })();
  }, []);

  const save = async (next: Mode) => {
    setSaving(next);
    const sb = supabase as any;
    const { error } = await sb
      .from("home_modules")
      .upsert({ key: "dynamic_zone_mode", value: next }, { onConflict: "key" });
    setSaving(null);
    if (error) {
      toast.error("No se pudo guardar: " + error.message);
      return;
    }
    setMode(next);
    toast.success("Zona dinámica actualizada");
  };

  if (loading) return <div className="text-muted-foreground">Cargando…</div>;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl uppercase tracking-widest text-gold">
          Home Control Center
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Decide qué se muestra en la zona estratégica de la home, justo debajo del ticker EN
          DIRECTO.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        {OPTIONS.map((opt) => {
          const active = mode === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => save(opt.value)}
              disabled={saving !== null}
              className={
                "group relative flex items-start gap-4 rounded-xl border p-5 text-left transition-all " +
                (active
                  ? "border-gold bg-gradient-to-br from-surface to-surface-2/40 shadow-[0_8px_32px_rgba(212,160,23,0.25)]"
                  : "border-border bg-surface hover:border-gold/60")
              }
            >
              <div
                className={
                  "flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border " +
                  (active ? "border-gold bg-gold/10 text-gold" : "border-border bg-black/30 text-muted-foreground")
                }
              >
                <opt.Icon className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-lg uppercase tracking-wide text-foreground">
                    {opt.label}
                  </h3>
                  {active && <CheckCircle2 className="h-4 w-4 text-gold" />}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{opt.description}</p>
              </div>
              {saving === opt.value && (
                <span className="font-condensed absolute right-3 top-3 text-[10px] uppercase tracking-widest text-gold">
                  Guardando…
                </span>
              )}
            </button>
          );
        })}
      </section>

      <section className="rounded-xl border border-border bg-surface p-5">
        <h2 className="font-display text-sm uppercase tracking-widest text-gold">
          Evento Live destacado
        </h2>
        {featuredEvent ? (
          <p className="mt-2 text-sm text-foreground">
            <span className="font-bold">{featuredEvent.name}</span> está activo como evento en
            directo. Para cambiarlo o crear uno nuevo, ve a{" "}
            <a href="/admin/eventos" className="text-gold hover:underline">
              Eventos
            </a>{" "}
            y marca otro como destacado + live center.
          </p>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">
            No hay ningún evento marcado como destacado y con live center activo. Ve a{" "}
            <a href="/admin/eventos" className="text-gold hover:underline">
              Eventos
            </a>{" "}
            para activarlo. El modo "Evento en directo" se mostrará vacío hasta entonces.
          </p>
        )}
      </section>
    </div>
  );
}
