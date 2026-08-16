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

const imagePath = z
  .string()
  .trim()
  .max(300)
  .regex(/^[a-z0-9-]{2,8}\/[a-z0-9-]+\.(jpg|jpeg|png|webp)$/i, 'ruta de imagen no válida')

export const communityInput = z
  .object({
    submission_type: z.enum(['noticia', 'evento', 'otro']),
    name: z.string().trim().min(2).max(120),
    email: z.string().trim().email().max(255),
    title: z.string().trim().min(3).max(200),
    description: z.string().trim().min(10).max(5000),
    country_code: z.string().trim().min(2).max(8),
    // Material fotográfico: rutas en almacenamiento privado (nunca URLs públicas)
    image_paths: z.array(imagePath).max(6).optional().default([]),
    photo_credit: z.string().trim().max(160).optional().nullable(),
    has_minors: z.boolean().optional().nullable(),
    // Declaraciones obligatorias
    declaration_age14: z.literal(true),
    declaration_rights: z.literal(true),
    declaration_editorial_use: z.literal(true),
    // Obligatorias solo si se adjuntan imágenes
    declaration_people_images: z.boolean().optional().default(false),
    declaration_minors_auth: z.boolean().optional().default(false),
    declarations_version: z.string().trim().min(1).max(40),
    turnstileToken: z.string().max(4096).optional().nullable(),
  })
  .superRefine((data, ctx) => {
    const hasImages = (data.image_paths ?? []).length > 0
    if (!hasImages) return
    if (data.has_minors !== true && data.has_minors !== false) {
      ctx.addIssue({
        code: 'custom',
        path: ['has_minors'],
        message: 'Indica si aparecen menores de edad identificables en las imágenes.',
      })
    }
    if (!data.declaration_people_images) {
      ctx.addIssue({
        code: 'custom',
        path: ['declaration_people_images'],
        message: 'Falta la declaración sobre las imágenes de personas.',
      })
    }
    if (data.has_minors === true && !data.declaration_minors_auth) {
      ctx.addIssue({
        code: 'custom',
        path: ['declaration_minors_auth'],
        message: 'Falta la declaración de autorización para imágenes de menores.',
      })
    }
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
