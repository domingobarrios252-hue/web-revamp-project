import { PenLine, Globe2, Mic, Camera } from "lucide-react";
import { ContributorSignupForm } from "./ContributorSignupForm";
import { useRedactoresContent, type RedactoresContent } from "@/lib/home/useRedactoresContent";

export function JoinContributorsBlock({ override }: { override?: RedactoresContent }) {
  const { content: live } = useRedactoresContent();
  const c = override ?? live;

  const items = [
    { Icon: PenLine, label: c.item1_label, text: c.item1_text },
    { Icon: Mic, label: c.item2_label, text: c.item2_text },
    { Icon: Camera, label: c.item3_label, text: c.item3_text },
    { Icon: Globe2, label: c.item4_label, text: c.item4_text },
  ];

  return (
    <section
      id="colaborar"
      className="relative scroll-mt-20 overflow-hidden border-y border-gold/30 bg-background py-16 md:py-24"
    >
      <div className="absolute inset-0 opacity-[0.07]" aria-hidden="true">
        <div className="hero-grid-bg h-full w-full" />
      </div>
      <div
        className="absolute -left-32 top-1/2 h-[480px] w-[480px] -translate-y-1/2 rounded-full bg-gold/10 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="absolute -right-32 bottom-0 h-[420px] w-[420px] rounded-full bg-tv-red/10 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative mx-auto grid max-w-7xl gap-10 px-5 md:px-6 lg:grid-cols-[1.1fr_1fr] lg:items-start">
        <div>
          <div className="font-condensed inline-flex items-center gap-2 bg-gold px-2.5 py-1 text-[10px] font-bold uppercase tracking-[3px] text-background">
            <PenLine className="h-3 w-3" /> {c.badge}
          </div>
          <h2 className="font-display mt-4 text-3xl uppercase leading-[1] tracking-wider text-foreground md:text-5xl lg:text-6xl">
            {c.title_line1}
            <span className="text-gold"> {c.title_highlight}</span> {c.title_line2}
          </h2>
          <div className="mt-4 h-[3px] w-24 bg-gold" aria-hidden="true" />
          <p className="mt-5 max-w-xl text-base leading-relaxed text-foreground/85 md:text-lg">
            {c.description}
          </p>

          <ul className="mt-7 grid grid-cols-2 gap-3 sm:max-w-md">
            {items.map(({ Icon, label, text }) => (
              <li
                key={label}
                className="flex items-start gap-3 rounded-lg border border-border bg-surface/70 p-3 backdrop-blur"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-gold/15 text-gold">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="font-display text-sm uppercase tracking-wider text-foreground">
                    {label}
                  </div>
                  <div className="font-condensed text-[11px] uppercase tracking-widest text-muted-foreground">
                    {text}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <ContributorSignupForm override={override} />
      </div>
    </section>
  );
}
