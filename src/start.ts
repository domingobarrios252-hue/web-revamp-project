import { createStart, createMiddleware } from '@tanstack/react-start'

/**
 * Cabeceras de seguridad aplicadas a todas las respuestas HTML/SSR.
 * No se incluye `frame-ancestors` ni CSP restrictiva para no romper
 * el preview del editor, los iframes de retransmisión ni Google Analytics.
 */
const securityHeaders = createMiddleware({ type: 'request' }).server(
  async ({ next }) => {
    const result = await next()
    const headers = result.response.headers
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
    return result
  },
)

export const startInstance = createStart(() => ({
  requestMiddleware: [securityHeaders],
}))
