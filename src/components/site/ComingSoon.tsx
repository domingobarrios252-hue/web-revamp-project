import { Link } from "@tanstack/react-router";
import { Sparkles, ArrowLeft } from "lucide-react";

interface Props {
  title?: string;
}

export function ComingSoon({ title }: Props) {
  return (
    <section className="mx-auto flex min-h-[70vh] max-w-3xl flex-col items-center justify-center px-6 py-20 text-center">
      <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full border border-[#D4A017]/40 bg-[#1A1A1A]">
        <Sparkles className="h-7 w-7 text-[#D4A017]" />
      </div>
      <p className="font-condensed mb-3 text-xs uppercase tracking-[0.3em] text-[#D4A017]">
        Próximamente
      </p>
      <h1 className="font-display text-4xl tracking-widest text-[#F5F5F5] md:text-5xl">
        {title ?? "Muy pronto disponible"}
      </h1>
      <p className="mt-5 max-w-xl text-base text-[#A0A0A0]">
        Esta sección estará disponible muy pronto. Estamos preparando algo especial para la
        comunidad del patinaje de velocidad.
      </p>
      <Link
        to="/"
        className="font-condensed mt-8 inline-flex items-center gap-2 rounded-[6px] border border-[#D4A017] bg-[#D4A017] px-6 py-3 text-xs font-bold uppercase tracking-widest text-[#1A1A1A] transition-colors hover:bg-[#B8890F]"
      >
        <ArrowLeft className="h-4 w-4" /> Volver al inicio
      </Link>
    </section>
  );
}
