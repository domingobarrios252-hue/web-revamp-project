
# Plataforma multi-país RollerZone

Evolución de la web actual a una plataforma internacional manteniendo identidad y contenido. Se añaden Colombia y Venezuela como secciones oficiales, dejando preparada la expansión (MX, AR, CL, EC, PE) sin crear sitios separados.

El plan se ejecutará en **5 fases incrementales**, cada una entregable y verificable. Pido confirmación antes de empezar la Fase 1.

---

## Fase 1 — Base de datos multi-país y visibilidad multicanal

Sin tocar todavía la UI pública. Es el cimiento.

**Nuevas tablas / cambios (vía migration):**

- `countries` — catálogo: `code` (es, co, ve, mx, ar, cl, ec, pe), `name`, `flag_url`, `accent_color`, `active`, `sort_order`. Seed inicial: ES (activo), CO (activo), VE (activo), resto inactivos pero presentes para expansión.
- `news.country_code` (text, FK lógica a `countries.code`, nullable) — país de origen editorial de la noticia (default 'es' para contenido existente).
- `news_visibility` — tabla many-to-many:
  - `news_id` (FK news)
  - `channel` enum: `global_home`, `featured`, `breaking`, `country`
  - `country_code` (nullable, sólo si channel='country')
  - PK compuesta `(news_id, channel, country_code)`
- Migración de datos: cada noticia actual con `featured=true` → fila en `news_visibility (channel='featured')`; todas → `(channel='global_home')` y `(channel='country', 'es')`.
- Mantener `news.featured` y `news.hero_order` por compatibilidad, pero la fuente de verdad pasa a ser `news_visibility`.

**Roles editoriales por país:**

- Ampliar enum `app_role` o reutilizar `editor` + nueva tabla `editor_countries (user_id, country_code)`.
- Helper SQL `can_edit_country(_user_id, _country)` (security definer) para RLS.
- RLS de `news`: editor sólo puede insert/update si `country_code` está en sus países asignados. Admin sigue con acceso total.
- Helpers paralelos para `events`, `interviews`, `skaters`, `clubs` (añadir `country_code` a cada uno con default 'es').

**Tablas de contenido por país (añadir `country_code`):**

- `events`, `interviews`, `skaters`, `clubs`, `tv_broadcasts`, `tv_highlights`, `sponsors`, `medal_standings` — todas con `country_code text default 'es'`.

---

## Fase 2 — Rutas públicas por país

Estructura de rutas TanStack (no creamos webs separadas, son sub-secciones):

```text
/{-$country}            -> home país (o home global si vacío)
/                       -> home global actual
/paises                 -> selector visual ES/CO/VE
/colombia               -> home editorial Colombia
/colombia/noticias
/colombia/eventos
/colombia/entrevistas
/colombia/clubes
/colombia/atletas
/colombia/galeria
/colombia/calendario
/venezuela/...          (idéntica estructura)
/espana/...             (idéntica estructura, alias del contenido ES)
```

Implementación: route layout `src/routes/$country.tsx` que valida el slug contra `countries`, expone contexto `{ country }` a los hijos vía `Outlet`, y `head()` por país con SEO propio.

**Home de país (componente reutilizable parametrizado por country_code):**

Hero destacado · Últimas noticias · Entrevistas · Próximos eventos · Calendario · Clubes destacados · Atletas destacados · Galería · Rankings · Patrocinadores. Todas las consultas filtran por `news_visibility.country_code = X` (para noticias) o `country_code = X` (para el resto).

**Header:** nuevo dropdown "PAÍSES" con bandera + nombre, marca activo el país actual. Identidad global se mantiene; cada país añade un acento sutil (banda superior con sus colores) sin romper el negro/amarillo RollerZone.

---

## Fase 3 — Admin: visibilidad multicanal y país

Editor de noticia (admin) gana un bloque **"Publicar en"** con checkboxes:

- Home global
- Noticias destacadas
- Breaking ticker
- España / Colombia / Venezuela (los países que el editor pueda gestionar)

Guardado: una sola fila en `news` + N filas en `news_visibility`. Sin duplicación.

Listado admin: filtro por país y por canal de visibilidad. Editores de país sólo ven/editan noticias de su(s) país(es).

Nuevo admin `/admin/paises` (sólo super-admin): activar/desactivar país, color de acento, asignar editores a países.

---

## Fase 4 — Buscador global, RollerZone TV por país, SEO técnico

- Buscador con filtros: país, categoría, fecha, tipo (noticia/atleta/club/evento).
- `/tv` con tabs Global / Colombia / Venezuela (filtra por `country_code`).
- Sitemap dinámico que incluye rutas de país y contenido por país.
- `head()` por ruta: title/description/og/twitter/canonical y JSON-LD `NewsArticle` con `inLanguage` + `contentLocation` por país.

---

## Fase 5 — Migración de contenido y QA responsive

- Script de migración (insert tool) que asigna `country_code='es'` a todo el contenido existente y crea las filas de `news_visibility` correspondientes.
- QA en móvil/tablet/desktop de las nuevas homes de país.
- Verificación de RLS con cuenta editor de prueba por país.

---

## Detalles técnicos

- **Sin duplicación de noticias:** garantizado por `news_visibility` (PK compuesta) + RLS que impide a un editor de Colombia tocar noticias cuyo `country_code` no esté entre sus permisos, pero sí puede *añadir visibilidad* a Colombia sobre una noticia global (regla a definir: por defecto sólo el autor/admin marca visibilidad cross-país; el editor de país sólo marca su propio país).
- **Compatibilidad:** las páginas actuales (`/`, `/noticias`, `/eventos`, etc.) siguen funcionando. La home global lee `news_visibility.channel='global_home'`. Si una noticia no tiene fila de visibilidad (legacy), fallback al comportamiento actual durante la transición.
- **Expansión futura:** añadir un país = insertar fila en `countries` + activarlo. La ruta `/$country` y los componentes ya lo soportan.
- **Identidad:** tokens existentes intactos. Cada país añade variables CSS `--country-accent-1/2/3` aplicadas sólo a una banda decorativa y badges.

---

## Pregunta de alcance antes de empezar

El plan completo es grande (5 fases, ~3-4 iteraciones por fase). Propongo empezar por **Fase 1 + Fase 2** en esta tanda (base de datos + rutas públicas de país funcionando con el contenido existente marcado como España), y dejar Fase 3-5 para iteraciones siguientes. ¿Confirmas o prefieres otro alcance inicial?
