# Plan: Sistema profesional de resultados agrupados por evento

## Objetivo
Reorganizar todo el sistema de resultados para que funcione como un archivo deportivo profesional: todos los resultados de un mismo campeonato quedan agrupados dentro del mismo evento, con filtros, navegación clara, slider de Home controlable y archivo histórico permanente.

---

## 1. Base de datos (Supabase)

El esquema actual ya tiene `result_events` (eventos) y `live_results` (filas individuales con `event_slug`, `race`, `category`, `gender`, etc.). Lo aprovecho añadiendo solo lo que falta:

**Ampliar `live_results`:**
- `round` (text) — Final / Semifinal / Serie / Clasificatoria
- `federation` (text) — para filtro por federación
- `notes` (text) — observaciones libres
- `home_sort_order` (int) — orden específico del slider Home (independiente de `sort_order` del evento)

**Índices:**
- `(event_slug, race, category, gender, round)` para filtros rápidos
- `(featured_in_live_center, home_sort_order)` para el slider

Se mantienen RLS actuales (lectura pública, escritura admin/editor).

---

## 2. Importación CSV mejorada (`/admin/live-results`)

Nuevo flujo: **subir CSV ya asignado a un evento + metadatos comunes**.

Antes de subir el CSV, el admin selecciona:
- **Evento existente** (dropdown desde `result_events`) — obligatorio, evita duplicados
- **Prueba** (200 m, 500 m sprint, eliminación, puntos…) — texto libre o sugerencias
- **Categoría** (Senior / Junior / Juvenil / Cadete…)
- **Sexo** (Masculino / Femenino / Mixto)
- **Ronda** (Final / Semifinal / Serie…)
- **Estado** (`en_vivo` / `finalizado` / `proxima`)

El CSV solo necesita columnas de resultados (posición, atleta, club, tiempo, puntos, país, federación). Los metadatos se aplican a todas las filas al insertar. Nunca se crea un evento desde el CSV.

Modo manual: mismo formulario con tabla editable inline (añadir/eliminar filas) sin CSV.

---

## 3. Páginas públicas

### `/resultados` (index)
Listado de eventos (`result_events`) como cards: banner, nombre, fecha, país, estado. Click → página del evento.

### `/resultados/$evento` (rediseño)
- Hero del evento (banner, nombre, fecha, lugar, estado)
- **Barra de filtros** sticky: Prueba · Categoría · Sexo · Ronda · Estado · Club · Federación (multi-select; opciones derivadas dinámicamente de las filas del evento)
- **Listado de pruebas** agrupadas: cada bloque = una combinación única (prueba + categoría + sexo + ronda) con su tabla completa de clasificación, podio destacado arriba (Top 3 con medallas), tabla limpia debajo
- Soporta query params: `?prueba=200m&categoria=senior&sexo=masculino&ronda=final` → autoselecciona filtros y hace scroll a la sección
- Diseño premium actual mantenido (fondo oscuro, oro, cards)

---

## 4. Slider Home (`HomeResultsSlider`)

Lectura desde `live_results` con `featured_in_live_center = true`, ordenado por `home_sort_order`. Sin cambios visuales mayores.

**Cambio clave en el link de cada slide:**
Actualmente apunta a `/resultados/$evento`. Pasa a apuntar a la prueba concreta:
`/resultados/$evento?prueba=...&categoria=...&sexo=...&ronda=...`

Así el usuario aterriza con el filtro ya aplicado en la prueba correspondiente.

---

## 5. Panel admin

### `/admin/resultados` (eventos) — ya existe
Sin cambios estructurales. Solo añado botón **"Gestionar pruebas y resultados →"** por evento que abre la nueva pantalla.

### `/admin/resultados/$slug` (NUEVO — gestión interna de un evento)
Una sola pantalla con todo el control del evento:

- **Lista de pruebas** del evento agrupadas por (prueba + categoría + sexo + ronda) con:
  - Toggle "Mostrar en Home" (`featured_in_live_center`)
  - Input de orden Home (`home_sort_order`)
  - Badge de estado (Live / Final / Próx.) editable inline
  - Contador de filas
  - Botón "Editar filas" / "Eliminar prueba completa" / "Duplicar"
- **Subir CSV a este evento** (formulario con metadatos descritos en sección 2)
- **Crear prueba manual** (mismo formulario sin CSV)
- **Editor de filas inline** (al desplegar una prueba): posición, atleta, club, federación, país, tiempo, puntos, observaciones, eliminar fila individual
- **Acción peligrosa:** "Eliminar todos los resultados del evento" con confirmación

### `/admin/live-results` actual
Se mantiene como editor global (búsqueda transversal) pero se recomienda usar la nueva pantalla por evento.

---

## 6. Navegación final

```
/resultados                                    → todos los eventos
/resultados/campeonato-espana-pista-2026       → evento + filtros + todas las pruebas
/resultados/campeonato-espana-pista-2026?prueba=200m&categoria=senior&sexo=masculino
                                               → vista filtrada (desde slider Home)

/admin/resultados                              → CRUD eventos
/admin/resultados/campeonato-espana-pista-2026 → gestión pruebas/filas/Home de ese evento
```

---

## 7. Reglas clave garantizadas

- **Nunca se duplica un evento** desde un CSV. El evento siempre se elige antes de subir.
- **Archivo histórico:** quitar `featured_in_live_center` solo lo retira del slider Home; no borra nada.
- **Agrupación:** todas las pruebas de un mismo campeonato comparten `event_slug` y aparecen juntas en `/resultados/$slug`.
- **Diseño:** se mantiene la identidad RollerZone (fondo oscuro, acentos oro, podios, tablas limpias, tipografía actual).

---

## Archivos a crear/editar

**Migración SQL:**
- Añadir columnas `round`, `federation`, `notes`, `home_sort_order` a `live_results` + índices

**Frontend público:**
- `src/routes/resultados.$evento.tsx` — rediseño completo con filtros y agrupación
- `src/components/home/HomeResultsSlider.tsx` — link con query params
- (opcional) `src/routes/resultados.index.tsx` — verificación del grid de eventos

**Admin:**
- `src/routes/admin.resultados.$slug.tsx` — NUEVO gestor por evento
- `src/routes/admin.live-results.tsx` — nuevo bloque "Subir CSV a evento existente" con selector de evento + metadatos
- `src/routes/admin.resultados.tsx` — botón "Gestionar pruebas" en cada evento

**Sin cambios:** auth, CMS general, ticker, header/footer, hubs de países, sección de noticias.

¿Apruebas el plan para empezar?