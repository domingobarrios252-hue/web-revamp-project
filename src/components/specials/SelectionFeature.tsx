import { MemberAsu26Live } from "@/components/specials/live/Asu26PieceModules";
import {
  flagEmoji,
  hasClosing,
  hasSummary,
  MEDAL_LABEL,
  type FeatureData,
  type PieceMember,
} from "@/lib/specials/pieceMembers";

const MEDAL_CLASS: Record<string, string> = {
  oro: "bg-gold text-background",
  plata: "bg-foreground/80 text-background",
  bronce: "bg-[hsl(28_60%_45%)] text-foreground",
};

function SpainStripe() {
  return (
    <div className="flex h-1 w-16" aria-hidden>
      <span className="flex-1 bg-[hsl(0_75%_45%)]" />
      <span className="flex-[2] bg-[hsl(48_95%_55%)]" />
      <span className="flex-1 bg-[hsl(0_75%_45%)]" />
    </div>
  );
}

export function SelectionSummary({ data }: { data: FeatureData }) {
  if (!hasSummary(data)) return null;
  const s = data.summary ?? {};
  const facts = [
    ["Patinadores", s.total],
    ["Categorías", s.categories],
    ["Sede", s.venue],
    ["Competición", s.competition],
  ].filter(([, v]) => v?.trim());
  const lists = [
    ["Júnior", s.junior],
    ["Sénior", s.senior],
  ].filter(([, v]) => v?.trim());
  return (
    <section className="bg-background py-10 md:py-14">
      <div className="mx-auto max-w-5xl px-4 md:px-6">
        <SpainStripe />
        <h2 className="font-display mt-3 text-2xl uppercase tracking-wider text-foreground md:text-3xl">
          Resumen de la selección
        </h2>
        {facts.length > 0 && (
          <dl className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
            {facts.map(([k, v]) => (
              <div key={k} className="rounded-lg border border-border bg-surface p-4">
                <dt className="font-condensed text-[10px] uppercase tracking-[2.5px] text-gold">{k}</dt>
                <dd className="font-display mt-1 break-words text-lg uppercase text-foreground md:text-xl">{v}</dd>
              </div>
            ))}
          </dl>
        )}
        {lists.length > 0 && (
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            {lists.map(([k, v]) => (
              <div key={k} className="rounded-lg border border-gold/30 bg-surface p-4">
                <h3 className="font-condensed text-[11px] font-bold uppercase tracking-[3px] text-gold">Lista {k}</h3>
                <ul className="mt-3 space-y-1 text-sm text-foreground/90">
                  {(v ?? "").split("\n").map((n) => n.trim()).filter(Boolean).map((n, i) => (
                    <li key={i} className="border-b border-border/50 pb-1 last:border-0">{n}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export function SelectionMembers({ members, live = false }: { members: PieceMember[]; live?: boolean }) {
  if (members.length === 0) return null;
  return (
    <section className="bg-surface py-12 md:py-20">
      <div className="mx-auto w-full max-w-[1200px] px-4 md:px-6">
        <SpainStripe />
        <h2 className="font-display mt-3 text-3xl uppercase tracking-wider text-foreground md:text-4xl">
          Patinadores
        </h2>
        <ul className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-7 lg:grid-cols-3 lg:gap-8">
          {members.map((m) => (
            <li key={m.id} className="min-w-0">
              <MemberCard m={m} live={live} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}


function MemberCard({ m, live = false }: { m: PieceMember; live?: boolean }) {
  const fullName = `${m.first_name} ${m.last_name}`.trim();
  const visible = m.display_name?.trim();
  const name = visible || fullName;
  const flag = flagEmoji(m.country_code);
  const results = m.results ?? [];
  const external = m.link_url?.startsWith("http");
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-[0_20px_50px_-30px_hsl(0_0%_0%/0.9)] transition-colors hover:border-gold/50">
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-surface-2">
        {m.image_url ? (
          <img src={m.image_url} alt={name} loading="lazy" decoding="async" className="h-full w-full object-cover object-top transition-transform duration-700 group-hover:scale-[1.03]" />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-gradient-to-b from-surface-2 to-background">
            <span className="font-display text-8xl text-gold/40">
              {(m.first_name[0] ?? "") + (m.last_name[0] ?? "")}
            </span>
            <span className="font-condensed text-[11px] uppercase tracking-[3px] text-muted-foreground">Imagen próximamente</span>
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-background via-background/70 to-transparent" />
        {m.category && (
          <span className="font-condensed absolute left-4 top-4 bg-gold px-3 py-1 text-[11px] font-bold uppercase tracking-[2.5px] text-background">
            {m.category}
          </span>
        )}
        {flag && <span className="absolute right-4 top-4 text-3xl drop-shadow" aria-label={m.country_code ?? ""}>{flag}</span>}
        <div className="absolute inset-x-0 bottom-0 p-5">
          <SpainStripe />
          <h3 className="font-display mt-3 break-words text-3xl uppercase leading-[0.95] tracking-wide text-foreground md:text-[2.1rem]">{name}</h3>
          {visible && fullName && <p className="mt-1.5 text-sm text-foreground/75">{fullName}</p>}
          {m.club && <p className="font-condensed mt-2 text-sm uppercase tracking-[2px] text-gold">{m.club}</p>}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-5 p-5">
        {m.specialty && (
          <p className="font-condensed text-xs uppercase tracking-[2.5px] text-muted-foreground">{m.specialty}</p>
        )}
        {results.length > 0 && (
          <div className="rounded-xl border border-gold/25 bg-surface p-4">
            <h4 className="font-condensed flex items-center gap-2 text-[11px] font-bold uppercase tracking-[3px] text-gold">
              <span className="h-3 w-0.5 bg-gold" aria-hidden />
              Resultados 2026
            </h4>
            <ul className="mt-3 divide-y divide-border/60">
              {results.map((r) => (
                <li key={r.id} className="flex items-start gap-3 py-3 first:pt-1 last:pb-0">
                  {r.medal ? (
                    <span
                      className={"mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-condensed text-[10px] font-bold uppercase " + MEDAL_CLASS[r.medal]}
                      title={MEDAL_LABEL[r.medal]}
                      aria-label={MEDAL_LABEL[r.medal]}
                    >
                      {MEDAL_LABEL[r.medal][0]}
                    </span>
                  ) : (
                    <span className="mt-2.5 h-2 w-2 shrink-0 rounded-full bg-border" aria-hidden />
                  )}
                  <div className="min-w-0 flex-1 break-words">
                    <div className="text-base font-semibold leading-snug text-foreground">
                      {[r.result, r.event_name].filter(Boolean).join(" · ")}
                    </div>
                    <div className="mt-0.5 text-[13px] text-muted-foreground">
                      {r.competition}
                      {r.result_date ? ` · ${new Date(r.result_date).toLocaleDateString("es-ES")}` : ""}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
        {m.bio && <p className="text-[15px] leading-relaxed text-foreground/80">{m.bio}</p>}
        {live && <MemberAsu26Live m={m} />}
        {m.link_url && (
          <a
            href={m.link_url}
            {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            className="font-condensed mt-auto inline-flex min-h-12 items-center justify-center border border-gold px-5 text-xs font-bold uppercase tracking-widest text-gold transition-colors hover:bg-gold hover:text-background"
          >
            {m.button_label?.trim() || "Ver más"}
          </a>
        )}
      </div>
    </article>
  );
}

export function SelectionClosing({ data }: { data: FeatureData }) {
  if (!hasClosing(data)) return null;
  const c = data.closing ?? {};
  return (
    <section className="bg-background py-12 md:py-16">
      <div className="mx-auto max-w-5xl px-4 md:px-6">
        {c.image_url?.trim() && (
          <div className="mb-8 aspect-[16/9] overflow-hidden rounded-2xl border border-border">
            <img src={c.image_url} alt={c.title || "Equipo"} loading="lazy" className="h-full w-full object-cover" />
          </div>
        )}
        <SpainStripe />
        {c.title?.trim() && (
          <h2 className="font-display mt-3 text-2xl uppercase tracking-wider text-gold md:text-4xl">{c.title}</h2>
        )}
        {c.text?.trim() && (
          <div className="mt-4 space-y-4 text-base leading-relaxed text-foreground/90">
            {c.text.split(/\n{2,}/).map((p, i) => <p key={i}>{p}</p>)}
          </div>
        )}
      </div>
    </section>
  );
}
