## Análisis del estado actual (nada se duplica)

Ya existe en el proyecto:

- **Liga Nacional**: tablas `league_seasons`, `league_rounds`, `league_standings` + rutas `hub.$country.competicion.liga-nacional.*` (índice, calendario, clasificaciones, resultados, noticias) y admin `admin.hub-liga.tsx`.
- **Resultados generales**: tablas `result_events` (competición) y `live_results` (filas de resultado) + rutas públicas `resultados.index.tsx` y `resultados.$evento.tsx`, admin `admin.resultados.tsx` + `admin.resultados-importar.tsx` (CSV) + `result_csv_mappings` (plantillas).
- **Live Center**: tabla `events` (con `is_featured`, `live_center_enabled`), `live_timeline`, `live_stream` + rutas `hub.$country.live.tsx`, `espana.live.tsx`, admin `admin.live-center.tsx` y `admin.live-results.tsx`.
- **Home**: `home_standings_groups` + `home_standings_rows` (Liga) y `HomeResultsSlider` que lee `live_results.featured_in_live_center` (Top 3 por grupo). Admin `admin.home-control.tsx` + `admin.clasificaciones.tsx`.

Todo se mantiene. No se crean módulos paralelos; solo se amplían campos, se pulen las vistas y se añade lo que falta (descargas con marca, "convertir Live→Resultados", vista pública premium).

---

## Cambios a aplicar

### 1. Base de datos (migración única, aditiva)

Ampliar `result_events` con los campos que faltan del brief y son útiles para las páginas premium:

- `city`, `venue`, `region`, `end_date`, `season`, `type` (campeonato / copa / liga / europeo / mundial / torneo / …), `main_category`, `poster_url` (además del `banner_url` que ya existe), `pdf_url`, `stream_url`, `organizer`, `source_url`, `show_in_home` (bool), `home_order` (int), `featured` (bool), `visible` (bool, alias de `published` — mantenemos `published` y añadimos `visible` sólo si aporta; si no, se omite para no duplicar).

Ampliar `live_results` con: `bib` (dorsal), `federation`, `points` (numeric), `notes`, `status` (oficial/provisional/pendiente/corregido) — sin tocar los que ya existen.

Añadir en `events` (Live Center) un campo `converted_result_event_id uuid` para el botón "Convertir Live Center en página de resultados", y una función RPC `convert_live_to_result_event(event_id)` que crea el `result_events` a partir del live y copia el `live_results` asociado (idempotente).

No se borra nada. Se añaden columnas con `DEFAULT` seguros. Se conservan políticas y grants existentes.

### 2. Admin — unificar sin duplicar

- **`admin.resultados.tsx`**: añadir los nuevos campos (ciudad, sede, PDF oficial, cartel, streaming, organizador, tipo, temporada, `Mostrar en Home` + orden, `Destacado`). Se sigue usando la misma pantalla, con secciones colapsables.
- **`admin.resultados-importar.tsx`**: mantener flujo, mejorar mapeo automático de columnas (heurística por nombre), añadir vista previa antes de publicar, validación de errores, guardar como borrador (`published=false`) y detectar los nuevos campos (`bib`, `points`, `notes`, `status`).
- **`admin.live-center.tsx`**: añadir botón "Convertir a página de resultados" que llama al RPC y enlaza al `resultados/$slug` recién creado.
- **`admin.home-control.tsx`**: nueva sub-sección "Resultados destacados en Home" que lista `result_events` con `show_in_home=true` y permite reordenar (`home_order`). No se duplica con `home_standings_groups`, que sigue sirviendo la Liga.
- **`admin.hub-liga.tsx`**: se mantiene tal cual (Liga Nacional ya tiene su editor).

### 3. Público — vistas premium

- **`resultados.index.tsx`**: se mantiene el grid; se añade filtro por `type` y badge de `Destacado`.
- **`resultados.$evento.tsx`**: rediseño premium — cabecera con cartel, estado (Próximo/En directo/Finalizado), ciudad + sede + fechas, botones **Descargar PDF oficial**, **Descargar resultados (PDF / Excel / CSV con marca RollerZone)**, **Compartir**, **Ver streaming**. Tablas responsive:
  - Móvil: tarjetas / acordeón por prueba.
  - Desktop: tabla con filtros (categoría, género, prueba, club, país, estado) y orden (posición, tiempo, puntos).
- **Liga Nacional pública** (`hub.$country.competicion.liga-nacional.clasificaciones.tsx`): vista principal simplificada (Posición · Club · Federación · Puntos) y botón/desplegable **"Ver detalle por jornadas y pruebas"** que muestra la tabla completa actual dentro de un `Collapsible`. No se toca la ruta ni los datos.

### 4. Home

- `HomeResultsSlider` existente sigue mostrando podios de `live_results` marcados como `featured_in_live_center`. Se amplía la condición para incluir también los `result_events` con `show_in_home=true` (Top 3 desde `live_results` del evento) — sin crear otro slider.
- `HomeStandingsCarousel` (Liga en Home) se mantiene igual.

### 5. Descargas con marca RollerZone

Nuevo módulo `src/lib/resultsExport.ts` con tres helpers puros (dependencias ya presentes o instalables: `xlsx` / `jspdf` + `jspdf-autotable`):

- `exportCsv(rows, meta)` — cabecera comentada con `# Datos extraídos de RollerZone.es`, competición, fecha, URL; si el destino no admite comentarios, se añade columna `Fuente = RollerZone.es`.
- `exportXlsx(rows, meta)` — hoja "Información" (competición, fecha, URL, fuente) + hoja "Resultados" con pie "Datos extraídos de RollerZone.es".
- `exportPdf(rows, meta)` — tabla con `autoTable`, pie de página en cada hoja: "Datos extraídos de RollerZone.es · Fuente: RollerZone.es · Fecha de descarga: DD/MM/AAAA · URL".

Se llama desde `resultados.$evento.tsx` y desde el admin.

### 6. Diseño

Se reutiliza el sistema de tokens existente (fondo oscuro, `gold`, tipografía `font-display` / `font-condensed`). No se introducen colores nuevos. Todas las tablas nuevas siguen el patrón de `LiveResultsTable`.

### 7. QA final

- Liga Nacional sigue funcionando (ruta y datos intactos).
- Live Center sigue funcionando (nueva conversión es opcional).
- `resultados/*` sigue sirviendo los mismos slugs y añade campos nuevos como opcionales.
- Home solo muestra lo marcado (`show_in_home` / `featured_in_live_center`).
- Descargas incluyen la marca RollerZone en los tres formatos.
- Responsive verificado en móvil (tablas → tarjetas/acordeón).

---

## Alcance y entrega

Es un cambio grande pero incremental. Lo entregaré en **una sola tanda** en este orden, para no romper nada:

1. Migración aditiva (columnas + RPC).
2. `resultsExport.ts` + botones de descarga con marca.
3. Vista pública `resultados.$evento.tsx` premium + filtros.
4. Liga Nacional: vista simplificada + `Collapsible` de detalle.
5. Admin: nuevos campos, importador mejorado, botón "Convertir Live→Resultados", bloque Home.
6. `HomeResultsSlider` amplía origen a `result_events.show_in_home`.

¿Doy luz verde a este plan y empiezo por la migración?
