# Auditoría móvil y rendimiento — RollerZone.es

Es una auditoría muy amplia (toda la web + admin + Core Web Vitals + accesibilidad). Para no romper nada y mantener control, la propongo por **fases independientes** que se pueden aprobar y ejecutar por separado. Intentar todo en un solo turno provocaría cambios masivos difíciles de revisar.

## Enfoque general

- No se elimina contenido, ni se cambian URLs, ni se toca la identidad visual (colores oro/negro, tipografías actuales).
- Se reutilizan componentes existentes (`SiteHeader`, `NewsVideoPlayer`, `TvSidebarBanners`, `HubDashboard`, etc.).
- Cada fase termina con verificación real vía Playwright en viewports móvil (390×844), tablet (768×1024) y desktop (1280×900), con capturas.
- Al final de cada fase: informe corto (problemas encontrados / cambios / pendientes).

## Fase 1 — Diagnóstico (sin cambios de código)

1. Recorrer con Playwright en 390px las páginas clave: `/`, `/noticias`, `/noticias/articulo/[slug]`, `/eventos`, `/resultados`, `/tv`, `/rollerzone-tv`, `/revista`, `/hub/es`, `/hub/co`, `/premios-mvp`, `/salon-de-la-fama`, `/especiales`, `/admin`.
2. Detectar automáticamente: scroll horizontal (`document.documentElement.scrollWidth > innerWidth`), imágenes sin `alt`, botones <44px, tablas overflow, `h-screen` en vez de `h-dvh`.
3. Medir peso inicial (JS/CSS/imagen) y LCP aproximado con Performance API.
4. Entregar informe con lista priorizada de problemas reales, no hipotéticos.

## Fase 2 — Responsive y navegación móvil

- Corregir overflow horizontal detectado en Fase 1 (patrón `grid-cols-[minmax(0,1fr)_auto]` + `min-w-0` + `shrink-0` + `truncate`).
- Tap targets: subir botones icon-only a `min-h-11 min-w-11`.
- Revisar menú hamburguesa (`SiteHeader`): cierre con overlay, scroll interno, foco atrapado.
- Tablas de resultados y clasificaciones: envolver en `overflow-x-auto` **contenido**, no la página.

## Fase 3 — Rendimiento y Core Web Vitals

- `loading="lazy"` + `decoding="async"` en imágenes fuera del hero; `fetchpriority="high"` + preload en LCP del home y del artículo.
- Convertir imágenes bundled a WebP/AVIF con `vite-imagetools` donde aplique (assets estáticos). Las imágenes subidas por admin ya viven en Storage; se sirven con `<img>` responsive (`sizes`, `srcset`) cuando la fuente lo permite.
- Lazy real de embeds pesados: YouTube/Twitch/Vimeo con "click-to-load" (poster + botón play → monta `<iframe>`). Se aplica a `NewsVideoPlayer` (embed) y a `TvEventLiveCenter`.
- Code-splitting: revisar imports pesados en `index.tsx` y `admin.*` (dynamic `import()` para editores y `LiveTimelineEditor`).
- Eliminar CSS/JS no usado detectado por el diagnóstico.

## Fase 4 — Noticias y RollerZone TV

- Artículo: garantizar que imagen destacada y `NewsVideoPlayer` no desbordan (ya usan `aspect-video w-full`); revisar galerías.
- TV móvil: mover `TvSidebarBanners` debajo del reproductor en <lg; ya usan grid, verificar orden.
- Player: mantener `controls`, sin autoplay, `playsInline` (ya está).

## Fase 5 — Resultados / PDFs

- Tablas con `overflow-x-auto` interno + `min-w-0` en el contenedor padre.
- Botones "Ver PDF" / "Descargar" a tamaño táctil y con `aria-label` explícito.

## Fase 6 — Admin en móvil/tablet

- Revisar `admin.index.tsx` y formularios (`NewsVideoUploadField`, `ImageUploadField`) en 390–768px.
- Persistencia al editar: verificar que el guardado no se pierde al rotar o cerrar teclado (autosave / warn-on-unload donde aplique).

## Fase 7 — Accesibilidad

- Alt text faltante, contraste con tokens (`text-foreground` / `text-muted-foreground`), labels de formularios, `<main>` único por ruta, zoom sin romper layout.

## Detalles técnicos

- Herramientas: Playwright headless (ya instalado) para reproducir y capturar; `bun run build` para verificar; sin `tsc` manual.
- No se toca `src/integrations/supabase/*` ni `src/routeTree.gen.ts`.
- Cada fase = 1 commit lógico con archivos listados.
- PageSpeed Insights es externo: solo puedo medir localmente Lighthouse-like con Playwright; los números finales de PSI los verás tras publicar.

## Qué necesito de ti

Confirma cómo prefieres avanzar:

1. **Empiezo por la Fase 1 (diagnóstico)** y te entrego el informe real antes de tocar nada. *(recomendado)*
2. **Ejecuto Fases 1–3 seguidas** (diagnóstico + responsive + rendimiento) y te entrego un solo informe.
3. **Priorizas una página concreta** (p. ej. portada + artículo de noticia) y hago auditoría profunda solo de esas dos primero.

Dime opción (1 / 2 / 3) y arranco.
