
# Fase 2B — Clubes, Patinadores y Federaciones (Hub España)

Construcción modular y relacional, reutilizable para Colombia/Venezuela/etc. simplemente cambiando `country_code`. Mantengo la ruta base `/hub/$country/...` (coherente con Fase 1 y 2A) y añado redirecciones `/espana/clubes`, `/espana/patinadores`, `/espana/federaciones` → `/hub/es/...` para las URLs SEO que pediste.

---

## 1. Base de datos (modelo relacional)

### Ampliar tablas existentes
- `clubs` → añadir: `cover_url`, `address`, `city`, `province`, `email`, `phone`, `instagram_url`, `facebook_url`, `youtube_url`, `tiktok_url`, `description`, `history`, `school_type` (enum: `escuela` | `competicion` | `mixto`), `categories` (text[]), `coaches` (jsonb), `gallery` (text[]), `featured` (bool), `published` (bool).
- `skaters` (ya existe parcial) → asegurar: `slug`, `full_name`, `photo_url`, `gallery`, `country_code`, `province`, `category`, `gender`, `specialty`, `bio`, `palmares` (jsonb), `records` (jsonb), `sponsors` (jsonb), `social` (jsonb), `club_id` (FK a clubs), `published`.

### Nuevas tablas
- `federations` — RFEP + autonómicas. Campos: `country_code`, `scope` (`nacional`|`autonomica`), `region_code` (FK a regions), `name`, `slug`, `logo_url`, `website`, `email`, `phone`, `address`, `description`, `social` (jsonb), `published`.
- `federation_documents` — reglamentos/licencias/convocatorias por federación. Campos: `federation_id`, `category` (`reglamento`|`calendario`|`licencia`|`convocatoria`|`documento`|`enlace`), `title`, `url`, `published_date`, `sort_order`.
- `news_skaters` — relación N:N entre `news` y `skaters`.
- `news_clubs` — relación N:N entre `news` y `clubs`.
- `news_federations` — relación N:N entre `news` y `federations`.
- `event_clubs` — relación N:N entre `events` y `clubs` (clubes organizadores/participantes).
- `event_federations` — relación N:N entre `events` y `federations`.
- `result_skaters` — enlaza filas de `live_results` / `results` a `skater_id` y `club_id` (sin duplicar datos del atleta).
- `videos` — galería de vídeos reutilizable. Campos: `entity_type` (`skater`|`club`|`federation`|`event`), `entity_id`, `title`, `youtube_id` o `url`, `thumbnail_url`, `sort_order`.

Todas con RLS:
- SELECT público para published=true.
- INSERT/UPDATE/DELETE para admin + editor con `can_edit_country()`.

---

## 2. Rutas

Base modular `/hub/$country/...` y alias `/espana/...`:

```
/hub/$country/clubes                       → directorio cards/lista + filtros
/hub/$country/clubes/$slug                 → ficha club
/hub/$country/patinadores                  → directorio atletas + filtros
/hub/$country/patinadores/$slug            → ficha atleta
/hub/$country/federaciones                 → landing (RFEP + mapa autonómicas)
/hub/$country/federaciones/rfep            → página RFEP con accesos rápidos
/hub/$country/federaciones/$slug           → ficha federación autonómica

/espana/clubes        → redirect /hub/es/clubes
/espana/patinadores   → redirect /hub/es/patinadores
/espana/federaciones  → redirect /hub/es/federaciones
```

Cada ruta con `head()` SEO completo (title, description, og:image, JSON-LD `SportsOrganization` / `Person` / `SportsTeam`).

---

## 3. Componentes nuevos (reutilizables, reciben `countryCode`)

`src/components/hub/`:
- `ClubsDirectory.tsx` — grid/lista con filtros (CCAA, provincia, ciudad, categoría, tipo escuela, búsqueda).
- `ClubCard.tsx` — tarjeta visual con logo, ciudad, badges.
- `ClubProfile.tsx` — ficha completa con tabs (info, atletas, eventos, noticias, galería, vídeos).
- `SkatersDirectory.tsx` — filtros (club, categoría, sexo, especialidad, CCAA, ranking MVP).
- `SkaterCard.tsx` y `SkaterProfile.tsx` — ficha con palmarés, redes, vídeos, noticias, resultados, entrevistas.
- `FederationsLanding.tsx` — bloque RFEP destacado + mapa SVG España interactivo.
- `FederationsMapES.tsx` — SVG de las 17 CCAA + 2 ciudades autónomas, click → navega a `/hub/es/federaciones/$slug`.
- `FederationProfile.tsx` — ficha federación + documentos categorizados.
- `RfepHub.tsx` — landing institucional con accesos rápidos (reglamentos, calendarios, licencias…).
- `RelatedNews.tsx`, `RelatedVideos.tsx`, `RelatedResults.tsx` — bloques reutilizables que reciben `entityType` + `entityId`.

Hooks `src/lib/hub/`:
- `useClubs.ts` — listado con filtros + ficha por slug.
- `useSkaters.ts` — listado + ficha + relaciones (noticias, resultados, entrevistas).
- `useFederations.ts` — listado + ficha + documentos.

---

## 4. Admin

Nuevas pantallas en `/admin/`:
- `/admin/hub-clubes` — CRUD clubes (ampliar el existente `/admin/clubes` con los nuevos campos + uploader de galería + multi-select atletas relacionados).
- `/admin/hub-patinadores` — CRUD atletas (ampliar `/admin/patinadores` con club, palmarés, redes, vídeos, relaciones).
- `/admin/hub-federaciones` — CRUD federaciones + documentos.
- En cada formulario de noticia/evento/resultado existente: añadir multiselect para vincular clubes, atletas, federaciones (usa tablas N:N).

Sidebar admin actualizada con enlaces nuevos.

---

## 5. Datos demo realistas

Seed inicial:
- ~10 clubes españoles representativos (CPV Reus, CPV Vall d'Hebron, Pelayo, Voltregà, Lalín, Alcobendas, Olot, Arteixo, El Vendrell, Astillero).
- ~12 atletas con club asignado, palmarés y categorías.
- RFEP + 8 federaciones autonómicas principales con datos públicos.
- Relaciones de demo: 3-4 noticias vinculadas a atletas/clubes.

---

## 6. Escalabilidad y SEO

- Todas las consultas filtran por `country_code` recibido como parámetro de ruta → clonar a Colombia = 1 fila en `country_hubs` + datos cargados desde admin.
- URLs slug + JSON-LD schema markup por tipo de entidad.
- Sitemap dinámico cubrirá clubes/atletas/federaciones publicados (próxima micro-tarea).

---

## Entrega propuesta en sub-fases

Esto es enorme (~6 tablas nuevas, 11 rutas, 10+ componentes, 3 admins, mapa SVG, seed). Propongo dividir en **3 entregas pequeñas** revisables:

- **2B-1 (esta entrega) — CLUBES completo**
  Migración (ampliar `clubs` + tablas N:N news/event clubs), rutas directorio + ficha, admin ampliado, redirección `/espana/clubes`, seed 10 clubes, bloques de noticias/eventos relacionados.

- **2B-2 — PATINADORES completo**
  Ampliar `skaters`, tabla `news_skaters` + `result_skaters` + `videos`, rutas directorio + ficha con tabs, admin, redirección `/espana/patinadores`, seed 12 atletas con relaciones a clubes y noticias.

- **2B-3 — FEDERACIONES completo**
  Tablas `federations` + `federation_documents` + N:N, mapa SVG interactivo de España, RFEP hub, fichas autonómicas, admin, redirección `/espana/federaciones`, seed RFEP + 8 autonómicas.

Las 3 sub-fases comparten patrones (RelatedNews, hooks, filtros) → la 2B-1 deja la "plantilla" hecha y las siguientes son mucho más rápidas.

---

## Confirmar antes de empezar

1. ¿Apruebas el desglose en 3 sub-entregas (2B-1, 2B-2, 2B-3) o lo quieres todo en una sola entrega grande (más riesgo)?
2. URLs públicas: ¿mantener `/hub/es/...` como canónica y `/espana/...` como redirección (mejor para no duplicar contenido SEO), o prefieres `/espana/...` como canónica?
3. Mapa SVG de España: ¿uso uno open-source de las 17 CCAA + Ceuta/Melilla con estilo RollerZone, o tienes preferencia por algún proveedor concreto?
4. Seed: ¿los datos demo realistas que propongo (clubes/atletas reales públicos) están bien, o prefieres datos ficticios para no tocar nombres reales sin permiso?
