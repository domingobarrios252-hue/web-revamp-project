import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

// Cartograma de tiles — cada CCAA = un cuadro posicionado según geografía aproximada.
// Limpio, recognocible y sin riesgo de proyecciones erróneas.
type Tile = { code: string; name: string; short: string; col: number; row: number };

const TILES: Tile[] = [
  // Norte (row 0)
  { code: "AST", name: "Asturias", short: "AST", col: 1, row: 0 },
  { code: "CTB", name: "Cantabria", short: "CTB", col: 2, row: 0 },
  { code: "PVA", name: "País Vasco", short: "PVA", col: 3, row: 0 },
  { code: "NAV", name: "Navarra", short: "NAV", col: 4, row: 0 },
  // Norte-centro (row 1)
  { code: "GAL", name: "Galicia", short: "GAL", col: 0, row: 1 },
  { code: "CYL", name: "Castilla y León", short: "CYL", col: 1, row: 1 },
  { code: "LRJ", name: "La Rioja", short: "LRJ", col: 3, row: 1 },
  { code: "ARA", name: "Aragón", short: "ARA", col: 4, row: 1 },
  { code: "CAT", name: "Cataluña", short: "CAT", col: 5, row: 1 },
  // Centro (row 2)
  { code: "EXT", name: "Extremadura", short: "EXT", col: 0, row: 2 },
  { code: "MAD", name: "Madrid", short: "MAD", col: 2, row: 2 },
  { code: "VAL", name: "C. Valenciana", short: "VAL", col: 4, row: 2 },
  { code: "BAL", name: "Baleares", short: "BAL", col: 5, row: 2 },
  // Sur (row 3)
  { code: "AND", name: "Andalucía", short: "AND", col: 1, row: 3 },
  { code: "CLM", name: "Castilla-La Mancha", short: "CLM", col: 2, row: 3 },
  { code: "MUR", name: "Murcia", short: "MUR", col: 3, row: 3 },
  // Insulares / Ciudades autónomas (row 4)
  { code: "CNY", name: "Canarias", short: "CNY", col: 0, row: 4 },
  { code: "CEU", name: "Ceuta", short: "CEU", col: 2, row: 4 },
  { code: "MEL", name: "Melilla", short: "MEL", col: 3, row: 4 },
];

type Counts = Record<string, { clubs: number; skaters: number; fed: boolean }>;

export function SpainMap({ country }: { country: string }) {
  const [counts, setCounts] = useState<Counts>({});
  const [hover, setHover] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [regs, feds, clubs, skaters] = await Promise.all([
        supabase.from("regions").select("id, code"),
        supabase.from("federations").select("region_code").eq("country_code", country).eq("published", true),
        supabase.from("clubs").select("region_id"),
        supabase.from("skaters").select("region_id"),
      ]);
      if (cancelled) return;
      const regionById: Record<string, string> = {};
      ((regs.data as Array<{ id: string; code: string }>) ?? []).forEach((r) => {
        regionById[r.id] = r.code;
      });
      const c: Counts = {};
      TILES.forEach((t) => (c[t.code] = { clubs: 0, skaters: 0, fed: false }));
      ((feds.data as Array<{ region_code: string | null }>) ?? []).forEach((f) => {
        if (f.region_code && c[f.region_code]) c[f.region_code].fed = true;
      });
      ((clubs.data as Array<{ region_id: string | null }>) ?? []).forEach((cl) => {
        const code = cl.region_id ? regionById[cl.region_id] : null;
        if (code && c[code]) c[code].clubs += 1;
      });
      ((skaters.data as Array<{ region_id: string | null }>) ?? []).forEach((s) => {
        const code = s.region_id ? regionById[s.region_id] : null;
        if (code && c[code]) c[code].skaters += 1;
      });
      setCounts(c);
    })();
    return () => {
      cancelled = true;
    };
  }, [country]);

  const W = 480;
  const H = 380;
  const tileW = 72;
  const tileH = 64;
  const gap = 6;
  const padX = 12;
  const padY = 12;

  const hovered = hover ? TILES.find((t) => t.code === hover) : null;
  const hoveredCount = hover ? counts[hover] : null;

  return (
    <div className="rounded-[8px] border border-[#333] bg-[#1A1A1A] p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-lg font-black uppercase text-[#F5F5F5]">
          Mapa de España
        </h2>
        <span className="text-[10px] uppercase tracking-widest text-[#888]">
          Pulsa una comunidad
        </span>
      </div>
      <div className="grid gap-4 md:grid-cols-[1fr_200px]">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full h-auto"
          role="img"
          aria-label="Mapa interactivo de comunidades autónomas de España"
        >
          {TILES.map((t) => {
            const x = padX + t.col * (tileW + gap);
            const y = padY + t.row * (tileH + gap);
            const stats = counts[t.code] ?? { clubs: 0, skaters: 0, fed: false };
            const activity = stats.fed || stats.clubs > 0 || stats.skaters > 0;
            const isHover = hover === t.code;
            return (
              <Link
                key={t.code}
                to="/hub/$country/regiones/$code"
                params={{ country, code: t.code }}
              >
                <g
                  onMouseEnter={() => setHover(t.code)}
                  onMouseLeave={() => setHover(null)}
                  className="cursor-pointer"
                >
                  <rect
                    x={x}
                    y={y}
                    width={tileW}
                    height={tileH}
                    rx={4}
                    fill={isHover ? "#D4A017" : activity ? "#2a2a2a" : "#1f1f1f"}
                    stroke={activity ? "#D4A017" : "#333"}
                    strokeWidth={isHover ? 2 : 1}
                    className="transition-colors"
                  />
                  <text
                    x={x + tileW / 2}
                    y={y + tileH / 2 - 4}
                    textAnchor="middle"
                    className="font-display"
                    style={{
                      fontSize: 16,
                      fontWeight: 900,
                      fill: isHover ? "#0d0d0d" : "#F5F5F5",
                    }}
                  >
                    {t.short}
                  </text>
                  {stats.fed && (
                    <circle
                      cx={x + tileW - 8}
                      cy={y + 8}
                      r={3}
                      fill={isHover ? "#0d0d0d" : "#D4A017"}
                    />
                  )}
                  <text
                    x={x + tileW / 2}
                    y={y + tileH - 10}
                    textAnchor="middle"
                    style={{
                      fontSize: 9,
                      letterSpacing: 1,
                      fill: isHover ? "#0d0d0d" : "#888",
                    }}
                  >
                    {stats.clubs}c · {stats.skaters}p
                  </text>
                </g>
              </Link>
            );
          })}
        </svg>

        <aside className="rounded-[6px] border border-[#333] bg-[#0d0d0d] p-3 text-sm">
          {hovered && hoveredCount ? (
            <div>
              <div className="text-[10px] uppercase tracking-widest text-[#D4A017]">
                Comunidad
              </div>
              <div className="font-display text-base font-black uppercase text-[#F5F5F5]">
                {hovered.name}
              </div>
              <ul className="mt-3 space-y-1 text-[#D4D4D4]">
                <li>Federación: <span className="text-[#F5F5F5]">{hoveredCount.fed ? "Sí" : "—"}</span></li>
                <li>Clubes: <span className="text-[#F5F5F5]">{hoveredCount.clubs}</span></li>
                <li>Patinadores: <span className="text-[#F5F5F5]">{hoveredCount.skaters}</span></li>
              </ul>
              <Link
                to="/hub/$country/regiones/$code"
                params={{ country, code: hovered.code }}
                className="mt-3 inline-block text-xs font-bold uppercase tracking-widest text-[#D4A017] hover:underline"
              >
                Ver ficha →
              </Link>
            </div>
          ) : (
            <div className="text-xs text-[#888]">
              <p className="mb-2">Pasa el cursor por una comunidad para ver su actividad.</p>
              <div className="mt-3 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="inline-block h-3 w-3 rounded-sm bg-[#2a2a2a] border border-[#D4A017]" />
                  <span>Con actividad</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-block h-3 w-3 rounded-sm bg-[#1f1f1f] border border-[#333]" />
                  <span>Sin datos</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-block h-3 w-3 rounded-full bg-[#D4A017]" />
                  <span>Federación registrada</span>
                </div>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
