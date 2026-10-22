import { notFound } from "@tanstack/react-router";
import { useCountryHub } from "@/lib/hub/useCountryHub";
import { HubHero } from "./HubHero";
import { HubDashboard } from "./HubDashboard";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
export function BilingualHubPage({ country }: { country: string }) {
  const { hub, loading } = useCountryHub(country);
  const { t } = useLanguage();
  if (loading) return <p className="px-6 py-12 text-muted-foreground">{t("common.loading")}</p>;
  if (!hub) throw notFound();
  return <div className="hub-readable bg-background"><HubHero hub={hub} /><HubDashboard country={country} /></div>;
}
