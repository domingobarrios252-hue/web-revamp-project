/**
 * Verificación server-side de Cloudflare Turnstile.
 *
 * La clave secreta vive SOLO como secret del backend (TURNSTILE_SECRET_KEY);
 * nunca se envía al navegador ni aparece en mensajes de error.
 *
 * Modos:
 *  - Turnstile NO configurado (ni site key ni secret): modo preparado, se omite
 *    la verificación para no bloquear los formularios (fase previa a las claves).
 *  - Turnstile configurado (existe site key pública o secret): FAIL-CLOSED.
 *    Sin token, token inválido/caducado, error de red o secret ausente => RECHAZO.
 */
export type TurnstileResult = { ok: boolean; reason?: string; enforced: boolean }

function turnstileConfigured(): boolean {
  return Boolean(
    process.env['TURNSTILE_SECRET_KEY'] ||
      process.env['VITE_TURNSTILE_SITE_KEY'] ||
      process.env['TURNSTILE_SITE_KEY'],
  )
}

export async function verifyTurnstile(
  token: string | null | undefined,
  ip?: string | null,
): Promise<TurnstileResult> {
  const secret = process.env['TURNSTILE_SECRET_KEY']

  // Fase previa: Turnstile aún no está configurado en ningún lado.
  if (!secret && !turnstileConfigured()) {
    return { ok: true, enforced: false }
  }

  // Turnstile activo pero sin clave secreta: error de configuración, nunca "pasa".
  if (!secret) {
    console.error('[turnstile] configuración incompleta: falta TURNSTILE_SECRET_KEY')
    return { ok: false, reason: 'misconfigured', enforced: true }
  }

  if (!token || token.length > 4096) {
    return { ok: false, reason: 'missing-token', enforced: true }
  }

  const body = new URLSearchParams({ secret, response: token })
  if (ip) body.set('remoteip', ip)

  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body,
    })
    if (!res.ok) return { ok: false, reason: 'verify-http-' + res.status, enforced: true }
    const data = (await res.json()) as { success?: boolean; 'error-codes'?: string[] }
    return data.success
      ? { ok: true, enforced: true }
      : { ok: false, reason: (data['error-codes'] ?? []).join(',') || 'failed', enforced: true }
  } catch {
    return { ok: false, reason: 'verify-unreachable', enforced: true }
  }
}

/** Identidad estable y anónima (hash) para el control de frecuencia. */
export async function identityHash(ip: string, extra = ''): Promise<string> {
  const data = new TextEncoder().encode(`${ip}|${extra}|rollerzone`)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 48)
}

export function clientIp(headers: Headers): string {
  return (
    headers.get('cf-connecting-ip') ??
    headers.get('x-real-ip') ??
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    'unknown'
  )
}
