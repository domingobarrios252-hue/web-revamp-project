# Internacionalización premium de Rollerzone ES/EN

## Auditoría breve: estado actual

- **Hay una base reutilizable:** `LanguageProvider`, diccionarios ES/EN y selector en la cabecera. Los diccionarios ya contienen textos de portada, noticias, TV, resultados, revista y otras áreas; su uso todavía es parcial. No hace falta instalar una nueva biblioteca de idiomas.
- **Noticias:** existe una única noticia española y su traducción vinculada en `news_translations`, funciones de generación/guardado/aprobación, editor y una vista de artículo compartida. La única ruta inglesa existente es `/en/news/$slug`; no existe todavía una portada `/en/` ni navegación inglesa general.
- **Piloto conservado:** lectura actual de la base de datos confirma Marine, Chevi y Ecuador en `draft`, sin persona ni fecha de aprobación. No se han repetido sus pruebas ni modificado sus textos.
- **Textos:** navegación, filtros y botones van en diccionarios; artículos, presentaciones y descripciones administrables necesitan traducciones almacenadas y revisadas.
- **Dependencias protegidas:** TV comparte reproductores y catálogo; resultados comparten `provider.ts`; especiales y territorios reutilizan sus vistas y datos. Se traducirán etiquetas alrededor de estos sistemas, no su funcionamiento.

Esta revisión es de código, reglas actuales y antecedentes del piloto. No equivale a nuevas pruebas autenticadas ni a certificar resultados deportivos o indexación real en Google.

## Incidencias que deben resolverse antes de ampliar

1. **Protección editorial:** las reglas actuales permiten inserciones sin restringir explícitamente el estado aprobado. El control de aprobación se ejecuta solo en actualizaciones y no protege por completo cambios de texto ya aprobado. Las reglas de propiedad/país también necesitan alinearse con los límites editoriales y la suspensión existentes. La lectura inglesa no exige aprobación explícita: un editor autenticado podría obtener una traducción privada de su ámbito en una vista destinada al público.
2. **Generación:** el esquema abierto de bloques de la solicitud actual no es adecuado para la salida estricta usada por la IA. El piloto lo evitó mediante campos traducibles cerrados; hay que integrar ese método en el botón existente y validar la respuesta antes de guardar.
3. **Huella del original:** el panel omite el cuerpo español mientras el servidor lo incluye. También faltan controles fiables para cambios de leyendas, estructura y demás campos traducibles. La aprobación debe comprobar la versión actual del original, no solo mostrar un aviso.
4. **Texto plano:** la vista inglesa no pasa el cuerpo traducido cuando no hay bloques y puede mostrar el español.
5. **Selector y navegación:** el menú completo desborda a 1280 px según el piloto; el selector solo cambia de URL en el artículo global. El idioma guardado y el idioma de la URL todavía no forman una única regla.
6. **SEO:** el documento inicial declara español incluso en la ruta inglesa; el idioma cambia después en el navegador. Faltan páginas inglesas generales y su incorporación al sitemap permanente. Parte del canonical general se añade únicamente después de cargar la página.

Los nombres en leyendas y datos deportivos pendientes del piloto requieren revisión independiente, nunca corrección por inferencia.

## Solución única: ampliar lo existente

Una sola web y vistas compartidas: rutas inglesas ligeras bajo `/en/`, conservando las URLs españolas y las inglesas de artículos existentes.

La URL determina el idioma servido; la preferencia guardada guía la navegación sin cambiar silenciosamente el idioma de una URL española. El selector conserva página y filtros compatibles. Sin traducción editorial, indicar el original y no indexarlo como inglés.

## Bloques de ejecución, tras autorización

### 1. Noticias: seguridad y correcciones del piloto
- Reforzar lectura pública, inserciones, cambios de estado y edición de traducciones aprobadas en funciones y reglas de la base de datos, reutilizando las comprobaciones actuales de administrador, propietario, país y cuenta activa.
- Comprobar autorización de edición antes de consumir IA, no inferirla de poder leer una noticia publicada. Si falla la comprobación de cuota, detener la generación; no saltarse el límite.
- Una edición del inglés aprobado lo retira a revisión y elimina su aprobación; no cambia silenciosamente texto público. Un cambio del original marca la traducción como desactualizada y bloquea su presentación como versión vigente y una nueva aprobación hasta revisarla. No generar ni sustituir textos automáticamente.
- Unificar la huella sobre los campos originales traducibles y comprobarla al guardar y aprobar. Guardar una traducción sobre un original que cambió exige actualizarla y revisarla primero.
- Integrar generación por campos cerrados y reconstrucción de bloques, conservando identificadores, tipos, orden, enlaces y archivos. Mantener corrección manual de bloques y texto plano.
- Conservar de forma reversible la versión aprobada anterior antes de regenerar o editar; no sobrescribirla sin conservar su contenido. Reutilizar almacenamiento existente cuando sea suficiente y justificar cualquier extensión mínima.
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
- Reutilizar especiales, revista, patrocinadores, equipo y contacto: presentaciones revisadas, conservando nombres, destinatarios, logos, enlaces, datos y PDF.
- Reutilizar configuraciones para presentaciones traducidas; cualquier ampliación de almacenamiento será mínima y justificada, sin sistema paralelo.
- **Verificación:** mismos resultados, orden, filtros, enlaces de vídeo y archivos antes/después; sin escrituras sobre resultados ni ajustes de sincronización, streaming o medallero.

### 5. SEO y comprobación final dirigida
- Cada página inglesa válida tendrá título, descripción, Open Graph y canonical propios desde el documento inicial; conservar el SEO español salvo errores comprobados.
- Hreflang ES/EN/x-default recíproco solo entre versiones realmente disponibles. Sitemap general para páginas inglesas publicadas y válidas; sitemap de noticias mantiene su ventana específica.
- Borradores y traducciones no aprobadas nunca públicos ni indexables. Sustituciones españolas en URL inglesa seguirán sin indexación como traducción.
- Comprobar navegación entre las secciones afectadas, presentación, noticias con bloques y texto plano y conservación de datos. Distinguir pruebas reales, revisión de código y cualquier comprobación no ejecutable; nunca contar una simulación como prueba superada.

## Alcance técnico y conservación

Archivos principales: `src/lib/i18n/*`, cabecera/selector, pie, búsqueda, migas y `__root.tsx`; funciones de traducción, `TranslationPanel`, `NewsEditor`, `NewsArticleView`; vistas compartidas de las secciones, rutas inglesas y ambos sitemaps.

La ampliación de base de datos prevista es **correctiva**, sobre reglas, vigencia y conservación de versiones de `news_translations`; no destructiva y compatible con borradores y permisos actuales. No duplicar artículos ni catálogos deportivos.

La base de datos es compartida con la web publicada: sus correcciones pueden tener efecto inmediato sin publicar la interfaz. La autorización cubrirá solo el sistema bilingüe, sin ampliar privilegios ni cambiar otros sistemas.

## Riesgos, esfuerzo y costes

- **Riesgos:** publicación indebida, inglés desactualizado, idiomas mezclados y consultas multiplicadas. Resolver primero los bloques 1 y 2.
- **Esfuerzo:** alto en conjunto por la amplitud de la web; medio-alto en seguridad/noticias y navegación/SEO; medio por grupo de secciones al compartir vistas. Se ejecutará en bloques coherentes, sin pedir permiso por archivo.
- **Créditos:** consumo moderado-alto total; menor que reconstruir. No puedo calcular créditos ni duración exactos antes de ejecutar y medir.
- **Costes:** ningún servicio nuevo previsto; diccionarios sin IA. Generación editorial consume la IA existente y más traducciones incrementan almacenamiento/lecturas. Comunicar gastos nuevos antes de habilitarlos.

## Autorización

Ahora: solo análisis, sin cambiar código, permisos ni datos. Tras autorización: ejecutar los bloques y detenerse ante riesgos importantes, gastos nuevos o decisiones fuera del alcance. Aprobar el plan **no aprueba el piloto ni autoriza publicar la web**.