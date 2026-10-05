# Avances en directo ASU26 en Rollerzone.TV

## Objetivo
Mostrar en la página ASU26 de Rollerzone.TV los avances manuales ya publicados desde el panel, sin crear otra fuente de datos ni modificar streaming, resultados, calendario u horarios.

## Implementación
- Consultar `live_timeline` por el evento ASU26 existente, filtrando solo entradas publicadas y ordenándolas de más reciente a más antigua.
- Añadir el bloque entre el reproductor y «Próximas pruebas» con el título exacto «EN VIVO · ACTUALIZACIONES».
- Mostrar inicialmente un máximo de 5 avances y ofrecer «Ver más» solo cuando haya entradas adicionales.
- Ocultar por completo el bloque, título y espacio cuando no existan avances.
- Mantener un diseño editorial ASU26 compacto en móvil y sin alterar la página del Especial.

## Verificación
- Comprobar estados con y sin avances, orden, límite y expansión.
- Revisar la página en escritorio y a 390 px, incluyendo ausencia de scroll horizontal.
- Confirmar que la compilación queda limpia.
