# Hub Miami → Hub USA (con Florida y Miami)

## Situación actual (auditoría)
- El hub Miami es una "delegación territorial" con código interno `mia`, igual que Portugal (`pt`). Tiene páginas públicas `/miami`, `/miami/noticias`, `/miami/noticias/<slug>`, `/miami/entrevistas`, `/miami/entrevistas/<slug>`, además de su panel de editor y administración (`/dashboard/miami`, `/admin/miami`, `/editor/miami`).
- Hay 2 noticias en Miami:
  1. "Miami Inline Marathon 2026…" → quedará en **USA · Florida · Miami**
  2. "El BONT Florida Inline Skating Marathon 2026 reunirá en Sarasota…" → quedará en **USA · Florida** (no Miami, porque es en Sarasota)
- Las noticias no guardan hoy un estado/región ni una ciudad.

## Qué haré
1. **Renombrar el hub a USA** sin cambiar su código interno (`mia`). Así los permisos de editores, el panel, las reglas de acceso y los filtros actuales siguen funcionando exactamente igual; solo cambian nombre, bandera, textos y direcciones.
2. **Lista de zonas ampliable** (nueva): cada zona tiene nombre, dirección corta y, si es ciudad, a qué estado pertenece. Se crean Florida y Miami (dentro de Florida). En el futuro se añaden California, Texas, etc. desde el panel, sin tocar código ni diseño.
3. **Dos campos nuevos opcionales en noticias y entrevistas**: "Estado/región" y "Ciudad". En el editor, cuando el hub sea USA, aparecen dos selectores. Elegir Miami rellena Florida automáticamente.
4. **Páginas públicas nuevas**, con el mismo estilo que España/Colombia/Portugal:
   - `rollerzone.es/usa` — portada, destacadas, últimas noticias y botones **Todas · Florida · Miami**
   - `rollerzone.es/usa/florida` — noticias de Florida (incluye Miami y Sarasota)
   - `rollerzone.es/usa/florida/miami` — solo Miami
   - `rollerzone.es/usa/noticias/<slug>` y `/usa/entrevistas/<slug>`
   - Cada página con su propio título y datos para compartir.
5. **Redirecciones permanentes** de todas las direcciones antiguas `/miami/...` a su equivalente `/usa/...`, para no romper enlaces ni perder posicionamiento. `/miami` → `/usa/florida/miami`.
6. **Clasificar las 2 noticias actuales** como se indica arriba. No se borra nada.
7. Menús, pie de página, buscador, sitemap y panel: "Miami" pasa a llamarse "USA".

## Qué no cambia
- Permisos de España, Colombia, Portugal y General.
- Slugs de las noticias.
- Diseño de las demás secciones.

## Detalles técnicos
- Nueva tabla `territory_zones` (territory_code, slug, name, parent_id, sort_order, active), con GRANT + RLS: lectura pública, escritura admin.
- `news.zone_region_id` / `news.zone_city_id` y lo mismo en `interviews` (FK ON DELETE SET NULL).
- `territories.ts`: MIAMI → USA con basePath `/usa`; rutas `usa.*` nuevas; rutas `miami.*` sustituidas por `redirect` 301.
- Filtro Florida = region Florida; Miami = city Miami.
