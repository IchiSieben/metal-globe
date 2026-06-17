# 🤘 ATLAS METALLUM — Prompt maestro para Claude Code

> **Cómo usar este archivo:** abre la carpeta del proyecto en VS Code con Claude Code
> y pégale TODO este documento como instrucción inicial. Adjunta también
> `atlas_metallum.html` (la maqueta del front) y `sondeo_metallum.py` (el script
> de descubrimiento). Claude Code debe leer este documento completo antes de escribir
> una sola línea, y seguir las fases en orden.

---

## 1. Qué estamos construyendo

Un **dashboard web público** que mapea las bandas de metal del mundo usando los datos de
**Encyclopaedia Metallum (metal-archives.com)**. Es a la vez una herramienta y una pieza
de portafolio (LinkedIn / Upwork), así que tiene que verse **brutal** y funcionar bien.

El front ya está prototipado (la maqueta `atlas_metallum.html` adjunta) y tiene:

- Un **globo terráqueo 3D** (three.js) que gira solo, con una **púa por país**
  cuya altura = nº de bandas. Botón para **pausar el giro** y seleccionar con calma.
- **Filtro bidireccional por género**: clic en un género → el globo apaga todo a plata
  y solo enciende en ámbar los países que tienen ese género.
- **Treemap de géneros** (ECharts), también clickeable.
- **Ficha por país** al hacer clic en una púa: bandera, nº de bandas, géneros dominantes,
  bandas emblemáticas, ciudades.

**Tu trabajo (Claude Code):** construir el **pipeline de datos real** que alimenta ese front,
conectarlo, y dejarlo listo para publicar. Hoy el front usa datos de muestra (mock); hay que
reemplazarlos por datos reales scrapeados de Metal Archives, **respetando el contrato de datos**
(sección 5) para que el front siga funcionando sin tocarlo.

---

## 2. La fuente: Encyclopaedia Metallum — qué SÍ sale y qué NO

Esto es clave para no perder tiempo buscando en MA cosas que no están ahí.

### NO hay API oficial — pero sí endpoints AJAX internos (JSON)
La web carga sus tablas con endpoints AJAX que devuelven JSON limpio. Son, en la práctica,
una API no documentada. **No uses** las APIs de terceros que vas a encontrar googleando
(wemakesites, martinivanov, MetalAPI) — están muertas o sin mantener.

### ✅ DE METAL ARCHIVES SÍ sale:
- Nombre de la banda, **país de origen**, **ciudad/región** (campo "location", texto libre)
- **Género** (texto libre compuesto, ej. `Melodic Death Metal`, `Symphonic Black Metal/Folk Metal`)
- **Status** (Active / Split-up / On hold / Changed name / Unknown)
- Año de formación, año de los álbumes
- **Discografía** completa
- **Line-up** (miembros actuales y pasados, con instrumentos)
- Reseñas, logo de la banda, a veces foto de banda
- ID interno de banda (lo necesitas para enriquecer; va en la URL `/bands/Nombre/{id}`)

### ❌ DE METAL ARCHIVES NO sale (hay que traerlo de otro lado):
- **Banderas** → se generan del código ISO (ver sección 7). MA no las da.
- **Coordenadas lat/lng** → MA da solo texto ("Bergen, Norway"). Hay que **geocodificar** (sección 8).
- **Spotify / enlaces de streaming** → Spotify Web API (fase futura). MA no enlaza a Spotify.
- **Fotos individuales de cada miembro** → inconsistente; a veces hay foto de banda, no de cada músico.
- **Fechas de conciertos** → MA no las tiene.

> **Respuesta directa a "¿de ahí sacamos toda la información?":** casi toda la que importa para
> este dashboard (país, ciudad, género, status, bandas, miembros, discografía) SÍ sale de MA.
> Banderas, coordenadas y Spotify son complementos externos baratos. No te quedes esperando que
> MA te dé banderas o lat/lng — no las tiene.

### Endpoints concretos

**(a) Bandas por país** — la mina de oro para el agregado:
```
GET https://www.metal-archives.com/browse/ajax-country/c/{ISO}/json/1/
    ?sEcho=0&iDisplayStart={offset}&iDisplayLength=500
```
- `{ISO}` = código de 2 letras (NO, SE, US, PE…). La lista completa está en `/browse/country`.
- `sEcho=0` es OBLIGATORIO: si va vacío, MA devuelve JSON inválido.
- `iDisplayLength` máximo **500** por request. Pagina subiendo `iDisplayStart` de 500 en 500
  hasta cubrir `iTotalRecords` (que viene en cada respuesta).
- Respuesta: `{ "iTotalRecords": N, "aaData": [ [col0, col1, col2, col3], ... ] }`.
  Cada fila es un **array**, no un objeto. La estructura típica de columnas para browse-por-país es:
  `[ <a href=".../bands/Nombre/ID">Nombre</a>, Género, Ciudad/Región, Status ]`
  **PERO no lo des por hecho** — ejecuta `sondeo_metallum.py` primero (fase 0) e imprime las filas
  crudas para confirmar qué columna es qué antes de escribir el parser.

**(b) Bandas por letra** (alternativa / verificación cruzada):
```
GET https://www.metal-archives.com/browse/ajax-letter/l/{letra}/json/?sEcho=0&iDisplayStart=N&iDisplayLength=500
```

**(c) Página individual de banda** (fase 3, enriquecer): la página `/bands/Nombre/{id}` y sus
sub-llamadas AJAX dan line-up, discografía y reseñas. Para esto considera usar la librería
**`enmet`** (`pip install enmet`), que ya envuelve el scraping de bandas individuales:
```python
import enmet
b = enmet.search_bands(name="Mayhem")[0]
b.discography, b.lineup, b.country, b.genres   # etc.
```
Para el **barrido agregado** (fase 1) los endpoints AJAX directos son más rápidos que enmet;
usa enmet solo para enriquecer bandas puntuales (fase 3).

### ⚠️ Reglas técnicas y de cortesía (NO negociables)
Metal Archives es un sitio **comunitario sin fines de lucro** y **banea scrapers agresivos**.
Respeta esto o te bloquean la IP:
- **User-Agent de navegador real** en todas las requests (no el default de `requests`).
- **Delay de 1.5–3 s entre requests.** Nada de hammering.
- **Backoff exponencial** ante HTTP 429 / 503 (espera, reintenta, hasta N veces).
- **Cachea TODO** en disco (`data/cache/`). Si ya bajaste un país, no lo vuelvas a pedir.
- Usa una sola `requests.Session()` reutilizada.
- Encoding: MA a veces declara mal el charset — fuerza `res.encoding = "utf-8"` y guarda con `utf-8-sig`.
- Atribuye la fuente en el footer del dashboard ("Datos: Encyclopaedia Metallum").

---

## 3. Estrategia: data barata vs data cara

- **Barato (~15 min):** metadata agregada por país (nombre, género, ciudad, status). Sale directo
  del endpoint browse-por-país. Con esto ya tienes el globo + treemap + conteos + fichas básicas.
  → **Esto es la Fase 1 y es el MVP. Priorízalo.**
- **Caro (decenas de horas):** entrar a cada banda individual (line-up, discografía). **NO** lo hagas
  para las ~198.000 bandas. Solo para las **top-N por país** (fase 3), o bajo demanda.

---

## 4. Estructura del proyecto

Crea esta estructura. Los `.py` los escribes tú (Claude Code) guiándote por este documento.

```
atlas-metallum/
├── README.md                      # explica el proyecto y cómo correrlo
├── requirements.txt               # requests, beautifulsoup4, pandas, enmet (opc.)
├── scraper/
│   ├── sondeo.py                  # (ADJUNTO como sondeo_metallum.py) descubre estructura — FASE 0
│   ├── paises.py                  # lista de países (ISO + nombre) desde /browse/country
│   ├── scrape_paises.py           # barrido agregado por país → data/bands_raw.csv  (FASE 1)
│   ├── parse_generos.py           # normaliza género compuesto → géneros raíz + subgéneros (FASE 1)
│   ├── geocode.py                 # ciudad/país → lat/lng (Nominatim, cacheado)        (FASE 1)
│   ├── enrich_bandas.py           # top-N bandas por país: line-up, etc. (enmet)       (FASE 3)
│   └── build_atlas_json.py        # ensambla todo → web/data/atlas_data.json
├── data/
│   ├── cache/                     # HTML/JSON crudo cacheado (NO sube al repo)
│   ├── geocode_cache.json         # cache de coordenadas (SÍ sube, ahorra requests)
│   └── bands_raw.csv              # bandas crudas scrapeadas
├── web/
│   ├── index.html                 # (ADJUNTO como atlas_metallum.html) el front
│   └── data/
│       └── atlas_data.json        # lo que el front consume (generado por build_atlas_json)
└── .gitignore                     # ignora data/cache/ y archivos pesados
```

> Nota: el `.html` adjunto trae los datos mock embebidos en una constante `PAISES`.
> En la fase 2 hay que cambiarlo para que haga `fetch('data/atlas_data.json')` en vez de usar el mock.

---

## 5. Contrato de datos — `web/data/atlas_data.json`

Este es el formato que el front consume. **Respétalo exactamente** y el front sigue funcionando.

```json
{
  "meta": {
    "generado": "2026-06-13T05:00:00Z",
    "total_bandas": 198480,
    "total_paises": 152,
    "fuente": "Encyclopaedia Metallum"
  },
  "generos_globales": [
    { "nombre": "Death", "total": 41230, "subgeneros": ["Melodic Death", "Brutal Death", "Technical Death"] },
    { "nombre": "Black", "total": 38110, "subgeneros": ["Symphonic Black", "Atmospheric Black", "Depressive Black"] }
  ],
  "paises": [
    {
      "code": "NO",
      "name": "Noruega",
      "lat": 60.5,
      "lng": 8.5,
      "total": 2900,
      "g": { "Black": 1700, "Death": 400, "Doom": 300, "Folk": 300 },
      "ciudades": [ { "nombre": "Bergen", "bandas": 210 }, { "nombre": "Oslo", "bandas": 380 } ],
      "top_bandas": [
        { "nombre": "Mayhem", "id": "67", "genero": "Black Metal", "ma_url": "https://www.metal-archives.com/bands/Mayhem/67" }
      ]
    }
  ]
}
```

Mapeo al front actual: el array `paises` corresponde 1:1 con la constante `PAISES` de la maqueta.
Campos que el front YA usa: `code, name, lat, lng, g{}, ciudades, top_bandas (→ "bandas")`.
- En el mock las ciudades son strings y las bandas son strings; en el JSON real son objetos.
  Ajusta el front para leer `.nombre` (mínimo cambio) — o, si prefieres no tocar el front,
  emite `ciudades` como array de strings y `bandas` como array de strings. **Tú decides, pero documenta cuál elegiste.**

---

## 6. Parsing de géneros y subgéneros — (esta parte es tu fuerte, IchiSieben)

El campo género en MA es **texto libre compuesto**, igual de sucio que las descripciones de
SUNAT. Ejemplos reales:
- `Melodic Death Metal`
- `Symphonic Black Metal/Folk Metal`
- `Black Metal (early); Ambient (later)`
- `Technical Death Metal, Progressive Metal`
- `Doom/Death Metal`

**Esto es ANÁLOGO a tu clasificador de marcas de SUNAT** (separadores `//` y `/`, notas entre
paréntesis, normalización de acentos, stopwords). **Reusa esa lógica.** El trabajo:

1. **Quitar notas temporales:** `(early)`, `(later)`, `(mid)`, `(as X)` → elimínalas.
2. **Separar** por `,`, `/`, `;` en sub-géneros individuales.
3. **Quitar la palabra "Metal"** del final de cada token para normalizar.
4. **Mapear cada token a un GÉNERO RAÍZ** para el globo (el filtro usa raíces), conservando
   el subgénero completo para el drill-down.

Lista de **géneros raíz** sugerida (ajústala con lo que veas en la data):
`Black, Death, Thrash, Heavy, Power, Doom, Speed, Folk, Symphonic, Progressive, Grindcore,
Sludge, Gothic, Groove, Industrial, Metalcore, Deathcore`

Regla de mapeo a raíz: busca la palabra clave dentro del token.
`"Melodic Death" → Death`, `"Symphonic Black" → Black`, `"Atmospheric Sludge/Doom" → Sludge + Doom`.
Una banda puede contar para **varias raíces** (cuenta en cada una). Decide si para el "total país"
cuentas la banda una sola vez (recomendado para `total`) y por separado en cada raíz dentro de `g{}`.

Salida del parser:
- `g{}` por país: conteo de bandas por género raíz (para el globo y el filtro).
- `generos_globales`: conteo por raíz a nivel mundial + lista de subgéneros más comunes (para el treemap y futuro drill-down de subgéneros).

---

## 7. Banderas — de dónde salen

MA **no** da banderas. Dos caminos (la maqueta ya implementa el primero con fallback al segundo):

1. **flagcdn.com** (recomendado para producción): SVG de banderas por código ISO, gratis, sin API key:
   `https://flagcdn.com/{iso_minuscula}.svg` → ej. `https://flagcdn.com/no.svg`.
   Se ven bien en Windows y en tu hosting.
2. **Emoji de bandera** (fallback offline): se derivan del ISO-2 con "regional indicator symbols".
   Cero requests. ⚠️ Ojo: **Windows no renderiza emoji de banderas** (muestra las 2 letras del código),
   por eso flagcdn es mejor como opción primaria para ti.

La maqueta usa `<img src="flagcdn…" onerror="→ emoji">`, así que en tu hosting se ven las SVG.
No necesitas scrapear nada de banderas.

---

## 8. Geocoding (ciudad/país → lat/lng)

El globo necesita coordenadas; MA solo da texto. Opciones:
- **Simple (recomendado para MVP):** usa el **centroide de cada país** (una tabla ISO→lat/lng fija,
  ~250 filas, hay datasets públicos). Una sola coordenada por país. Suficiente para el globo.
- **Detallado (fase futura):** geocodifica cada **ciudad** con **Nominatim (OpenStreetMap)**:
  `https://nominatim.openstreetmap.org/search?q={ciudad},{pais}&format=json&limit=1`.
  Rate limit **1 req/seg**, manda User-Agent identificable, y **cachea en `geocode_cache.json`**
  (las ciudades no cambian de lugar; geocodifica una vez y reusa para siempre).

Para el MVP, centroides de país. Las ciudades de la ficha pueden mostrarse sin coordenadas propias.

---

## 9. El front-end (maqueta adjunta)

`atlas_metallum.html` ya está hecho y validado. Tu tarea sobre el front:

1. **Conectar al JSON real:** reemplaza la constante `PAISES` (mock) por
   `const PAISES = (await fetch('data/atlas_data.json')).paises;` (envuelto en un init async),
   manejando estado de carga y error en la voz del producto (no "undefined", sino "Cargando el atlas…"
   y, si falla, "No se pudo cargar la data — reintenta").
2. **No rompas el contrato:** el resto del código (globo, filtro, treemap, fichas, botón pausa,
   banderas) depende de la forma de `PAISES`. Mantén los nombres de campo.

Mejoras de profundidad sugeridas (en orden de valor para portafolio):
- **Ranking Top-10 países** por nº de bandas (lista lateral o sobre el globo).
- **Buscador**: escribir un país o banda y que el globo enfoque / la ficha se abra.
- **Drill-down de subgéneros**: clic en un género raíz → desglose de sus subgéneros (treemap nivel 2).
- **Enlace a la página MA** de cada banda en la ficha (usa `ma_url`).
- **Per-cápita**: KPI "país más metalero por habitante" (requiere tabla de población — dataset público).
- **(Futuro) Spotify**: embed del top track de cada banda (Spotify Web API).
- **(Futuro) Globo de puntos** estilo "dot globe" en vez de wireframe, para otro look.

---

## 10. Fases de ejecución (sigue este orden)

**FASE 0 — Descubrimiento.** Ejecuta `sondeo_metallum.py`. Confirma que el endpoint responde,
cuántas bandas hay en un país (Perú) y, sobre todo, **la estructura real de columnas**.
Ajusta los parsers a lo que veas. No avances hasta confirmar esto.

**FASE 1 — Agregado (MVP).**
1. `paises.py`: obtén la lista ISO+nombre desde `/browse/country`.
2. `scrape_paises.py`: barre todos los países, paginando de 500 en 500, con delays y cache.
   → `data/bands_raw.csv` (columnas: banda, id, pais, ciudad, genero_raw, status).
3. `parse_generos.py`: normaliza `genero_raw` → géneros raíz + subgéneros (sección 6).
4. `geocode.py`: centroides de país.
5. `build_atlas_json.py`: ensambla → `web/data/atlas_data.json` (sección 5).
6. Conecta el front al JSON (sección 9.1). Verifica en el navegador que el globo carga data real.

**FASE 2 — Pulido.** Ranking, buscador, drill-down de subgéneros, enlaces MA. Revisa responsive y rendimiento.

**FASE 3 — Enriquecimiento (caro, selectivo).** `enrich_bandas.py`: para las top-N bandas por país,
trae line-up y discografía con `enmet`. Llena `top_bandas` con datos ricos.

**FASE 4 — Futuro.** Spotify, globo de puntos, per-cápita, museo 3D.

---

## 11. Criterios de aceptación

- [ ] `atlas_data.json` se genera con ~todos los países y conteos por género raíz.
- [ ] El front carga del JSON real (no del mock) y el globo se llena de púas correctas.
- [ ] El **filtro por género** funciona con data real (apaga el mundo, enciende los países del género).
- [ ] El **botón de pausa** detiene el giro y permite seleccionar con precisión.
- [ ] Las **fichas** muestran bandera (flagcdn), géneros dominantes, bandas y ciudades.
- [ ] El scraper **respeta rate limits**, **cachea**, y no re-scrapea lo ya bajado.
- [ ] Footer atribuye la fuente a Encyclopaedia Metallum.

---

## 12. Publicación (hosting público)

El dashboard es **100% estático** (HTML + JS + un JSON). Para que cualquiera lo vea por una URL:
- **GitHub Pages** (gratis): sube `web/` y actívalo. O súbelo a **tu propio hosting**.
- **Actualización periódica (opcional):** un workflow programado regenera el JSON cada cierto
  tiempo y lo publica. La metadata agregada casi no cambia (las bandas se suman de a poco), así que
  **semanal o mensual basta** — no hace falta diario. Si prefieres, corre el scraper a mano cada
  tanto y subes el JSON nuevo; ambas formas valen. Decide según lo que te sea más cómodo.

---

## 13. Comandos base

```bash
python -m venv .venv && source .venv/bin/activate   # (Windows: .venv\Scripts\activate)
pip install -r requirements.txt    # requests beautifulsoup4 pandas  (enmet opcional)

python scraper/sondeo.py                 # FASE 0 — confirma estructura
python scraper/scrape_paises.py          # FASE 1 — barrido (tarda; respeta delays)
python scraper/parse_generos.py
python scraper/geocode.py
python scraper/build_atlas_json.py       # genera web/data/atlas_data.json
# abrir web/index.html en el navegador (o servir con: python -m http.server -d web)
```

---

### Resumen de una línea para Claude Code
Construye el pipeline `scrape → parse géneros → geocode → atlas_data.json`, respetando los rate
limits de Metal Archives y el contrato de datos de la sección 5, y conecta la maqueta `index.html`
a ese JSON. Empieza por la FASE 0 (sondeo) y no asumas la estructura de columnas: confírmala.
