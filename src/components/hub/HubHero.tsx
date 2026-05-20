import type { CountryHub } from "@/lib/hub/useCountryHub";

export function HubHero({ hub }: { hub: CountryHub }) {
  return (
    <section
      className="relative overflow-hidden border-b border-[#2A2A2A] bg-gradient-to-br from-[#1A1A1A] via-[#222] to-[#1A1A1A]"
      style={{
        backgroundImage: hub.hero_image_url
          ? `linear-gradient(to right, rgba(20,20,20,0.92), rgba(20,20,20,0.6)), url(${hub.hero_image_url})`
          : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="mx-auto max-w-7xl px-4 md:px-6 py-10 md:py-16">
        <div className="flex items-center gap-3 mb-3">
          <span
            className="inline-block h-2 w-8 rounded-full"
            style={{ background: hub.accent_color || "#D4A017" }}
          />
          <span className="font-ui text-[11px] font-bold uppercase tracking-[0.2em] text-[#D4A017]">
            Hub País · {hub.country_code.toUpperCase()}
          </span>
        </div>
        <h1 className="font-display text-4xl md:text-6xl font-black text-[#F5F5F5] tracking-tight">
          {hub.name}
        </h1>
        {hub.tagline && (
          <p className="mt-3 max-w-2xl text-base md:text-lg text-[#B5B5B5]">{hub.tagline}</p>
        )}
        {hub.federation_name && (
          <div className="mt-5 text-xs text-[#888]">
            <span className="uppercase tracking-wider">Federación oficial: </span>
            {hub.federation_url ? (
              <a
                href={hub.federation_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#D4A017] hover:underline"
              >
                {hub.federation_name}
              </a>
            ) : (
              <span className="text-[#F5F5F5]">{hub.federation_name}</span>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
