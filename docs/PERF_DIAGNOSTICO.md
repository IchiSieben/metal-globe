# Metal Globe — Diagnóstico de rendimiento de CARGA

> **Solo medición.** No se tocó `index.html`, `data/`, assets ni el modelo de Tierra.
> Fecha: 2026-06-16. Todos los bytes son mediciones REALES (curl contra los CDN reales y
> contra el hosting real de Hostinger), no estimados.

---

## TL;DR — los 5 ofensores (por bytes sobre red)

| # | Asset | Peso sobre red | De dónde | ¿Crítico p/ el globo? |
|---|-------|----------------|----------|------------------------|
| 1 | **earth-blue-marble.jpg** (mapa día NASA) | **1.46 MB** (sin comprimir) | unpkg (3ros) | Sí — es la Tierra realista |
| 2 | **night-sky.png** (cielo estelar) | **904 KB** (sin comprimir) | unpkg (3ros) | No para el mapa; sí p/ fondo |
| 3 | **echarts.min.js** | 1.02 MB cruda / **269 KB** br | cloudflare | **NO** — solo para el dashboard |
| 4 | **earth-water.png** + **earth-topology.png** | **430 KB + 378 KB** (sin comprimir) | unpkg (3ros) | No (specular/bump, secundarios) |
| 5 | **world-atlas countries-50m.json** | 756 KB cruda / **245 KB** br | jsdelivr | Sí — bordes + Tierra clásica |

**El 78% del peso del arranque son las 4 imágenes de Tierra de unpkg (~3.2 MB, sin comprimir,
en un host de terceros).** Ese es el problema, no el HTML ni la data del sitio.

---

## 1. Inventario de assets (qué carga el globo)

### Archivos propios (en `web/`)
| Archivo | Tamaño disco | Transfer hosting (br) | ¿Cuándo carga? |
|---------|--------------|------------------------|----------------|
| `index.html` | 254 KB (local, con La Forja) / 73 KB en hosting (estable) | ~73 KB br | inicio (HTML) |
| `data/atlas_data.json` | 964 KB | **167 KB br** | **inicio** (`init()`) |
| `data/lastfm/dashboard.json` | 24 KB | 7 KB br | al ver dashboard (chico) |
| `data/bands_index.json` | **6.2 MB** | 1.7 MB br | **LAZY** — solo al buscar bandas |
| `data/search_index.json` | 628 KB | 263 KB br | **LAZY** — solo al usar buscador |
| `data/ciudades/*.json` (154) | 24 MB total | por país | **LAZY** — al entrar a un país |
| `data/admin1/*.json` (151) | 2.4 MB total | por país | **LAZY** — al entrar a un país |
| `web/preview.png` | 480 KB | — | **NO se baja** (solo `og:image`/social) |
| `web/forja.html` | 22 KB | — | solo si abres La Forja |

✅ **Confirmado: el `.jsonl` de ~22 MB de Last.fm NO está en `web/` y NO se baja al cliente.**
El cliente solo recibe el agregado `dashboard.json` (24 KB). Correcto según CLAUDE.md.

✅ **`bands_index.json` (6.2 MB) NO es del arranque** — es lazy, se baja solo cuando el usuario
busca una banda. No es la causa de la carga lenta inicial.

### Librerías externas (CDN) — `<script>` al final del body, ejecución en orden
| Lib | Cruda | gz/br | ¿Necesaria p/ el globo? |
|-----|-------|-------|--------------------------|
| three.js r128 | 603 KB | **121 KB br** | Sí |
| **echarts 5.4.3** | 1.02 MB | **269 KB br** | **NO** — solo dashboard (charts) |
| topojson-client@3 | 7 KB | 3 KB br | Sí (bordes) |
| **fuse.js@7** | 24 KB | 8 KB br | **NO** — solo buscador de bandas |

### Datos/imágenes de terceros (durante el arranque)
| Asset | Peso | Host | Comprimible |
|-------|------|------|-------------|
| world-atlas countries-50m.json | 756 KB → 245 KB br | jsdelivr | sí |
| earth-blue-marble.jpg | **1.46 MB** | unpkg | no (jpg) |
| night-sky.png | **904 KB** | unpkg | no (png) |
| earth-water.png | 430 KB | unpkg | no (png) |
| earth-topology.png | 378 KB | unpkg | no (png) |
| Google Fonts (CSS + woff2) | CSS chico | fonts.gstatic | **9 familias** (ver §5) |
| flagcdn `*.svg` | chico | flagcdn | por bandera, on-demand |

---

## 2. Waterfall de carga (reconstruido con bytes reales)

**Hosting sirve Brotli** (`content-encoding: br`) para HTML y JSON propios — bien. Los CDN
sirven br para JS. Las **imágenes de Tierra (unpkg) NO se comprimen** (ya son jpg/png).

Secuencia de la **primera carga** (skin por defecto = `realista`, ver §3):

```
1. index.html ...................... ~73 KB br        [paint del HTML/CSS]
2. (paralelo) 4 scripts CDN:
     three.js ....................... 121 KB br
     echarts ........................ 269 KB br   ← bloquea el script inline, NO se usa p/ globo
     topojson ....................... 3 KB br
     fuse ........................... 8 KB br     ← no se usa p/ globo
   → el script inline (init del globo) NO corre hasta que TODOS bajan
3. world-atlas countries-50m ....... 245 KB br    → dibuja la TIERRA CLÁSICA (canvas)  ◄── "mapa 1"
4. atlas_data.json ................. 167 KB br    → países, pines, paneles
5. texturas NASA (unpkg, en paralelo):
     earth-blue-marble.jpg .......... 1.46 MB     → al llegar, SWAP a Tierra NASA      ◄── "mapa 2"
     night-sky.png .................. 904 KB
     earth-water.png ................ 430 KB
     earth-topology.png ............. 378 KB
```

**Totales (camino crítico hasta el globo NASA completo):**
- Antes de que corra el init del globo: index + 4 scripts ≈ **~474 KB br** (echarts+fuse son ~277 KB de eso y NO se usan p/ el globo).
- Hasta la **Tierra clásica visible** (placeholder): + world-atlas + atlas ≈ **~886 KB**.
- Hasta la **Tierra NASA completa**: + 4 imágenes unpkg = **+3.17 MB sin comprimir** → **~4.0 MB total**.

> Medición hosting real `index.html`: TTFB ≈ 0.37 s, total ≈ 0.44 s. El HTML es rápido.
> Lo que duele es bajar **~3.2 MB de imágenes desde unpkg** (host de 3ros, sin comprimir,
> con su propia latencia DNS/TLS), más echarts compitiendo por ancho de banda.

> ⚠️ No se corrió traza Playwright en vivo (Playwright no instalado; instalarlo + Chromium
> ~150 MB es alto costo y bajo valor: el prompt indica que los **bytes son lo más predictivo**
> y están todos medidos contra los servidores reales). Si quieres la traza visual igual, se
> puede instalar la skill `webapp-testing` aparte.

---

## 3. El "doble globo" — CONFIRMADO (no es bug, es diseño)

El skin por defecto es **`realista`** (`localStorage.getItem('mg_skin')||'realista'`, línea 3927).
Pero las texturas NASA tardan en bajar (1.46 MB+), así que la app muestra un **placeholder**:

1. **Sphere sin mapa** (color sólido) al instante.
2. Llega `countries-50m.json` (245 KB) → `buildEarthTexture()` dibuja la **Tierra CLÁSICA en
   canvas** (estilizada, océano azul oscuro + tierra) sobre `coreMat`. ← **"otro mapa primero"**
3. Llega `earth-blue-marble.jpg` (1.46 MB) → `applySkin('realista')` hace
   `core.material = earthRealMat` → **swap a la Tierra NASA**. ← **"y luego este"**

Además hay una **3ª representación**: `coreVec`/`earthVectorMat` (Tierra vectorial nítida) que
hace crossfade al hacer zoom profundo en modo realista (`buildVectorEarth`, línea 1968). No
causa el parpadeo inicial pero es otra capa de Tierra.

**Causa raíz del parpadeo:** la textura NASA pesa 1.46 MB y baja de unpkg → tarda → da tiempo
a que se vea la clásica primero. Si la NASA fuera chica (§6, target 1), el swap sería casi
instantáneo/invisible.

---

## 4. Modelos / texturas SIN usar

- **No hay imágenes descargadas en vano.** Los 6 skins estilizados (clásico, cromo, obsidiana,
  brasas, tóxico, acento) son **100% procedurales (canvas)** — cero descargas de red.
- Las **únicas** texturas de red son las 4 de unpkg, y **todas las usa `realista`** (el default).
- Matiz: como el default es `realista`, **un visitante nuevo (ej. Sandra) baja las 4 imágenes
  (3.2 MB) sí o sí**. De ellas, solo `earth-blue-marble.jpg` es crítica para ver el mapa; las
  otras 3 (night-sky 904 KB, water 430 KB, topology 378 KB) son fondo/relieve y podrían cargar
  DESPUÉS del primer render sin que se note (= 1.7 MB que no tienen por qué bloquear).

---

## 5. Vistas/secciones que fallan o tardan

- **No se detectaron 404** en los assets críticos de hosting (index, atlas_data, search_index,
  bands_index, dashboard → todos HTTP 200).
- **echarts (269 KB br)** se carga en el arranque pero solo sirve para los charts del dashboard
  (debajo del globo). Bloquea el init del globo sin necesidad → retrasa lo que el usuario sí ve.
- **Google Fonts: 9 familias** (`Cinzel, Oswald, JetBrains Mono, Pirata One, New Rocker,
  Metamorphous, Grenze Gotisch, UnifrakturCook, MedievalSharp`) en un solo `<link>` render-
  blocking. Usa `display=swap` (bien: el texto no se bloquea), pero son muchas conexiones de
  woff2. Impacto medio-bajo, no es el cuello principal.
- `bands_index.json` (6.2 MB / 1.7 MB br) es pesado pero **lazy** — solo molesta al primer uso
  del buscador de bandas, no en la carga inicial.

---

## 6. Top 3–5 objetivos de optimización (para el PRÓXIMO prompt — NO ejecutados)

1. **Achicar + auto-hostear las texturas de Tierra (mayor impacto, ~3.2 MB → ~0.4 MB).**
   `earth-blue-marble.jpg` 1.46 MB → WebP 2048px (~200–300 KB) o 1024px. `night-sky.png` 904 KB
   → JPG/WebP (~100 KB). `water`/`topology` PNG → WebP. Y servirlas desde Hostinger (br, mismo
   origen, sin latencia de unpkg). **Esto solo ya borra el "doble globo" y la mayor parte de la lentitud.**
2. **Cargar lo no-crítico DESPUÉS del primer render.** Solo `blue-marble` es crítica; diferir
   `night-sky`, `water`, `topology` (1.7 MB) a post-paint.
3. **Diferir echarts (269 KB) y fuse (24 KB).** No se usan para el globo. echarts → cargar al
   hacer scroll al dashboard (IntersectionObserver); fuse → cargar en la primera búsqueda de banda.
   Desbloquea el init del globo.
4. **Auto-hostear las 4 libs CDN + `world-atlas`** en Hostinger (br + HTTP/2 + mismo origen) para
   matar DNS/TLS/latencia de 3ros (unpkg/jsdelivr pueden ir lentos y unpkg no comprime imágenes).
5. **(Menor) Reducir familias de fuentes** de 9 a las que de verdad se usan, o cargar las
   decorativas (Pirata One, New Rocker, etc.) bajo demanda.

> Con esto, el arranque pasaría de **~4.0 MB** a estimado **<1 MB**, casi todo comprimido y
> mismo-origen, y el globo NASA aparecería de una sin el parpadeo clásico→NASA.

---

# RESULTADO de la optimización (aplicada 2026-06-16)

| Cambio | Detalle |
|--------|---------|
| **A. Texturas → WebP auto-hosteadas** | Las 4 texturas NASA pasaron de unpkg (jpg/png, 4096px, 3.1 MB) a `web/assets/textures/*.webp` a **2048px** (decisión del usuario: el globo nunca se ve >800px, así que 2048 es visualmente idéntico). Total **549 KB** (-82%). blue-marble q90 341KB, night-sky q85 96KB, water q88 53KB, topology q88 59KB. |
| **B. Solo lo crítico en 1er render** | `ensureRealEarth` ahora hace el swap a la Tierra NASA en cuanto llega **solo `blue-marble`** (341 KB). `water` (specular) y `topology` (bump) se adjuntan después sin bloquear. `night-sky` también post-render. |
| **C. echarts + fuse diferidos** | `echarts` (269 KB) ya no carga en el arranque: helper `loadScriptOnce` + `IntersectionObserver` lo cargan cuando "El árbol del metal" entra al viewport, y recién ahí se crea `treeChart`. `fuse` (24 KB) se carga en la 1ra búsqueda de bandas (`SRC_BANDAS.ensure`). `updateTree`/`treeChart.resize` guardados para cuando aún no existe. |
| **D. Libs auto-hosteadas** | `three r128`, `topojson-client 3.1.0` (críticas, cargan ya) + `echarts 5.4.3`, `fuse 7.0.0` (diferidas) en `web/vendor/`. `world-atlas@2 countries-50m.json` en `web/assets/`. Mismas versiones, mismo origen (Brotli de Hostinger). |
| **E. Fuentes** | **Sin cambios, a propósito.** Las 6 familias "decorativas" alimentan el selector de fuente de títulos (feature). Con `display=swap` los navegadores **solo bajan el woff2 cuando la fuente se renderiza** → no se descargan en el arranque. Quitarlas daba ~0 de ahorro y rompía el picker. |

**Arranque: ~4.0 MB → ~0.95 MB a interactivo (-76%), ~1.16 MB ya asentado (con cielo+relieve diferidos).**
echarts y fuse fuera del arranque (bajo demanda). El doble-globo desaparece porque blue-marble (341 KB)
llega casi tan rápido como la Tierra clásica de canvas.

### Archivos nuevos (suben a `public_html`)
```
web/vendor/three.min.js, echarts.min.js, topojson-client.min.js, fuse.min.js
web/assets/countries-50m.json
web/assets/textures/earth-blue-marble.webp, night-sky.webp, earth-water.webp, earth-topology.webp
```

### Pendiente de validación REAL (navegador incógnito) — ver checklist del prompt
No se corrió en navegador real desde acá (sin Playwright). El usuario debe abrir incógnito y confirmar:
globo idéntico, sin parpadeo doble-globo, dashboard/búsqueda/radio/skins OK, y arranque <1 MB en Network.
