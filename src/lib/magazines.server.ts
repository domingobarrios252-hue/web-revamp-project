import { supabaseAdmin } from '@/integrations/supabase/client.server'

const BUCKET = 'magazine-pages'
export const PAGE_URL_TTL = 300 // 5 min

export type MagazinePagesResult =
  | { ok: true; title: string; pages: string[] }
  | { ok: false; error: string }

/**
 * Devuelve URLs firmadas de las páginas de una revista SIEMPRE que la edición
 * esté publicada y marcada como de acceso público (o gratuita).
 * No requiere cuenta de usuario: la comprobación se hace en el servidor.
 */
export async function listPublicMagazinePages(id: string): Promise<MagazinePagesResult> {
  const { data: mag, error: magErr } = await supabaseAdmin
    .from('magazines')
    .select('id, title, published, is_free, public_access')
    .eq('id', id)
    .maybeSingle()

  if (magErr || !mag || !mag.published) {
    return { ok: false, error: 'Revista no disponible.' }
  }
  if (!mag.public_access && !mag.is_free) {
    return { ok: false, error: 'Esta edición no está disponible para lectura online.' }
  }

  const { data: files, error: listErr } = await supabaseAdmin.storage
    .from(BUCKET)
    .list(id, { limit: 500, sortBy: { column: 'name', order: 'asc' } })

  if (listErr || !files || files.length === 0) {
    return { ok: false, error: 'Esta revista aún no tiene páginas publicadas.' }
  }

  const paths = files
    .filter((f) => /\.(jpe?g|png|webp)$/i.test(f.name))
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
    .map((f) => `${id}/${f.name}`)

  if (paths.length === 0) {
    return { ok: false, error: 'Esta revista aún no tiene páginas publicadas.' }
  }

  const { data: signed, error: signErr } = await supabaseAdmin.storage
    .from(BUCKET)
    .createSignedUrls(paths, PAGE_URL_TTL)

  if (signErr || !signed) {
    return { ok: false, error: 'No se pudieron cargar las páginas.' }
  }

  return {
    ok: true,
    title: mag.title,
    pages: signed.map((s) => s.signedUrl).filter(Boolean) as string[],
  }
}
