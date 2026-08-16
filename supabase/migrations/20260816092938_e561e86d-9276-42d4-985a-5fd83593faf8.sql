UPDATE public.legal_pages
SET content = $rz$En RollerZone Spain utilizamos cookies y tecnologías de almacenamiento en el navegador. Esta política describe exactamente las que se utilizan hoy en rollerzone.es.

Responsable: RollerZone Spain. Contacto: [rollerzonespain@gmail.com](mailto:rollerzonespain@gmail.com)

## ¿Qué son las cookies?

Son pequeños archivos o datos que un sitio web guarda en tu navegador. Junto a ellas utilizamos tecnologías equivalentes (almacenamiento local del navegador) con las mismas garantías y con la misma información que se detalla aquí.

## Categorías que utilizamos

**1. Necesarias (siempre activadas)**

Imprescindibles para el funcionamiento, la seguridad, la autenticación y las preferencias esenciales de RollerZone.es. Sin ellas la web no puede funcionar correctamente, por lo que no pueden desactivarse.

- **sb-…-auth-token** — Proveedor: RollerZone (servicio de autenticación propio, Supabase). Finalidad: mantener tu sesión cuando inicias sesión. Duración: hasta el cierre de sesión o la expiración de la sesión. Propia. Solo existe si te registras o inicias sesión.
- **rz_cookie_consent_v2** — Proveedor: RollerZone. Finalidad: recordar tu elección sobre cookies (categorías autorizadas, versión y fecha de la decisión). Duración: persistente hasta que la cambies o borres los datos del navegador. Propia.
- **Preferencia de idioma e interfaz** — Proveedor: RollerZone. Finalidad: recordar el idioma y ajustes básicos de visualización. Duración: persistente. Propia.
- **rz_visitor (identificador aleatorio de visita)** — Proveedor: RollerZone. Finalidad: contar de forma agregada las visitas a una noticia y evitar contarlas por duplicado. No contiene datos identificativos ni se comparte con terceros. Duración: persistente. Propia.

**2. Analíticas (desactivadas por defecto)**

Nos permiten conocer de forma agregada cómo se utiliza RollerZone y mejorar el servicio. Solo se activan si las aceptas.

- **_ga** — Proveedor: Google Analytics 4 (Google). Finalidad: distinguir usuarios de forma estadística. Duración: 2 años. Tercero.
- **_ga_&lt;identificador de propiedad&gt;** — Proveedor: Google Analytics 4 (Google). Finalidad: mantener el estado de la sesión de medición. Duración: 2 años. Tercero.

Antes de tu consentimiento, Google Analytics se carga con el almacenamiento analítico denegado mediante Consent Mode y la librería de medición no se descarga: no se crean estas cookies. Si aceptas las analíticas, se activan; si retiras el consentimiento, se vuelve a denegar el almacenamiento analítico y dejamos de enviar mediciones.

**3. Contenido externo (desactivado por defecto)**

Reproductores y contenidos incrustados de terceros. Mientras no lo permitas, no cargamos el contenido: verás un aviso con el botón "Permitir y ver contenido". Cuando es posible utilizamos modos de incrustación con privacidad mejorada (por ejemplo el dominio youtube-nocookie), lo que no sustituye a tu consentimiento.

- **YouTube / youtube-nocookie** — Proveedor: Google. Finalidad: reproducir vídeos incrustados. Cookies y almacenamiento propios del proveedor (por ejemplo VISITOR_INFO1_LIVE, YSC, CONSENT), con duraciones que van de la sesión a 2 años. Tercero.
- **World Skate Europe TV (players.cdn.enetres.net)** — Proveedor: proveedor técnico del reproductor oficial. Finalidad: emitir la retransmisión oficial del Europeo. Cookies y almacenamiento determinados por el proveedor. Tercero.
- **Otros reproductores incrustados realmente utilizados** — Facebook Video, Twitch, Vimeo o el reproductor que en cada caso indique la fuente del vídeo. Finalidad: reproducir el contenido. Cookies y duraciones determinadas por cada proveedor. Terceros.
- **Google Maps** — Proveedor: Google. Finalidad: mostrar el mapa de la sede de un evento. Cookies y duraciones determinadas por el proveedor. Tercero.

No utilizamos cookies de publicidad comportamental, de perfilado publicitario ni de redes sociales de seguimiento. La publicidad y los patrocinios que ves en RollerZone se sirven desde nuestros propios sistemas y no instalan cookies de terceros.

## Cómo aceptar o rechazar

Al entrar por primera vez verás un aviso con tres opciones igualmente accesibles:

- **Aceptar todas**: activa las analíticas y el contenido externo.
- **Rechazar no necesarias**: mantiene solo las necesarias. Google Analytics no recibe permiso analítico y el contenido externo permanece bloqueado.
- **Configurar**: abre el panel de preferencias para activar o desactivar por separado las analíticas y el contenido externo, y guardar la elección con "Guardar preferencias".

Seguir navegando, hacer scroll o cerrar el aviso no se interpreta como consentimiento: hasta que elijas, las categorías no necesarias permanecen desactivadas.

## Cómo cambiar o retirar tu elección

En cualquier momento puedes pulsar **Gestionar cookies** en el pie de página de cualquier página. Se abrirá el mismo panel de preferencias y podrás activar o desactivar las analíticas y el contenido externo. La nueva elección se guarda y se aplica de inmediato, sin necesidad de borrar manualmente las cookies del navegador.

Adicionalmente, puedes eliminar o bloquear cookies desde la configuración de tu navegador. Si borras el almacenamiento del navegador, volveremos a preguntarte.

## Versiones

Guardamos la versión de tu consentimiento. Si en el futuro cambian las categorías o esta política de forma sustancial, incrementaremos la versión y volveremos a solicitar tu elección.$rz$,
    updated_at = now()
WHERE slug = 'cookies';