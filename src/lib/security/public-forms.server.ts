import { getRequest } from '@tanstack/react-start/server'
import { z } from 'zod'
import { verifyTurnstile, identityHash, clientIp } from './turnstile.server'

export const newsletterInput = z.object({
  email: z.string().trim().email().max(255),
  source: z.string().trim().max(60).optional(),
  // El consentimiento es obligatorio: sin casilla marcada no hay suscripción.
  consent: z.literal(true),
  turnstileToken: z.string().max(4096).optional().nullable(),
})

export const newsletterTokenInput = z.object({
  token: z
    .string()
    .trim()
    .regex(/^[a-f0-9]{64}$/, 'token inválido'),
})


export const contributorInput = z.object({
  full_name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(255),
  country: z.string().trim().min(2).max(80),
  region: z.string().trim().max(120).optional().nullable(),
  club_or_federation: z.string().trim().max(160).optional().nullable(),
  topics: z.string().trim().min(2).max(500),
  role_type: z.enum(['redactor', 'corresponsal', 'fotografo', 'otro']),
  message: z.string().trim().max(3000).optional().nullable(),
  turnstileToken: z.string().max(4096).optional().nullable(),
})

export const communityInput = z.object({
  submission_type: z.enum(['noticia', 'evento', 'otro']),
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().max(40).optional().nullable(),
  title: z.string().trim().min(3).max(200),
  description: z.string().trim().min(10).max(5000),
  country_code: z.string().trim().min(2).max(8),
  image_urls: z.array(z.string().url().max(500)).max(6).optional().default([]),
  turnstileToken: z.string().max(4096).optional().nullable(),
})

export type GuardResult = { ok: true; ipHash: string } | { ok: false; error: string }

/**
 * Puerta única para los formularios públicos:
 * 1) anti-bot (Turnstile, si está configurado)
 * 2) rate limiting por IP en la base de datos
 */
export async function guardPublicForm(
  action: string,
  token: string | null | undefined,
  limits: { max: number; windowSeconds: number },
): Promise<GuardResult> {
  const request = getRequest()
  const ip = clientIp(request?.headers ?? new Headers())
  const ipHash = await identityHash(ip, action)

  const captcha = await verifyTurnstile(token, ip === 'unknown' ? null : ip)
  if (!captcha.ok) {
    return { ok: false, error: 'Verificación anti-bot no superada. Recarga la página e inténtalo de nuevo.' }
  }

  const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
  const { data: allowed, error } = await supabaseAdmin.rpc('check_rate_limit', {
    _action: action,
    _identity: ipHash,
    _max_hits: limits.max,
    _window_seconds: limits.windowSeconds,
  })

  if (error) return { ok: false, error: 'No se ha podido procesar el envío. Inténtalo más tarde.' }
  if (allowed === false) {
    return { ok: false, error: 'Demasiados envíos desde tu conexión. Espera unos minutos e inténtalo de nuevo.' }
  }

  return { ok: true, ipHash }
}
