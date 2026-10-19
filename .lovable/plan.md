# Rollerzone después de ASU26: TV permanente y archivo histórico

## 1. Alcance y garantías

Preparar Rollerzone TV para retransmitir futuras competiciones de patinaje de velocidad y conservar ASU26 como archivo histórico, manteniendo el diseño actual en móvil y ordenador.

- Conservar todas las URL, páginas, fotografías, noticias, clasificaciones, fases, PDF, medallero y retransmisiones existentes.
- No cambiar permisos, cuentas ni integraciones de VeloPro.
- No modificar horarios ni estados de pruebas individuales para aparentar que están finalizadas.
- No ejecutar cambios hasta aprobar este plan. La aprobación del plan no autoriza publicar ni detener la sincronización.
- La sincronización se revisará únicamente en lectura; cualquier desactivación requerirá una autorización posterior y concreta.

## 2. Estructura actual comprobada

| Área | Situación actual | Consecuencia |
|---|---|---|
| `/rollerzone-tv` | Redirige a `/tv`. | Sustituir la redirección por la página general, sin romper `/tv`. |
| `/tv` | Ya tiene reproductor, programación, vídeos destacados, publicidad y patrocinadores. | Reutilizar esta experiencia, no crear una segunda TV independiente. |
| Administración | `/admin/tv`, `/admin/tv-emisiones`, `/admin/tv-highlights` y `/admin/resultados-eventos` ya existen. | Ampliar controles existentes; no crear otro sistema de permisos. |
| Retransmisiones de campeonatos | `result_events` ya dispone de campos `stream_*`, editables desde el gestor de eventos. | Utilizar esos eventos como fuente central, vinculados por ID. |
| Especial ASU26 | Sigue publicado con `special_editorials.status = active`. | Mantener ese estado editorial: cambiarlo a “finalizado” impediría resolver la página. |
| Campeonato ASU26 | Su evento de Resultados figura `en_vivo`; el evento vinculado de Calendario figura `upcoming`. | Alinear solo el estado global del campeonato a FINALIZADO. |
| TV ASU26 | Configuración `asu26_streaming`: `streamStatus = upcoming`, `tvPromoActive = true`. | Cambiar la presentación a histórica y retirar el protagonismo temporal de la portada general. |

La sincronización está habilitada y sin parada registrada. La última ejecución satisfactoria guardada es del 19 de octubre a las 02:59 UTC. Existe una tarea ASU26/Vensport activa cada 30 segundos. Esto describe los controles observados, no certifica por sí solo la integridad de las clasificaciones definitivas.

## 3. Especial ASU26 como archivo

### Resultado visible

- Mostrar **FINALIZADO · Archivo ASU26** en el especial y su página de TV.
- Conservar el acceso desde Especiales, todas las piezas y las URL actuales, incluidas las páginas de Resultados.
- Mantener calendario histórico, selección española, medallero, noticias, galería y clasificaciones completas.
- Reemplazar únicamente indicadores de actualidad como “Hoy” o “En directo” por etiquetas históricas cuando proceda; conservar las entradas y mensajes existentes.
- Conservar todos los enlaces y señales de vídeo. No afirmar que hay grabaciones reproducibles si el proveedor solo conserva un enlace de directo; mostrar disponibilidad real y un aviso neutral cuando no haya reproducción.

### Cambios de datos previstos, limitados a ASU26

- `result_events.status`: `en_vivo` → `finalizado`.
- `events.status`: `upcoming` → `finished`, para el evento vinculado del mismo campeonato.
- `site_settings`, clave `asu26_streaming`: `streamStatus` → `finished` y `tvPromoActive` → `false`, conservando el resto del objeto y sus enlaces.
- Mantener `special_editorials.status = active`, las publicaciones y los enlaces por ID.

El fin del campeonato **no** convierte automáticamente sus resultados en oficiales. No se cambiarán `live_results.result_status`, sus fuentes ni las clasificaciones. Actualmente hay 3.383 filas de origen Vensport/VeloPro, incluidas fases, marcadas `unconfirmed`; conservarán su atribución y condición actual.

## 4. Rollerzone TV permanente

### Página general

`/rollerzone-tv` tendrá:

1. **Retransmisión destacada:** campeonato elegido desde administración, portada y reproductor existente.
2. **Estado manual:** PRÓXIMAMENTE, EN DIRECTO o FINALIZADO. La hora prevista no activará por sí sola un directo.
3. **Próximas retransmisiones:** campeonatos publicados, con fecha y hora.
4. **Archivo de competiciones:** campeonatos finalizados o archivados, con acceso a su vídeo disponible y contenidos relacionados.
5. **ASU26:** entrada histórica que conduce a su página específica, sin duplicar sus cuatro señales ni inventar grabaciones.

Conservar publicidad, patrocinadores, consentimiento para vídeos externos, programación antigua y vídeos destacados. Los registros de `tv_broadcasts` y `tv_highlights` permanecerán intactos y accesibles; no se migrarán ni convertirán automáticamente.

`/tv` seguirá funcionando con el mismo componente y los mismos datos de la página general. No se añadirán redirecciones para páginas específicas ni se cambiarán las URL ASU26. Los enlaces principales a TV apuntarán a `/rollerzone-tv`; los enlaces antiguos seguirán funcionando. Cada dirección tendrá metadatos coherentes y una URL canónica común para evitar duplicar la página en buscadores.

### Reglas del reproductor y archivo

- Solo puede existir una selección destacada; se guardará el ID del campeonato elegido.
- Un campeonato oculto no podrá aparecer en el reproductor ni en los listados públicos.
- Archivar no elimina ni despublica resultados, noticias o el propio campeonato.
- Archivar finalizará la retransmisión y la trasladará al archivo; no cambiará su estado deportivo ni sus pruebas individuales.
- Un elemento archivado no podrá seguir destacado; será posible editarlo y devolverlo al listado sin borrar su historial.
- Sin selección destacada, mantener la configuración general actual como alternativa; nunca elegir o anunciar un directo arbitrariamente.

## 5. Administración

Ampliar **Admin → TV → Emisiones** como gestor de retransmisiones de campeonatos, conservando una vista de las emisiones existentes.

Campos: campeonato, portada, inicio y fin con zona horaria visible, enlace de vídeo o inserción autorizada, proveedor/atribución y estado.

Acciones: guardar, editar, publicar/ocultar la retransmisión, destacar y archivar. En el nuevo flujo se utilizará archivar, no borrar. Se reutilizarán los campos de retransmisión del gestor de eventos, para que ambas pantallas editen el mismo registro.

La publicación en TV será independiente de `result_events.published`: ocultar un vídeo nunca ocultará sus resultados. El nuevo gestor no ampliará facultades de los editores; las operaciones nuevas se validarán como administrador en el servidor, utilizando los controles existentes. No se accederá a tu cuenta Admin para probarlo.

**Vídeos autorizados:** aceptar enlaces HTTPS e inserciones de proveedores ya admitidos. De un código de inserción se extraerá solo la URL válida; no se ejecutarán scripts ni HTML arbitrario. Conservar el consentimiento actual. Si un proveedor nuevo necesita ampliar la política de seguridad, solicitar autorización antes de hacerlo.

## 6. Detalle técnico: rutas, componentes y base de datos

### Archivos previstos

| Archivos | Cambio |
|---|---|
| `src/routes/rollerzone-tv.index.tsx`, `src/routes/tv.tsx` | Página general compartida y metadatos; conservar acceso antiguo. |
| Nuevo `src/components/tv/RollerzoneTvPage.tsx` | Extraer la experiencia actual para reutilizarla en ambas rutas. |
| Nuevos componentes TV de próximas retransmisiones y archivo | Listados del mismo catálogo de eventos, con reproducción/selección sin nuevas URL obligatorias. |
| `src/components/tv/TvTopStage.tsx` | Adaptar el evento destacado al reproductor existente, conservando anuncios y consentimiento. |
| Nuevos módulos `src/lib/tv/broadcasts.ts` y `broadcasts.functions.ts` | Tipos, reglas, lecturas públicas y operaciones de administración verificadas en servidor. |
| `src/routes/admin.tv-emisiones.tsx`, `src/routes/admin.tv.tsx` | Gestor ampliado y selección del destacado. |
| `src/routes/admin.resultados-eventos.tsx` | Compartir controles de retransmisión, evitando editores divergentes. |
| `src/routes/admin.tsx` | Ajustar el nombre de la entrada del gestor, sin cambiar permisos. |
| `src/routes/especiales.$slug.index.tsx`, `src/components/specials/live/Asu26SpecialHub.tsx` | Presentación histórica exclusivamente para ASU26. |
| `src/routes/rollerzone-tv.world-skate-games-asu26.tsx` y componentes ASU26 necesarios | Estado finalizado y etiquetas históricas; conservar señales y contenidos. |
| `src/lib/tv/asu26Streaming.ts` | Lectura coherente de la configuración histórica, conservando los valores del resto del objeto. |
| Navegación compartida y sitemap, si precisan ajuste | TV general y enlace permanente a Especiales; conservar URL existentes. |

No está previsto modificar `provider.ts`, los parsers/sincronizadores VeloPro ni la lógica de filtros/PDF de Resultados. Tampoco corregir el fallo previo de “Quitar filtros”: queda fuera de esta solicitud.

### Cambios aditivos de esquema

**No crear tablas nuevas ni un sistema paralelo de streaming.**

- Reutilizar en `result_events`: `name`, `stream_title`, `stream_description`, `stream_url`, `stream_embed_url`, `stream_poster_url`, `stream_poster_mobile_url`, `stream_scheduled_at`, `stream_status`, `stream_provider` y `stream_attribution`.
- Añadir `stream_published` (booleano, predeterminado `false`), `stream_ends_at` (fecha/hora opcional) y `stream_archived_at` (fecha/hora opcional). No reinterpretar silenciosamente `stream_active` ni publicar automáticamente registros anteriores.
- Añadir a `tv_settings` `featured_result_event_id` (UUID opcional, referencia a `result_events`, sin borrado en cascada).
- Validar fechas y valores admitidos. Mantener las políticas y concesiones actuales; no alterar roles ni funciones de autorización.
- `tv_broadcasts`, `tv_highlights`, noticias, pruebas, resultados y medallero: sin cambios de esquema ni eliminación de datos.

La ampliación del esquema se aplicaría al backend compartido tras aprobar el plan; no queda aislada por no publicar la web. Será aditiva y compatible con la versión publicada. Antes de los cambios de estado se guardarán los valores originales para poder revertirlos sin tocar contenidos.

## 7. Sincronización: revisión y propuesta, no desactivación

Antes de proponer detenerla:

1. Comparar las clasificaciones finales disponibles en la fuente autorizada con las almacenadas, incluyendo categorías, fases, puestos y vínculos por ID.
2. Documentar pruebas sin clasificación final, discrepancias y pendientes. Actualmente el calendario conserva 17 pruebas `programada` y 2 `suspendida`; no se modificarán automáticamente.
3. Revisar páginas pendientes de sincronización, últimas ejecuciones y posibles cambios recientes.
4. Presentar una recomendación y solicitar autorización específica.

**Dependencia importante:** el control `results_sync_state`, clave `asu26_speed`, es compartido por los sincronizadores ASU26 y Vensport. Desactivarlo detendría también la importación VeloPro de este campeonato. No se tocará el interruptor, las tareas programadas ni las integraciones con la aprobación de este plan. Los resultados almacenados seguirían disponibles aunque una desactivación posterior fuera autorizada.

## 8. Verificación y entrega antes de publicar

- Pruebas de las tres etiquetas, publicación independiente, selección única, archivo sin borrado y rechazo de inserciones no autorizadas.
- Repetir las 52 pruebas de permisos mediante el procedimiento existente, sin usar tu Admin; cualquier dato temporal se gestionará solo mediante ese procedimiento controlado.
- Probar con una cuenta de pruebas autorizada: guardar, editar, publicar, destacar y archivar; confirmar lectura pública y bloqueo para Editor Francia.
- Comprobar en móvil y ordenador las dos entradas TV, ASU26, el especial, Resultados, vídeos disponibles, portadas y consentimiento.
- Comparar antes/después publicaciones, cantidades de datos y valores de clasificaciones, medallero, noticias y horarios; ninguna modificación fuera de los estados globales descritos.
- Revisar portada, Francia, Portugal, USA y demás páginas principales, errores y seguridad.
- Entregar resumen de cambios y pendientes en vista previa. Publicar únicamente tras tu autorización explícita.

## Orden de ejecución tras aprobación

1. Salvaguarda e inventario de datos y configuración.
2. Ampliación compatible de los campos existentes y gestor reutilizado.
3. TV general compartida y catálogo/archivo.
4. Estado global y presentación histórica ASU26.
5. Pruebas y revisión de sincronización en lectura.
6. Entrega en vista previa, esperando autorización de publicación y, por separado, cualquier pausa de sincronización.