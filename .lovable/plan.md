# Especiales editoriales: piezas como artículos independientes

La base ya existe: cada pieza tiene su propia dirección (`/especiales/[especial]/[pieza]`), las tarjetas de la portada del especial ya son clicables y el panel ya permite crear, editar, ordenar (arrastrando), ocultar y borrar piezas. Lo que falta es acabar de convertir cada pieza en un artículo completo, compartible y bien posicionado en Google, sin tocar el diseño ni las direcciones actuales.

## Lo que se va a mejorar

### Página individual de la pieza
- Migas de pan: Inicio > Especiales > Nombre del especial > Nombre de la pieza.
- Imagen destacada grande a ancho completo (y a ancho completo en móvil), manteniendo el estilo negro y dorado actual.
- Al final: botón "Volver al especial" con el nombre real del especial, y debajo "Otras piezas del especial" con 3 tarjetas (una columna en móvil).
- Galería táctil: se puede deslizar con el dedo y ampliar cada foto.
- Botones discretos para compartir: WhatsApp, Facebook, X y "Copiar enlace", siempre con la dirección de esa pieza.
- Revisión móvil: sin desbordes ni scroll horizontal, títulos legibles, botones cómodos de pulsar.

### Google y redes
- Cada pieza generará automáticamente su título ("Título de la pieza | Rollerzone"), descripción corta, dirección canónica y vista previa al compartir con la imagen destacada.
- Para que Google y WhatsApp lean esos datos, la pieza se cargará en el servidor (hoy se carga solo en el navegador, por eso las vistas previas salen genéricas).
- Las piezas en borrador u ocultas no se indexan y no aparecen públicamente; siguen visibles en el panel.
- La portada de cada especial también recibirá su título y descripción reales (hoy muestra el identificador de la dirección).

### Panel de administración
- La lista de piezas mostrará también la categoría y el orden numérico junto a lo que ya muestra (número, miniatura, antetítulo, título, estado).
- Se añade la acción DUPLICAR pieza (copia todo el contenido como borrador, con un nombre de dirección libre).
- Se añade un botón de publicar/ocultar por estado (publicado / borrador), además del interruptor de visibilidad ya existente.
- "+ Nueva pieza" seguirá vinculando la pieza al especial desde el que se crea, y propondrá automáticamente el nombre de la dirección a partir del título.
- Al editar se podrá cambiar también la dirección de la pieza (hoy está bloqueada al editar), avisando de que cambiarla rompe enlaces antiguos.

## Contenido existente
No se borra ni se recrea nada. Las piezas del especial World Skate Games ASU26 conservan textos, imágenes, direcciones, orden, categorías, galerías y estado. No hacen falta tablas nuevas: la tabla de piezas ya tiene todos los campos necesarios (número, antetítulo, categoría, título, dirección, entradilla, descripción de tarjeta, contenido, miniatura, imagen destacada, galería, enlace externo, orden, estado). No se crea ninguna columna nueva.

## Detalles técnicos
- `src/routes/especiales.$slug.$piece.tsx`: pasar de carga en el navegador a `loader` (cliente público de solo lectura) + `head()` derivado de `loaderData` con title, description, canonical, og:* y twitter:*, `robots: noindex` cuando no hay pieza publicada. Nuevos bloques: breadcrumb, hero de imagen destacada, share bar, "volver al especial", 3 piezas relacionadas, galería con `Lightbox` existente.
- `src/routes/especiales.$slug.tsx`: `loader` + `head()` dinámico con el título/descripción reales del especial y canonical propio; se mantiene intacto el diseño de las tarjetas.
- `src/routes/admin.especiales.tsx`: columna de categoría/orden en `SortableRow`, acciones duplicar y publicar/ocultar, slug editable con aviso, autogeneración de slug desde el título.
- Sin migraciones. Sin cambios en header, footer, menú ni otras secciones.

## Comprobaciones finales
Se verificará con navegador real: portada del especial, cada tarjeta clicable, "Leer pieza", recarga directa de cada dirección, piezas ocultas no visibles, imágenes cargando, volver al especial, y todo en escritorio y móvil.
