# Metal Globe — improvement proposals

Proposals only. Nothing here is implemented; pick what you want and I'll build it.
Ordered by value per hour of work, not by how interesting it is.

Current state after the extraction commit: `index.html` 496 lines, `app.js` 3,025,
`styles.css` 898, vendor 1.6 MB, data 34 MB.

---

## 0. Genre x country filtering — THE #1 user request

Users ask for this more than anything else: *"black metal + death metal in Peru"*. The current
genre selector makes it possible but tedious, and it is the single interaction most likely to
decide whether someone stays on the page.

The data already supports it — `subCountPais` and `filterMatchCount` compute exactly these
intersections, and the combine toggle (OR / AND) exists. **The gap is UI, not data.**

### Approach A — Filter bar over the globe · M

A persistent horizontal bar: selected genres as removable chips, an OR/AND toggle, and a live
count ("3 214 bandas · 41 países"). Clicking a country adds it as another chip, so
country and genre become the same kind of token in one query.

- **For:** one mental model, visible current state, shareable via URL params, and it survives
  on mobile where the current side panel does not.
- **Against:** takes vertical space from the globe, which is the hero.
- **Effort:** medium. Reuses the existing filter engine; the work is the bar, the chip state
  and URL sync.

### Approach B — Genre treemap as the control · M-L

Make the treemap that already sits beside the globe the selector: click a genre to filter,
shift-click to add. The globe recolours to the selection and the treemap dims what is excluded.

- **For:** removes a whole UI instead of adding one, and turns two disconnected panels into one
  instrument. This is the same idea as item 6 and would subsume it.
- **Against:** discoverability — a treemap does not look clickable without an affordance. Needs
  a hint on first use, which the opening tutorial (item 2) can carry.
- **Effort:** medium-large. Touches the ECharts instance, the globe's colour ramp and the
  selection state at once.

### Recommendation

**A first, B second.** A is lower risk, fixes the complaint directly, and is testable on its
own. B is the better product but is a redesign of the page's core interaction — worth doing
once A has proven what people actually filter by.

Both need the URL to carry the selection (`?g=black,death&c=PE`), which is also what makes a
filtered view shareable — the same property just added to the hub's project grid.

## 1. Finish the module split — L, and harder than it looked

**Correction to the earlier assessment.** I previously wrote that the obstacle was 231
top-level statements interleaved with the function declarations. That was wrong, and the
attempt that proved it is worth recording.

`data.js` extracted cleanly (10 pure aggregation functions, committed, pixel-identical). The
same technique applied to the globe layer failed immediately: `ReferenceError: R is not
defined`, thrown by `ring()` called from `boot()`.

The reason is structural. **`function boot(DATA, esMock)` spans lines 220–2919 — 2,700 of
app.js's 2,955 lines, 91% of the file.** Its body is not indented, which is why a
column-zero scan read those lines as top-level. `const R`, `scene`, `camera`, `renderer`,
`globe` and the rest are **locals of `boot`**, and every render, interaction and UI function is
a **closure over them**. Moving any of those functions to another script severs the closure.

So the real work is not "cut the file into modules". It is:

1. **Break `boot()` open first.** Its locals need to become an explicit context object — a
   `scene` module owning `{renderer, scene, camera, globe, R, camDist}` — that the other
   modules receive rather than close over. Until that exists, no further extraction is possible.
2. Only then split render / interaction / UI, one at a time.

`data.js` worked precisely because those ten functions were the only ones already outside
`boot`, referencing genuine globals or their own arguments. It is not a template for the rest.

**Estimate revised:** this is a day of careful work with the pixel harness after every step, not
an afternoon. It is also the highest-leverage thing in the file — nothing else can be tested in
isolation while 91% of the code lives in one closure.

## 2. Ship the opening tutorial — S

The brief makes it mandatory (rule 2.2) and Metal Globe has none — the entry animation is not
onboarding. `Portfolio/shared/tutorial/` is built and already running on Botánica; wiring it
here is copying two files into `web/` and writing 5 steps.

Suggested steps: what the globe shows (195,679 bands, 153 countries) → drag/zoom → click a
country for its sheet → the genre filter → the treemap. Targets already have stable ids.

## 3. First paint — mostly already solved (measured, not assumed)

**This section was wrong when first written.** I proposed deferring `bands_index.json` and
ECharts; both claims came from a summary rather than from reading the loading code. Measured
on a 1440x900 viewport, served locally:

| | before | after |
|---|---|---|
| First load | 4.66 MB, 56 requests | **4.43 MB, 44 requests** |

What is actually true:

- **`bands_index.json` (5.9 MB), `search_index.json` and Fuse are already deferred** behind
  `ensure()`, loaded on first use of the band search. Nothing to do.
- **ECharts (1 MB) cannot be deferred.** `#am-tree` is the treemap beside the globe — above the
  fold by design — so its IntersectionObserver is firing correctly. I assumed it was misfiring
  against a pre-layout position, moved the observer to after `load` + rAF, measured no
  difference, and reverted.
- **Flags were the real win, and it is done**: `loading="lazy"` cut 12 requests and 230 KB.

**What is left, and it needs a decision rather than a patch:** `flagcdn.com` still serves
detail SVGs where a 24px-tall flag is drawn — `ec.svg` is 212 KB for something rendered smaller
than a favicon. Switching to flagcdn's raster sizes (`/w40/ec.png`) or vendoring a sprite would
cut most of the remaining 304 KB, but both change how flags rasterise, so neither is a
"no visual change" edit. See item 4.

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
