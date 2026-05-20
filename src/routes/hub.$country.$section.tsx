import { createFileRoute, Link } from "@tanstack/react-router";
import { HUB_SECTIONS, type HubSectionKey } from "@/lib/hub/useCountryHub";
import { Construction } from "lucide-react";

export const Route = createFileRoute("/hub/$country/$section")({
  component: HubSectionPage,
});

function HubSectionPage() {
  const { country, section } = Route.useParams();
  const meta = HUB_SECTIONS.find((s) => s.key === (section as HubSectionKey));

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-6 py-12">
      <div className="rounded-[8px] border border-dashed border-[#333] bg-[#1A1A1A] p-10 md:p-16 text-center">
        <Construction className="mx-auto h-10 w-10 text-[#D4A017] mb-4" />
        <div className="font-ui text-[11px] font-bold uppercase tracking-[0.2em] text-[#D4A017] mb-2">
          Próximamente
        </div>
        <h2 className="font-display text-3xl md:text-4xl font-black text-[#F5F5F5]">
          {meta?.label ?? section}
        </h2>
        <p className="mt-3 max-w-xl mx-auto text-sm text-[#B5B5B5]">
          Estamos construyendo esta sección del Hub. Pronto encontrarás aquí todo el contenido
          editorial premium dedicado a {meta?.label?.toLowerCase() ?? section}.
        </p>
        <Link
          to="/hub/$country"
          params={{ country }}
          className="mt-6 inline-flex items-center gap-2 rounded-[4px] border border-[#D4A017] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[#D4A017] hover:bg-[#D4A017] hover:text-[#1A1A1A] transition-colors"
        >
          Volver al inicio del Hub
        </Link>
      </div>
    </div>
  );
}
