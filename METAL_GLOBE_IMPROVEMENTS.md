# Metal Globe — improvement proposals

Proposals only. Nothing here is implemented; pick what you want and I'll build it.
Ordered by value per hour of work, not by how interesting it is.

Current state after the extraction commit: `index.html` 496 lines, `app.js` 3,025,
`styles.css` 898, vendor 1.6 MB, data 34 MB.

---

## 1. Finish the module split properly — L

**Why it stopped where it did.** `app.js` has 231 top-level statements interleaved with the
function declarations. A declaration hoists only inside its own script, so cutting the file by
theme reorders execution against those statements and the globe stops booting. The split is
real work, not a move.

**How to do it safely.** Convert to ES modules with explicit exports, one seam at a time,
re-running the pixel comparison after each:

| Module | Roughly | Depends on |
|---|---|---|
| `data.js` | `prepararDatos`, `subCount*`, `fusionar`, `totalesGlobales`, `joyasOcultas` | nothing (pure) |
| `globe.js` | three.js scene, textures, borders, pins, LOD | `data` for pin counts |
| `interaction.js` | picking, hover, `flyTo`, pointer handlers | `globe` |
| `ui-panel.js` | country/city sheet, band lists | `data`, `interaction` |
| `filters.js` | genre tokens, chips, combo KPI | `data`, `globe` |
| `search.js` | Fuse index, suggestions | `data` |
| `dashboard.js` | Last.fm ECharts panels | lazy, independent |

Start with `data.js`: it is pure, has no three.js dependency, and proves the harness works
before touching rendering. The mutable globals (`DATA`, `PAISES`, `state`) become a single
exported store object — that is the actual work, and where behaviour can drift.

**Guardrail:** the screenshot comparison from the extraction commit, masking the globe canvas,
catches any regression outside the 3D view. Keep it as a script and run it per step.

## 2. Ship the opening tutorial — S

The brief makes it mandatory (rule 2.2) and Metal Globe has none — the entry animation is not
onboarding. `Portfolio/shared/tutorial/` is built and already running on Botánica; wiring it
here is copying two files into `web/` and writing 5 steps.

Suggested steps: what the globe shows (195,679 bands, 153 countries) → drag/zoom → click a
country for its sheet → the genre filter → the treemap. Targets already have stable ids.

## 3. Cut first paint — M

`bands_index.json` is **6.2 MB**. If it loads before first render, that dominates time-to-globe
on a Lima connection. Worth measuring first, then:

- Load the globe from `atlas_data.json` (964 KB) alone; fetch `bands_index.json` only when a
  country sheet actually opens. Per-country files under `data/admin1/` already work this way,
  so the pattern exists.
- `echarts.min.js` is **1.02 MB** of the 1.6 MB vendor bundle and is only needed for the
  dashboard. `loadScriptOnce` already exists — defer it until the dashboard opens.
- Serve `.json` gzipped. 34 MB of JSON compresses very well; this is a server config line, not
  code.

Expected: first meaningful paint on the globe without the 6.2 MB index or the 1 MB chart lib.

## 4. Remove the last external dependency — S

`flagcdn.com` is fetched for country flags (around line 1656 of the original). Everything else
is vendored. One third-party host is one thing that can break the demo, slow it down, or log
visitors. Options: bundle the ~153 flags as a sprite sheet (small at 40px wide), or drop to
emoji flags, or inline the few dozen actually shown.

`forja.html` separately pulls **Leaflet from unpkg**. It is a standalone curation tool, not part
of the demo — decide whether it ships at all. If it does, vendor Leaflet too.

## 5. Data honesty pass — S

Same discipline applied to Botánica. The counts come from a scrape of Encyclopaedia Metallum,
and the page should say what that means: when the snapshot was taken, that "bands per country"
is the band's registered country rather than where members live, and how unknown/multiple
countries are handled. One short methodology note raises credibility more than another chart.

## 6. Make the treemap and globe agree — M

Right now the genre treemap and the globe are two views of one dataset that a visitor has to
mentally join. Selecting a genre in the treemap could drive the globe's spike colouring
directly, and vice versa. That is the interaction that makes the demo memorable in 30 seconds —
currently the strongest unrealised idea in the project.

## 7. Accessibility floor — S

A 3D globe will not be fully accessible, but the surrounding UI can be: keyboard focus on the
genre list and country sheet, `aria-live` on the count that updates when filters change, and a
text fallback listing top countries. Recruiters do run automated checks.

---

## Not recommended

- **Rewriting in React/Three-fiber.** The vanilla implementation works, is fast, and is
  differentiating precisely because it has no framework. Rewriting spends the budget on
  something the visitor cannot see.
- **Server-side anything.** Rule 7 of the brief is zero variable cost. The lazy per-country
  fetches already give the feel of an API without one.
- **More data.** 195,679 bands is already past the point where more rows add credibility.
  Effort goes further into explaining what is there.
