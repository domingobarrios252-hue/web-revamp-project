import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const TIER_LABEL: Record<string, string> = {
  elite: "ÉLITE",
  estrella: "ESTRELLA",
  promesa: "PROMESA",
};

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

export const Route = createFileRoute("/api/og/premios-mvp.svg")({
  server: {
    handlers: {
      GET: async () => {
        // Use anon key to read public published data — RLS allows it.
        const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
        const key = process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
        if (!url || !key) {
          return new Response("Backend not configured", { status: 500 });
        }
        const supabase = createClient<Database>(url, key);

        const { data: seasons } = await supabase
          .from("mvp_seasons")
          .select("id, year, label, is_current")
          .order("year", { ascending: false });

        const active = seasons?.find((s) => s.is_current) ?? seasons?.[0] ?? null;

        let awards: Array<{
          tier: "elite" | "estrella" | "promesa";
          gender: "masculino" | "femenino";
          full_name: string;
          club: string | null;
        }> = [];

        if (active) {
          const { data } = await supabase
            .from("mvp_awards")
            .select("tier, gender, full_name, club")
            .eq("season_id", active.id)
            .eq("position", 1)
            .eq("published", true);
          awards = (data as typeof awards) ?? [];
        }

        const seasonLabel = active?.label ?? "Próxima temporada";

        const tiers: Array<"elite" | "estrella" | "promesa"> = ["elite", "estrella", "promesa"];
        const genders: Array<"masculino" | "femenino"> = ["masculino", "femenino"];

        // Build a 3-row × 2-col grid of name slots
        const slots = tiers.map((t) => ({
          tier: t,
          masculino: awards.find((a) => a.tier === t && a.gender === "masculino") ?? null,
          femenino: awards.find((a) => a.tier === t && a.gender === "femenino") ?? null,
        }));

        const W = 1200;
        const H = 630;

        // Layout
        const rowY0 = 230;
        const rowH = 110;
        const colXM = 110; // Masculino column x
        const colXF = 660; // Femenino column x
        const colW = 460;

        const rows = slots
          .map((s, i) => {
            const y = rowY0 + i * rowH;
            const tierLabel = escapeXml(TIER_LABEL[s.tier]);
            const m = s.masculino;
            const f = s.femenino;
            const mName = m ? escapeXml(truncate(m.full_name, 26)) : "—";
            const mClub = m?.club ? escapeXml(truncate(m.club, 28)) : "";
            const fName = f ? escapeXml(truncate(f.full_name, 26)) : "—";
            const fClub = f?.club ? escapeXml(truncate(f.club, 28)) : "";
            return `
  <g>
    <text x="${colXM}" y="${y}" font-family="'Bebas Neue', 'Oswald', Impact, sans-serif" font-size="22" letter-spacing="3" fill="#D4A24C">${tierLabel} · M</text>
    <text x="${colXM}" y="${y + 36}" font-family="'Oswald', Impact, sans-serif" font-size="34" font-weight="700" fill="#F5F5F5">${mName}</text>
    ${mClub ? `<text x="${colXM}" y="${y + 64}" font-family="'Oswald', Impact, sans-serif" font-size="18" letter-spacing="1.5" fill="#9A9A9A">${mClub}</text>` : ""}

    <text x="${colXF}" y="${y}" font-family="'Bebas Neue', 'Oswald', Impact, sans-serif" font-size="22" letter-spacing="3" fill="#D4A24C">${tierLabel} · F</text>
    <text x="${colXF}" y="${y + 36}" font-family="'Oswald', Impact, sans-serif" font-size="34" font-weight="700" fill="#F5F5F5">${fName}</text>
    ${fClub ? `<text x="${colXF}" y="${y + 64}" font-family="'Oswald', Impact, sans-serif" font-size="18" letter-spacing="1.5" fill="#9A9A9A">${fClub}</text>` : ""}

    <line x1="${colXM}" y1="${y + 82}" x2="${colXM + colW - 30}" y2="${y + 82}" stroke="#2a2a2a" stroke-width="1" />
    <line x1="${colXF}" y1="${y + 82}" x2="${colXF + colW - 30}" y2="${y + 82}" stroke="#2a2a2a" stroke-width="1" />
  </g>`;
          })
          .join("");

        const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0a0a0a"/>
      <stop offset="100%" stop-color="#171717"/>
    </linearGradient>
    <linearGradient id="gold" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#E8C172"/>
      <stop offset="100%" stop-color="#B8862E"/>
    </linearGradient>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#bg)"/>

  <!-- Top border accent -->
  <rect x="0" y="0" width="${W}" height="6" fill="url(#gold)"/>

  <!-- Brand -->
  <text x="60" y="70" font-family="'Oswald', Impact, sans-serif" font-size="22" letter-spacing="6" fill="#9A9A9A">ROLLER<tspan fill="#D4A24C">ZONE</tspan></text>

  <!-- Trophy mark -->
  <g transform="translate(${W - 130}, 38)">
    <rect x="0" y="0" width="70" height="70" fill="none" stroke="#D4A24C" stroke-width="2"/>
    <text x="35" y="48" text-anchor="middle" font-family="'Oswald', Impact, sans-serif" font-size="36" fill="#D4A24C">★</text>
  </g>

  <!-- Title -->
  <text x="60" y="160" font-family="'Bebas Neue', 'Oswald', Impact, sans-serif" font-size="84" letter-spacing="6" fill="#F5F5F5">PREMIOS <tspan fill="#D4A24C">MVP</tspan></text>
  <text x="60" y="195" font-family="'Oswald', Impact, sans-serif" font-size="22" letter-spacing="8" fill="#9A9A9A">CUADRO DE HONOR · ${escapeXml(seasonLabel.toUpperCase())}</text>

  ${rows}

  <!-- Footer -->
  <text x="60" y="${H - 30}" font-family="'Oswald', Impact, sans-serif" font-size="18" letter-spacing="3" fill="#6a6a6a">REVISTA DE PATINAJE DE VELOCIDAD</text>
  <text x="${W - 60}" y="${H - 30}" text-anchor="end" font-family="'Oswald', Impact, sans-serif" font-size="18" letter-spacing="3" fill="#6a6a6a">ROLLERZONE.ES</text>
</svg>`;

        return new Response(svg, {
          status: 200,
          headers: {
            "Content-Type": "image/svg+xml; charset=utf-8",
            "Cache-Control": "public, max-age=300, s-maxage=600",
          },
        });
      },
    },
  },
});
