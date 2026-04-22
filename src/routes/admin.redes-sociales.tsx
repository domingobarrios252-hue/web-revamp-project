import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Instagram, Facebook, Save } from "lucide-react";

export const Route = createFileRoute("/admin/redes-sociales")({
  head: () => ({
    meta: [
      { title: "Redes sociales — Admin" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminSocialPage,
});

type SocialEntry = {
  handle: string;
  url: string;
  followers: string;
};

type SocialSettings = {
  instagram: SocialEntry;
  facebook: SocialEntry;
};

const DEFAULTS: SocialSettings = {
  instagram: {
    handle: "@rollerzone_spain",
    url: "https://instagram.com/rollerzone_spain",
    followers: "4.4K",
  },
  facebook: {
    handle: "@rollerzone.spain",
    url: "https://facebook.com/rollerzone.spain",
    followers: "2K",
  },
};

function AdminSocialPage() {
  const [data, setData] = useState<SocialSettings>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("site_settings")
      .select("value")
      .eq("key", "social_followers")
      .maybeSingle()
      .then(({ data: row }) => {
        if (cancelled) return;
        if (row?.value) {
          const v = row.value as Partial<SocialSettings>;
          setData({
            instagram: { ...DEFAULTS.instagram, ...(v.instagram ?? {}) },
            facebook: { ...DEFAULTS.facebook, ...(v.facebook ?? {}) },
          });
        }
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const update = (network: keyof SocialSettings, field: keyof SocialEntry, value: string) => {
    setData((prev) => ({ ...prev, [network]: { ...prev[network], [field]: value } }));
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("site_settings")
      .upsert({ key: "social_followers", value: data as never }, { onConflict: "key" });
    setSaving(false);
    if (error) {
      toast.error("Error al guardar: " + error.message);
    } else {
      toast.success("Seguidores actualizados");
    }
  };

  if (loading) {
    return <div className="text-muted-foreground">Cargando…</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl tracking-widest">Redes sociales</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Actualiza el número de seguidores que aparece en la sección "Síguenos" de la portada.
          Puedes escribir el valor en formato corto (ej. <code>4.4K</code>, <code>12.3K</code>, <code>1.2M</code>) o número completo.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <NetworkCard
          title="Instagram"
          icon={<Instagram className="h-5 w-5 text-[#d62976]" />}
          entry={data.instagram}
          onChange={(field, value) => update("instagram", field, value)}
        />
        <NetworkCard
          title="Facebook"
          icon={<Facebook className="h-5 w-5 text-[#1877f2]" />}
          entry={data.facebook}
          onChange={(field, value) => update("facebook", field, value)}
        />
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          <Save className="h-4 w-4" />
          {saving ? "Guardando…" : "Guardar cambios"}
        </Button>
      </div>
    </div>
  );
}

function NetworkCard({
  title,
  icon,
  entry,
  onChange,
}: {
  title: string;
  icon: React.ReactNode;
  entry: SocialEntry;
  onChange: (field: keyof SocialEntry, value: string) => void;
}) {
  return (
    <div className="space-y-4 border border-border bg-surface p-5">
      <div className="flex items-center gap-2 border-b border-border pb-3">
        {icon}
        <h2 className="font-display text-lg tracking-widest">{title}</h2>
      </div>

      <div className="space-y-2">
        <Label>Seguidores</Label>
        <Input
          value={entry.followers}
          onChange={(e) => onChange("followers", e.target.value)}
          placeholder="ej. 4.4K"
        />
      </div>

      <div className="space-y-2">
        <Label>Usuario / Handle</Label>
        <Input
          value={entry.handle}
          onChange={(e) => onChange("handle", e.target.value)}
          placeholder="@rollerzone_spain"
        />
      </div>

      <div className="space-y-2">
        <Label>URL del perfil</Label>
        <Input
          value={entry.url}
          onChange={(e) => onChange("url", e.target.value)}
          placeholder="https://..."
        />
      </div>
    </div>
  );
}
