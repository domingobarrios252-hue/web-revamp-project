# Plan: HOME CONTROL CENTER + LIVE EVENT CENTER

Transformar la home de RollerZone en un sistema dinámico modular tipo Olympics/F1/ESPN, manteniendo 100% la identidad visual actual (dark + oro #D4A017, tipografía editorial) y sin romper nada existente.

---

## 1. Arquitectura de base de datos (Supabase)

Nuevas tablas:

- **`home_modules`** — control de la zona dinámica de la home
  - `key` ('dynamic_zone_mode'), `value` ('liga' | 'live' | 'both' | 'none'), `updated_at`
- **`league_tables`** — clasificaciones administrables
  - `id`, `competition_group` ('absoluta' | 'sub15'), `division` ('1M','1F','2M','2F','3M','3F'), `season`, `title`, `subtitle`, `visible`, `display_order`, `autoplay`, `max_cards`
- **`league_table_rows`**
  - `id`, `table_id` (FK), `position`, `club_name`, `club_logo`, `points`, `full_url`, `display_order`
- **`event_tests`** (pruebas de cada evento)
  - `id`, `event_id` (FK a `events`), `name`, `category`, `gender`, `scheduled_at`, `status` ('pending'|'upcoming'|'call_room'|'live'|'finished'|'official'), `description`, `display_order`
- **`event_results`** (resultados de cada prueba)
  - `id`, `test_id` (FK), `position`, `athlete_name`, `club`, `country`, `race_time`, `points`, `is_highlighted`

Extender tabla `events` con: `event_type`, `logo_url`, `banner_url`, `organizer`, `season`, `city`, `venue`, `show_in_home`, `is_featured`, `live_center_enabled`, `show_in_calendar`, `show_in_results`. Trigger para garantizar un único evento con `is_featured + live_center_enabled` activos a la vez.

RLS:
- Lectura pública (`true`) en todas las tablas de cara al público.
- Escritura solo para `admin` (vía `has_role`).

Realtime habilitado en `event_tests`, `event_results`, `home_modules`, `league_tables`, `league_table_rows`.

---

## 2. Panel de administración

Nueva entrada en sidebar: **HOME CONTROL CENTER** (`/admin/home-control`).

Pantallas:

- **`/admin/home-control`** — selector de modo (Liga / Live / Both / None) con preview en vivo del resultado.
- **`/admin/liga-tablas`** — CRUD de las 14 clasificaciones (Absoluta + Sub15, 3 divisiones × 2 sexos). Por tabla: título, subtítulo, visible, orden, autoplay, nº cards; editor inline de filas (posición, club, logo, puntos, URL completa) con drag & drop.
- **`/admin/event-manager`** — CRUD de eventos enriquecido (campos nuevos, estados, badges live/featured). Botón "Activar Live" único excluyente.
- **`/admin/eventos/$id/pruebas`** — gestor de pruebas de un evento. Crear, editar, ordenar, cambiar estado.
- **`/admin/eventos/$id/pruebas/$testId`** — editor de resultados con dos modos:
  - **Rápido**: Top 3 inline.
  - **Completo**: tabla editable con cualquier número de filas.
  - **Import CSV/Excel**: parser con mapeo de columnas (`position,name,club,country,time,points`).

Todas las pantallas reutilizan los componentes existentes (`AdminLink`, layout `admin.tsx`, tokens `gold/surface/border`).

---

## 3. Frontend público — Home

Reemplazar el bloque actual `HomeStandingsCarousel` por un componente orquestador `HomeDynamicZone`:

```text
[Ticker EN VIVO]
[HomeDynamicZone] ← lee home_modules.dynamic_zone_mode
  ├─ mode='liga'  → <LeagueTablesCarousel />
  ├─ mode='live'  → <LiveEventCenter />
  ├─ mode='both'  → ambos apilados (Live arriba, Liga debajo)
  └─ mode='none'  → null
[Publicidad / Revista]
```

- **`LeagueTablesCarousel`** — carrusel premium de las tablas visibles, con tabs por grupo (Absoluta / Sub15) y por división. Mantiene el look actual.
- **`LiveEventCenter`** — módulo cinemático tipo Olympics:
  - Header con logo evento + hero + badge LIVE pulsante + sede + fechas.
  - Grid de cards por prueba: nombre, categoría, hora, estado (icono + badge LIVE/FINAL/UPCOMING), top 3 resultados, botón "Ver resultados".
  - Contador regresivo para pruebas `upcoming`.
  - Suscripción realtime a `event_tests` y `event_results`.

---

## 4. Páginas públicas

- **`/eventos/$slug`** (ya existe — enriquecer): hero image, datos, programa, pruebas con resultados live, streaming opcional, noticias relacionadas. Meta SEO + OpenGraph + JSON-LD `SportsEvent`.
- **`/resultados`** (ya existe — rediseñar como archivo histórico): filtros por año, evento, país, categoría, sexo, tipo prueba, club, atleta + buscador global.
- **`/resultados/$evento/$prueba`** — clasificación completa de una prueba. URL limpia tipo `/resultados/campeonato-espana-pista-2026/200m-senior-femenino`.

---

## 5. Realtime

Suscripciones Supabase Realtime en `LiveEventCenter` y `HomeDynamicZone` para refrescar sin recargar cuando cambian: `home_modules`, `event_tests`, `event_results`, evento activo.

---

## 6. SEO

- Meta dinámica por evento/prueba (`head()` en cada route).
- Canonical, og:image desde `banner_url`/`logo_url`.
- JSON-LD: `SportsEvent` en evento, `SportsResults` en prueba.

---

## 7. Detalles técnicos

- TanStack Start file-routes nuevos en `src/routes/admin.home-control.tsx`, `src/routes/admin.liga-tablas.tsx`, `src/routes/admin.event-manager.tsx`, `src/routes/admin.eventos.$id.pruebas.tsx`, `src/routes/admin.eventos.$id.pruebas.$testId.tsx`, `src/routes/resultados.$evento.$prueba.tsx`.
- Hooks en `src/lib/hub/`: `useHomeMode`, `useLeagueTables`, `useLiveFeaturedEvent`, `useEventTests`, `useEventResults`.
- Componentes en `src/components/home/`: `HomeDynamicZone`, `LeagueTablesCarousel` (refactor del actual), `LiveEventCenter`, `LiveTestCard`, `LiveCountdown`.
- CSV import con librería `papaparse` (ligera, edge-compatible).
- Cero cambios en auth, ticker, header, footer, hubs de país, secciones de noticias.

---

## Entregables

1. Migración SQL (1 sola) con todas las tablas, RLS, realtime publication, trigger del live único.
2. Panel admin completo (5 pantallas nuevas).
3. Componentes home (`HomeDynamicZone` + `LiveEventCenter` + refactor del carrusel actual).
4. Páginas públicas (`/eventos/$slug` enriquecido, `/resultados` rediseñado, `/resultados/$evento/$prueba` nuevo).
5. SEO + JSON-LD.

Identidad visual y código existente intactos. La sección actual "Liga Nacional" se preserva como uno de los modos del nuevo sistema.

¿Apruebas el plan para empezar?
