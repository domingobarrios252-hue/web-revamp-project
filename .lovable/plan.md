# Especial "Camino al Europeo 2026"

Convertir el bloque actual de la home en un hub editorial real, con landing, subpáginas individuales y un bloque dinámico de noticias relacionadas con la selección española.

## 1. Cambios en la home

Editar `src/components/home/SpecialCoverageBanner.tsx`:

- Eliminar las piezas "Análisis de rivales" y "Seguimiento de la selección".
- Reemplazar el listado lateral por las 7 piezas nuevas del dossier (presentación, convocatoria, calendario, entrevista, info, resultados, galería).
- Cada item enlaza a su subpágina (`/camino-al-europeo-2026/<slug>`).
- CTA "Ver toda la cobertura" → `/camino-al-europeo-2026`.
- Añadir CTA secundario "Ver convocatoria de España" → subpágina de convocatoria.

## 2. Estructura de rutas (TanStack Start, file-based)

Layout + landing + subpáginas con dot-routing:

```text
src/routes/
  camino-al-europeo-2026.tsx                              (layout: <Outlet />)
  camino-al-europeo-2026.index.tsx                        (landing del especial)
  camino-al-europeo-2026.presentacion-europeo-2026.tsx
  camino-al-europeo-2026.convocatoria-seleccion-espanola.tsx
  camino-al-europeo-2026.calendario-y-sedes.tsx
  camino-al-europeo-2026.entrevista-seleccionador.tsx
  camino-al-europeo-2026.informacion-campeonato.tsx
  camino-al-europeo-2026.resultados-y-medallero.tsx
  camino-al-europeo-2026.galeria-rollerzone-tv.tsx
```

Cada subpágina usa `head()` propio (title, description, og:title/desc, og:image en leaf).

## 3. Componentes compartidos del especial

Crear `src/components/specials/europeo-2026/`:

- `SpecialHero.tsx` — hero reutilizable (imagen, kicker "Cobertura especial", título, subtítulo, CTAs).
- `SpecialSubNav.tsx` — navegación horizontal entre piezas del especial.
- `SpecialBreadcrumb.tsx` — "Cobertura especial › Camino al Europeo 2026 › <pieza>".
- `BackToSpecial.tsx` — CTA "Volver al especial".
- `DossierPiecesGrid.tsx` — grid de tarjetas con las 7 piezas (kicker, número, título, descripción, link).
- `EventKeyFacts.tsx` — bloque de datos clave (sede, fechas, disciplinas).
- `EventCalendarTimeline.tsx` — timeline día a día (19–26 julio).
- `CallupRoster.tsx` — bloque de convocados por categoría/género.
- `RelatedSelectionNews.tsx` — bloque dinámico de noticias (ver §5).
- `specialConfig.ts` — fuente única de verdad: array con las 7 piezas (slug, kicker, título, descripción, imagen, orden, destacado).

## 4. Datos del campeonato (contenido estático inicial)

Hardcodear en `specialConfig.ts` los datos de la web oficial (euroskatingcardano2026.it):

- Evento, sede (Cardano al Campo, Varese, Italia), fechas (19–26 julio 2026).
- Programa: 19 apertura · 20–22 pista · 23 descanso · 24–25 ruta · 26 maratón.
- Disciplinas: pista, ruta, maratón.

Convocatoria de España: estructura por género (masculino/femenino) y categoría (juvenil/junior/sénior), seleccionador Garikoitz Lerga. Los nombres concretos se cargarán cuando el usuario suba la convocatoria; dejar arrays vacíos con placeholders y un comentario `// TODO: completar con la convocatoria adjunta`.

## 5. Bloque "Actualidad de la selección española" (dinámico)

Estrategia sin migración nueva (reutilizando `news_categories` y la columna `tags` de `news` si existe, o filtrando por categoría):

- Server fn `getSeleccionEspanolaNews` en `src/lib/specials/europeo-2026.functions.ts`:
  - Cliente publishable server-side (read-only anon).
  - SELECT en `news` donde `published = true` AND (`category.slug = 'seleccion-espanola'` OR tags contiene `europeo-2026` / `camino-al-europeo-2026` / `seleccion-espanola`).
  - ORDER BY `published_at DESC` LIMIT 12.
- Componente `RelatedSelectionNews` consume vía `useSuspenseQuery` + `ensureQueryData` en el loader de la landing.
- Si no hay resultados, mostrar `EmptyState` con CTA al admin de noticias.

Verificar primero el esquema real de `news` (columnas de tags/categoría) antes de escribir la query; ajustar el filtro a lo que exista. Si no hay categoría "Selección Española", instruir al usuario para crearla desde `/admin/categorias` (sin migración).

## 6. Landing del especial (`/camino-al-europeo-2026`)

Composición:

1. `SpecialHero` con imagen de fondo, título "Camino al Europeo 2026", subtítulo y CTAs.
2. `SpecialSubNav` sticky.
3. Bloque presentación (texto editorial introductorio).
4. `EventKeyFacts` (sede, fechas, disciplinas).
5. `DossierPiecesGrid` (7 piezas con enlaces a subpáginas).
6. `RelatedSelectionNews` (bloque dinámico).
7. Bloque "Últimas actualizaciones del especial" (placeholder, reutilizable cuando haya más piezas).
8. CTA final (newsletter / volver a home).

## 7. Subpáginas

Patrón común para cada subpágina:

- `SpecialBreadcrumb` arriba.
- Hero compacto con kicker, título, imagen.
- Contenido propio:
  - **Presentación**: texto largo + `EventKeyFacts` + `EventCalendarTimeline`.
  - **Convocatoria**: intro editorial + `CallupRoster` (masculino/femenino × juvenil/junior/sénior) + mención a Garikoitz Lerga + slot para imagen de la convocatoria.
  - **Calendario y sedes**: `EventCalendarTimeline` extendido + ficha de la sede.
  - **Entrevista al seleccionador**: layout de entrevista (placeholder con CTA "Próximamente") + link a `/entrevistas`.
  - **Información del campeonato**: ficha técnica (fechas, sede, disciplinas, instalación, links útiles).
  - **Resultados y medallero**: placeholder "Disponible durante el campeonato" + estructura preparada (tabla medallero, lista resultados).
  - **Galería / RollerZone TV**: grid placeholder + link a `/tv`.
- `SpecialSubNav` al final + `BackToSpecial`.
- `RelatedSelectionNews` cuando tenga sentido (convocatoria, entrevista).

## 8. SEO

Cada ruta define `head()` con title/description únicos. La landing y las subpáginas con imagen real definen `og:image` (leaf only). Breadcrumbs JSON-LD se generan automáticamente por el componente `Breadcrumbs` ya existente si la ruta encaja con su lógica (verificar y, si no, añadir `LABELS`).

## 9. Escalabilidad

- `specialConfig.ts` centraliza piezas y orden → añadir una nueva pieza = añadir un objeto + crear su archivo de ruta.
- `RelatedSelectionNews` se alimenta del CMS existente; el usuario solo crea noticias con la categoría/tag adecuado.
- Los componentes (`SpecialHero`, `DossierPiecesGrid`, etc.) son reutilizables para futuros especiales cambiando el config.

## 10. Detalles técnicos

- Loaders públicos: usan server fn con cliente publishable (no `requireSupabaseAuth`) — la home y el especial son rutas públicas.
- Imágenes: usar Unsplash temporales con prompt deportivo (patinaje/Italia) hasta que el usuario suba las definitivas; marcar con comentarios `// TODO: reemplazar imagen`.
- Tokens de diseño: mantener `gold`, `font-display`, `font-condensed` ya en uso; nada de colores hardcoded.
- No tocar `routeTree.gen.ts` (se regenera).

## Fuera de alcance

- No se crea migración nueva (se reutiliza `news` + `news_categories`).
- No se sube la convocatoria con nombres reales: queda el esqueleto listo para pegarla después.
- No se implementa admin específico del especial (se edita por código en `specialConfig.ts`); si más adelante se quiere CMS, se hará en otra iteración.
