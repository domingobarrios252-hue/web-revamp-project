# Archivo histórico ASU26 en la sección «Resultados»

## Qué hay ahora (revisión técnica)
- **/resultados**: es un listado de campeonatos sacado del catálogo de eventos publicados, más algunos eventos antiguos. Solo se puede filtrar por país y estado. ASU26 ya aparece en el listado como «World Skate Games ASU26 · Patinaje de Velocidad», pero con estado «próxima».
- **/resultados/{campeonato}**: la ficha de cada campeonato busca los resultados por el nombre corto antiguo del evento (`event_slug`). Los 881 resultados de ASU26 (294 de clasificaciones generales y 587 de fases) están enlazados por identificador interno y tienen ese nombre vacío. Por eso **la ficha de ASU26 en «Resultados» sale vacía** aunque los datos existen.
- Los filtros que existen ahora son prueba, categoría, género, ronda, club, federación, país y un buscador. No hay filtro de año, modalidad ni campeonato, el buscador distingue tildes y las fases de Vensport no tienen un tratamiento propio.
- La página de resultados de ASU26 en Rollerzone.TV ya lee estos datos a través de la capa de resultados común, con filtro de fase y botón de PDF. Es lo que voy a reutilizar.

## Propuesta
1. **No crear sección nueva.** Amplío la ficha `/resultados/{campeonato}` que ya existe.
2. **Lectura de datos:** si el campeonato tiene identificador, la ficha leerá con la misma capa de resultados que usa Rollerzone.TV (clasificaciones generales y fases, filas ocultas excluidas). Si no lo tiene, seguirá leyendo por el nombre antiguo, como hasta ahora. Es solo lectura: no se mueve, duplica ni reescribe ningún registro.
3. **Filtros combinables** (guardados en la dirección de la página para poder compartirla): campeonato, año, modalidad (pista/ruta), prueba, categoría, género, fase, país y nombre del patinador. El nombre se busca por partes, sin distinguir mayúsculas ni tildes. En el listado `/resultados` añado además los filtros de año y modalidad.
4. **Tarjetas y PDF:** se mostrará una tarjeta por clasificación (general, serie, final y desempate), con el mismo diseño, el resaltado ESP y el crédito VeloPro. El botón «Descargar clasificación en PDF» reutilizará el generador aprobado y descargará siempre la clasificación completa: los filtros solo deciden qué tarjetas se ven, nunca qué filas entran en el PDF.
5. **Independencia del Especial:** el archivo solo depende del campeonato en el catálogo de resultados y de sus filas, no del Especial, de la portada ni de Rollerzone.TV. Ocultar o archivar el Especial no le afecta.
6. **Futuros campeonatos:** cualquier evento del catálogo de resultados con proveedor y resultados enlazados aparecerá automáticamente con los mismos filtros. El año sale de la fecha del evento y la modalidad del nombre de la prueba. Sin cambios en la base de datos.
7. **Rendimiento:** una sola lectura por campeonato (unas 900 filas para ASU26) y filtrado en el propio navegador. Añadiré paginación de tarjetas («Ver más») para que el móvil vaya fluido. Lo comprobaré en ordenador y móvil en la vista previa.

## Una decisión para ti
El estado «próxima» de ASU26 en el catálogo se puede cambiar a «en vivo» desde Admin → Resultados → Eventos. Es un dato de producción, así que no lo toco sin tu autorización.

## No se toca
La sincronización de cada 5 minutos, Vensport (ninguna consulta nueva), Rollerzone.TV, el Especial, el medallero, el calendario ni ningún resultado guardado. Todo queda en vista previa hasta que autorices publicar.

## Detalles técnicos
- `src/routes/resultados.$evento.tsx`: si `meta.id` existe, usar `loadEventResults` (provider.ts) y agrupar con `groupResults`. Se mantiene el camino antiguo por `event_slug`.
- Búsqueda normalizada con `normalize("NFD")` quitando diacríticos y pasando a minúsculas.
- Filtros mediante `validateSearch` con `fallback`.
- Componente de tarjeta compartido extraído de `Asu26Results` (`PdfButton` exportado) para no duplicar código; la vista de TV no cambia visualmente.
