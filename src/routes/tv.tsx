import { createFileRoute } from "@tanstack/react-router";
import { RollerzoneTvPage } from "@/components/tv/RollerzoneTvPage";

const TV_OG_IMAGE = "https://rollerzone.es/__l5e/assets-v1/57c70012-bbe9-4642-b766-6b243447cc73/og-rollerzone-tv.jpg";
const TV_CANONICAL = "https://rollerzone.es/rollerzone-tv";
const TV_TITLE = "Rollerzone TV | El canal del patinaje de velocidad";
const TV_DESCRIPTION =
  "Directos, retransmisiones, vídeos, momentos destacados y contenido audiovisual del patinaje de velocidad nacional e internacional.";

export const Route = createFileRoute("/tv")({
  head: () => ({
    meta: [
      { title: TV_TITLE },
      { name: "description", content: TV_DESCRIPTION },
      { property: "og:title", content: TV_TITLE },
      { property: "og:description", content: TV_DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: TV_CANONICAL },
      { property: "og:image", content: TV_OG_IMAGE },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: "RollerZone TV — El canal del patinaje de velocidad" },
      { property: "og:site_name", content: "RollerZone" },
      { property: "og:locale", content: "es_ES" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: TV_TITLE },
      { name: "twitter:description", content: TV_DESCRIPTION },
      { name: "twitter:image", content: TV_OG_IMAGE },
      { name: "twitter:image:alt", content: "RollerZone TV — El canal del patinaje de velocidad" },
    ],
    links: [{ rel: "canonical", href: TV_CANONICAL }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "BroadcastService",
              name: "Rollerzone TV",
              url: TV_CANONICAL,
              inLanguage: "es-ES",
              broadcastDisplayName: "Rollerzone TV",
              description: TV_DESCRIPTION,
              publisher: { "@type": "Organization", name: "Rollerzone", url: "https://rollerzone.es" },
              areaServed: ["ES", "CO", "PT"],
            },
            {
              "@type": "VideoObject",
              name: TV_TITLE,
              description: TV_DESCRIPTION,
              thumbnailUrl: [TV_OG_IMAGE],
              uploadDate: "2025-01-01T00:00:00.000Z",
              contentUrl: TV_CANONICAL,
              embedUrl: TV_CANONICAL,
              publisher: { "@type": "Organization", name: "Rollerzone", url: "https://rollerzone.es" },
            },
          ],
        }).replace(/</g, "\\u003c"),
      },
    ],
  }),
  component: RollerzoneTvPage,
});


