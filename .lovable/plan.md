# Nuevo editor de noticias (Admin)

## Lo que he revisado (sin tocar nada)
- **Pantalla actual:** una ventana larga con todo apilado: título, slug, entradilla, contenido (texto clásico), bloques aparte, galería y vídeo aparte, portada, estado, fecha, hub, relaciones y directo.
- **España / Colombia:** cada noticia guarda un código de país (`es`, `co`) y una fila de visibilidad "hub de país". Hoy: 135 noticias `es`, 27 `co`, 1 `mia`, 0 `pt`.
- **Miami y Portugal** ya usan ese mismo código (`mia`, `pt`) en sus páginas públicas, pero el editor no los ofrece.
- **Hero portada** = interruptor "Destacada" (solo una a la vez) + modo de visualización; es independiente del hub.
- **"General"** hoy no existe como valor: una noticia sin hub queda guardada como `es` por defecto. Esto es un riesgo de mezcla.
- **Contenido existente:** 12 noticias usan bloques; el resto usa el texto clásico + galería/vídeo. 160 tienen entradilla.

## Qué propongo construir
1. **Diseño:** pantalla completa, zona principal (Título, Subtítulo/Entradilla, Portada, Editor) y barra lateral (Publicación, Hero portada, Hub, Autor, Categoría, Etiquetas, Relacionados, Opciones avanzadas con slug, minutos de lectura y ajustes secundarios). Mismo estilo oscuro y dorado. En móvil la barra lateral pasa debajo.
2. **Subtítulo:** reutiliza el campo de entradilla que ya existe (sin columna nueva).
3. **Un único editor por bloques:** Texto, H2/H3, Imagen, Galería, Vídeo/embed, Cita y **Lista** (nuevo tipo). Cada bloque: editar, subir/bajar, arrastrar, duplicar y eliminar. Arrastrar imágenes directamente al artículo crea un bloque imagen.
4. **Noticias antiguas:** al abrirlas, su texto clásico, galería y vídeo se convierten en bloques dentro del editor; solo se guardan como bloques si el editor pulsa guardar. La página pública ya da prioridad a los bloques, así que nada cambia para las que no se editen.
5. **Automático:** slug desde el título (solo en noticias nuevas; las existentes conservan su URL), minutos de lectura calculados, autoguardado cada pocos segundos para borradores con indicador "Guardado / Guardando…".
6. **Botones claros:** Guardar borrador, Vista previa, Publicar.
7. **Hub único:** General | España | Colombia | Portugal | Miami, uno solo, usando el código de país que ya existe (sin un interruptor por país). Hero portada sigue aparte (p. ej. Hero + Portugal).
8. **Relaciones:** buscador con selección múltiple y chips.

## Una decisión necesaria (cambio pequeño en la base de datos)
Para que **"General"** sea real, el código de país debe poder quedar vacío (hoy es obligatorio y se rellena con `es`). Propuesta: permitir vacío = General; no cambiar las 163 noticias existentes. Tengo que revisar que los listados de España no dependan de ese `es` por defecto antes de ejecutarlo.

## No se toca
URLs existentes, contenido publicado, ASU26, Resultados, VeloPro, Medallero, PDFs, permisos, idiomas.

## Detalles técnicos
- `admin.index.tsx` NewsForm se divide en componentes; `ContentBlocksEditor` + `newsBlocks.ts` añaden `list`, duplicar y soltar archivos; `NewsContentBlocks` renderiza listas.
- Hub → `news.country_code` (`null|es|co|pt|mia`) + fila `news_visibility` channel=country; migración `ALTER COLUMN country_code DROP NOT NULL`.
- Autosave solo en estado borrador (no publica sin pulsar Publicar); nuevo borrador se inserta en el primer autoguardado.
