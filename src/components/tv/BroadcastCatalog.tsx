import { useUiText } from "@/lib/i18n/uiText";
import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Play, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { ExternalEmbedGate } from '@/components/site/ExternalEmbedGate';
import { videoEmbedUrl, videoThumbnail } from '@/lib/videoEmbed';
import { ASU26_EVENT_ID, BROADCAST_LABELS, visibleBroadcast, type ChampionshipBroadcast } from '@/lib/tv/broadcasts';

export function BroadcastCatalog({ items }: { items: ChampionshipBroadcast[] }) {
  const ui = useUiText();
  const [playing, setPlaying] = useState<ChampionshipBroadcast | null>(null);
  const visible = items.filter(visibleBroadcast);
  const upcoming = visible.filter(e => !e.stream_archived_at && e.stream_status !== 'finished').sort((a, b) => (a.stream_scheduled_at ?? '').localeCompare(b.stream_scheduled_at ?? ''));
  const archived = visible.filter(e => e.stream_archived_at || e.stream_status === 'finished');
  const source = playing?.stream_embed_url || playing?.stream_url || '';
  const embed = videoEmbedUrl(source);
  return <>
    {[{ id: 'retransmisiones', title: ui('Próximas retransmisiones'), entries: upcoming }, { id: 'archivo', title: ui('Archivo de competiciones'), entries: archived }].map(section => <section key={section.id} id={section.id} className="scroll-mt-28 border-y border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
        <h2 className="font-display text-3xl uppercase text-foreground">{section.title}</h2>
        {!section.entries.length && section.id === 'retransmisiones' && <p className="mt-4 text-sm text-muted-foreground">{ui('No hay próximas retransmisiones publicadas.')}</p>}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {section.entries.map(event => {
            const cover = event.stream_poster_url || videoThumbnail(event.stream_url);
            return <article key={event.id} className="overflow-hidden rounded-md border border-border bg-surface">
              <div className="relative aspect-video bg-background">{cover ? <picture>{event.stream_poster_mobile_url && <source media="(max-width: 640px)" srcSet={event.stream_poster_mobile_url} />}<img src={cover} alt={event.name} loading="lazy" className="h-full w-full object-cover" /></picture> : <Radio className="absolute inset-0 m-auto h-10 w-10 text-gold" />}</div>
              <div className="space-y-3 p-4"><p className="font-condensed text-xs uppercase text-gold">{ui(BROADCAST_LABELS[event.stream_status])}</p><h3 className="font-display break-words text-xl uppercase">{event.stream_title || event.name}</h3>
                {event.stream_scheduled_at && <p className="text-xs text-muted-foreground">{new Date(event.stream_scheduled_at).toLocaleString('es-ES')}{event.stream_ends_at && ` — ${new Date(event.stream_ends_at).toLocaleString('es-ES')}`}</p>}
                {event.id === ASU26_EVENT_ID ? <Link to="/rollerzone-tv/world-skate-games-asu26" className="font-condensed text-sm text-gold underline">{ui('Archivo ASU26')}</Link> : (event.stream_url || event.stream_embed_url) ? <Button variant="outline" onClick={() => setPlaying(event)}><Play className="h-4 w-4" /> {ui('Ver retransmisión')}</Button> : <p className="text-xs text-muted-foreground">{ui('Vídeo no disponible.')}</p>}
              </div>
            </article>;
          })}
          {section.id === 'archivo' && !archived.some(e => e.id === ASU26_EVENT_ID) && <article className="overflow-hidden rounded-md border border-border bg-surface"><div className="space-y-3 p-5"><p className="font-condensed text-xs uppercase text-gold">{ui('Finalizado')}</p><h3 className="font-display text-xl uppercase">World Skate Games ASU26</h3><p className="text-sm text-muted-foreground">Asunción 2026</p><Link to="/rollerzone-tv/world-skate-games-asu26" className="text-gold underline">{ui('Archivo ASU26')}</Link></div></article>}
        </div>
      </div>
    </section>)}
    <Dialog open={Boolean(playing)} onOpenChange={open => { if (!open) setPlaying(null); }}><DialogContent className="max-w-5xl"><DialogTitle>{playing?.stream_title || playing?.name}</DialogTitle><div className="aspect-video">{embed ? <ExternalEmbedGate provider={playing?.stream_provider || 'reproductor externo'} sourceUrl={source}><iframe src={embed} title={playing?.name} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen className="h-full w-full" /></ExternalEmbedGate> : <p className="p-6 text-muted-foreground">Reproducción integrada no disponible. {source && <a href={source} target="_blank" rel="noopener noreferrer" className="text-gold underline">Ver en la plataforma original</a>}</p>}</div>{playing?.stream_attribution && <p className="text-xs text-muted-foreground">{playing.stream_attribution}</p>}</DialogContent></Dialog>
  </>;
}