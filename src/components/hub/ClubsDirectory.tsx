import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useClubs } from "@/lib/hub/useClubs";
import { ClubCard } from "./ClubCard";

type Region = { id: string; name: string; code: string };

export function ClubsDirectory({ country }: { country: string }) {
  const [search, setSearch] = useState("");
  const [regionId, setRegionId] = useState("");
  const [schoolType, setSchoolType] = useState("");
  const [category, setCategory] = useState("");
  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");
  const [regions, setRegions] = useState<Region[]>([]);

  useEffect(() => {
    supabase
      .from("regions")
      .select("id, name, code")
      .order("name")
      .then(({ data }) => setRegions((data as unknown as Region[]) ?? []));
  }, []);

  const filters = useMemo(
    () => ({ search, regionId, schoolType, category }),
    [search, regionId, schoolType, category],
  );
  const { clubs: rawClubs, loading } = useClubs(country, filters);

  const allCategories = useMemo(() => {
    const set = new Set<string>();
    rawClubs.forEach((c) => c.categories.forEach((cat) => set.add(cat)));
    return Array.from(set).sort();
  }, [rawClubs]);

  const allProvinces = useMemo(() => {
    const set = new Set<string>();
    rawClubs.forEach((c) => c.province && set.add(c.province));
    return Array.from(set).sort();
  }, [rawClubs]);

  const allCities = useMemo(() => {
    const set = new Set<string>();
    rawClubs.forEach((c) => {
      if (!province || c.province === province) c.city && set.add(c.city);
    });
    return Array.from(set).sort();
  }, [rawClubs, province]);

  const clubs = useMemo(() => {
    return rawClubs.filter((c) => {
      if (province && c.province !== province) return false;
      if (city && c.city !== city) return false;
      return true;
    });
  }, [rawClubs, province, city]);

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-6 py-8">
      <header className="mb-6">
        <div className="font-ui text-[11px] font-bold uppercase tracking-[0.2em] text-[#D4A017]">
          Hub España
        </div>
        <h1 className="font-display text-4xl md:text-5xl font-black uppercase text-[#F5F5F5]">
          Clubes & Escuelas
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-[#B5B5B5]">
          Directorio nacional de clubes de patinaje de velocidad. Filtra por CCAA, provincia, ciudad,
          categoría o tipo de escuela.
        </p>
      </header>

      <div className="mb-6 grid gap-2 md:grid-cols-3 lg:grid-cols-6">
        <div className="relative lg:col-span-2">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#666]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar club…"
            className="w-full rounded-[4px] border border-[#333] bg-[#1A1A1A] py-2 pl-9 pr-3 text-sm text-[#F5F5F5] placeholder:text-[#666] focus:border-[#D4A017] focus:outline-none"
          />
        </div>
        <select value={regionId} onChange={(e) => setRegionId(e.target.value)} className="rounded-[4px] border border-[#333] bg-[#1A1A1A] px-3 py-2 text-sm text-[#F5F5F5]">
          <option value="">Todas las CCAA</option>
          {regions.map((r) => (<option key={r.id} value={r.id}>{r.name}</option>))}
        </select>
        <select value={province} onChange={(e) => { setProvince(e.target.value); setCity(""); }} className="rounded-[4px] border border-[#333] bg-[#1A1A1A] px-3 py-2 text-sm text-[#F5F5F5]">
          <option value="">Provincia</option>
          {allProvinces.map((p) => (<option key={p} value={p}>{p}</option>))}
        </select>
        <select value={city} onChange={(e) => setCity(e.target.value)} className="rounded-[4px] border border-[#333] bg-[#1A1A1A] px-3 py-2 text-sm text-[#F5F5F5]">
          <option value="">Ciudad</option>
          {allCities.map((c) => (<option key={c} value={c}>{c}</option>))}
        </select>
        <select value={schoolType} onChange={(e) => setSchoolType(e.target.value)} className="rounded-[4px] border border-[#333] bg-[#1A1A1A] px-3 py-2 text-sm text-[#F5F5F5]">
          <option value="">Tipo</option>
          <option value="escuela">Escuela</option>
          <option value="competicion">Competición</option>
          <option value="mixto">Mixto</option>
        </select>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-[4px] border border-[#333] bg-[#1A1A1A] px-3 py-2 text-sm text-[#F5F5F5]">
          <option value="">Categoría</option>
          {allCategories.map((c) => (<option key={c} value={c}>{c}</option>))}
        </select>
      </div>

      {loading ? (
        <p className="text-sm text-[#888]">Cargando clubes…</p>
      ) : clubs.length === 0 ? (
        <p className="text-sm text-[#888]">No hay clubes que coincidan con los filtros.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clubs.map((c) => (
            <ClubCard key={c.id} club={c} country={country} />
          ))}
        </div>
      )}
    </div>
  );
}
