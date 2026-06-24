
# Rediseño de la HOME — RollerZone como cabecera deportiva

Mantengo la identidad de marca ya consolidada (Bebas Neue, paleta oro/negro, estética editorial) y reorganizo la portada por completo con mentalidad de medio digital deportivo especializado. Reutilizo los componentes existentes que aportan valor (`HeroCarousel`, `Ticker`, `HomeDynamicZone`, `HomeResultsSlider`, `LiveCenter`, `AdBanner`, secciones de eventos y revista) y construyo los bloques nuevos donde hace falta.

## Nueva estructura de la portada

```text
┌─────────────────────────────────────────────────┐
│ 1. HERO CARRUSEL (existente, refinado)          │  Nivel 1 — Portada
│    + chip "EL MEDIO DEL PATINAJE DE VELOCIDAD"  │
│    + CTAs: Leer actualidad / Únete a RollerZone │
├─────────────────────────────────────────────────┤
│ 2. TICKER en directo (existente)                │
├─────────────────────────────────────────────────┤
│ 3. PORTADA EDITORIAL (NUEVO)                    │  Nivel 1
│    ┌──────────────────────┬──────────────────┐  │
│    │  Noticia principal   │  3 secundarias   │  │
│    │  (grande, 2/3)       │  apiladas (1/3)  │  │
│    └──────────────────────┴──────────────────┘  │
├─────────────────────────────────────────────────┤
│ 4. ESPECIAL DEL MOMENTO (NUEVO)                 │  Nivel 1
│    Banner full-width con cobertura destacada    │
│    + 3-4 enlaces a piezas relacionadas          │
├─────────────────────────────────────────────────┤
│ 5. ACTUALIDAD ROLLERZONE — grid 3×2 (refinado)  │  Nivel 2
│    Cards con etiquetas de sección + jerarquía   │
├─────────────────────────────────────────────────┤
│ 6. RESULTADOS / LIVE CENTER (existente)         │  Nivel 2
│    HomeDynamicZone + HomeResultsSlider          │
├─────────────────────────────────────────────────┤
│ 7. PRÓXIMOS EVENTOS (existente, refinado)       │  Nivel 2
├─────────────────────────────────────────────────┤
│ 8. ROLLERZONE TV (NUEVO en home)                │  Nivel 3
│    Vídeo destacado + 3 miniaturas               │
├─────────────────────────────────────────────────┤
│ 9. REVISTA — última edición (existente)         │  Nivel 3
├─────────────────────────────────────────────────┤
│10. UNIVERSO ROLLERZONE (NUEVO)                  │  Nivel 3
│    Tarjetas: MVP · Salón de la Fama · Hubs país │
├─────────────────────────────────────────────────┤
│11. CAPTACIÓN DE REDACTORES (NUEVO)              │  Nivel 4
│    Bloque editorial con CTA "Quiero colaborar"  │
├─────────────────────────────────────────────────┤
│12. NEWSLETTER (NUEVO en home)                   │  Nivel 4
│    Banda visual con NewsletterForm existente    │
└─────────────────────────────────────────────────┘
```

El footer ya cumple la función editorial pedida (navegación, comunidad, newsletter, legal); lo dejo intacto salvo retoques menores de copy si hace falta.

## Componentes nuevos a crear

- `src/components/home/EditorialCover.tsx` — bloque "Portada editorial" (1 noticia grande + 3 secundarias apiladas, jerarquía clara).
- `src/components/home/SpecialCoverageBanner.tsx` — bloque "Especial del momento" full-width con imagen, kicker, título, resumen, lista de enlaces y CTA. Configurable desde código en MVP (puede mover a admin en una fase posterior).
- `src/components/home/RollerZoneTVHome.tsx` — bloque de vídeo destacado + miniaturas, leyendo de `tv_videos`/`tv_highlights` ya existentes.
- `src/components/home/UniverseGrid.tsx` — tarjetas de MVP, Salón de la Fama, Hub España, Hub Colombia.
- `src/components/home/JoinContributorsBlock.tsx` — bloque editorial de captación de redactores con dos CTA.
- `src/components/home/NewsletterBand.tsx` — banda visual envolviendo `NewsletterForm`.

## Componentes refinados (mismos archivos, mejor jerarquía visual)

- `HeroCarousel`/`HeroSlide` — añado kicker "El medio del patinaje de velocidad" y un segundo CTA "Únete a RollerZone".
- `NewsGridCard` — tipografía de titular más editorial, etiqueta de categoría más visible, autor + fecha + tiempo de lectura en una sola línea condensada.
- Encabezados de sección (`section-header` reutilizable inline) — kicker dorado + título display + filete dorado + enlace "Ver todo →" alineado, para que todos los bloques compartan ritmo visual.

## Reorganización de `src/routes/index.tsx`

Sustituyo el JSX actual de `HomePage` por la nueva composición:

```tsx
<HeroCarousel ... />
<Ticker />
<EditorialCover news={news} />
<SpecialCoverageBanner />        // config inline (título, imagen, enlaces)
<LatestNewsGrid news={news} />   // grid 3×2 actual extraída a sub-bloque
<HomeDynamicZone /> + <HomeResultsSlider />
<EventsPreviewSection />
<RollerZoneTVHome />
<MagazinePreviewSection />
<UniverseGrid />
<JoinContributorsBlock />
<NewsletterBand />
```

Mantengo la lógica de fetch de `news` y de `home_hero` tal cual; los nuevos bloques consumen las mismas filas (top-1 = principal, 2-4 = secundarias, 5-10 = grid de actualidad).

## Detalles editoriales y de marca

- Kicker estándar en bloques: pequeño rectángulo dorado con texto condensado mayúsculas (ya existe en el hero, lo extiendo al resto).
- Filete dorado de 3px bajo cada `h2` de sección, alineado a la izquierda — refuerza el aire de "cabecera deportiva".
- Mayor uso de fondos `bg-surface`/`bg-surface-2` alternos entre secciones para separar bloques sin saturar.
- En "Especial del momento" y "Captación de redactores", uso composición a sangre con overlay oscuro + gold-glow para diferenciarlos del resto.

## Notas técnicas (para mí, no para el usuario)

- Sin cambios de esquema en esta fase. El "Especial del momento" se configura por código (constantes editables) en el MVP; un panel admin se puede añadir después.
- Sin cambios en backend, server functions ni RLS.
- Mantengo `useHomeSectionVisibility` para que la visibilidad por sección siga respetándose.
- Todo en frontend, tokens semánticos (`bg-gold`, `text-foreground`, `border-border`...), nada de colores hardcodeados.

## Fuera de alcance de esta fase

- Panel admin para el "Especial del momento" y para los vídeos destacados de la home (se puede añadir en una iteración siguiente).
- Página `/colaborar` dedicada (el CTA del bloque de redactores enlazará a `/redactores`; podemos crear una landing específica más adelante).
- Cambios en el header global y en rutas internas (entrevistas, noticias, etc.).

¿Procedo a implementarlo tal cual?
