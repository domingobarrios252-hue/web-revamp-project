import type { CountryHub } from "@/lib/hub/useCountryHub";

export function HubHero({ hub }: { hub: CountryHub }) {
  return (
    <section
      className="relative overflow-hidden bg-[#1A1A1A]"
      style={{
        backgroundImage: hub.hero_image_url
          ? `linear-gradient(to right, rgba(20,20,20,0.95), rgba(20,20,20,0.75)), url(${hub.hero_image_url})`
          : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="mx-auto max-w-7xl px-4 md:px-8 pt-10 md:pt-14 pb-8 md:pb-10">
        {/* Eyebrow */}
        <div className="flex items-center gap-3 text-[10px] font-extrabold tracking-[0.25em] text-[#D4A017] uppercase mb-6">
          <span
            className="h-[2px] w-6"
            style={{ background: hub.accent_color || "#D4A017" }}
          />
          Hub País · {hub.country_code.toUpperCase()}
        </div>

        {/* Title + federation row */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-[#333] pb-8 md:pb-10">
          <div className="space-y-3">
            <h1 className="font-display text-6xl md:text-8xl font-black tracking-tighter text-white leading-[0.95]">
              {hub.name}
            </h1>
            {hub.tagline && (
              <p className="text-[#A0A0A0] text-base md:text-xl font-medium max-w-xl leading-relaxed">
                {hub.tagline}
              </p>
            )}
          </div>

          {hub.federation_name && (
            <div className="flex flex-col gap-2 items-start md:items-end">
              <span className="text-[10px] uppercase font-bold text-[#888] tracking-wider">
                Federación Oficial
              </span>
              {hub.federation_url ? (
                <a
                  href={hub.federation_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#D4A017] text-sm font-bold hover:text-white transition-colors underline decoration-1 underline-offset-8 decoration-[#D4A017]/30"
                >
                  {hub.federation_name}
                </a>
              ) : (
                <span className="text-[#F5F5F5] text-sm font-bold">{hub.federation_name}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
