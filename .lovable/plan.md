# Especiales Editoriales — sistema dinámico completo

Convertir el actual "Camino al Europeo 2026" (hoy hardcoded en `src/lib/specials/europeo-2026.ts` + tabla `special_pieces` sólo para piezas) en un sistema genérico gestionable desde el panel, sin perder contenido ni romper URLs actuales.

## 1. Base de datos

**Nueva tabla `special_editorials`** (los especiales en sí):
- `id`, `slug` (único), `title`, `subtitle`, `description`
- `cover_url`, `hero_image_url`
- `status` (`active` | `hidden` | `archived` | `draft`)
- `featured_home` (bool), `sort_order`
- `start_date`, `end_date`
- `created_at`, `updated_at`
- RLS: lectura pública sólo `status='active'`; admin gestiona todo. GRANTs a `anon` (select), `authenticated`, `service_role`.

**Ampliar `special_pieces`** (mantengo tabla y datos actuales):
- Añadir: `content_md` (texto largo con editor), `excerpt`, `thumbnail_url`, `category`, `external_url`, `related_news_ids uuid[]`, `related_result_event_ids uuid[]`, `related_video_ids uuid[]`.
- Cambiar `status` a enum lógico (`published` | `hidden` | `draft`); mantener columna `text` con CHECK para no romper filas actuales (`live`→`published` en migración de datos).
- FK lógica: `special_slug` referencia `special_editorials.slug` (constraint diferido, no rompe piezas actuales).

**Seed de migración**: insertar fila en `special_editorials` con `slug='camino-al-europeo-2026'`, `status='active'`, título/subtítulo/imagen tomados del actual `EVENT` para preservar la portada. Marcar todas las piezas actuales como `status='published'`.

## 2. Panel de administración

Rehacer `src/routes/admin.especiales.tsx` con dos paneles:

**Panel A — Lista de especiales**
- Botón `+ Nuevo Especial`
- Filtros: Todos / Activos / Ocultos / Archivados / Borradores
- Buscador por título/slug
- Cada fila: portada, título, slug, fechas, estado, destacado, acciones (editar, ver público, duplicar, ocultar/activar, archivar, eliminar con confirmación)
- Acción "Duplicar": copia especial + todas sus piezas como `draft` con nuevo slug.

**Panel B — Piezas del especial seleccionado**
- Selector superior para elegir especial activo
- Botón `+ Nueva Pieza`
- Lista con miniatura, orden, categoría, título, slug, estado, iconos (destacar, ver, editar, ocultar, eliminar)
- Reordenación drag-and-drop (usando `@dnd-kit/core`, ya en el proyecto si existe; si no, orden con flechas ↑↓ como fallback ligero)
- Formulario de pieza: todos los campos (título, kicker/categoría, slug, número, miniatura, imagen destacada, entradilla, contenido markdown, estado, orden, destacado, enlace externo, selectores multi para noticias/resultados/vídeos relacionados)

## 3. Web pública

**Rutas nuevas dinámicas** (mantienen todas las URLs existentes gracias al seed):
- `src/routes/especiales.index.tsx` — listado de especiales activos
- `src/routes/especiales.$slug.tsx` — portada de un especial (imagen, título, descripción, piezas destacadas arriba, resto ordenadas, noticias/resultados/vídeos relacionados)
- `src/routes/especiales.$slug.$piece.tsx` — ficha de una pieza (render markdown, relacionados, navegación entre piezas del especial)

**Compatibilidad con URLs actuales `/camino-al-europeo-2026/*`**:
- Mantener los archivos existentes de `camino-al-europeo-2026.*.tsx` pero refactorizarlos para consumir datos desde Supabase (mismo slug), no desde el objeto hardcoded. Así los enlaces publicados no se rompen.
- `src/lib/specials/europeo-2026.ts` queda como constantes de fallback (EVENT metadata + roster) mientras se migra ese contenido a DB en pasadas futuras. Marcado con TODO.

Solo se muestran especiales `status='active'` y piezas `status='published'`.

## 4. Componentes clave a crear

- `src/lib/specials/useSpecialEditorials.ts` — hooks `useSpecialEditorials()`, `useSpecialEditorial(slug)`, `useSpecialPieces(slug)` (reusar/ampliar el existente).
- `src/components/admin/specials/SpecialEditorialForm.tsx`
- `src/components/admin/specials/SpecialPieceForm.tsx` (con editor markdown ya usado en admin.noticias)
- `src/components/admin/specials/SpecialsList.tsx`
- `src/components/admin/specials/PiecesList.tsx` (con drag-and-drop)
- `src/components/specials/SpecialLandingDynamic.tsx` — portada genérica reutilizable
- `src/components/specials/SpecialPieceView.tsx` — vista genérica de pieza

## 5. Qué NO se toca

- Diseño oscuro/premium actual (reutilizo tokens gold/surface).
- Piezas y textos existentes del Europeo 2026 (migrados 1:1).
- Roster de la selección española (`SPAIN_CALLUP`) permanece en el archivo actual y sigue mostrándose en `camino-al-europeo-2026.convocatoria-seleccion-espanola.tsx`.
- Tablas y flujos ajenos (noticias, resultados, TV) — sólo se consultan como relaciones opcionales.

## 6. Orden de ejecución

1. Migración SQL: crear `special_editorials`, ampliar `special_pieces`, insertar seed del Europeo, migrar `status`.
2. Hooks + tipos actualizados.
3. Nuevo `admin.especiales.tsx` completo (lista + piezas + formularios + drag-and-drop).
4. Rutas públicas `/especiales`, `/especiales/$slug`, `/especiales/$slug/$piece`.
5. Refactor de las rutas `camino-al-europeo-2026.*` para leer desde DB con fallback al objeto actual (cero regresión visual).
6. Verificación: build + Playwright rápido sobre `/especiales/camino-al-europeo-2026` y `/admin/especiales`.

## Nota técnica

Volumen alto (≈8–10 archivos nuevos, 1 migración, refactor de 8 rutas). Lo abordo en un único bloque para dejarlo funcionando end-to-end; el refactor de las rutas Europeo preserva la UI actual leyendo de DB, con fallback a las constantes locales si la fila no existe.
