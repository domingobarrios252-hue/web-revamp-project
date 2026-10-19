import { createServerFn } from '@tanstack/react-start';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { ASU26_EVENT_ID, BROADCAST_COLUMNS, archivePatch, broadcastSchema, type ChampionshipBroadcast } from './broadcasts';

export const getPublicBroadcasts = createServerFn({ method: 'GET' }).handler(async () => {
  const url = process.env['SUPABASE_URL'];
  const key = process.env['SUPABASE_PUBLISHABLE_KEY'] ?? process.env['SUPABASE_ANON_KEY'];
  if (!url || !key) throw new Error('Retransmisiones no disponibles');
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: (input, init) => {
    const headers = new Headers(init?.headers);
    if (key.startsWith('sb_') && headers.get('Authorization') === `Bearer ${key}`) headers.delete('Authorization');
    headers.set('apikey', key);
    return fetch(input, { ...init, headers });
  } } });
  const [events, settings] = await Promise.all([
    db.from('result_events').select(BROADCAST_COLUMNS).eq('published', true).eq('stream_published', true).order('stream_scheduled_at', { ascending: false }),
    db.from('tv_settings').select('featured_result_event_id').order('updated_at', { ascending: false }).limit(1).maybeSingle(),
  ]);
  if (events.error || settings.error) throw new Error('No se pudieron cargar las retransmisiones');
  return { events: events.data as ChampionshipBroadcast[], featuredId: settings.data?.featured_result_event_id as string | null };
});

export const getAdminBroadcasts = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const { data: admin } = await context.supabase.rpc('has_role', { _user_id: context.userId, _role: 'admin' });
  if (!admin) throw new Error('Acceso reservado al administrador');
  const [events, settings] = await Promise.all([
    context.supabase.from('result_events').select(BROADCAST_COLUMNS).order('event_date', { ascending: false }),
    context.supabase.from('tv_settings').select('id,featured_result_event_id').order('updated_at', { ascending: false }).limit(1).maybeSingle(),
  ]);
  if (events.error || settings.error) throw new Error('No se pudieron cargar las retransmisiones');
  return { events: events.data as ChampionshipBroadcast[], settings: settings.data };
});

export const saveBroadcast = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator(broadcastSchema).handler(async ({ data, context }) => {
  const { data: admin } = await context.supabase.rpc('has_role', { _user_id: context.userId, _role: 'admin' });
  if (!admin) throw new Error('Acceso reservado al administrador');
  const { id, name, ...fields } = data;
  if (id === ASU26_EVENT_ID) throw new Error('ASU26 se conserva en su gestor específico');
  const payload = { ...fields, stream_url: fields.stream_url || null, stream_embed_url: null, stream_poster_url: fields.stream_poster_url || null };
  const result = id
    ? await context.supabase.from('result_events').update(payload).eq('id', id).select('id').single()
    : await context.supabase.from('result_events').insert({ ...payload, name, slug: `${name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').slice(0, 100)}-${crypto.randomUUID().slice(0, 8)}`, published: true }).select('id').single();
  if (result.error) throw new Error('No se pudo guardar la retransmisión');
  return result.data;
});

export const changeBroadcast = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator(z.object({ id: z.string().uuid().nullable(), action: z.enum(['feature', 'archive', 'restore', 'publish', 'hide']) })).handler(async ({ data, context }) => {
  const { data: admin } = await context.supabase.rpc('has_role', { _user_id: context.userId, _role: 'admin' });
  if (!admin) throw new Error('Acceso reservado al administrador');
  if (!data.id && data.action !== 'feature') throw new Error('Selecciona un campeonato');
  if (data.action === 'feature') {
    if (data.id) {
      const { data: event } = await context.supabase.from('result_events').select('published,stream_published,stream_archived_at').eq('id', data.id).single();
      if (!event?.published || !event.stream_published || event.stream_archived_at || data.id === ASU26_EVENT_ID) throw new Error('Esta retransmisión no se puede destacar');
    }
    const { data: settings } = await context.supabase.from('tv_settings').select('id').order('updated_at', { ascending: false }).limit(1).maybeSingle();
    const result = settings ? await context.supabase.from('tv_settings').update({ featured_result_event_id: data.id }).eq('id', settings.id) : await context.supabase.from('tv_settings').insert({ featured_result_event_id: data.id });
    if (result.error) throw new Error('No se pudo cambiar el destacado');
  } else if (data.id) {
    if (data.id === ASU26_EVENT_ID) throw new Error('ASU26 se conserva en su gestor específico');
    const patch = data.action === 'archive' ? archivePatch(new Date().toISOString()) : data.action === 'restore' ? { stream_archived_at: null } : { stream_published: data.action === 'publish' };
    const result = await context.supabase.from('result_events').update(patch).eq('id', data.id);
    if (result.error) throw new Error('No se pudo actualizar la retransmisión');
    if (data.action === 'archive' || data.action === 'hide') {
      const cleared = await context.supabase.from('tv_settings').update({ featured_result_event_id: null }).eq('featured_result_event_id', data.id);
      if (cleared.error) throw new Error('La retransmisión se guardó, pero no se pudo limpiar el destacado');
    }
  }
  return { success: true };
});