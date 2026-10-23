import { createFileRoute } from "@tanstack/react-router";
import { EventoDetail, loadEventDetail } from "./eventos.$slug";

export const Route = createFileRoute("/en/events/$slug")({
  loader: ({ params }) => loadEventDetail(params.slug),
  head: ({ loaderData, params }) => {
    const event = loaderData?.event;
    const title = `${event?.name ?? "Event"} — RollerZone`;
    const description = "Event dates, venue, registration and information from RollerZone. Editorial information is shown in its original language.";
    const canonical = `https://rollerzone.es/eventos/${params.slug}`;
    const image = event?.cover_url;
    return {
      meta: [
        { title }, { name: "description", content: description },
        { property: "og:title", content: title }, { property: "og:description", content: description },
        { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
        { name: "robots", content: "noindex, follow" },
        ...(image && /^https:\/\//.test(image) ? [{ property: "og:image", content: image }, { name: "twitter:image", content: image }] : []),
      ],
      links: [{ rel: "canonical", href: canonical }, { rel: "alternate", hreflang: "es", href: canonical }],
    };
  },
  component: () => {
    const { event } = Route.useLoaderData();
    return <>
      {event.description && <p className="mx-auto max-w-6xl px-4 pt-5 text-xs text-muted-foreground">English editorial information is not available yet — showing the original.</p>}
      <EventoDetail event={event} />
    </>;
  },
});