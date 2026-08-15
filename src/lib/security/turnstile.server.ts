/**
 * Verificación server-side de Cloudflare Turnstile.
 *
 * La clave secreta vive SOLO como secret del backend (TURNSTILE_SECRET_KEY);
 * nunca se envía al navegador. Mientras el secret no esté configurado, la
 * verificación se omite (modo preparado) para no bloquear los formularios.
 */
export type TurnstileResult = { ok: boolean; reason?: string; enforced: boolean }

export async function verifyTurnstile(
  token: string | null | undefined,
  ip?: string | null,
): Promise<TurnstileResult> {
  const secret = process.env['TURNSTILE_SECRET_KEY']
  if (!secret) return { ok: true, enforced: false }

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
