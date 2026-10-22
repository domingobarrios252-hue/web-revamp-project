import { createFileRoute } from '@tanstack/react-router';
import { RollerzoneTvPage } from '@/components/tv/RollerzoneTvPage';
export const Route = createFileRoute('/rollerzone-tv/')({
  head: () => ({ meta: [
    { title: 'Rollerzone TV | Retransmisiones y archivo de patinaje de velocidad' },
    { name: 'description', content: 'Retransmisiones de patinaje de velocidad, próximas competiciones y archivo de Rollerzone TV, incluido ASU26.' },
    { property: 'og:title', content: 'Rollerzone TV · Retransmisiones y archivo' },
    { property: 'og:description', content: 'Competiciones en directo, próximas retransmisiones y archivo histórico de patinaje de velocidad.' },
    { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' },
  ], links: [{ rel: 'canonical', href: 'https://rollerzone.es/rollerzone-tv' }, { rel: 'alternate', hreflang: 'es', href: 'https://rollerzone.es/rollerzone-tv' }, { rel: 'alternate', hreflang: 'en', href: 'https://rollerzone.es/en/rollerzone-tv' }, { rel: 'alternate', hreflang: 'x-default', href: 'https://rollerzone.es/rollerzone-tv' }] }),
  component: RollerzoneTvPage,
});
