## Resumen

Voy a desarrollar las 5 secciones avanzadas del Hub España de forma modular y relacional, reutilizando al máximo lo que ya existe en la base de datos (videos, mvp_seasons/awards, live_results, live_stream, events, news, clubs, skaters) y añadiendo solo lo imprescindible para conectarlo todo.

Antes de tocar nada quiero confirmar el alcance porque algunas piezas ya existen parcialmente y conviene no duplicar.

---

## Estado actual (lo que ya está)

- **Vídeos**: tabla `video_skaters` ya existe (N:N). Falta confirmar tabla `videos` base — la reviso antes de migrar.
- **MVP**: `mvp_seasons` + `mvp_awards` ya existen con tiers (élite/estrella/promesa) × género. Hay admin `/admin/premios-mvp` y ruta pública `/premios-mvp`. **No hay ranking dinámico con puntos/evolución** — solo "premio ganador".
- **Live Center**: `live_results` + `live_stream` + `schedule_items` + `LiveBar` + `LiveCenter` ya existen. Hay admin `/admin/live-center` y `/admin/live-results`. **Falta página dedicada `/live` y `/hub/es/live`** y modelo de "evento live" con timeline.
- **Eventos**: tabla `events` completa, con `status` (upcoming/en_curso/finalizado), galería, redes, etc.
- **Noticias / Archivo**: `news` con `published_at`, `country_code`, categorías y N:N a clubes/atletas/federaciones. El "archivo histórico" puede ser una vista filtrada de `news` + `interviews` + `events` finalizados, no necesita tabla nueva.

---

## Plan de trabajo

### 1. RollerZone TV España — `/hub/es/tv` (+ alias `/espana/rollerzone-tv`)

**Migración mínima** (solo si no existe ya tabla `videos`):
- `videos`: id, slug, title, description, video_url (YouTube/MP4), thumbnail_url, category (entrevista/directo/highlight/reportaje/resumen), published_at, featured, country_code, event_id (FK suave), club_id, news_id, published.
- Relación N:N skaters ya existe (`video_skaters`).
- RLS: público lee published=true; admin/editor CRUD.

**Frontend**:
- `/hub/$country/tv/index.tsx`: hero (vídeo destacado), carrusel destacados, grid últimos, filtros por categoría/atleta/club/evento.
- `/hub/$country/tv/$slug.tsx`: ficha vídeo con embed (reutilizar `lib/youtube.ts`), metadatos, relaciones (atleta/club/evento/noticias), vídeos relacionados.
- `/espana/rollerzone-tv.tsx`: redirect a `/hub/es/tv`.

**Admin**: `/admin/videos.tsx` — CRUD + selector relaciones (EntityRelationsField ya existe).

### 2. MVP España — ranking dinámico

**Migración**:
- Añadir a `mvp_awards` (o nueva tabla `mvp_rankings`): `points` (numeric), `previous_position` (int, evolución), `skater_id` (FK suave a `skaters` para enlazar ficha). Mantengo los premios actuales y añado modo "ranking" por tier×género ordenado por puntos.

**Frontend**:
- Renovar `/premios-mvp.tsx` y crear `/hub/$country/mvp` con tabla ranking por 6 categorías, evolución (↑↓), enlace a ficha skater. Mantengo el diseño awards actual como "Hall of Fame" + nueva pestaña "Ranking actual".

**Admin**: extender `/admin/premios-mvp` con campo de puntos y skater_id.

### 3. Live Center — `/live` + `/hub/es/live`

**Migración**:
- `live_events`: id, event_id (FK suave events), country_code, status, headline, timeline (jsonb array de entradas con timestamp+texto), streaming_url, is_active.
- O reutilizo `events.status='en_curso'` + `live_stream` + `live_results` y solo añado tabla `live_timeline` (event_id, ts, text, type).

**Frontend**:
- `/live.tsx` (global) y `/hub/$country/live.tsx`: muestra evento activo, timeline en tiempo real (supabase realtime), resultados (`live_results`), stream embed, galería, vídeos relacionados (`videos` por event_id).
- `LiveBar` ya existe y muestra schedule_items en_curso — la conecto al nuevo `/live`.

**Admin**: `/admin/live-events.tsx` o extender `/admin/live-center` con activar/desactivar evento + editar timeline.

### 4. Comunidad — `/hub/es/comunidad`

**Migración**:
- `community_submissions`: id, type (noticia/evento/otro), name, email, phone, title, description, image_urls[], links[], status (pendiente/aprobada/rechazada), created_at, country_code. RLS: INSERT público (con validación zod estricta), SELECT solo admin/editor.

**Frontend**:
- `/hub/$country/comunidad/index.tsx`: 3 bloques.
  - A) Calendario comunidad: reutiliza `events` filtrando por tipo (`scope` o categoría "comunidad", trofeos, opens, campus, clinics, maratones).
  - B) Formulario "Envía tu noticia" con validación zod + upload a bucket `media`.
  - C) Página patrocinio: enlace a `/patrocinadores` (ya existe) + formulario contacto comercial.

**Admin**: `/admin/comunidad-submissions.tsx` — moderar envíos, convertir en noticia/evento.

### 5. Archivo histórico — `/hub/es/archivo`

**Sin migración** — vista agregada de contenido ya existente.

**Frontend**:
- `/hub/$country/archivo/index.tsx`: tabs (Noticias / Resultados / Entrevistas / Reportajes / Leyendas).
- Filtros: año (extraído de `published_at`/`event_date`), categoría, atleta, evento.
- "Leyendas": skaters con flag `is_legend` (añado columna boolean a `skaters`).

### 6. Sistema relacional

Ya está cubierto por:
- `news_clubs`, `news_skaters`, `news_federations`
- `event_clubs`, `event_skaters`, `event_federations`
- `video_skaters` + FKs sueltas `videos.event_id/club_id/news_id`
- Nuevo `live_events.event_id` enlaza con todo el ecosistema del evento.

### 7. Monetización

Reutilizo `ad_banners` existente con nuevos `placement`:
- `tv_top`, `tv_sidebar`, `mvp_sponsor`, `live_sidebar`, `community_top`, `archive_sidebar`.

Sin tabla nueva — solo añadir los slots en los componentes y documentarlo en `/admin/banners`.

### 8. Escalabilidad

Todo se construye bajo `/hub/$country/*` con `country_code` como filtro. Los alias `/espana/*` son thin redirects. Clonar a CO/VE = añadir filas en `country_hubs` + seed mínimo, sin cambios de estructura.

---

## Detalles técnicos

**Migraciones** (en este orden, una sola llamada con todo):
1. `videos` (si no existe) + RLS
2. `mvp_awards`: añadir `points`, `previous_position`, `skater_id`
3. `live_timeline` + RLS, o `live_events` según convenga al revisar `events.status`
4. `community_submissions` + RLS (INSERT público con validación, SELECT staff)
5. `skaters.is_legend` boolean default false

**Rutas nuevas**:
- `src/routes/hub.$country.tv.tsx` (layout)
- `src/routes/hub.$country.tv.index.tsx`
- `src/routes/hub.$country.tv.$slug.tsx`
- `src/routes/hub.$country.mvp.tsx`
- `src/routes/hub.$country.live.tsx`
- `src/routes/hub.$country.comunidad.tsx`
- `src/routes/hub.$country.archivo.tsx`
- `src/routes/live.tsx` (global)
- `src/routes/espana.rollerzone-tv.tsx`, `espana.mvp.tsx`, `espana.live.tsx`, `espana.comunidad.tsx`, `espana.archivo.tsx` (redirects)

**Admin nuevos**:
- `src/routes/admin.videos.tsx`
- `src/routes/admin.live-events.tsx` (o extender existente)
- `src/routes/admin.comunidad.tsx`
- Tab "Leyendas" en `/admin/patinadores`

**Componentes Hub**:
- `src/components/hub/VideosDirectory.tsx`, `VideoCard.tsx`, `VideoPlayer.tsx`
- `src/components/hub/MvpRanking.tsx`
- `src/components/hub/LiveCenterPage.tsx`, `LiveTimeline.tsx`
- `src/components/hub/CommunityForm.tsx`, `CommunityCalendar.tsx`
- `src/components/hub/ArchiveBrowser.tsx`

**Reutilización**:
- `EntityRelationsField` para relaciones N:N en todos los admins nuevos.
- `ImageUploadField` / `GalleryUploadField` para multimedia.
- `useCountryHub`, `HubHero`, `HubSubNav` ya existentes.
- Supabase Realtime ya integrado en `LiveBar` — extender al Live Center.

---

## Pregunta antes de empezar

Es bastante trabajo (5 secciones grandes). ¿Cómo lo prefieres?

**A) Todo de una** — implemento las 5 secciones en una pasada larga. Riesgo: más superficie, más posibles ajustes después.

**B) Por bloques** — empiezo por las 2 más estratégicas (te recomiendo **RollerZone TV + Live Center** porque son las que más impacto editorial y de tráfico tienen) y seguimos con MVP, Comunidad y Archivo en mensajes siguientes.

**C) Otro orden** — me dices la prioridad.

También: ¿el formulario "Envía tu noticia" de Comunidad debe permitir envío **anónimo sin login** (más fricción cero pero más spam) o requerir cuenta? Por defecto iría con envío público + validación zod estricta + moderación admin.
