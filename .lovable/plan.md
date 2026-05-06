## Plan: Idiomas reales + Resultados profesional

Esta entrega es grande (5 bloques). Propongo dividirla en **2 fases** para no romper funcionalidades existentes y poder validar entre medias.

---

### FASE 1 — Sistema de idiomas ES/EN funcional en toda la web

Ya existe la infraestructura base (`LanguageProvider`, `translations.ts`, `useT`, `LanguageToggle`). El problema es que la mayoría de componentes usan strings en español hardcodeados.

**Cambios:**

1. **Ampliar `src/lib/i18n/translations.ts`** con todas las claves que faltan (Live Center, resultados, formularios, eventos, fechas, categorías, footer secundario, ticker, etc.).
2. **Reemplazar strings hardcodeados con `t("...")`** en:
   - `SiteHeader.tsx` (menú, submenús, botones)
   - `SiteFooter.tsx`
   - `LiveCenter.tsx` (tabs, badges, botones, "Próximas pruebas", etc.)
   - `LiveBar.tsx` / `Ticker.tsx`
   - `index.tsx` (Hero, secciones home)
   - `noticias.index.tsx`, `noticias.articulo.$slug.tsx`
   - `eventos.index.tsx`, `eventos.$slug.tsx`
   - `resultados.$evento.tsx` (y la nueva página de resultados)
   - `tv.tsx`, `revista.tsx`, `entrevistas.*`, `patrocinadores.tsx`, `redactores.tsx`, `premios-mvp.tsx`
   - `auth.tsx`, `legal.$slug.tsx`, `CookieBanner.tsx`
3. **Formato de fechas** según idioma (`Intl.DateTimeFormat` con `lang === "en" ? "en-GB" : "es-ES"`). Crear helper `src/lib/i18n/format.ts`.
4. **Persistencia + auto-detección**: ya existe en `LanguageProvider` (localStorage `rz_lang_v1` + navigator.language). Verificar que funciona y añadir `<html lang>` dinámico (ya está).
5. **URLs `/es/` y `/en/`**: ⚠️ TanStack Start usa rutas file-based. Implementar prefijos reales requeriría duplicar todo el routeTree o un layout `/$lang/`. Esto es un refactor enorme y arriesgado. **Propuesta**: mantener URLs actuales (sin prefijo) y persistir idioma en localStorage + `<html lang>`. Si insistes en `/es/` y `/en/`, lo hacemos en una iteración aparte porque toca todas las rutas. *(Confirmar antes de implementar prefijos.)*

**Contenido de BD (noticias, eventos, etc.)**: el contenido editorial seguirá en el idioma en que se subió (no se traduce automáticamente). Sólo se traduce la **UI**. Esto es estándar y lo correcto.

---

### FASE 2 — Página y panel de Resultados profesional

Ya existe `live_results` (con `event_slug`, posición, atleta, club, tiempo, puntos, status `en_vivo|finalizado|proxima`) y la ruta `/resultados/$evento`. Falta: índice de eventos con resultados, filtros, columnas extra (país, diferencia), banner, y un panel admin más cómodo.

**Cambios de BD (migración):**
- Añadir a `live_results`: `country` (text), `gap` (text), `distance` (text), `gender` (text), `is_highlighted` (boolean), `featured_in_live_center` (boolean).
- Añadir tabla `result_events` (o reutilizar `events` enlazándolo): nombre, slug, fecha, país, banner_url, status. **Recomiendo nueva tabla ligera `result_events`** para no acoplar con `events` (que tiene otra semántica de calendario).
  - Campos: `id, slug (unique), name, event_date, country, banner_url, status (live|finalizado|proximo), published, sort_order`.
- RLS: lectura pública de publicados, escritura admin/editor.

**Frontend público:**
- Nueva ruta `src/routes/resultados.index.tsx` → listado de eventos con resultados (cards con banner, estado, fecha, país).
- Refactor `resultados.$evento.tsx`:
  - Header con banner, nombre, fecha, país, badge de estado (LIVE animado si aplica).
  - Filtros (categoría, distancia, sexo, club, país) con `useState` y derivado.
  - Tabla con columnas: Pos, Patinador, Club, País, Tiempo, Diferencia, Puntos.
  - Resaltar filas `is_highlighted` con acento dorado.
  - Diseño premium negro/dorado, hover, responsive (tabla → cards en móvil).

**Panel admin:**
- Nueva ruta `src/routes/admin.resultados.tsx`:
  - Lista de `result_events` con crear/editar/borrar (banner, nombre, fecha, país, estado).
  - Editor inline de clasificaciones por evento: añadir filas, reordenar (drag con `sort_order` o flechas ↑↓), marcar destacado, status por fila.
  - Botón "Publicar resultados" que pone `published = true` masivamente.
- Mantener compatibilidad con `admin.live-results.tsx` actual o redirigir.

**Live Center:**
- En `admin.live-center.tsx`, añadir selector de "evento destacado" (lee `result_events`).
- En `LiveCenter.tsx`, mostrar el top-N de resultados del evento destacado con badge LIVE animado.

---

### Técnico

```text
src/
  lib/i18n/
    translations.ts        ← ampliar dictamen completo ES/EN
    format.ts              ← formatDate(date, lang), formatNumber...
    LanguageProvider.tsx   ← (ya existe, sin cambios)
  components/site/
    SiteHeader.tsx         ← t("nav.*")
    SiteFooter.tsx         ← t("footer.*")
    LiveCenter.tsx         ← t("tv.*"), t("home.*") + integrar evento destacado
    Ticker.tsx, LiveBar.tsx
  routes/
    index.tsx              ← t() en hero/secciones
    resultados.index.tsx   ← NUEVO listado
    resultados.$evento.tsx ← refactor con filtros + columnas extra
    admin.resultados.tsx   ← NUEVO panel CRUD eventos+clasificaciones
    (resto de rutas públicas con t())
```

Migración SQL:
```sql
ALTER TABLE live_results
  ADD COLUMN country text,
  ADD COLUMN gap text,
  ADD COLUMN distance text,
  ADD COLUMN gender text,
  ADD COLUMN is_highlighted boolean NOT NULL DEFAULT false,
  ADD COLUMN featured_in_live_center boolean NOT NULL DEFAULT false;

CREATE TABLE result_events (
  id uuid PK default gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  event_date date,
  country text,
  banner_url text,
  status live_result_status NOT NULL DEFAULT 'proxima',
  published boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at, updated_at
);
-- + RLS (lectura pública si published, escritura admin/editor)
```

---

### Preguntas antes de empezar

1. **URLs `/es/` y `/en/`**: ¿obligatorio (refactor grande de rutas) o aceptas idioma persistido sin prefijo en URL? Recomiendo lo segundo.
2. **Resultados destacados en Live Center**: ¿reemplazar la sección actual de "Resultados" del Live Center por el evento destacado, o añadirlo como una sección nueva?
3. ¿Empiezo por la **Fase 1 (idiomas)** y luego la **Fase 2 (resultados)** en mensajes separados, o lo hago todo del tirón?
