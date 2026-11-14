# Home · Especial ASU26

- Nueva sección compartida ES/EN, entre `home_top` (banner) y EditorialCover. No cambios en otros bloques.
- Portadas originales optimizadas a WebP, 960 × 1352, completas y con espacio reservado. Dos columnas desde 360 px; apiladas a 320 px.
- Configuración privada opcional: `ASU26_HEYZINE_ES_URL` y `ASU26_HEYZINE_EN_URL`. Ambas intencionadamente pendientes, sin valores ficticios ni escritura en configuración pública.
- El servidor comprueba su reloj y el enlace válido de cada edición. Apertura desde 2026-11-15T17:00:00Z (18:00 Europe/Madrid). Respuesta de estado solo devuelve booleanos, no URLs.
- Rutas propias `/especial-asu26/leer/es` y `/especial-asu26/leer/en`: validan de nuevo el reloj, no admiten destinos arbitrarios y responden no-store (también CDN). Antes: 403; tras estreno sin enlace: 503; disponible: 302 a su edición.
- Actualización de página abierta programada según reloj del servidor, comprobación al recuperar foco y cada minuto para detectar configuración pendiente. Sin cron, migraciones, dependencias nuevas ni cambios de datos.

## Comprobaciones
- 6 pruebas, 19 aserciones: instante anterior/exacto, zona horaria, enlaces pendientes, activación independiente, destinos y caché.
- Navegador real: ES/EN a 1280, 390, 320 px; portadas cargadas y dimensiones iguales, botones desactivados, apilado solo en estrechas; cero errores JS.
- Acceso real anticipado a ruta de lectura rechazado, no-store.
- Home abierta: respuestas del servidor simuladas un segundo antes/exactamente al estreno; sin recargar desaparece el aviso, español se convierte en enlace amarillo a la ruta correcta y abre en pestaña nueva; inglés pendiente permanece desactivado. No se cambió reloj ni configuración del servidor real.
- Última compilación: OK.

## Pendiente
- Sin enlaces finales no se puede comprobar lectura real de Heyzine ni su correspondencia editorial; redirecciones probadas con URLs de prueba solo en tests.
- No publicado. Se necesita autorización explícita para publicar.