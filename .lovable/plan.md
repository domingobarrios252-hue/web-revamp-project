
# Hub España — Microsite editorial premium

Construir un "portal dentro del portal" para España, totalmente modular y reutilizable para Colombia, Venezuela y otros países más adelante. Dada la magnitud (9 secciones + decenas de subsecciones + admin completo), propongo construirlo por **fases incrementales**, no todo de golpe. Cada fase es entregable y revisable.

---

## Arquitectura base (reutilizable por país)

**Ruta raíz dinámica**: `/hub/$country` (ej: `/hub/es`, `/hub/co`, `/hub/ve`)
- Layout propio con sub-header de navegación específico del hub (independiente del header global)
- Provider de contexto `CountryHubContext` que inyecta: código país, colores, federación, idioma, etc.
- Configuración por país en tabla `country_hubs` (nombre, bandera, colores acento, federación principal, secciones activas)

**Componentes reutilizables** (`src/components/hub/`):
- `HubSubNav` — menú de las 9 secciones
- `HubDashboard` — bloques editoriales (noticias, eventos, vídeo, atleta semana…)
- `RankingTable`, `CalendarList`, `ResultsArchive`
- `ClubDirectory`, `SchoolDirectory`, `ClubCard`
- `AthleteDirectory`, `AthleteCard`, `AthleteProfile`
- `MvpRanking`, `FederationMap`, `MediaGrid`
- `NewsSubmissionForm`

Todos aceptan `countryCode` como prop → mismo código sirve para cualquier país.

**Diseño visual**: mantener tokens existentes (gris oscuro/negro + oro `#D4A017`), tipografías ya definidas, animaciones suaves estilo MARCA/AS.

---

## Fases propuestas

### Fase 1 — Cimientos + Inicio España (esta entrega)
- Crear esquema de base de datos para hubs (tabla `country_hubs`, ampliar `news`, `events`, `skaters`, `clubs` con filtros por país/sección hub)
- Rutas `hub/$country` (layout) e `hub/$country/index` (dashboard editorial)
- Sub-navegación de las 9 secciones (la mayoría llevan a páginas "próximamente" en esta fase)
- Componente `HubDashboard` con: ticker hub, noticias destacadas país, próximos eventos, resultados fin de semana, vídeo destacado, entrevista, patinador semana, club destacado
- Reaprovecha datos existentes filtrados por `country_code = 'es'`

### Fase 2 — Competición (Liga + Campeonatos)
- Tablas: `league_seasons`, `league_standings`, `championships`, `championship_results`
- Páginas: clasificaciones con filtros, calendario con mapa, archivo de jornadas, campeonatos históricos
- Admin: gestión de jornadas, importación de resultados

### Fase 3 — Clubs & Escuelas + Patinadores
- Ampliar `clubs` y `skaters` con campos hub (provincia, escuela vs competición, especialidad)
- Directorios filtrables + fichas detalladas
- Admin de fichas

### Fase 4 — Federaciones + RollerZone TV España + MVP España
- Tabla `federations` (nacional + autonómicas) con mapa interactivo SVG España
- Vista TV filtrada por país
- MVP España reusando tablas `mvp_seasons` y `mvp_awards`

### Fase 5 — Archivo + Comunidad
- Archivo histórico (vistas filtradas de news/results)
- Calendario comunidad + formulario "Envía tu noticia"
- Sistema de roles colaborador por país (ampliar `editor_countries`)

---

## Detalles técnicos

- **Escalabilidad**: TODA la lógica recibe `countryCode`. Duplicar para Colombia = añadir fila en `country_hubs` + activar secciones. Cero código nuevo.
- **Admin**: cada fase añade su panel correspondiente en `/admin/hub/...` con RLS por rol `editor` + país asignado (`editor_countries` ya existe).
- **Acceso desde header**: el menú "España" actual del header pasará a apuntar a `/hub/es`.
- **SEO**: cada ruta hub con su `head()` (title, description, og:image).
- **Sin romper lo existente**: las páginas actuales (`/noticias`, `/eventos`, `/resultados`, etc.) siguen funcionando; el hub las complementa con vistas filtradas.

---

## Qué necesito confirmar antes de empezar Fase 1

1. **¿Apruebas avanzar por fases?** (5 fases ≈ 5 entregas revisables). Si quieres todo de golpe, será mucho más arriesgado y difícil de revisar.
2. **¿La sección "España" del header debe seguir existiendo separada, o se sustituye por el nuevo Hub `/hub/es`?**
3. **Datos iniciales**: ¿quieres que pueble España con los datos ya existentes (filtrando `country_code='es'`) o empezamos vacío y vas cargando desde admin?
4. **Federaciones autonómicas**: ¿tienes ya un listado oficial (17 CCAA + 2 ciudades autónomas) con webs, o lo dejo con placeholders editables?

Cuando confirmes estos 4 puntos, ejecuto **Fase 1** completa (migración DB + rutas + dashboard editorial + sub-nav).
