# Finalización incremental ES/EN — 23 octubre 2026

## Realizado, solo en vista previa
- Generador existente: recupera traducciones vigentes antes de límites o llamadas a IA; conserva borradores y textos revisados. El panel identifica recuperación frente a actualización.
- Noticias aprobadas: titular, subtítulo, entradilla, bloques y cuerpo; una entradilla inglesa vacía no se sustituye por español.
- Fallback: original intacto, aviso visible, controles ingleses, canonical español y noindex.
- Buscador: titulares aprobados ingleses en los resultados; búsquedas siguen basadas en el título original.
- Noticias relacionadas con vídeos: reutilizan traducciones y enlazan al artículo correcto.
- TV: fechas, controles y mensajes secundarios; no se modifican datos ni comportamiento de streaming.
- Fichas de eventos inglesas: misma consulta y presentación, contexto ES/EN conservado, datos originales y descripción sin traducir con aviso, canonical español y noindex.
- Avisos de contenido externo, etiqueta accesible del correo, fechas y presentaciones territoriales completados. Logotipo sin cambios.

## Comprobaciones superadas
- 17 pruebas existentes y ampliadas; 40 aserciones: versiones, datos multimedia, límites, selector, filtros y Francia.
- Navegador a 1280 px: portada y artículo completo ingleses con respuestas simuladas exclusivamente en el navegador. No se aprobó ni guardó la traducción de prueba.
- Datos de prueba: «Chevi Guzmán», «100 metres» y «9.800» se muestran sin alteración.
- Artículo público real sin traducción: aviso, controles ingleses, noindex y canonical español.
- Evento público real: etiquetas y fechas inglesas, cambio al evento español con el mismo identificador.
- Móvil 390 px: selector funciona y no hay desbordamiento horizontal.
- Sin errores de ejecución en el recorrido; últimos registros de compilación correctos.

## Pendiente y límites
- No se encontró sistema de traducciones editoriales aprobadas para entrevistas independientes, piezas especiales, revista/PDF, descripciones de eventos ni textos administrables de TV. Se conservan originales; añadir ese flujo supondría ampliar la arquitectura y requiere una decisión separada. Noticias/reportajes almacenados como noticias sí reutilizan el sistema actual.
- No se realizó generación real ni comprobación autenticada del generador para no usar la cuenta Admin, alterar borradores o gastar IA; la reutilización se verificó mediante pruebas de vigencia e inspección del guard previo a los límites/modelo, no como prueba autenticada de extremo a extremo.
- La reutilización evita solicitudes repetidas secuenciales; no garantiza exclusión entre dos solicitudes simultáneas de distintos editores. Una garantía distribuida necesitaría coordinación persistente; no se añadieron migraciones.
- No se ejecutaron traducciones por lotes, trabajos automáticos, nuevas dependencias ni cambios de reglas o permisos.
- Los tres borradores piloto no se modificaron ni aprobaron. Revisión y publicación requieren autorización del administrador.
- No se publicó en producción; no se tocaron resultados, medallero, retransmisiones ni VeloPro/Vensport.