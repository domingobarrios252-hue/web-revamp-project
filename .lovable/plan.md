# Rollerzone después de ASU26: TV permanente y archivo histórico

## 1. Alcance y garantías

Preparar Rollerzone TV para retransmitir futuras competiciones de patinaje de velocidad y conservar ASU26 como archivo histórico, manteniendo el diseño actual en móvil y ordenador.

- Conservar todas las URL, páginas, fotografías, noticias, clasificaciones, fases, PDF, medallero y retransmisiones existentes.
- No cambiar permisos, cuentas ni integraciones de VeloPro.
- No modificar horarios ni estados de pruebas individuales para aparentar que están finalizadas.
- No ejecutar cambios hasta aprobar este plan. La aprobación del plan no autoriza publicar ni detener la sincronización.
- La sincronización se revisará únicamente en lectura; cualquier desactivación requerirá una autorización posterior y concreta.

## 2. Estructura comprobada

- `/rollerzone-tv` redirige a `/tv`, que ya tiene reproductor, programación, vídeos, anuncios y patrocinadores.
- Existen `/admin/tv`, `/admin/tv-emisiones`, `/admin/tv-highlights` y `/admin/resultados-eventos`; este último ya edita los campos `result_events.stream_*`.
- El especial ASU26 está publicado con `special_editorials.status = active`: debe conservarse así para que su página siga disponible.
- El campeonato figura `en_vivo` en Resultados y `upcoming` en su evento de Calendario. TV ASU26 conserva `streamStatus = upcoming` y `tvPromoActive = true`.
- Sincronización habilitada, sin parada registrada; última ejecución satisfactoria guardada: 19 de octubre, 02:59 UTC. Tarea ASU26/Vensport activa cada 30 segundos. Esto no certifica resultados definitivos.

## 3. Especial ASU26 como archivo

### Resultado visible

- Mostrar **FINALIZADO · Archivo ASU26**, manteniendo Especiales y todas las URL, piezas, calendario histórico, selección, medallero, noticias, galería y clasificaciones.
- Sustituir solo indicadores de actualidad como “Hoy” o “En directo” por etiquetas históricas; conservar entradas y mensajes.
- Mantener todas las señales y enlaces de vídeo. No anunciar grabaciones si el proveedor solo conserva un enlace de directo; mostrar disponibilidad real.

### Cambios de datos previstos, limitados a ASU26

- `result_events.status`: `en_vivo` → `finalizado`.
- `events.status`: `upcoming` → `finished`, para el evento vinculado del mismo campeonato.
- `site_settings`, clave `asu26_streaming`: `streamStatus` → `finished` y `tvPromoActive` → `false`, conservando el resto del objeto y sus enlaces.
- Mantener `special_editorials.status = active`, las publicaciones y los enlaces por ID.

FINALIZADO no significa resultados oficiales: las 3.383 filas Vensport/VeloPro, incluidas fases, conservan fuente y `result_status = unconfirmed`. No se cambiarán clasificaciones.

## 4. Rollerzone TV permanente

### Página general

`/rollerzone-tv` mostrará reproductor destacado configurable, los tres estados manuales, próximas retransmisiones y archivo de competiciones con vídeo disponible y enlaces relacionados. ASU26 tendrá una entrada a su página específica, sin duplicar señales ni inventar grabaciones.

Reutilizar la experiencia de `/tv`: anuncios, patrocinadores, consentimiento y vídeos existentes. `tv_broadcasts` y `tv_highlights` se conservarán accesibles, sin migración automática.

`/tv` seguirá funcionando con el mismo componente y datos. Los enlaces principales irán a `/rollerzone-tv`; los antiguos y todas las URL ASU26 seguirán válidos. Metadatos propios y una canónica común evitarán duplicidad en buscadores.

### Reglas del reproductor y archivo

- Solo puede existir una selección destacada; se guardará el ID del campeonato elegido.
- Un campeonato oculto no podrá aparecer en el reproductor ni en los listados públicos.
- Archivar no elimina ni despublica resultados, noticias o el propio campeonato.
- Archivar finalizará la retransmisión y la trasladará al archivo; no cambiará su estado deportivo ni sus pruebas individuales.
- Un elemento archivado no podrá seguir destacado; será posible editarlo y devolverlo al listado sin borrar su historial.
- Sin selección destacada, mantener la configuración general actual como alternativa; nunca elegir o anunciar un directo arbitrariamente.

## 5. Administración

Ampliar **Admin → TV → Emisiones** como gestor de campeonatos, conservando una vista de las emisiones existentes.

Campos: campeonato, portada, inicio/fin con zona horaria visible, vídeo o inserción autorizada, proveedor/atribución y estado. Acciones: guardar, editar, publicar/ocultar vídeo, destacar y archivar, no borrar.

Reutilizar los campos y controles del gestor de eventos: ambas pantallas editarán el mismo registro. Publicación de TV independiente de `result_events.published`, sin ocultar resultados. Nuevas operaciones verificadas como administrador en servidor mediante controles existentes, sin ampliar permisos ni acceder a tu Admin.

Aceptar HTTPS y proveedores ya admitidos. Extraer solo la URL válida de una inserción: nunca ejecutar scripts/HTML arbitrario. Conservar consentimiento. Cualquier proveedor que requiera ampliar la política de seguridad necesitará autorización aparte.

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

Sin cambios en `provider.ts`, VeloPro ni filtros/PDF; “Quitar filtros” queda fuera de alcance.

### Cambios aditivos de esquema

**No crear tablas nuevas ni un sistema paralelo de streaming.**

- Reutilizar en `result_events`: `name`, `stream_title`, `stream_description`, `stream_url`, `stream_embed_url`, `stream_poster_url`, `stream_poster_mobile_url`, `stream_scheduled_at`, `stream_status`, `stream_provider` y `stream_attribution`.
- Añadir `stream_published` (booleano, predeterminado `false`), `stream_ends_at` (fecha/hora opcional) y `stream_archived_at` (fecha/hora opcional). No reinterpretar silenciosamente `stream_active` ni publicar automáticamente registros anteriores.
- Añadir a `tv_settings` `featured_result_event_id` (UUID opcional, referencia a `result_events`, sin borrado en cascada).
- Validar fechas y valores admitidos. Mantener las políticas y concesiones actuales; no alterar roles ni funciones de autorización.
- `tv_broadcasts`, `tv_highlights`, noticias, pruebas, resultados y medallero: sin cambios de esquema ni eliminación de datos.

El esquema y los estados afectan al backend compartido, incluso sin publicar. Se aplicarán tras aprobar el plan, con compatibilidad y copia de los valores previos para reversión.

## 7. Sincronización: revisión y propuesta, no desactivación

Antes de proponer detenerla:

1. Comparar las clasificaciones finales disponibles en la fuente autorizada con las almacenadas, incluyendo categorías, fases, puestos y vínculos por ID.
2. Documentar pruebas sin clasificación final, discrepancias y pendientes. Actualmente el calendario conserva 17 pruebas `programada` y 2 `suspendida`; no se modificarán automáticamente.
3. Revisar páginas pendientes de sincronización, últimas ejecuciones y posibles cambios recientes.
4. Presentar una recomendación y solicitar autorización específica.

**Dependencia importante:** el control `results_sync_state`, clave `asu26_speed`, es compartido por los sincronizadores ASU26 y Vensport. Desactivarlo detendría también la importación VeloPro de este campeonato. No se tocará el interruptor, las tareas programadas ni las integraciones con la aprobación de este plan. Los resultados almacenados seguirían disponibles aunque una desactivación posterior fuera autorizada.

## 8. Verificación antes de publicar

- Pruebas: tres estados, publicación independiente, destacado único, archivo sin borrado, fechas e inserciones autorizadas.
- Repetir las 52 pruebas de permisos con el procedimiento controlado existente, sin tu Admin; probar guardar→publicar→destacar→archivar con cuenta de pruebas autorizada y comprobar bloqueo del Editor Francia.
- Verificar móvil/ordenador: ambas entradas TV, especial, ASU26, Resultados, portadas, vídeo disponible y consentimiento.
- Comparar cantidades y valores de resultados, medallero, noticias y horarios: sin cambios fuera de los estados globales descritos.
- Revisar errores, seguridad y regresiones en portada, Francia, Portugal, USA y páginas principales.
- Entregar cambios y pendientes en vista previa; publicar solo con autorización explícita.

