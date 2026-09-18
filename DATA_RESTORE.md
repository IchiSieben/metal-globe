# DATA_RESTORE — Metal Globe

Respaldo de la **data pesada scrapeada** que NO vive en git (está en `.gitignore`).
Drive es solo estacionamiento: los scripts leen `data/` local, no hay integración
Drive↔editor ni hace falta.

---

## Qué contiene `metal-globe-data.zip`

| Archivo | Ruta destino (relativa a la raíz del repo) | Tamaño aprox | Qué es |
|---|---|---|---|
| `bands_raw.csv` | `data/bands_raw.csv` | ~27 MB | Scrape original de Metal Archives (base de 195,679 bandas). |
| `lastfm_metrics.jsonl` | `data/lastfm/lastfm_metrics.jsonl` | ~22 MB | Barrido Last.fm COMPLETO (195,679 bandas, métricas finales). |
| `bands_enriched.jsonl` | `data/metallum/bands_enriched.jsonl` | ~7 KB | Prueba del re-scrape enriquecido de Metallum (parcial). |
| `mb_metrics.jsonl` | `data/musicbrainz/mb_metrics.jsonl` | ~220 KB | Barrido MusicBrainz PARCIAL (parqueado; rate 1 req/s, lento de rehacer). |

El zip **preserva las rutas relativas** (`data/...`), así que al descomprimir en la
raíz del repo cada archivo cae exactamente en su sitio.

---

## Cómo restaurar

1. Descargar `metal-globe-data.zip` desde Drive.
2. Descomprimirlo **en la raíz del repo** (`C:\...\Metallum\`), conservando rutas.
   - Quedan en `data/bands_raw.csv`, `data/lastfm/...`, `data/metallum/...`, `data/musicbrainz/...`.
3. Listo. Los scripts de `scraper/` ya leen `data/` local.

---

## GeoNames — NO está en el zip (re-descargable)

`data/geonames/` es un dataset **público** de [geonames.org](https://www.geonames.org/),
no se respalda. Si hace falta, re-bajar estos mismos archivos y ponerlos en `data/geonames/`:

| Archivo | Fuente | Nota |
|---|---|---|
| `cities500.zip` / `cities500.txt` | https://download.geonames.org/export/dump/cities500.zip | Ciudades de >500 hab (mundial). Descomprimir el .zip da el .txt. |
| `PE.zip` / `PE.txt` | https://download.geonames.org/export/dump/PE.zip | Dump completo de Perú (todas las localidades). |
| `admin1_10m.geojson` | Natural Earth (admin-1, 1:10m) | Fronteras de regiones/estados, alta resolución. |
| `admin1_50m.geojson` | Natural Earth (admin-1, 1:50m) | Misma capa, menor resolución. |
| `readme.txt` | viene en los dumps de GeoNames | Documentación de columnas. |

---

## ⚠️ Importante

- Estos archivos están en `.gitignore` **a propósito** — NO subir a git.
- `metal-globe-data.zip` también está gitignoreado (no se cuela al repo).
- Drive = solo respaldo manual. El upload lo haces tú arrastrando el zip al navegador.
