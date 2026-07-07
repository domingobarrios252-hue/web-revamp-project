import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Building2, Mail, Phone, Printer, MapPin, Globe, Search, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/espana/federaciones")({
  head: () => ({
    meta: [
      { title: "Federaciones Autonómicas de Patinaje en España | RollerZone" },
      {
        name: "description",
        content:
          "Directorio de contacto de las federaciones autonómicas de patinaje en España: presidencia, teléfono, dirección, email y web oficial.",
      },
      { property: "og:title", content: "Federaciones Autonómicas de Patinaje en España" },
      {
        property: "og:description",
        content:
          "Consulta los datos oficiales de las federaciones autonómicas vinculadas al patinaje nacional.",
      },
    ],
  }),
  component: EspanaFederacionesPage,
});

type Fed = {
  id: string;
  name: string;
  short_name: string | null;
  region_name: string | null;
  city: string | null;
  president: string | null;
  phone: string | null;
  fax: string | null;
  address: string | null;
  email: string | null;
  website: string | null;
  logo_url: string | null;
};

function EspanaFederacionesPage() {
  const [feds, setFeds] = useState<Fed[] | null>(null);
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState("all");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("federations")
        .select("id,name,short_name,region_name,city,president,phone,fax,address,email,website,logo_url")
        .eq("country_code", "es")
        .eq("type", "autonomica")
        .eq("published", true)
        .order("name");
      if (cancelled) return;
      setFeds((data as Fed[]) ?? []);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const regions = useMemo(() => {
    const s = new Set<string>();
    (feds ?? []).forEach((f) => f.region_name && s.add(f.region_name));
    return Array.from(s).sort((a, b) => a.localeCompare(b, "es"));
  }, [feds]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (feds ?? []).filter((f) => {
      if (region !== "all" && f.region_name !== region) return false;
      if (!q) return true;
      const hay = [f.name, f.short_name, f.region_name, f.city, f.address, f.president]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [feds, query, region]);

  return (
    <div className="min-h-screen bg-[#0d0d0d]">
      <div className="mx-auto max-w-7xl px-5 py-10 md:px-6 md:py-14">
        <Link
          to="/hub/$country"
          params={{ country: "es" }}
          className="font-condensed inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-[#888] hover:text-[#D4A017]"
        >
          <ArrowLeft className="h-3 w-3" /> Volver a Hub España
        </Link>

        <header className="mt-4 border-b border-[#2A2A2A] pb-6">
          <div className="font-ui text-[11px] font-bold uppercase tracking-[0.2em] text-[#D4A017]">
            Hub España
          </div>
          <h1 className="mt-2 font-display text-3xl font-black uppercase text-[#F5F5F5] md:text-4xl">
            Federaciones Autonómicas de Patinaje en España
          </h1>
          <div className="mt-3 h-[3px] w-24 bg-[#D4A017]" aria-hidden />
          <p className="mt-4 max-w-3xl text-sm text-[#B5B5B5] md:text-base">
            Directorio de contacto de las federaciones autonómicas vinculadas al patinaje nacional.
          </p>
          <p className="mt-2 max-w-3xl text-xs text-[#888] md:text-sm">
            Consulta los datos principales de las federaciones autonómicas de patinaje en España:
            presidencia, teléfono, dirección, correo electrónico y página web oficial.
          </p>
        </header>

        <div className="mt-6 grid gap-3 md:grid-cols-[1fr_260px]">
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#666]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por federación, comunidad, ciudad o presidente…"
              className="h-11 w-full rounded-md border border-[#2A2A2A] bg-[#141414] pl-10 pr-3 text-sm text-[#F5F5F5] placeholder:text-[#666] focus:border-[#D4A017] focus:outline-none"
            />
          </label>
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="h-11 rounded-md border border-[#2A2A2A] bg-[#141414] px-3 text-sm text-[#F5F5F5] focus:border-[#D4A017] focus:outline-none"
          >
            <option value="all">Todas las comunidades</option>
            {regions.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-8">
          {feds === null ? (
            <div className="text-sm text-[#888]">Cargando federaciones…</div>
          ) : filtered.length === 0 ? (
            <div className="rounded-md border border-dashed border-[#333] bg-[#141414] p-10 text-center text-sm text-[#888]">
              No se han encontrado federaciones con esos criterios.
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((f) => (
                <FedCard key={f.id} f={f} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FedCard({ f }: { f: Fed }) {
  const cleanUrl = (u: string) => (u.startsWith("http") ? u : `https://${u}`);
  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-[#2A2A2A] bg-gradient-to-b from-[#161616] to-[#101010] transition-colors hover:border-[#D4A017]/60">
      <div className="flex items-start gap-3 border-b border-[#2A2A2A] bg-black/30 px-4 py-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md border border-[#2A2A2A] bg-[#0a0a0a]">
          {f.logo_url ? (
            <img src={f.logo_url} alt="" loading="lazy" className="h-full w-full object-contain p-1" />
          ) : (
            <Building2 className="h-7 w-7 text-[#D4A017]" />
          )}
        </div>
        <div className="min-w-0">
          <div className="font-condensed text-[10px] font-bold uppercase tracking-[0.25em] text-[#D4A017]">
            {f.region_name ?? "España"}
          </div>
          <h2 className="mt-0.5 font-display text-base font-black uppercase leading-tight text-[#F5F5F5]">
            {f.name}
          </h2>
        </div>
      </div>

      <div className="flex-1 space-y-2.5 px-4 py-4 text-sm text-[#D4D4D4]">
        {f.president && (
          <Row icon={<User className="h-4 w-4 text-[#D4A017]" />} label="Presidencia">
            {f.president}
          </Row>
        )}
        {f.phone && (
          <Row icon={<Phone className="h-4 w-4 text-[#D4A017]" />} label="Teléfono">
            <a href={`tel:${f.phone.replace(/\s+/g, "")}`} className="hover:text-[#D4A017]">
              {f.phone}
            </a>
          </Row>
        )}
        {f.fax && (
          <Row icon={<Printer className="h-4 w-4 text-[#D4A017]" />} label="Fax">
            {f.fax}
          </Row>
        )}
        {f.address && (
          <Row icon={<MapPin className="h-4 w-4 text-[#D4A017]" />} label="Dirección">
            {f.address}
          </Row>
        )}
        {f.email && (
          <Row icon={<Mail className="h-4 w-4 text-[#D4A017]" />} label="Email">
            <a href={`mailto:${f.email}`} className="break-all hover:text-[#D4A017]">
              {f.email}
            </a>
          </Row>
        )}
        {f.website && (
          <Row icon={<Globe className="h-4 w-4 text-[#D4A017]" />} label="Web">
            <a
              href={cleanUrl(f.website)}
              target="_blank"
              rel="noopener noreferrer"
              className="break-all hover:text-[#D4A017]"
            >
              {f.website.replace(/^https?:\/\//, "")}
            </a>
          </Row>
        )}
      </div>

      {(f.email || f.website) && (
        <div className="mt-auto flex flex-wrap gap-2 border-t border-[#2A2A2A] bg-black/20 px-4 py-3">
          {f.email && (
            <a
              href={`mailto:${f.email}`}
              className="font-condensed inline-flex items-center gap-1.5 rounded-md border border-[#D4A017]/60 bg-[#D4A017]/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest text-[#D4A017] hover:bg-[#D4A017] hover:text-[#111]"
            >
              <Mail className="h-3.5 w-3.5" /> Enviar email
            </a>
          )}
          {f.website && (
            <a
              href={cleanUrl(f.website)}
              target="_blank"
              rel="noopener noreferrer"
              className="font-condensed inline-flex items-center gap-1.5 rounded-md border border-[#333] bg-[#1A1A1A] px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest text-[#F5F5F5] hover:border-[#D4A017] hover:text-[#D4A017]"
            >
              <Globe className="h-3.5 w-3.5" /> Visitar web
            </a>
          )}
        </div>
      )}
    </article>
  );
}

function Row({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-2.5">
      <div className="mt-0.5 shrink-0">{icon}</div>
      <div className="min-w-0">
        <div className="font-condensed text-[9px] font-bold uppercase tracking-[0.2em] text-[#666]">
          {label}
        </div>
        <div className="text-sm leading-snug text-[#E8E8E8]">{children}</div>
      </div>
    </div>
  );
}
