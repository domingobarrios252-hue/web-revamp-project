import { test, expect } from 'bun:test';
import { archivePatch, authorizedVideo, broadcastSchema, selectableBroadcast, visibleBroadcast, type ChampionshipBroadcast } from '../src/lib/tv/broadcasts';
const event: ChampionshipBroadcast = { id: '11111111-1111-4111-8111-111111111111', name: 'Campeonato', slug: 'campeonato', published: true, status: 'proxima', stream_title: null, stream_description: null, stream_url: null, stream_embed_url: null, stream_poster_url: null, stream_scheduled_at: null, stream_ends_at: null, stream_status: 'upcoming', stream_published: true, stream_archived_at: null, stream_provider: null, stream_attribution: null };
test('los tres estados de retransmisión son manuales', () => {
  for (const stream_status of ['upcoming', 'live', 'finished']) expect(broadcastSchema.safeParse({ name: 'Campeonato', stream_title: '', stream_description: '', stream_url: '', stream_poster_url: '', stream_scheduled_at: null, stream_ends_at: null, stream_status, stream_provider: '', stream_attribution: '', stream_published: false }).success).toBe(true);
  expect(broadcastSchema.safeParse({ stream_status: 'automatic' }).success).toBe(false);
});
test('ocultar retransmisión no cambia publicación del campeonato', () => {
  expect(visibleBroadcast({ ...event, stream_published: false })).toBe(false);
  expect(event.published).toBe(true);
});
test('un campeonato no publicado no puede aparecer en TV', () => expect(visibleBroadcast({ ...event, published: false })).toBe(false));
test('un archivo se conserva y solo finaliza la retransmisión', () => expect(archivePatch('2026-10-19T12:00:00Z')).toEqual({ stream_status: 'finished', stream_archived_at: '2026-10-19T12:00:00Z' }));
test('una retransmisión archivada no puede destacarse', () => expect(selectableBroadcast({ ...event, stream_archived_at: '2026-10-19T12:00:00Z' })).toBe(false));
test('una retransmisión oculta no puede destacarse', () => expect(selectableBroadcast({ ...event, stream_published: false })).toBe(false));
test('inserción autorizada guarda solo URL y no HTML', () => expect(authorizedVideo('<iframe src="https://www.youtube.com/embed/abcdef12345"></iframe>')).toBe('https://www.youtube.com/embed/abcdef12345'));
test('se rechazan scripts y proveedores no autorizados', () => {
  expect(() => authorizedVideo('<script>alert(1)</script><iframe src="https://www.youtube.com/embed/x"></iframe>')).toThrow();
  expect(() => authorizedVideo('https://evil.example/embed/x')).toThrow();
  expect(() => authorizedVideo('http://www.youtube.com/embed/x')).toThrow();
});
test('la fecha final no puede preceder al inicio', () => expect(broadcastSchema.safeParse({ name: 'Campeonato', stream_title: '', stream_description: '', stream_url: '', stream_poster_url: '', stream_scheduled_at: '2026-10-21T12:00:00Z', stream_ends_at: '2026-10-20T12:00:00Z', stream_status: 'upcoming', stream_provider: '', stream_attribution: '', stream_published: false }).success).toBe(false));