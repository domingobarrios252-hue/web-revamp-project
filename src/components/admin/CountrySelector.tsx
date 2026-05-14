import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type Country = { code: string; name: string; flag_url: string | null };

export function CountrySelector({
  value,
  onChange,
  label = "Publicar en (país)",
  className = "",
}: {
  value: string;
  onChange: (code: string) => void;
  label?: string;
  className?: string;
}) {
  const [countries, setCountries] = useState<Country[]>([]);
  useEffect(() => {
    supabase
      .from("countries")
      .select("code,name,flag_url")
      .eq("active", true)
      .order("sort_order")
      .then(({ data }) => setCountries((data as Country[]) ?? []));
  }, []);
  return (
    <label className={`block ${className}`}>
      <span className="font-condensed mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="input">
        {countries.length === 0 && <option value="es">España</option>}
        {countries.map((c) => (
          <option key={c.code} value={c.code}>
            {c.name}
          </option>
        ))}
      </select>
    </label>
  );
}
