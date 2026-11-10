# Fase 0 — Protección del calendario de competiciones

Sin lectores automáticos ni conexiones a RFEP, FPP, FFRS ni World Skate. Solo protección e historial.

## Situación actual (comprobada)
- 40 competiciones en la tabla de eventos.
- El botón «Eliminar» de Admin → Eventos borra la competición para siempre, y con ella, en cascada: sus carreras, los clubes, los patinadores y las federaciones vinculados. Las noticias y los especiales enlazados pierden el vínculo (se quedan vacíos).
- Los resultados de VeloPro/Vensport y los horarios cuelgan de los eventos de resultados, no de esta tabla. Hoy no dependen de ella y no cambian.

## Qué se va a hacer
1. **Archivar en lugar de borrar.** «Eliminar» pasa a llamarse «Archivar» y se pide confirmación. Las competiciones archivadas desaparecen del calendario público, del buscador, del sitemap y de la portada, pero en Admin aparecen en un filtro «Archivadas» con un botón «Restaurar». No se pierde nada: ni la competición ni sus relaciones, carteles, PDF o enlaces.
2. **Bloquear el borrado físico.** Ni siquiera con una petición directa se podrá borrar una competición: la base de datos lo impedirá, también a los administradores. Si algún día hiciera falta un borrado definitivo, se haría aparte y con tu autorización.
3. **Historial de cambios.** Cada alta, modificación, archivado o restauración queda registrada con la fecha, quién lo hizo, qué campos cambiaron (valor anterior y nuevo) y el origen (de momento, «admin»; en el futuro, la fuente automática). En Admin, cada competición tendrá un panel de solo lectura «Historial».
4. **El calendario público no cambia**: mismo diseño, mismas rutas y mismo comportamiento. Las 40 competiciones actuales empiezan sin archivar.

## Cambios en la base de datos (una sola migración, solo añadir)
- Eventos: nuevas columnas opcionales `archived_at` y `archived_by` (vacías para los 40 actuales). No se renombra ni elimina nada.
- Nueva tabla `event_change_log` (id, event_id sin clave externa, para que el historial sobreviva a cualquier cosa; action; changed_fields jsonb; old/new snapshot jsonb; actor_id; source = 'admin'; created_at). Solo la pueden leer administradores y nadie la puede editar ni borrar desde la app (solo se añaden registros).
- Disparador de historial en la tabla de eventos (alta/edición) y disparador que rechaza el borrado.
- Las lecturas públicas excluyen las archivadas filtrando en las consultas públicas existentes (calendario, ficha, portada, sitemap, buscador y centro en directo). La política de seguridad de lectura no se toca, para no afectar a Admin ni a los editores.
- **Reversión:** se guarda un respaldo previo (JSON de los 40 eventos y relaciones) y un script de reversión que quita los disparadores, la tabla del historial y las columnas nuevas, dejando todo como hoy.

## Cambios en el código
- Admin → Eventos: «Archivar» / «Restaurar», filtro «Activas / Archivadas», panel «Historial».
- Consultas públicas de eventos: añadir «no archivadas». Si una ficha archivada se abre por su URL, mostrará «no encontrada», como si se hubiera borrado hoy (dime si prefieres que siga visible).

## Comprobaciones
- Antes y después: recuento de los 40 eventos, sus carreras, clubes, patinadores, federaciones, noticias y especiales enlazados; deben coincidir exactamente.
- Prueba de archivar → desaparece del calendario → restaurar → vuelve a aparecer, con historial registrado.
- Prueba de que el borrado directo se rechaza.
- VeloPro/Vensport: recuento de resultados y estado de sincronización idénticos; páginas de resultados y calendario con respuesta 200 en ordenador y móvil.
- Nada se publica sin tu autorización.

## Riesgos
- **Consultas olvidadas** que muestren una competición archivada: se revisan las 17 lecturas existentes de eventos.
- **La regla de «una sola competición destacada en directo»** actualiza eventos automáticamente; esos cambios también quedarán en el historial (es correcto, pero generará entradas).
- **Crecimiento del historial**: bajo (decenas de cambios al mes); sin coste relevante.
- **Bloqueo del borrado**: impide también limpiar pruebas; se decide caso a caso.
- Riesgo nulo para resultados y retransmisiones: no se tocan sus tablas.
