import { createStart, createMiddleware } from '@tanstack/react-start'

const SUPABASE_HOST = 'https://*.supabase.co'

/**
 * Allowlist derivada de los recursos que RollerZone.es usa hoy.
 * Se aplica SOLO en modo Report-Only: el navegador no bloquea nada,
 * únicamente informa a /api/public/csp-report de lo que incumpliría.
 */
const cspReportOnly = [
  "default-src 'self'",
  // Vite/HMR y GA necesitan inline+eval en dev; se revisará antes de pasar a modo bloqueante.
  `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://challenges.cloudflare.com https://cdn.gpteng.co`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  'font-src \'self\' data: https://fonts.gstatic.com',
  `img-src 'self' data: blob: ${SUPABASE_HOST} https://i.ytimg.com https://img.youtube.com https://www.google-analytics.com https://*.lovable.app https://*.lovableproject.com https://vumbnail.com https://*.cloudfront.net`,
  `media-src 'self' blob: data: ${SUPABASE_HOST} https://players.cdn.enetres.net`,
  `connect-src 'self' ${SUPABASE_HOST} wss://*.supabase.co https://www.google-analytics.com https://region1.google-analytics.com https://challenges.cloudflare.com`,
  [
    'frame-src',
    "'self'",
    'https://www.youtube.com',
    'https://www.youtube-nocookie.com',
    'https://player.vimeo.com',
    'https://players.cdn.enetres.net',
    'https://iframe.mediadelivery.net',
    'https://player.twitch.tv',
    'https://www.facebook.com',
    'https://web.facebook.com',
    'https://live.speedskate.tv',
    'https://*.worldskateeurope.org',
    'https://challenges.cloudflare.com',
  ].join(' '),
  "worker-src 'self' blob:",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  // frame-ancestors se deja permisivo a propósito: el editor de Lovable
  // embebe la web en un iframe y restringirlo rompería el preview.
  'report-uri /api/public/csp-report',
].join('; ')

const securityHeaders = createMiddleware({ type: 'request' }).server(
  async ({ next }) => {
    const result = await next()
    const headers = result.response.headers
    const contentType = headers.get('content-type') ?? ''

    headers.set('X-Content-Type-Options', 'nosniff')
    headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    headers.set(
      'Permissions-Policy',
      'geolocation=(), microphone=(), camera=(), payment=(), usb=()',
    )
    headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains',
    )
    headers.set('X-DNS-Prefetch-Control', 'on')

    // La CSP solo tiene sentido en documentos HTML.
    if (contentType.includes('text/html')) {
      headers.set('Content-Security-Policy-Report-Only', cspReportOnly)
    }

    return result
  },
)

export const startInstance = createStart(() => ({
  requestMiddleware: [securityHeaders],
}))
