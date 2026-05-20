import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSkaters } from "@/lib/hub/useSkaters";
import { SkaterCard } from "./SkaterCard";

type Region = { id: string; name: string; code: string };

export function SkatersDirectory({ country }: { country: string }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [gender, setGender] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [regionId, setRegionId] = useState("");
  const [regions, setRegions] = useState<Region[]>([]);

  useEffect(() => {
    supabase
      .from("regions")
      .select("id, name, code")
      .order("name")
      .then(({ data }) => setRegions((data as unknown as Region[]) ?? []));
  }, []);

  const filters = useMemo(
    () => ({ search, category, gender, specialty }),
    [search, category, gender, specialty],
  );
  const { skaters: rawSkaters, loading } = useSkaters(country, filters);

  const specialties = useMemo(() => {
    const set = new Set<string>();
    rawSkaters.forEach((s) => s.specialty && set.add(s.specialty));
    return Array.from(set).sort();
  }, [rawSkaters]);

  const skaters = useMemo(
    () => (regionId ? rawSkaters.filter((s) => s.region_id === regionId) : rawSkaters),
    [rawSkaters, regionId],
  );

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-6 py-8">
      <header className="mb-6">
        <div className="font-ui text-[11px] font-bold uppercase tracking-[0.2em] text-[#D4A017]">
          Hub España
        </div>
        <h1 className="font-display text-4xl md:text-5xl font-black uppercase text-[#F5F5F5]">
          Patinadores
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-[#B5B5B5]">
          Atletas del patinaje español. Filtra por CCAA, categoría, género y modalidad. Orden por ranking MVP.
        </p>
      </header>

      <div className="mb-6 grid gap-2 md:grid-cols-3 lg:grid-cols-5">
        <div className="relative lg:col-span-2">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#666]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar patinador…"
            className="w-full rounded-[4px] border border-[#333] bg-[#1A1A1A] py-2 pl-9 pr-3 text-sm text-[#F5F5F5] placeholder:text-[#666] focus:border-[#D4A017] focus:outline-none"
          />
        </div>
        <select value={regionId} onChange={(e) => setRegionId(e.target.value)} className="rounded-[4px] border border-[#333] bg-[#1A1A1A] px-3 py-2 text-sm text-[#F5F5F5]">
          <option value="">Todas las CCAA</option>
          {regions.map((r) => (<option key={r.id} value={r.id}>{r.name}</option>))}
        </select>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-[4px] border border-[#333] bg-[#1A1A1A] px-3 py-2 text-sm text-[#F5F5F5]">
          <option value="">Categoría</option>
          <option value="Senior">Senior</option>
          <option value="Junior">Junior</option>
          <option value="Cadete">Cadete</option>
          <option value="Infantil">Infantil</option>
        </select>
        <select value={gender} onChange={(e) => setGender(e.target.value)} className="rounded-[4px] border border-[#333] bg-[#1A1A1A] px-3 py-2 text-sm text-[#F5F5F5]">
          <option value="">Género</option>
          <option value="M">Masculino</option>
          <option value="F">Femenino</option>
        </select>
        <select value={specialty} onChange={(e) => setSpecialty(e.target.value)} className="rounded-[4px] border border-[#333] bg-[#1A1A1A] px-3 py-2 text-sm text-[#F5F5F5]">
          <option value="">Modalidad</option>
          {specialties.map((s) => (<option key={s} value={s}>{s}</option>))}
        </select>
      </div>

      {loading ? (
        <p className="text-sm text-[#888]">Cargando patinadores…</p>
      ) : skaters.length === 0 ? (
        <p className="text-sm text-[#888]">No hay patinadores que coincidan con los filtros.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {skaters.map((s) => (
            <SkaterCard key={s.id} skater={s} country={country} />
          ))}
        </div>
      )}
    </div>
  );
}
