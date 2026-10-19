import { z } from 'zod';

export const broadcastStatus = z.enum(['upcoming', 'live', 'finished']);
export const BROADCAST_LABELS = { upcoming: 'Próximamente', live: 'En directo', finished: 'Finalizado' } as const;
export const ASU26_EVENT_ID = '8af85269-de02-4b16-b98f-8a4e7b7df6ee';
const EMBED_HOSTS = new Set(['www.youtube.com', 'www.youtube-nocookie.com', 'player.vimeo.com', 'players.cdn.enetres.net', 'iframe.mediadelivery.net', 'player.twitch.tv', 'www.facebook.com', 'web.facebook.com', 'live.speedskate.tv']);

export function authorizedVideo(input: string): string {
  const raw = input.trim();
  if (!raw) return '';
  const match = /<iframe\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/i.exec(raw);
  if (raw.includes('<') && (!match || /<script\b/i.test(raw))) throw new Error('Inserción no autorizada');
  const url = new URL(match?.[1] ?? raw);
  if (url.protocol !== 'https:' || url.username || url.password) throw new Error('El vídeo debe utilizar HTTPS');
  const host = url.hostname.toLowerCase();
  if (!EMBED_HOSTS.has(host) && !['youtube.com', 'youtu.be', 'vimeo.com', 'twitch.tv', 'facebook.com', 'fb.watch'].includes(host) && !host.endsWith('.worldskateeurope.org')) throw new Error('Proveedor no autorizado');
  return url.toString();
}

export const broadcastSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2).max(200),
  stream_title: z.string().trim().max(200),
  stream_description: z.string().trim().max(2000),
  stream_poster_url: z.string().trim().url().or(z.literal('')),
  stream_scheduled_at: z.string().datetime({ offset: true }).nullable(),
  stream_ends_at: z.string().datetime({ offset: true }).nullable(),
  stream_url: z.string().max(3000).transform(authorizedVideo),
  stream_status: broadcastStatus,
  stream_provider: z.string().trim().max(150),
  stream_attribution: z.string().trim().max(300),
  stream_published: z.boolean(),
}).refine(d => !d.stream_ends_at || !d.stream_scheduled_at || Date.parse(d.stream_ends_at) >= Date.parse(d.stream_scheduled_at), { message: 'El fin debe ser posterior al inicio' });

export type BroadcastInput = z.input<typeof broadcastSchema>;
export type ChampionshipBroadcast = {
  id: string; name: string; slug: string; published: boolean; status: string;
  stream_title: string | null; stream_description: string | null;
  stream_url: string | null; stream_embed_url: string | null;
  stream_poster_url: string | null; stream_poster_mobile_url?: string | null;
  stream_scheduled_at: string | null; stream_ends_at: string | null;
  stream_status: 'upcoming' | 'live' | 'finished'; stream_published: boolean;
  stream_archived_at: string | null; stream_provider: string | null; stream_attribution: string | null;
};
export const BROADCAST_COLUMNS = 'id,name,slug,published,status,stream_title,stream_description,stream_url,stream_embed_url,stream_poster_url,stream_poster_mobile_url,stream_scheduled_at,stream_ends_at,stream_status,stream_published,stream_archived_at,stream_provider,stream_attribution' as const;
export function visibleBroadcast(b: ChampionshipBroadcast) { return b.published && b.stream_published; }
export function selectableBroadcast(b: ChampionshipBroadcast) { return visibleBroadcast(b) && !b.stream_archived_at; }
export function archivePatch(at: string) { return { stream_status: 'finished' as const, stream_archived_at: at }; }