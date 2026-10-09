# Sincronización automática de resultados oficiales ASU26 (Speed)

## Objetivo
Importar en nuestra base de datos los resultados oficiales de patinaje de velocidad publicados en datos.asu26.org.py (autorizado por VeloPro). Rollerzone.TV los muestra en su sección Resultados actual, sin que ningún visitante consulte el servidor de ASU26.

## Qué NO cambia
Diseño público, streaming, noticias, calendario (las 42 pruebas), medallero manual, Especial ASU26, ticker y resultados manuales ya existentes.

## Fases

### 1. Datos (solo ampliaciones)
- **Resultados actuales:** se añade a cada resultado su origen (manual u oficial), el número del patinador en la fuente y el de su competición. Así cada fila oficial es única y no se duplica al resincronizar.
- **Equivalencias:** nueva tabla que relaciona cada competición oficial con una prueba de nuestro calendario. Guarda el estado de la vinculación (propuesta automática, confirmada o ignorada).
- **Estado de sincronización:** nueva tabla con hora del último intento, último éxito, nº de filas, último error y fallos consecutivos.
- **Ajustes en Admin:** sincronización activada o desactivada, prioridad por defecto (oficial o manual), modo de frecuencia y jornadas activas (por defecto del 10 al 18 de octubre, en hora de Asunción).

### 2. Sincronización (solo en servidor)
- Lectura pública de solo lectura con la clave pública de la propia web. Se filtra solo Speed y solo las competiciones en curso o finalizadas recientemente: 2 o 3 consultas pequeñas por pasada.
- Conversión al formato actual: prueba (Track/Road + distancia), categoría, género, fase, puesto, dorsal, patinador, país en código de 3 letras, tiempo, puntos y observaciones. Cada prueba se lee según sus propias columnas.
- **Estados:** competición finalizada → Oficial; resultados publicados con la competición en curso → Provisional; programada → Próximamente. No se inventa ningún estado.
- **Actualización sin duplicados:** las filas oficiales se actualizan por su código único.
- **Protección ante errores:**
  - Si la fuente falla, responde vacía o cambia de formato, no se borra nada y se anota el error.
  - Una fila oficial solo se retira si la fuente deja de publicarla en dos pasadas seguidas sin error.
- Un bloqueo impide que se ejecuten dos sincronizaciones a la vez.

### 3. Programación
- Un aviso cada 5 minutos llama a una dirección protegida con clave secreta.
- Dentro de las jornadas activas, sincroniza en cada aviso. Fuera de ellas, una vez cada 6 horas o en pausa, según el ajuste de Admin.
- **Parada total de seguridad:** la sincronización se detiene por completo si hay 5 errores seguidos, si la web responde 429 (demasiadas consultas) o si niega el acceso (401/403). No se reduce la frecuencia: se para. El motivo y la hora quedan visibles en Admin.
- **Interruptor de emergencia en Admin:** al activarlo, bloquea al instante todas las consultas a ASU26, tanto las automáticas como «Sincronizar ahora». Antes de cada consulta se comprueba el bloqueo.
- **Reactivación solo con tu autorización:** tras una parada o un bloqueo de emergencia no se reanuda nada sola. Hay que pulsar «Reactivar» en Admin, solo disponible para administradores. Queda registrado quién lo hizo y cuándo.
- Los resultados ya guardados se siguen mostrando durante cualquier parada.
- **Queda desactivada hasta tu aprobación tras la prueba.**

### 4. Vinculación con el calendario
- Propuesta automática por fecha + prueba + categoría + género, solo cuando hay una única coincidencia.
- Las dudosas quedan pendientes de revisión y no se muestran en ninguna prueba hasta confirmarlas.

### 5. Prioridad oficial / manual
- Ajuste general en Admin, con excepción posible por prueba.
- Si en una prueba manda lo oficial y hay resultados oficiales, se muestran esos. Si no los hay, se siguen mostrando los manuales.
- Los manuales nunca se borran ni se modifican.

### 6. Panel Admin (dentro de Resultados → Eventos ASU26)
- Estado: última actualización, último éxito, filas importadas y último error legible.
- Botones «Sincronizar ahora» y activar o desactivar la automatización.
- Interruptor de emergencia y botón «Reactivar» (solo administradores), con el motivo de la última parada.
- Lista de equivalencias con su estado y acciones confirmar, cambiar o ignorar.
- Selector de prioridad y vista previa de lo que verá el público.

### 7. Visualización
La sección Resultados actual de Rollerzone.TV ASU26 recibe estos datos por la misma vía que hoy. La pantalla no cambia; solo aparecen datos nuevos.

## Prueba antes de activar
1. Importación manual de prueba: hoy Speed está vacío, así que se prueba con una modalidad que ya tiene resultados (Skate Cross), en un evento de prueba no visible. Se comprueban el formato, los países y los tiempos.
2. Se ejecuta dos y tres veces seguidas para comprobar que el nº de filas no cambia (sin duplicados).
3. Se simula un error de conexión y se comprueba que los datos se conservan. También se simulan 5 errores seguidos y una respuesta 429/403, y se comprueba que la sincronización se para y no se reanuda sin reactivación. Por último, se comprueba que el interruptor de emergencia bloquea también «Sincronizar ahora».
4. Se borra todo lo de prueba y se comprueba que los manuales y las 42 pruebas siguen intactos.
5. Te presento el resultado y, con tu aprobación, se activa Speed cada 5 minutos.
6. El primer resultado real de Speed (10 de octubre) se revisa en cuanto aparezca.

## Riesgos
- No es una conexión documentada oficialmente. Si la web cambia, la sincronización se pausa sola y se muestran los últimos datos guardados.
- El panel Admin requiere doble verificación (MFA), así que no podré probarlo en pantalla. Las pruebas se harán directamente con los datos.

## Detalles técnicos
- Las columnas nuevas de live_results son: `source` ('manual' por defecto), `source_result_id` (único cuando hay valor) y `source_competition_id`. Ya existe `external_ref` y se conserva.
- Tablas nuevas `asu26_results_links` y `results_sync_state`: lectura para el equipo editorial y escritura solo desde el servidor. Ajustes en `site_settings`, clave `asu26_results_sync`.
- La lógica va en `src/lib/results/asu26Sync.server.ts`. Se llama desde la ruta `src/routes/api/public/cron/asu26-results.ts`, que verifica un secreto, y desde una función de servidor de admin para «Sincronizar ahora».
- Se programa con pg_cron + pg_net.
- `provider.ts` pasa a aplicar la prioridad oficial/manual; la interfaz no cambia.
