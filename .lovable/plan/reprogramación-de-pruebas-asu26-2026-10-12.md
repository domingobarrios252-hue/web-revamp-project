# Reprogramación de pruebas ASU26

## Qué hay hoy (análisis)
- El calendario oficial es una única lista de pruebas (Admin → Calendario). Rollerzone.TV, el ticker, «Próximas pruebas», el Especial y la sección España leen todos de esa misma lista. Cualquier cambio de fecha o estado guardado ahí aparece en todas partes sin publicar de nuevo.
- Desde Admin ya se puede cambiar la fecha, la hora y el estado. Los estados disponibles son Programada, En curso, Finalizada, Aplazada y Cancelada.
- **Falta lo siguiente:**
  1. No existe el estado «Suspendida».
  2. Un horario nuevo se publica en cuanto se guarda; no hay forma de dejarlo pendiente de confirmación oficial.
  3. No queda guardado el horario original ni el motivo del cambio.
  4. Algunos bloques (directo, ticker, «ahora en pista») deciden qué prueba está «en directo» por la hora. Una prueba aplazada o suspendida podría aparecer como en directo si su hora antigua coincide con el momento actual.

## Propuesta
1. **Nuevo estado «Suspendida»**, junto a Aplazada y Cancelada.
2. **Reprogramación en dos pasos** desde Admin → Calendario, con un nuevo botón «Reprogramar» en cada prueba:
   - Paso 1: se introduce la nueva fecha y hora (hora de Asunción) y un motivo opcional. Queda como **«Nuevo horario pendiente de confirmación»**. La web pública sigue mostrando el horario anterior con la etiqueta «Horario en revisión», o «Aplazada» si se marca así.
   - Paso 2: el botón **«Confirmar horario oficial»** publica el nuevo horario. En ese momento se actualizan solos el calendario, Rollerzone.TV, el ticker, «Próximas pruebas» y la sección España.
   - El horario original queda guardado y la web puede mostrar discretamente «Reprogramada · antes 14/10 10:30».
   - Hay un botón para descartar el cambio pendiente.
3. **Directo protegido:** las pruebas Aplazadas, Suspendidas o Canceladas nunca se muestran como en directo, ni por estado ni por hora, en ningún bloque. Esto incluye el directo, el ticker, «ahora en pista», el Especial y la barra de directo.
4. **Lo que se conserva:** el identificador de cada prueba no cambia, así que las clasificaciones, los vínculos con VeloPro, los resultados de la sección España y la sincronización de cada 5 minutos siguen igual. Las pruebas que se marcan solas como finalizadas siguen esa misma regla.

## Comprobación en vista previa
- En la vista previa no se toca ninguna prueba real: se simulan una reprogramación pendiente, su confirmación y una suspensión, sin guardar nada en la base.
- Comprobaré el calendario, Rollerzone.TV, el ticker, «Próximas pruebas» y la sección España en ordenador y móvil.

## Qué requiere tu autorización
La base de datos es compartida entre la vista previa y la web publicada. El paso de añadir el estado «Suspendida» y los campos del horario pendiente necesita tu autorización. Son solo añadidos: no se borra ni se cambia nada existente, y la web actual sigue funcionando igual. No se modificará ninguna prueba ni horario real.

## Detalles técnicos
- Migración aditiva: `ALTER TYPE schedule_status ADD VALUE 'suspendida'`; columnas en `schedule_items`: `pending_scheduled_at timestamptz null`, `reschedule_note text null`, `original_scheduled_at timestamptz null`, `rescheduled_at timestamptz null`.
- La confirmación copia `pending_scheduled_at → scheduled_at` (guardando antes `original_scheduled_at` si estaba vacío) y limpia el pendiente. `id` intacto.
- Helper único `isLiveEligible(item)` en `src/lib/specials/liveEvent.ts`, usado en Asu26TvTicker, TvEventLiveCenter, LiveCenter, LiveBar, asu26Hub y la página TV ASU26. `SCHEDULE_STATUS_LABEL` amplía «Suspendida».
- `asu26Sync`/`vensportSync` no cambian; la autofinalización ignora pruebas suspendidas o canceladas, como ya hace con las aplazadas.
