# Internacionalización premium de Rollerzone ES/EN

## Auditoría breve: estado actual

- **Hay una base reutilizable:** `LanguageProvider`, diccionarios ES/EN y selector en la cabecera. Los diccionarios ya contienen textos de portada, noticias, TV, resultados, revista y otras áreas; su uso todavía es parcial. No hace falta instalar una nueva biblioteca de idiomas.
- **Noticias:** existe una única noticia española y su traducción vinculada en `news_translations`, funciones de generación/guardado/aprobación, editor y una vista de artículo compartida. La única ruta inglesa existente es `/en/news/$slug`; no existe todavía una portada `/en/` ni navegación inglesa general.
- **Piloto conservado:** lectura actual de la base de datos confirma Marine, Chevi y Ecuador en `draft`, sin persona ni fecha de aprobación. No se han repetido sus pruebas ni modificado sus textos.
- **Textos fijos frente a gestionados:** navegación, filtros, estados y botones pertenecen a los diccionarios; artículos, presentaciones administrables, datos de eventos y descripciones de revistas proceden de contenido almacenado. Traducir la interfaz no autoriza traducir automáticamente ese contenido editorial.
- **Dependencias protegidas:** TV comparte reproductores y catálogo; resultados comparten `provider.ts`; especiales y territorios reutilizan sus vistas y datos. Se traducirán etiquetas alrededor de estos sistemas, no su funcionamiento.

Esta revisión es de código, reglas actuales y antecedentes del piloto. No equivale a nuevas pruebas autenticadas ni a certificar resultados deportivos o indexación real en Google.

## Incidencias que deben resolverse antes de ampliar

1. **Protección editorial:** las reglas actuales permiten inserciones sin restringir explícitamente el estado aprobado. El control de aprobación se ejecuta solo en actualizaciones y no protege por completo cambios de texto ya aprobado. Las reglas de propiedad/país también necesitan alinearse con los límites editoriales y la suspensión existentes. La lectura inglesa no exige aprobación explícita: un editor autenticado podría obtener una traducción privada de su ámbito en una vista destinada al público.
2. **Generación:** el esquema abierto de bloques de la solicitud actual no es adecuado para la salida estricta usada por la IA. El piloto lo evitó mediante campos traducibles cerrados; hay que integrar ese método en el botón existente y validar la respuesta antes de guardar.
3. **Huella del original:** el panel omite el cuerpo español mientras el servidor lo incluye. También faltan controles fiables para cambios de leyendas, estructura y demás campos traducibles. La aprobación debe comprobar la versión actual del original, no solo mostrar un aviso.
4. **Texto plano:** la vista inglesa no pasa el cuerpo traducido cuando no hay bloques y puede mostrar el español.
5. **Selector y navegación:** el menú completo desborda a 1280 px según el piloto; el selector solo cambia de URL en el artículo global. El idioma guardado y el idioma de la URL todavía no forman una única regla.
6. **SEO:** el documento inicial declara español incluso en la ruta inglesa; el idioma cambia después en el navegador. Faltan páginas inglesas generales y su incorporación al sitemap permanente. Parte del canonical general se añade únicamente después de cargar la página.

Las variantes de nombres en leyendas, la homologación del récord y los antecedentes deportivos pendientes del piloto requieren revisión editorial independiente; no se corregirán por inferencia ni impedirán trabajar en la interfaz.

## Solución única: ampliar lo existente

Una sola web, mismos datos, mismas vistas y diccionarios ampliables. Las rutas inglesas serán entradas ligeras a las vistas compartidas, no copias de las páginas. Español conserva todas sus direcciones; inglés utiliza `/en/` y mantiene las URLs de artículos ingleses ya creadas.

El idioma de una URL explícita determina su contenido y lo que recibe Google. La preferencia guardada se utiliza al elegir idioma y navegar, sin transformar silenciosamente una URL española en una página inglesa ni provocar redirecciones innecesarias. El selector lleva a la página equivalente y mantiene los filtros compatibles. Cuando falta una traducción editorial, lo indica y conserva el original sin presentarlo como inglés indexable.

## Bloques de ejecución, tras autorización

### 1. Noticias: seguridad y correcciones del piloto
- Reforzar lectura pública, inserciones, cambios de estado y edición de traducciones aprobadas en funciones y reglas de la base de datos, reutilizando las comprobaciones actuales de administrador, propietario, país y cuenta activa.
- Una edición del inglés aprobado lo retira a revisión y elimina su aprobación; no cambia silenciosamente texto público. Un cambio del original marca la traducción como desactualizada y bloquea su presentación como versión vigente y una nueva aprobación hasta revisarla. No generar ni sustituir textos automáticamente.
- Unificar la huella sobre los campos originales traducibles y comprobarla al guardar y aprobar. Guardar una traducción sobre un original que cambió exige actualizarla y revisarla primero.
- Integrar generación por campos cerrados y reconstrucción de bloques, conservando identificadores, tipos, orden, enlaces y archivos. Mantener corrección manual de bloques y texto plano.
- Conservar las tres traducciones como borradores. Mantener los límites de 30 traducciones al día por sitio y 3 por artículo al día.
- **Verificación:** pruebas específicas de inserción aprobada no autorizada, edición aprobada, país/propiedad, suspensión, lectura pública y autenticada, huella, bloque completo, texto plano y límites. Sin acceder a la cuenta Admin del usuario.

### 2. Idioma común, selector y rutas
- Ampliar los diccionarios existentes por secciones y definir un mapa común de equivalencias ES/EN.
- Hacer que cabecera, pie, búsqueda, migas, avisos y enlaces compartidos mantengan idioma y página equivalente.
- Ajustar únicamente la cabecera necesaria para que el selector permanezca accesible en escritorio, tablet y móvil, especialmente a 1280 px y menores.
- Resolver idioma inicial y atributo `lang` desde la URL también en el documento servido, sin parpadeos ni discrepancias con la preferencia guardada.
- **Verificación:** entrada directa ES/EN, recarga, navegación, cambio de idioma y preferencia guardada, con teclado y tamaños representativos.

### 3. Portada, noticias y ediciones territoriales
- Compartir la portada y listados entre rutas españolas e inglesas.
- Traducir módulos, etiquetas y navegación; cargar en conjunto las traducciones aprobadas disponibles para las tarjetas, evitando una consulta por noticia.
- Reutilizar `TerritoryCards`, `useTerritory` y las vistas de territorios, incluyendo las ediciones actuales y futuras. No duplicar gestores ni cambiar sus permisos.
- Contenidos largos, entrevistas y piezas especiales permanecen en su idioma original salvo versión inglesa revisada y aprobada; no afirmar que están traducidos por traducir su menú.

### 4. TV, resultados, especiales y páginas complementarias
- Traducir la presentación de `RollerzoneTvPage`, catálogo, archivo ASU26, calendarios y resultados, incluidos filtros, categorías y estados mediante correspondencias de etiquetas que no cambien sus valores internos.
- Reutilizar vistas de especiales, revista, patrocinadores, equipo y contacto. Traducir presentaciones y descripciones revisadas; conservar nombres, destinatarios, logos, enlaces, datos oficiales y PDF.
- Aprovechar configuraciones existentes para presentaciones traducidas cuando encajen; no crear una segunda base de datos ni un sistema de traducción paralelo. Cualquier ampliación de almacenamiento será mínima y justificada.
- **Verificación:** mismos resultados, orden, filtros, enlaces de vídeo y archivos antes/después; sin escrituras sobre resultados ni ajustes de sincronización, streaming o medallero.

### 5. SEO y comprobación final dirigida
- Cada página inglesa válida tendrá título, descripción, Open Graph y canonical propios desde el documento inicial; conservar el SEO español salvo errores comprobados.
- Hreflang ES/EN/x-default recíproco solo entre versiones realmente disponibles. Sitemap general para páginas inglesas publicadas y válidas; sitemap de noticias mantiene su ventana específica.
- Borradores y traducciones no aprobadas nunca públicos ni indexables. Sustituciones españolas en URL inglesa seguirán sin indexación como traducción.
- Comprobar navegación entre las secciones afectadas, presentación, noticias con bloques y texto plano y conservación de datos. Distinguir pruebas reales, revisión de código y cualquier comprobación no ejecutable; nunca contar una simulación como prueba superada.

## Alcance técnico y conservación

Archivos principales: `src/lib/i18n/*`, `LanguageToggle`, `SiteHeader`, `SiteFooter`, `Breadcrumbs`, `GlobalSearch`, `__root.tsx`; traducciones de noticias, `TranslationPanel`, `NewsEditor`, `NewsArticleView` y rutas de artículos; vistas compartidas de portada, territorios, TV, resultados, especiales y páginas complementarias; rutas inglesas y ambos sitemaps.

La primera ampliación de base de datos prevista es **correctiva**, sobre reglas y controles de `news_translations`; no es destructiva y debe cubrir también vigencia del original. No crear otro catálogo deportivo ni duplicar artículos. Antes de aplicarla, verificar compatibilidad con los borradores existentes y los permisos actuales.

La base de datos sirve también a la web publicada: sus correcciones de seguridad pueden tener efecto inmediato aunque la interfaz nueva no se publique. La autorización de implementación cubrirá únicamente estas correcciones del sistema bilingüe; no ampliará los privilegios de colaboradores ni cambiará otros sistemas.

## Riesgos, esfuerzo y costes

- **Riesgos principales:** publicar una traducción sin autorización, mezclar idiomas entre documento inicial y navegación, mostrar inglés desactualizado, multiplicar consultas y dejar rutas inglesas parcialmente traducidas. Los bloques 1 y 2 resuelven las dependencias antes de extender secciones.
- **Esfuerzo:** alto en conjunto por la amplitud de la web; medio-alto en seguridad/noticias y navegación/SEO; medio por grupo de secciones al compartir vistas. Se ejecutará en bloques coherentes, sin pedir permiso por archivo.
- **Créditos:** consumo moderado-alto para la ampliación completa; menor que reconstruir o traducir cada visita. No puedo calcular una cifra fiable de créditos ni una duración exacta antes de ejecutar y medir las partes afectadas.
- **Costes nuevos previstos:** ninguna biblioteca ni servicio de pago adicional. Consultar diccionarios no consume IA. Generar o regenerar contenido editorial seguirá consumiendo la IA existente y su cuota; más traducciones almacenadas pueden aumentar ligeramente almacenamiento y lecturas. Cualquier gasto nuevo se comunicará antes de habilitarlo.

## Autorización

Ahora: análisis y plan únicamente, sin modificar código, permisos, datos editoriales ni publicar. Tras aprobar el plan: ejecutar los bloques descritos; detenerse ante un riesgo importante, gasto nuevo o decisión funcional que salga de este alcance. Aprobar el plan **no aprueba las tres noticias piloto ni autoriza publicar la web**.