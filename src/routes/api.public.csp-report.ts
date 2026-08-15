import { createFileRoute } from '@tanstack/react-router'

type CspBody = {
  'csp-report'?: Record<string, unknown>
  [key: string]: unknown
}

function str(v: unknown, max = 500): string | null {
  if (typeof v !== 'string' || !v) return null
  return v.slice(0, max)
}

/**
 * Receptor de informes de la CSP en modo Report-Only.
 * Público a propósito (lo llama el navegador sin sesión), sin datos sensibles:
 * solo guarda qué recurso incumpliría la política.
 */
export const Route = createFileRoute('/api/public/csp-report')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const text = await request.text()
          if (!text || text.length > 20_000) return new Response(null, { status: 204 })

          const parsed = JSON.parse(text) as CspBody
          const reports = Array.isArray(parsed)
            ? (parsed as Array<Record<string, unknown>>).map(
                (r) => (r['body'] as Record<string, unknown>) ?? r,
              )
            : [(parsed['csp-report'] as Record<string, unknown>) ?? parsed]

          const { supabaseAdmin } = await import('@/integrations/supabase/client.server')

          const rows = reports.slice(0, 10).map((r) => ({
            document_uri: str(r['document-uri'] ?? r['documentURL']),
            blocked_uri: str(r['blocked-uri'] ?? r['blockedURL']),
            violated_directive: str(r['violated-directive'] ?? r['effectiveDirective'], 120),
            effective_directive: str(r['effective-directive'] ?? r['effectiveDirective'], 120),
            disposition: str(r['disposition'], 40) ?? 'report',
            user_agent: str(request.headers.get('user-agent'), 300),
            raw: r as never,
          }))

          if (rows.length) await supabaseAdmin.from('csp_reports').insert(rows)
        } catch {
          // Nunca devolvemos error al navegador por un informe malformado.
        }
        return new Response(null, { status: 204 })
      },
    },
  },
})
