# La Forja del Metal — Capa 0 (datos de genealogía)

Atlas interactivo de la **evolución del metal**: de dónde vino, cómo se ramificó y a
dónde llegó. Pensado para que un fan profundice y un novato se culturice.

Esta carpeta (`data/genealogia/`) es **data NUEVA y autónoma**. No modifica nada del
sitio: el globo, la radio, los paneles y el dashboard siguen intactos. Se construye
**por capas, una a la vez**.

## Roadmap por capas
- **Capa 0 (esto):** documento de DATOS de genealogía. El "guion".
  - `generos.json` — datos estructurados (el corazón; conectado por `id`).
  - `genealogia.md` — narrativa legible por era (texto de las futuras fichas).
  - `README.md` — esta visión + roadmap.
- **Capa 1 (futuro):** grafo de nodos interactivo de los géneros.
- **Capa 2 (futuro):** rutas que linkean cada nodo → el globo (filtra ese género/bandas).
- **Capa 3 (futuro):** arte ilustrado 2D encima (pergamino, luego con relieve).
- **Capa 4 (futuro):** timeline por décadas (60s → hoy).

El JSON ya está diseñado para esas capas: ids estables, todo conectado por id.

## `generos.json` — esquema
Array de objetos. Cada objeto = un género, subgénero o influencia externa.

| campo | tipo | nota |
|------|------|------|
| `id` | string | **snake_case ASCII** (sin acentos ni espacios). Id estable e interno; se usa en `genero_padre`, `origenes_estilisticos`, `formas_derivadas`. |
| `nombre_es` / `nombre_en` | string | nombre legible (es/en). |
| `tipo` | enum | `raiz` \| `subgenero` \| `influencia_externa`. |
| `en_globo` | bool | `true` si es un género que el sitio puede filtrar (linkeable a bandas). |
| `id_sitio` | string\|null | **puente de linkeo de la Capa 2.** Si `en_globo:true`, es el STRING EXACTO del sitio (con mayúsculas/acentos/espacios: `"Death"`, `"Melodic Death"`, `"Death (clásico)"`). Si `en_globo:false`, `null`. |
| `id_sitio_alias` | array (opcional) | OTROS labels EXACTOS del sitio que mapean al MISMO género (el sitio cross-lista un género bajo varias raíces). Capa 2 debe linkear `id_sitio` **y** todos los `id_sitio_alias` al mismo nodo. Ausente o `[]` = sin alias. Ej.: `viking_black` tiene `id_sitio:"Viking Black"` y `id_sitio_alias:["Viking"]`. |
| `genero_padre` | id\|null | id de la raíz si es subgénero; `null` si raíz o influencia. |
| `decada_origen` | string | ej. `"1980s"`, `"late 1960s"`. |
| `anio_aprox` | número\|null | `null` cuando no hay fuente verificable de un año exacto (ver "Notas de datos"). |
| `paises_origen` | array ISO-2 | `[]` si la fuente no nombra países codificables. |
| `escenas` | array | escenas/ciudades/regiones tal como las lista la fuente. |
| `origenes_estilisticos` | array de ids | de qué nació (ids que existen en el array). |
| `formas_derivadas` | array de ids | qué derivó de él (ids que existen en el array). |
| `bandas_seminales` | array | editorial; solo bandas que la fuente nombra como pioneras. |
| `descripcion` | string | 2-3 frases en palabras propias. |
| `fuentes` | array de URLs | respaldan los datos de ESE nodo. |
| `confianza` | enum | `alta` \| `media` \| `baja`. |

### Convención de id (decidida)
- `id`: snake_case ASCII. Regla de derivación desde el nombre: minúsculas, sin acentos
  (á→a, ñ→n), espacios y signos → `_`, sin paréntesis. Ej.: `"Death (clásico)"` →
  `death_clasico` (con `id_sitio` = `"Death (clásico)"`).
- Si dos etiquetas del sitio colapsaran al mismo snake_case, se diferencian con sufijo
  y se reporta. (En la Tanda 1 no hubo colisiones.)

## Fuentes (orden de prioridad)
1. **Fichas de Wikipedia por género** — backbone. Campos del infobox: *Stylistic
   origins* → `origenes_estilisticos`; *Derivative forms/Subgenres/Fusion* →
   `formas_derivadas`; *Cultural origins* → década + países; *Regional scenes* → escenas.
2. **boundbymetal — Interactive Metal Genres Graph**
   (https://www.boundbymetal.com/en/common/metal-genres-graph) — referencia de fechas.
3. **Ian Christe, _Sound of the Beast: The Complete Headbanging History of Heavy Metal_**
   (2003) — bibliografía de referencia. Se **cita, nunca se reproduce** su texto.
4. Para profundizar: bibliografía académica en https://metalstudies.org/biblio

## Notas de datos (honestidad de fuentes)
- **`anio_aprox` está en `null` en toda la Tanda 1.** Los infoboxes de Wikipedia dan
  *décadas*, no años exactos, y el grafo de boundbymetal es interactivo (JS): no expone
  el año por género en texto verificable. La información temporal vive, por ahora, en
  `decada_origen` (sí respaldada). Los años exactos se completarán cuando se extraigan
  de una fuente verificable (p. ej. el grafo interactivo, nodo por nodo).
- Distinción **hecho vs. interpretación**: década/países/orígenes/derivados salen del
  infobox (hecho citado); `bandas_seminales` es editorial y también se respalda con la
  misma ficha que nombra a esas bandas como pioneras.
- `confianza`: `media`/`baja` marcan campos incompletos o inferidos (p. ej. país no
  listado por la fuente, o artículo sin infobox). Está documentado en la `descripcion`.

## Estado
- **Capa 0 — COMPLETA: 84 nodos** (8 influencias externas + 17 raíces + 59 subgéneros).
  - Tanda 1: 17 raíces + 8 influencias.
  - Tanda 2: subgéneros de Black y Death (+ double-check de micro-combos).
  - Tanda 3: subgéneros de Folk, Doom, Thrash (+ campo `id_sitio_alias`).
  - Tanda 4: subgéneros de Heavy, Power, Groove, Grindcore, Progressive, Industrial,
    Gothic, Speed, Deathcore, Symphonic, Sludge, Metalcore.
- Cobertura: 84 de los 346 subgéneros del sitio con nodo o alias. Los ~262 restantes son
  micro-combos del sitio sin fuente dedicada (excluidos a propósito).
- Confianza: 37 alta · 44 media · 3 baja. `anio_aprox` = null en todos (ver "Notas de datos").
- Siguiente (fuera de Capa 0): Capa 1 (grafo de nodos), Capa 2 (linkeo al globo vía
  `id_sitio` + `id_sitio_alias`), Capa 3 (arte), Capa 4 (timeline / años exactos).
