# 🚀 Prompt de arranque para Claude Code — Atlas Metallum

> **Cómo usarlo (lo más limpio):** en el terminal de Claude Code, escribe:
> *"Lee `PROMPT_PARA_CLAUDE_CODE.md` y `MASTER_PROMPT_claude_code.md` completos y
> empieza a ejecutar el proyecto siguiendo ambos. Hazme primero el plan."*
> (O pega directamente el contenido de abajo.)

---

Estás en el proyecto **Atlas Metallum**. Antes de escribir una sola línea, **lee estos tres archivos**
de la carpeta y trátalos como tu base:

- **`MASTER_PROMPT_claude_code.md`** — la especificación completa: fuente de datos (Metal Archives),
  endpoints AJAX, reglas de rate-limiting, contrato de datos (`atlas_data.json`), parsing de
  géneros/subgéneros, geocoding, fases y criterios. **Es tu biblia. Síguela al pie.**
- **`atlas_metallum.html`** — el front actual (maqueta funcional con globo 3D, filtro por género,
  treemap, fichas, botón de pausa y banderas). Es tu punto de partida visual.
- **`sondeo_metallum.py`** — el script de descubrimiento (Fase 0).

## Cómo quiero que trabajes (modo agéntico, iterando sobre ti mismo)

1. **Hazte un plan (todo list) y muéstramelo** antes de empezar.
2. **Trabaja por fases verificables** (las del MASTER_PROMPT). No pases de fase sin probar la anterior.
3. **Después de cada entregable, pruébalo de verdad**: corre el script, valida el JSON generado,
   levanta el HTML con un server local (`python -m http.server -d web`) y revísalo en el navegador.
   Inspecciona la consola por errores. Si puedes capturar screenshots o leer el DOM, hazlo.
4. **Auto-critícate contra los criterios de aceptación.** Si algo quedó feo, lento, roto, o el
   scraper se está haciendo botar, **diagnostícalo y vuelve a intentar con otro enfoque**. No te
   quedes en la primera versión — itera sobre tu propio resultado hasta que esté óptimo.
5. **Respeta SIEMPRE los rate-limits de Metal Archives** (delays 1.5–3 s, cache en disco, backoff en
   429/503). Si empiezan a botar tus requests, **baja el ritmo, no lo subas**. Cachea todo lo bajado.
6. **Lo técnico, resuélvelo tú.** Solo pregúntame cuando dependa de una decisión no técnica
   (preferencia de diseño, qué priorizar, dónde publicar).

## Mejora importante respecto a la maqueta: ZOOM GEOGRÁFICO PROGRESIVO

La maqueta tiene el globo con púas, pero quiero subir el nivel: un **globo terráqueo navegable con
detalle creciente según el zoom**, en tres niveles:

1. **Planetario** — globo completo girando, una púa por país (altura = densidad de bandas). Como ahora.
2. **Continental** — al acercar el zoom (rueda) o clic en una región, la **cámara vuela suave** hacia
   ese continente; aparecen los **nombres de los países** y el detalle sube.
3. **País** — al seguir acercando o clic en un país, se **centra en él**, muestra su ficha (bandas,
   géneros, ciudades) y, si hay data, sus ciudades como puntos sobre el mapa.

Requisitos del globo:

- **Dibuja las fronteras reales de continentes y países sobre la esfera — NO inventes coordenadas.**
  Carga un TopoJSON/GeoJSON real de países (ej. world-atlas `countries-110m`, o `50m` para más
  detalle al hacer zoom) y proyéctalo sobre la esfera (convierte cada vértice lat/lng a XYZ con la
  misma fórmula que ya usa la maqueta). Para lograrlo puedes **construir sobre el three.js actual**,
  o **evaluar `three-globe` / `globe.gl`** (librerías sobre three.js que ya traen polígonos de países,
  barras, labels y navegación con zoom). **Elige lo que se vea mejor y más fluido — pruébalo y decide
  iterando.** Si migras a `three-globe`, hazlo conservando todo lo de abajo.
- **PRESERVA la estética y las features actuales** (esto es aditivo, no las sacrifiques):
  paleta metal (negro obsidiana / plata fría / dorado viejo / fuego ámbar-rojo), tipografía
  (Cinzel + Oswald + mono), **púas incandescentes**, **filtro por género bidireccional**
  (clic en género → apaga el mundo, enciende los países del género), **treemap** (ECharts),
  **fichas de país**, **botón de pausa del giro** y **banderas** (flagcdn con fallback a emoji).
- **Transiciones de cámara suaves** (tween/easing), nunca saltos bruscos.
- Mantén un botón / gesto para **volver a la vista planetaria** desde cualquier nivel.

## GitHub Actions — SÍ, inclúyelo

Crea `.github/workflows/refresh.yml`: scrape completo **programado mensual** (`schedule` con cron) +
`workflow_dispatch` (botón para correrlo manual). Que ejecute el pipeline completo y publique el
`atlas_data.json` actualizado (commit al repo, o deploy a GitHub Pages). En el README explica cómo
activarlo y cómo publicar el sitio. Recuerda: el cron de GitHub corre en UTC y puede retrasarse
5–30 min; para este caso no importa porque no es time-critical.

## Está listo cuando (criterios de parada)

- [ ] El pipeline genera `web/data/atlas_data.json` real con ~todos los países y conteos por género raíz.
- [ ] El front carga del JSON real (ya no del mock embebido).
- [ ] El globo tiene **fronteras de países**, y el **zoom progresivo** planetario → continente → país
      funciona fluido, conservando todas las features de la maqueta.
- [ ] Filtro por género, treemap, fichas, botón de pausa y banderas funcionan con data real.
- [ ] El scraper respeta rate-limits y cachea (no re-scrapea lo ya bajado).
- [ ] Existe el workflow de GitHub Actions y el README explica cómo correrlo y publicar.
- [ ] El footer atribuye la fuente a Encyclopaedia Metallum.

---

**Arranca por la Fase 0:** corre `sondeo_metallum.py`, confírmame la estructura real de columnas,
muéstrame el plan, y dale. Itera hasta que quede brutal.
