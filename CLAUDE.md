# CLAUDE.md — Metal Globe 🌍🤘

> Este archivo es la MEMORIA del proyecto. Claude Code lo lee automáticamente al
> arrancar en esta carpeta. Mantenerlo actualizado = no perder contexto entre sesiones.
> Ubicación: raíz del repo (`C:\Users\Usuario\Documents\Portfolio\Metallum\CLAUDE.md`).

---

## 🎸 QUÉ ES EL PROYECTO

**Metal Globe** — sitio de portafolio: un globo terráqueo 3D interactivo con **195,679
bandas de metal reales** (de Encyclopaedia Metallum / Metal Archives), de **153 países**,
**17 géneros raíz** y **346 subgéneros**. Single-page, todo en `web/index.html`
(HTML + CSS + JavaScript vanilla, **sin build step**).

- **Local:** corre en `http://localhost:8124/index.html` (`py -3 serve.py`; el puerto
  por defecto es **8124**, configurable: `py -3 serve.py <puerto>`).
- **Hosting:** Hostinger (`lightgray-skunk-391254.hostingersite.com`). Se sube el
  CONTENIDO de `web/` a `public_html`.
- **Estética:** gótica sobria — negro / oro / plata / rojo, fuentes Cinzel + Oswald.
  Elegante, NO circo. El dorado se ve premium justo porque es sobrio.

⚠️ **IMPORTANTE:** otra persona del equipo ya tiene acceso a la versión ESTABLE colgada
en Hosting (la última antes del grafo genealógico). El desarrollo local es la versión
NUEVA — modificar local no afecta lo que esa persona ve hasta que se suba a Hosting.

---

## 🛠️ MODO DE TRABAJO (reglas no negociables)

- **Idioma:** español casual peruano. Responder igual.
- **Una feature por prompt.** Nada de "haz-todo". El usuario tiende a scope creep —
  ayudar cerrando una cosa a la vez.
- **Datos primero, arte/visual después.** El arte sin datos es pintura muerta.
- **Verificación REAL, no headless.** Claude Code "canta victoria" en headless pero no
  es prueba. Verificar siempre en navegador real incógnito: `Ctrl+Shift+N` (incógnito) +
  `Ctrl+Shift+R` (hard refresh). El caché engaña.
  - Ahora hay skill `webapp-testing` (Playwright) para verificación real automatizada.
- **NO inventar datos.** Si algo no tiene fuente, marcarlo `null` / confianza "baja".
  Mejor un dato faltante que uno inventado. El usuario corrige premisas no verificadas.
- **Guards explícitos** en cada prompt: qué NO tocar.
- **Copyright:** NUNCA reproducir texto con derechos (ej. libro "Sound of the Beast" se
  cita como bibliografía, no se reproduce). NUNCA descargar logos/fotos de bandas (tienen
  copyright) — solo datos textuales factuales.

---

## 📂 ESTRUCTURA Y ARCHIVOS CLAVE

```
Metallum/
├── web/                          ← lo que se sube a Hosting (public_html)
│   ├── index.html                ← ⚠️ TODO el sitio vive ACÁ (web/index.html, NO en
│   │                                la raíz). ~4,200 líneas / ~248KB.
│   └── data/
│       ├── lastfm/dashboard.json ← agregado liviano ~23KB (lo que ve el cliente)
│       └── atlas_data.json       ← data de géneros del sitio (roots + subgéneros)
├── data/                         ← data pesada, NO se sube
│   ├── bands_raw.csv             ← base de bandas (scrape Metallum original)
│   ├── lastfm/lastfm_metrics.jsonl  ← 195,679 bandas, métricas Last.fm (22MB, FINAL)
│   ├── genealogia/               ← La Forja Capa 0 (genealogía de géneros)
│   │   ├── generos.json          ← 84 nodos (76 con en_globo:true)
│   │   ├── genealogia.md
│   │   └── README.md
│   └── musicbrainz/mb_metrics.jsonl ← barrido MB PARCIAL (parado, ver abajo)
├── scraper/                      ← scripts de build (varios). Los que importan:
│   ├── build_dashboard.py        ← ✅ lee el jsonl → genera dashboard.json (sí correr)
│   └── lastfm_pipeline.py        ← ❌ el barrido de Last.fm. NO correr (ya terminó).
├── serve.py                      ← server estático local (sirve web/, puerto 8124)
└── CLAUDE.md                     ← este archivo
```
(Otros scripts en scraper/: build_atlas_json.py, build_search_index.py,
build_bands_index.py, geocode*.py, parse_generos.py, etc. — son builds auxiliares.)

### `bands_raw.csv` — columnas:
`pais_iso, pais_nombre, banda, band_id, genero_raw, ciudad_region, status, ma_url`
⚠️ **NO tiene año de formación** (por eso el re-scrape pendiente, ver roadmap).

### `lastfm_metrics.jsonl` — campos por banda:
`id, n` (nombre), `c` (país), `li` (oyentes), `pc` (playcount), `mbid`, `v` (validez), `s`
- ✅ **COMPLETO: 195,679/195,679 bandas. Data FINAL** (último write 15-jun-2026). El
  barrido YA terminó — NO hay nada corriendo, las métricas YA se pueden usar.
- Desglose real de `v`: `ok`=70,661 · `ok_pais`=62,370 · `debil`=39,281 · `colision`=15,341 · `nf`=8,026

### `atlas_data.json` — keys: `meta`, `generos_globales`, `paises`
- `generos_globales` es un array de 17 raíces, cada una `{nombre, total, subgeneros}`.
- Las raíces usan id capitalizado: `"Death"`, `"Black"`, `"Thrash"`...
- Los subgéneros son labels con espacios/acentos: `"Melodic Death"`, `"Death (clásico)"`

---

## 🔑 DECISIONES TÉCNICAS CLAVE (no re-litigar)

1. **Filtro de confianza Last.fm:** para métricas de OYENTES se usa filtro ESTRICTO
   `v == "ok_pais"` solamente (excluye colision/debil/nf/ok). Los CONTEOS de bandas NO
   se filtran (toda banda es real). Esto está validado.
2. **Campo de géneros raíz en la data por banda se llama `roots`** (no `raices`).
3. **Dedup del podio por `mbid`** (fix aplicado en `build_dashboard.py`): varios band_id
   de Metallum colisionan al mismo artista de Last.fm (mismo mbid) → heredan el mismo
   `li`. Se deduplica quedándose con el de mayor `li`. Las de mbid vacío NO se agrupan
   entre sí (respaldo: dedup por `(n, c)`).
   - ⚠️ Hay un `TODO(MusicBrainz)` en el código: algunas `ok_pais` pueden ser colisiones
     suaves (band_id oscuro heredando oyentes de un homónimo famoso). Eso se resolverá
     con cruce de datos futuro. El dedup actual solo quita filas repetidas.
4. **Export de imagen (si/cuando se agregue):** usar `html2canvas-pro` 2.0.4, NO el
   `html2canvas` 1.4.1 viejo (rompe con oklch/color-mix). ⚠️ Todavía NO existe feature de
   captura/export en `web/index.html` — esto es nota para cuando se implemente, no algo
   ya cargado en el código.
5. **Performance:** NO bajar el jsonl de 22MB al cliente. Se genera `dashboard.json`
   (~23KB) con el agregado. Si se re-corre el barrido, regenerar con `py scraper/build_dashboard.py`.

---

## ✅ FEATURES YA CONSTRUIDAS (NO reconstruir)

- **Globo 3D** (Three.js) con las 195,679 bandas, pines por país/ciudad.
- **Filtros de género:** selección única + toggle "Combinar" (O = alguno / Y = todos).
  Contador, pines y panel derecho salen del MISMO conjunto filtrado.
- **Ficha de contexto de país:** bandera + reloj local + clima (Open-Meteo, keyless+CORS,
  íconos WMO, cache 10min) + nº bandas + género dominante. Colapsable, transparente.
- **Radio Metal:** widget flotante (TV CRT), arrastrable, mini↔grande, persiste sonando,
  localStorage. Playlists de YouTube por género (`videoseries?list=ID`). Botón YouTube
  de cada banda = búsqueda externa (no abre radio).
- **Dashboard scrollytelling** (debajo del globo; globo intacto como héroe):
  - "El mundo en números" (195,679 / 153 / 17 / 578,040,730 oyentes)
  - "Dónde late más fuerte" (cantidad: US 45,425 · oyentes: US 198M)
  - Scatter "Muchas bandas ≠ muchos oyentes" (eje log)
  - "El ADN de cada escena" (género dominante por país)
  - "Dónde los fans son más intensos" (devoción = plays/oyente; Eslovenia 55.7)
  - Podio "La banda más escuchada" (Metallica 5.2M / Black Sabbath 4.4M / Slipknot 4.3M)
  - "Joyas ocultas" (pocos oyentes, altísima devoción)
  - "El árbol del metal" (346 subgéneros; ranking de raíces por nº de subgéneros:
    Black 32, Death 31, Folk 29...)
- **Tops expandibles** incrementales 25→50→75→100 en todos los rankings (renderiza solo
  lo visible, no infla el DOM).
- **Podio expandible** 3→5→10→25→50→100.
- **Conexiones dashboard→globo:** clic en país/banda → vuela al globo. Clic en raíz del
  "Árbol del metal" → sube al globo + expande esa raíz en el panel izquierdo.
- **Animaciones de entrada sobrias:** count-up de KPIs, barras que crecen
  (IntersectionObserver). Respeta `prefers-reduced-motion`. SIN neón/goteo/sangrado.
- **Fix Incubus:** dedup del podio (ver decisiones técnicas).

---

## 🔥 LA FORJA DEL METAL (atlas genealógico — proyecto dentro del proyecto)

Visión: atlas interactivo de la evolución del metal — de dónde vino, cómo se ramificó,
a dónde llegó. Para que un fan profundice y un novato se culturice. Se construye POR
CAPAS, una a la vez.

### Capa 0 — DATOS ✅ COMPLETA
`data/genealogia/generos.json` — **84 nodos** (8 influencias externas con `en_globo:false`
+ 17 raíces + 59 subgéneros). **76 nodos con `en_globo:true`.** Confianza: 37 alta /
44 media / 3 baja. **101/101 labels matchean exacto** contra `atlas_data.json` → linkeo
de Capa 2 garantizado. 0 huérfanos, 0 duplicados.

**Schema de cada nodo:**
- `id` (snake_case ASCII estable, ej. `melodic_death`) — para conexiones entre nodos
- `id_sitio` (string EXACTO del sitio, ej. `"Melodic Death"`) — puente de linkeo Capa 2;
  `null` si `en_globo:false`
- `id_sitio_alias` (array) — otros labels del sitio que mapean al mismo género
  (cross-listing); `[]` si no hay
- `nombre_es`, `nombre_en`, `tipo` (raiz|subgenero|influencia_externa), `en_globo` (bool),
  `genero_padre`, `decada_origen`, `anio_aprox` (null por ahora), `paises_origen`,
  `escenas`, `origenes_estilisticos` [ids], `formas_derivadas` [ids], `bandas_seminales`,
  `descripcion`, `fuentes` [urls], `confianza`

**Fuentes usadas:** fichas de Wikipedia por género (Stylistic origins / Derivative forms
/ Cultural origins / Regional scenes), boundbymetal.com/en/common/metal-genres-graph
(fechas), libro "Sound of the Beast" (Ian Christe, 2003, citar no reproducir),
metalstudies.org/biblio.

**Nota:** `anio_aprox` está en `null` en todos (Wikipedia da décadas, no años exactos).
Los años exactos se sacarán del re-scrape de Metallum (ver roadmap) para alimentar el
timeline de la Capa 4.

### Capa 1 — GRAFO DE NODOS ⏳ PENDIENTE (prompt listo)
Árbol genealógico por eras (columnas 60s-70s → 80s → 90s → 2000s+), nodos = géneros,
líneas de linaje, hover resalta padres/hijos, clic abre ficha lateral, pan/zoom.
Sección nueva, NO toca globo ni dashboard. Botón "ver bandas en el globo" como
placeholder (se conecta en Capa 2).

### Capa 2 — RUTAS AL GLOBO (futuro)
Cada nodo linkea al globo filtrando ese género/época (usando id_sitio + alias).

### Capa 3 — ARTE ILUSTRADO (futuro)
Mapa 2D pergamino tipo Tierra Media como IMAGEN DE FONDO (generada aparte, ej.
Nano Banana/Gemini), con la capa interactiva de nodos NÍTIDA encima (SVG/HTML). El arte
NO debe depender de su propio texto (los modelos de imagen escriben texto basura). 3D
parqueado (el globo ya es la estrella 3D). Navegación pan/zoom con Leaflet `L.CRS.Simple`.

### Capa 4 — TIMELINE por décadas (futuro)
Deslizar 60s → hoy, ver aparecer géneros/bandas. Necesita años de formación (del re-scrape).

---

## 🗺️ ROADMAP / PENDIENTES (en orden sugerido)

1. **Re-scrape de Metallum** ⏳ (prueba de 30 PENDIENTE). Capturar campos NUEVOS de la
   página principal de cada banda (1 request, SIN imágenes por copyright):
   `formed_in`, `lyrical_themes`, `years_active`, `label`, `genre_full`, `status`.
   Output a archivo NUEVO `data/metallum/bands_enriched.jsonl`. Reanudable, rate prudente
   (1.5-2s, Metallum banea agresivos), User-Agent identificable. → alimenta timeline +
   infografías de temática lírica ("¿de qué canta cada género/país?").
2. **La Forja Capa 1** (el grafo de nodos). Data lista para alimentarlo.
3. **i18n / multiidioma** — su propia tanda (la más laboriosa). Selector arriba
   (español/inglés/alemán). Diccionario por idioma de cada texto.
4. Capas 2, 3, 4 de La Forja.
5. **Subir versión nueva a Hosting** cuando un bloque esté listo.

### Bugs a verificar en navegador real (no confirmados por lectura):
- **Claymore sin bandera:** la banda Claymore existe en los datos con país/coords, así
  que si el pin no muestra bandera es bug de UI/render, no de datos. Verificar en
  incógnito. (El color picker "Selección" del CLAUDE.md viejo YA está resuelto, no tocar.)

### Parqueado / descartado:
- **MusicBrainz:** PARADO. Se decidió usar Metallum (misma fuente del CSV, da más campos
  de una sola pasada). `data/musicbrainz/mb_metrics.jsonl` parcial dejado por si acaso
  (no borrar). Tenía los años de formación + IDs cruzados (Discogs/Spotify/Wikidata),
  pero solo cubría las ~97k con mbid. Rate limit MB: 1 req/seg ESTRICTO (banea IP si te
  pasas). Script: `scraper/musicbrainz_pipeline.py` (NO correr).
- **Spotify API:** MUERTA para apps nuevas (deprecó related artists/recommendations/
  audio features/previews el 27 nov 2024, sin reemplazo).
- **Imágenes de bandas (logos/fotos):** descartadas por copyright.

---

## 🔌 SETUP DE HERRAMIENTAS (instalado, global, todos los proyectos)

### MCP servers (`claude mcp list`):
- **context7** — docs actualizadas de librerías (Leaflet, ECharts, Three.js, etc.)
- **firecrawl** — scraping de URLs a markdown limpio. Key en `~/.claude.json` (env var).
- (Playwright MCP se quitó: redundante con la skill webapp-testing.)

### Skills oficiales de Anthropic (`anthropics/skills`, se auto-actualizan):
- **frontend-design** — UI de calidad senior (portafolio Astro, tienda, dashboards)
- **webapp-testing** — verificación real de navegador (scripts caja negra, NO leer su
  fuente, queman contexto — correr con `--help`)
- **skill-creator** — crear skills propias de flujos repetidos (incl. data science)
- **web-artifacts-builder** — artifacts complejos React/Tailwind/shadcn
- **canvas-design** — arte/pósters .png/.pdf (sirve para el arte de La Forja)
- **theme-factory**, **brand-guidelines** — diseño/marca (tienda de Alejandra)
- **xlsx, pptx, docx, pdf** — documentos (el bot Chasqui genera Excel/PPT)

**Cómo funcionan:** Claude Code los activa SOLO cuando la tarea los necesita (no hay que
invocarlos). Los skills usan CARGA PROGRESIVA: duermen hasta usarse, NO queman tope.
(Regla "menos es más" aplica fuerte a MCP, que sí jalan data; a skills casi no.)

---

## 💸 TOPE / EFICIENCIA (plan Claude Max)

- El "$ cost" que muestra Claude Code es valor-API ESTIMADO, NO factura (en Max se paga
  fijo). Lo que importa es la barra del PLAN (semanal).
- "90% de uso a >150k de contexto" = sesiones largas queman el tope más rápido aunque
  estén cacheadas. **`/compact` mid-task, `/clear` al cambiar de tarea.**
- Diseñar en el chat (claude.ai) / ejecutar en Claude Code. `/model` según dificultad.
- Este `CLAUDE.md` + abrir hilo nuevo entre features grandes = arranca barato.
