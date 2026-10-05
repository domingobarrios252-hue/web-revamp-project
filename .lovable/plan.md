# Especial ASU26 como hub dinámico conectado a Rollerzone TV

## Lo que ya existe y se reutiliza
- **6 piezas publicadas** (Calendario, Selección, Noticias, Resultados, Medallero, Rollerzone TV): se mantienen, con sus imágenes de portada.
- **Calendario:** las mismas 42 pruebas que usa Rollerzone TV en «Próximas pruebas». Sin calendario nuevo.
- **Resultados:** el lector central de resultados (hoy manual, VeloPro preparado). Ya tiene fecha, prueba, categoría, modalidad, fase, participante, país, posición, tiempo/puntos y estado.
- **Medallero:** el sistema de medallero existente, que se calcula desde resultados.
- **Selección:** las 7 fichas actuales y sus resultados por patinador.
- **Noticias:** hoy no tienen forma de vincularse a un especial. Es lo único que necesita un cambio en la base de datos.

## Qué se construye
1. **Calendario (pieza):** se mantiene la imagen y el texto explicativo se sustituye por el calendario en vivo: fecha, hora Asunción y España, prueba, modalidad, categoría y estado. Filtros TODOS | TRACK | ROAD | 100 M | MARATHON. Si está en directo sale «VER DIRECTO» y si ha terminado «VER RESULTADOS», los dos hacia Rollerzone TV.
2. **Selección Española:** las fichas quedan igual. Cada ficha suma un bloque ASU26 con próxima prueba (fecha y hora) y resultado (posición, tiempo/puntos, medalla), que aparece solo cuando hay datos. Las pruebas se enlazan con el patinador desde el panel. Más adelante se rellenará con VeloPro.
3. **Noticias y Crónicas:**
   - El editor de noticias suma dos campos: «Especial relacionado» (Ninguno / cualquier especial activo, preparado para futuros especiales) y «Tipo de contenido» (Noticia, Previa, Crónica, Entrevista, Última hora).
   - Cada noticia se guarda una sola vez y sale tanto en Actualidad como en el Especial.
   - En la pieza se ve una noticia principal y debajo una cuadrícula con fecha, imagen, titular y tipo.
   - Las noticias antiguas no se tocan. Las 5 sobre ASU26 que ya existen se vinculan solo si das el visto bueno a esa lista.
4. **Resultados:** pieza con «RESULTADOS OFICIALES · Powered by VeloPro» y botón a Rollerzone TV #resultados, sin una segunda tabla. Se añade un campo para la URL o ID externo del resultado y se deja preparado para recibir datos por API, JSON, widget o iframe.
5. **Medallero:** se mantiene la imagen y el texto se sustituye por la tabla Posición | País | Oro | Plata | Bronce | Total, más un bloque destacado de ESPAÑA. Mientras no haya resultados, muestra el estado «Comienza el 10 de octubre».
6. **Rollerzone TV (pieza):** muestra la próxima retransmisión con fecha, hora Paraguay y España, prueba y estado, más el botón «VER EN ROLLERZONE TV». Si hay emisión, sale «🔴 EN DIRECTO». No lleva reproductor.
7. **Duplicidades:** se revisa el menú de la página ASU26 de Rollerzone TV. Si «Horarios» y «Calendario» muestran lo mismo, se unifican en DIRECTO | CALENDARIO | RESULTADOS | ESPAÑA | MEDALLERO | NOTICIAS y los horarios quedan dentro de Calendario.
8. **Portada del especial:** las 6 tarjetas pasan a mostrar datos en vivo: próxima prueba, «7 patinadores · 3 Junior · 4 Senior», último titular, «Powered by VeloPro», estado o total del medallero y próxima emisión o EN DIRECTO.

## No se toca
El streaming, las 42 pruebas, VeloPro, los avances en directo (solo salen en TV), las URLs, los permisos, el resto de noticias y la identidad visual ASU26.

## Orden
Primero el cambio en noticias y el editor, luego las piezas una por una (Calendario, TV, Resultados, Medallero, Noticias, Selección), después la portada y por último el menú de TV. Se comprueba en escritorio y a 390 px.

## Detalles técnicos
- Migración: `news.special_slug text null` (FK → special_editorials.slug, ON DELETE SET NULL) + `news.content_kind text null` (check). `result_events`/`live_results`: añadir `external_ref text null` si no existe. Sin tablas nuevas.
- Lectura de noticias del especial: consulta `news` publicada filtrada por `special_slug`. La consulta de Actualidad no cambia.
- Las piezas detectan su tipo por slug (`calendario-competicion`, `medallero`, …) y renderizan componentes nuevos en `components/specials/live/` alimentados por `schedule_items`, `loadEventResults` y `useMedalStandings`.
- Selección: próxima prueba mediante coincidencia opcional `special_piece_members` → `schedule_items.id` (columna nullable `next_schedule_item_id`).
