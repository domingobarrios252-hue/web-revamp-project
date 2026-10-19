# Noticias bilingües ES / EN — análisis y plan (sin cambios todavía)

## Lo que hay hoy
- Las noticias tienen un único idioma (español): título, entradilla, texto clásico, bloques, portada, autor, país, categoría y fecha en una sola ficha. No existen títulos ni descripciones SEO separados.
- Ya existe un botón ES / EN en la web, pero solo traduce textos fijos de menús; los artículos siguen en español. No cambia la dirección de la página ni avisa a Google.
- URL actual de artículo: `/noticias/articulo/<slug>` (más las de Francia, Portugal, USA). No se toca ninguna.
- Permisos: rol + país (p. ej. Anthony solo Francia), aplicados en el servidor. La traducción heredará exactamente esos mismos permisos.
- IA disponible: Lovable AI, ya activo en el proyecto, sin claves en el navegador. Todo se ejecutaría en el servidor.

## Qué propongo
1. **Traducción vinculada, no duplicada.** Una ficha «versión inglesa» enlazada a la noticia original (1 por noticia). Guarda solo los textos traducidos (titular, subtítulo, entradilla, cuerpo/bloques, título SEO, descripción SEO) y su estado: borrador / pendiente de revisión / aprobada. Fotos, autor, fecha, categoría y créditos se leen siempre de la original.
2. **Editor.** En la noticia actual, una pestaña «Inglés» con el botón «Generar versión en inglés». La IA rellena los campos; el editor los revisa y edita. Nada se publica sin pulsar «Aprobar traducción» (solo administrador, igual que hoy la publicación).
3. **Aviso de desactualización.** Al guardar cambios en el original, la traducción queda marcada «Necesita actualizarse» (se compara una huella del texto original).
4. **Respeto terminológico.** Instrucciones a la IA: no traducir nombres de patinadores, clubes, marcas ni pruebas oficiales; mantener citas fieles; glosario de patinaje de velocidad (p. ej. «eliminación» → *elimination race*, «puntos» → *points race*, «vuelta lanzada» → *flying lap*).
5. **URLs en inglés.** `/en/news/<slug>` solo para noticias con traducción aprobada; si no existe, esa dirección no se indexa y muestra la versión española con un aviso claro «Available in Spanish only».
6. **Selector ES / EN.** Se reutiliza el actual (mismo estilo negro/dorado, móvil y ordenador). Recuerda la elección; en un artículo traducido lleva al mismo artículo en el otro idioma.
7. **SEO.** hreflang es / en / x-default y canonical propio en cada versión; títulos y descripciones traducidos; solo las versiones aprobadas entran en el sitemap.

## Costes y límites
- Cada traducción usa créditos de Lovable AI del espacio de trabajo. Una noticia típica (800–1.500 palabras) supone una sola petición; el coste exacto depende del modelo y se verá en el registro de uso, estimación orientativa: céntimos por noticia.
- Límites propuestos: máximo 30 traducciones al día en todo el sitio y 3 regeneraciones por noticia al día; solo se traduce al pulsar el botón (nunca automático ni masivo); si se acaban los créditos, se detiene y avisa sin reintentar.

## Riesgos
- Calidad de la IA en nombres/citas → mitigado por revisión obligatoria.
- Contenido duplicado para Google → mitigado con hreflang, canonical y noindex sin traducción.
- Permisos → la traducción reutiliza las reglas de servidor de la noticia; se añadirán pruebas automáticas (editor de Francia no puede traducir noticias de otros países ni aprobar).

## Implantación gradual
1. Construir todo oculto al público.
2. Probar con 3 noticias existentes que tú elijas (o propongo 3 recientes): traducción, enlaces, móvil, SEO, editor y permisos.
3. Solo con tu aprobación: abrir el botón a todas las noticias y publicar.

## No se toca
Noticias actuales, URLs, Rollerzone TV, resultados, especiales, streaming, VeloPro, medallero, permisos existentes.

## Detalles técnicos
- Nueva tabla `news_translations` (news_id FK CASCADE, lang 'en', title, subtitle, excerpt, content, content_blocks, seo_title, seo_description, status, source_hash, translated_at, approved_by/at; UNIQUE(news_id, lang)). RLS reutiliza `can_edit_country`/políticas de `news`; lectura pública solo `status='approved'` y noticia publicada; aprobación solo admin (trigger).
- Server fn `translateNews` con `requireSupabaseAuth`, comprobación de permiso sobre la noticia, límite en `check_rate_limit`, Lovable AI Gateway (streaming, salida JSON estricta), gestión 402/429 según reglas.
- Ruta `src/routes/en.news.$slug.tsx`; head con hreflang/canonical; sitemap ampliado; `LanguageToggle` enlaza a la versión equivalente.
