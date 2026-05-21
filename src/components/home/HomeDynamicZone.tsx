import { useHomeMode } from "@/lib/home/useHomeMode";
import { HomeStandingsCarousel } from "@/components/home/HomeStandingsCarousel";
import { LiveEventCenter } from "@/components/home/LiveEventCenter";

export function HomeDynamicZone() {
  const { mode, loading } = useHomeMode();
  if (loading) return null;
  if (mode === "none") return null;
  if (mode === "liga") return <HomeStandingsCarousel />;
  if (mode === "live") return <LiveEventCenter />;
  return (
    <>
      <LiveEventCenter />
      <HomeStandingsCarousel />
    </>
  );
}
