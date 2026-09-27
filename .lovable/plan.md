# ESTADÍSTICAS — Auditoría y plan técnico (sin implementar)

## 1. Qué mide hoy Rollerzone.es
- **Google Analytics 4** (G-2ZLN80RMTW), instalado directamente con gtag.js (no hay Google Tag Manager).
  - Solo se carga si el visitante acepta "Analíticas" en el banner de cookies (Consent Mode, denegado por defecto).
  - Envía una página vista en cada cambio de página. No envía eventos propios (ni Play en TV, ni clics).
- **Contador propio de noticias** en la base de datos: 3.532 lecturas registradas de 165 noticias, una por navegador y noticia (identificador anónimo, sin datos personales). Funciona sin cookies de analítica.
- **Estadísticas de banners**: impresiones y clics por día (hoy a 0).
- No hay otros sistemas (ni Tag Manager, ni Meta Pixel, ni Clarity, ni similares).

## 2. Métricas disponibles ya
Con GA4 (solo visitantes que aceptan cookies): usuarios, sesiones, páginas vistas, tiempo medio, páginas por sesión, evolución diaria/semanal/mensual, países, fuentes de tráfico (Google, Instagram, Facebook, directo, referrals), dispositivo, navegador, sistema operativo, tráfico por sección (por dirección web), páginas de especiales y TV, tiempo real (usuarios activos, página, país, dispositivo), comparativas entre periodos.

Con el contador propio: ranking de noticias por lecturas y lectores únicos, con imagen, título, hub y fecha, filtrable por fechas.

## 3. Métricas no disponibles hoy
- **Reproducciones reales en Rollerzone TV**: no se registran. Solo se sabe que alguien visitó la página.
- **Tiempo medio de lectura por noticia**: el contador propio no lo mide. GA4 puede dar el tiempo por página, pero solo de quien acepta cookies.
- **Cifras totales exactas**: GA4 no cuenta a quien rechaza cookies, así que sus cifras son menores que el tráfico real. El dashboard lo indicará.
- **Histórico anterior**: GA4 solo tiene datos desde su instalación; el contador propio, desde su primera lectura.

## 4. Qué habría que configurar
1. **Acceso de lectura a GA4 desde el servidor**. La conexión de Google Analytics disponible solo sirve para instalar la etiqueta, no para leer informes. Hace falta:
   - una cuenta de servicio de Google Cloud con la API "Google Analytics Data" activada;
   - añadir su email como "Lector" en la propiedad GA4;
   - guardar su clave como secreto privado del servidor, más el ID numérico de la propiedad (no es el G-…).
   Te guiaré paso a paso cuando lo apruebes. La clave nunca llega al navegador.
2. **Evento "Play" en Rollerzone TV** (opcional, recomendado): un evento `tv_play` en GA4 al aceptar y cargar el vídeo, con el nombre de la emisión. Respeta el consentimiento, no lleva datos personales y no ralentiza la web.

## 5. Tablas y servicios
- GA4 Data API (informes) y Realtime API ("Ahora en Rollerzone"), llamadas solo desde el servidor.
- Tablas existentes: `news_views` (ranking), `news` (título, imagen, hub, fecha), `special_editorials` (detección automática de especiales nuevos por su dirección), `ad_banner_stats_daily` (sin cambios).
- Sin tablas nuevas. Caché breve en el servidor (unos 5 min; tiempo real 30 s) para no agotar la cuota de GA4.

## 6. Integración con el Admin
- Nueva entrada **"Estadísticas"** en el menú del Admin, visible solo para administradores y protegida también en el servidor (el servidor comprueba el rol en cada consulta).
- Una sola pantalla con filtro de fechas (Hoy, Ayer, 7 días, 30 días, Este mes, Mes anterior, Este año, Personalizado) que actualiza todos los bloques: resumen con variación, evolución, noticias más leídas, secciones, países, fuentes, dispositivos, TV, especiales, tiempo real y comparativas.
- Mismo estilo oscuro y dorado del Admin; tarjetas y gráficos sencillos; versión móvil cuidada.
- Si GA4 no está conectado todavía, los bloques de GA4 muestran "Pendiente de conectar Google Analytics", nunca cifras inventadas. El ranking de noticias funciona desde el primer día.
- Secciones por dirección web: General y hubs (/espana, /colombia, /portugal, /miami + noticias por hub), /tv, resultados, magazine, /especiales/*, eventos.

## Qué no cambia
Noticias, URLs, slugs, permisos existentes, SEO, Rollerzone TV (salvo el evento opcional de Play, si lo apruebas), banner de cookies.

## Decisiones que necesito
1. ¿Configuramos la cuenta de servicio de GA4 (punto 4.1)?
2. ¿Añado el evento de reproducción en Rollerzone TV (punto 4.2)?
