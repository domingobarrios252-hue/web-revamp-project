
# Rediseño RollerZone TV

Rediseño completo de la página `/tv`, gestión ampliada en el admin y detección de directo en la home. Reutilizo las tablas existentes (`tv_settings`, `tv_highlights`, `tv_broadcasts`, `ad_banners`) y añado soporte para banners laterales/premium y bloque de suscripción.

## 1. Base de datos

**Nuevos placements en `ad_banners`** (no requiere migración de estructura, solo convenciones):
- `tv_sidebar` — banners verticales columna derecha (múltiples, ordenados).
- `tv_premium` — banner premium horizontal ancho completo. Si hay varios activos → modo slider automático.

**Migración**: extender `tv_settings` con:
- `live_is_active` (bool) — override manual de "directo activo ahora".
- `status_label` (text: `live`|`upcoming`|`finished`) — subestado editable.
- `premium_slider_enabled` (bool, default true) — auto-slider si hay >1 premium.
- `premium_interval_ms` (int, default 5000).
- `premium_show_arrows` (bool), `premium_show_dots` (bool), `premium_autoplay` (bool).
- `subscribe_title`, `subscribe_text`, `subscribe_button_text`, `subscribe_button_url`.

"Directo activo" se calcula así: `live_is_active === true` **o** (`live_starts_at ≤ now ≤ live_ends_at`).

## 2. Página `/tv` rediseño

Nuevo layout en `src/routes/tv.tsx`:

```text
┌──────────────────────────────────────────────┐
│ ROLLERZONE TV · [● EN DIRECTO] · Título      │
├─────────────────────────────┬────────────────┤
│                             │ [Banner V]     │
│      Reproductor 16:9       │ [Banner V]     │
│                             │ [Banner V]     │
├─────────────────────────────┴────────────────┤
│      BANNER PREMIUM (estático o slider)      │
├──────────────────────────────────────────────┤
│  Próximas carreras (tv_broadcasts)           │
├──────────────────────────────────────────────┤
│  Highlights & momentos (tv_highlights)       │
├──────────────────────────────────────────────┤
│  Bloque suscripción CTA                      │
└──────────────────────────────────────────────┘
```

Componentes nuevos en `src/components/tv/`:
- `TvHero.tsx` — cabecera con estado + título.
- `TvPlayer.tsx` — reproductor 16:9 (usa `videoEmbedUrl`).
- `TvSidebarBanners.tsx` — lista vertical de `ad_banners` con placement `tv_sidebar`.
- `TvPremiumBanner.tsx` — estático si 1 slide, carrusel fade con autoplay/arrows/dots si múltiples.
- `TvUpcomingBroadcasts.tsx` — lista de `tv_broadcasts`.
- `TvHighlightsGrid.tsx` — grid de `tv_highlights` con modal player.
- `TvSubscribeCTA.tsx` — bloque final desde `tv_settings`.

Responsive: grid 2 columnas en `lg:`, columna única apilada en móvil (banners debajo del video).

## 3. Home — detección de directo

Modifico `src/components/home/RollerZoneTVHome.tsx`:
- Cargar `tv_settings` en paralelo.
- Si hay directo activo → renderizar tarjeta destacada con badge rojo "EN DIRECTO", título del evento, preview (thumbnail o embed), botón "Ver directo" → `/tv`.
- Si no → comportamiento actual (últimos highlights).

## 4. Panel admin

Reestructuro `src/routes/admin.tv.tsx` con pestañas/secciones:
1. **Evento principal** — título, subtítulo, estado (live/upcoming/finished), toggle "En directo ahora", URL de stream, fechas inicio/fin (existente + nuevo).
2. **Banners laterales** — link al admin de banners con filtro `placement=tv_sidebar` (reutiliza `admin.banners.tsx`).
3. **Banner premium** — mismo, `placement=tv_premium`, más ajustes de slider (autoplay/velocidad/flechas/puntos) sobre `tv_settings`.
4. **Suscripción** — 4 campos editables.

`admin.tv-emisiones.tsx` y `admin.tv-highlights.tsx` ya cubren próximas carreras y highlights — verifico que existen y añado enlaces de acceso rápido.

En `src/routes/admin.banners.tsx` añado las nuevas opciones `tv_sidebar` y `tv_premium` al selector de placement.

## 5. Diseño

Se mantiene el sistema existente: fondo `bg-background`/`bg-surface`, acentos `text-gold`, tipografía `font-display`/`font-condensed`, bordes `border-border`. Sin colores hardcoded.

## Archivos

**Migración** (1): añadir columnas a `tv_settings`.

**Nuevos**: 7 componentes en `src/components/tv/`, hook `src/lib/tv/useTvState.ts`.

**Editados**: `src/routes/tv.tsx`, `src/routes/admin.tv.tsx`, `src/routes/admin.banners.tsx`, `src/components/home/RollerZoneTVHome.tsx`, `src/integrations/supabase/types.ts` (auto tras migración).

¿Procedo?
