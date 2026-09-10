# Metamorph POC — what it is and what's in it

## 1. What this POC is

A **clickable, high-fidelity functional prototype** of Metamorph — an agentic metamorphic
testing framework for computer-vision models. It walks a viewer through the *entire* proposed
workflow, screen by screen, on real data, with every stage animated.

It is a **frontend demonstration**. The LLM, the InstructPix2Pix editor, the CLIP check and the
CV model under test are **deterministic mock services** — the transformed images and the
pass/fail outcomes are pre-computed offline. Nothing calls an API, needs a key, or needs the
internet at runtime. The point is to prove the *workflow, the data path and the user experience*,
not to ship the ML backend.

- **Stack:** React 18 + TypeScript + Vite + Tailwind, hash-routed SPA, ~220 KB gzip.
- **Deploy:** static — `vercel.json` is set up; `vercel --prod` or push-to-GitHub → Vercel.
- **Dataset:** 10 real street scenes + ground-truth boxes from **KITTI** (`nateraw/kitti`,
  Hugging Face, CC BY-NC-SA 3.0), pulled once and baked in.

---

## 2. Themes

Two named modes of **one** token-based design system, switched from the top-right of the header
and **persisted** across reloads (no flash on load).

| Theme | Character | Palette |
|---|---|---|
| **Dark** | computational / operational | near-black navy, cobalt `#5B9DFF`, teal, coral |
| **Warm Lab** *(default)* | analytical / research / engineering-notebook | warm parchment `#F5F1E8`, cream cards `#FBF9F3`, ink-navy text `#172033`, deep cobalt `#3157C8`, forest teal `#27846F`, burnt-coral warnings, deep-vermilion violations, warm-gray borders, faint blueprint dot-grid |

Every colour is a CSS custom-property token in `src/index.css` (`--bg`, `--surface`, `--border`,
`--text`, `--accent`, `--teal`, `--warn`, `--danger`, `--indigo` …); no component hard-codes a
hex. Both themes share the exact same layout, spacing and component hierarchy — only the token
values change. Colour is used for **state and hierarchy**, not decoration: teal = robust/pass,
coral = vulnerable/warning, vermilion = violation, cobalt = testing/execution, indigo = the
relation library.

---

## 3. The eight tabs

### Dashboard — analytics overview
- Title + one context-aware primary button (*Start run* / *Open testing* / *View report*).
- **Four stat tiles**, each a link, each with a mini sparkline and a coloured rail:
  *Iterations* `n/10` (cobalt), *Pass rate* `%` (teal), *Violations* `n` (coral),
  *Relation pool* `39` (indigo, "19 discovered").
- **Testing pipeline strip** — the 8 stages as a process diagram (icon nodes + thin
  connectors); nodes fill cobalt as they complete, the active node gets an emphasised ring.
  Clicking it opens the Testing tab.
- **Robustness by condition** — horizontal bars per transformation condition, coral for the
  weak ones, teal for the strong ones, percentage on the right.
- **Run summary** — a donut (passing % vs violations), *Most affected class*, *Weakest
  condition*, link to the full report.
- Empty before a run; fills in live as the run progresses.

### Test Setup — configure the run
- **Model** — "upload" a model file (simulated → `yolov8n_urban.pt`), and pick the task:
  Classification / Object Detection / Segmentation / Tracking (detection is the implemented one).
- **Dataset** — "upload" the dataset → shows the 10 KITTI thumbnails.
- **Domain description** — a free-text box ("*urban driving; pedestrians, cars, cyclists…
  robust to weather, lighting, camera, occlusion*") with a **Use example** button. As you type,
  a *Domain identified* panel appears — parsed label ("Autonomous driving") + the relevant
  conditions (weather · lighting · occlusion · camera · road environment).
- **Start Agentic Test** — enabled once model + dataset + domain are set.

### AI Analysis — baseline profiling & per-image analysis
- **Baseline model profile** — the model's metrics on the original dataset: mAP@0.5 0.91,
  Precision 0.90, Recall 0.88, Mean IoU 0.82, Avg. confidence 0.78; **per-class AP bars**
  (car 0.95, truck 0.92, cyclist 0.74, pedestrian 0.71 — weak classes flagged).
- **Initial failure profile** — the JSON the profiler produces
  (`weak_classes`, `common_failures`, `average_confidence`).
- **Domain identified** — label + conditions.
- **Scene analysis** for the current image — the image with detection boxes, the objects the
  model found, and a concise agent reasoning summary (no fake chain-of-thought).
- **Transformation selection** — the relation the agent picked for this image, its parameters,
  its expected-output relation, and *why* (from the failure profile + memory).

### MR Generation — relation discovery & validation
- **LLM Metamorphic Relation Discovery** context card: model type, domain, base library size
  (21), discovered count (19 · 1 rejected).
- **Discovered metamorphic relations** — cards for the relations the agent synthesised from the
  domain: generative/environmental (Clear→Rainy/Foggy/Snowy, Day→Night/Dusk, low-light, motion
  blur, lens glare, raindrops on lens…) and domain-specific (occluded pedestrian, wet road,
  car→truck, object insertion/removal…). Each card shows the relation type
  (invariant / predictable / addition / removal / relational) and its expected relation.
- **MR validation** — the 6-check screen (schema · task compatibility · domain consistency ·
  feasibility · expected relation · semantic preservation) run against a selected relation;
  passes are green, the rejected one (horizontal flip — breaks left/right traffic semantics)
  is struck through.
- **MR candidate pool** — every relation as a chip: 21 base + 18 admitted discovered.

### Testing — the agentic loop, live *(the centrepiece)*
- **Controls** — Start / Pause / Step / Skip to end / Run again, a progress bar, and a
  Presenter⇄Fast speed toggle.
- **Current iteration** panel:
  - `IMG-XX · <transform>` header + the relation id.
  - **Stage rail** — the 8 stages (Source → Describe → Relation → Transform → CLIP → Model →
    Verify → Memory) as icon nodes; done = check, active = ring.
  - **Before / after images** with detection boxes drawn on both.
  - **Description** — the vision model's caption of the original image.
  - **Agent** — the one-line reason the relation was chosen.
  - **Semantic check** — CLIP similarity vs threshold, "preserved" / "regenerated once".
  - **Model output** — the original vs test-case predictions side by side, with confidence
    deltas (drops in coral).
  - **Verdict** — *Relation satisfied* or *Metamorphic violation* + severity, expected vs
    actual, and for violations the **failure analysis** (type, affected class, observed effect,
    likely cause).
- **Right rail** — the **agent event stream** (a live log narrating every stage: "vision model
  description → …", "from memory patterns the agent chose GMR-03 …", "InstructPix2Pix edit —
  '…'"), the **testing memory** counters + failures-by-condition, and the **iterations**
  timeline (10 rows, pass/violation).

### Results — every test record
- Metric row: Tests, Relations satisfied, Violations, Image coverage.
- **Expandable per-test records** — click any row to see the before/after comparison, the full
  original vs transformed prediction tables, the oracle's expected/actual + CLIP score, and the
  failure detail.
- **MR usage** — which relation was exercised how many times (from testing memory).

### Violations — the failing cases
- Two views: **Violating cases** and **All transformed images**.
- Each **violation card**: before/after images, the relation, affected class, failure type,
  CLIP similarity, the observed effect, *View details* (jumps to that record in Results), and
  **Save image** (downloads the transformed PNG).
- The gallery lets you download any generated test-case image.

### Final Report — the robustness profile
- Metric cards: Baseline mAP 0.91, Metamorphic tests 10, MR violations 5 (3 high severity),
  Violation rate 50%.
- **Robustness by condition** — bars per condition with violation counts.
- **Metamorphic relations that failed** — ranked, with severity and failure type.
- **Most vulnerable conditions** (Night / Occlusion / Glare · 28% robust), **Most affected
  class** (pedestrian).
- **AI robustness assessment** — "Needs improvement", with the recommended action and an
  explicit caveat: *this is a metamorphic robustness assessment, not a production-readiness
  guarantee.*
- **Print / PDF** button.

---

## 4. The 10 baked-in test cases

Real KITTI frames, one relation each, ~half deliberately failing so the demo has a story:

| # | Transformation | Relation | Engine | Outcome |
|---|---|---|---|---|
| IMG-01 | Brightness +42 | MR-03 | deterministic | PASS |
| IMG-02 | Clear → Hazy | GMR-05 | generative | PASS |
| IMG-03 | Camera motion blur | GMR-09 | deterministic | PASS |
| IMG-04 | Rotation 9° | MR-07 | deterministic (boxes rotate) | PASS |
| IMG-05 | Clear → Foggy | GMR-02 | generative | **VIOLATION** — distant object disappears |
| IMG-06 | Clear → Rainy | GMR-01 | generative | **VIOLATION** — cyclist re-classed as pedestrian |
| IMG-07 | Day → Night | GMR-03 | generative | **VIOLATION** — pedestrian confidence collapses |
| IMG-08 | Partial pedestrian occlusion | DMR-01 | deterministic | **VIOLATION** — occluded pedestrian missed |
| IMG-09 | Day → Dusk | GMR-06 | generative | PASS |
| IMG-10 | Low-sun lens glare | GMR-10 | generative | **VIOLATION** — pedestrian lost in the bloom |

The images (10 original + 10 transformed) are generated by `data_work/build_dataset.py` with
OpenCV/PIL — the "generative" ones approximate InstructPix2Pix output (fog blend, night gamma +
blue cast + vignette, rain streaks, haze, warm dusk, radial glare bloom).

---

## 5. Cross-cutting features

- **Deterministic run engine** (`useTestingPipeline`) — a frame-by-frame simulation: boot
  phase (adapter → profiling → **bootstrap sweep** → relation discovery → validation → pool),
  then 8 stages × 10 iterations, then the report. Same inputs → identical run every time.
- **Testing memory** — accumulates verdicts, per-condition failure rates, coverage; the (mock)
  adaptive agent "reads" it to justify each next selection.
- **CLIP gate** — one case (fog / glare) shows the "similarity below threshold → regenerate"
  path, proving the semantic check isn't cosmetic.
- **Theme + speed persistence**, keyboard-free operation, print-friendly report.
- **~40-relation library** (`src/data/metamorphicRelations.ts`): 21 base (photometric /
  geometric / morphological) + ~19 discovered, one flagged rejected.

---

## 6. What you have (files in the repo)

| Path | What it is |
|---|---|
| `src/`, `public/dataset/`, `index.html`, configs | the POC web app (this document describes it) |
| `vercel.json`, `.vercelignore` | Vercel deploy config (static SPA) |
| `data_work/build_dataset.py` | downloads KITTI + generates the 20 images + `dataset.json` |
| `data_work/build_pptx.py` | generates the proposal deck as an editable `.pptx` |
| `proposal-slides.html` / `proposal-slides.pptx` | 10-slide proposal-defense deck (HTML interactive + editable PowerPoint) |
| `ARCHITECTURE.md` | full architecture / project flow write-up |
| `architecture.mmd` / `architecture-sequence.mmd` | Mermaid diagrams (full flowchart + one-iteration sequence) |
| `POC-OVERVIEW.md` | this file |
| `README.md` | run / build / deploy instructions |
| `scripts/smoke.mjs` | headless end-to-end check |

---

## 7. What's real vs simulated (state this in the defense)

| Real in the POC | Simulated (pre-computed / mocked) |
|---|---|
| The full workflow and screen-by-screen UX | the LLM (relation discovery, planning, reasoning text) |
| Real KITTI images + ground-truth boxes | InstructPix2Pix (transforms generated offline with OpenCV) |
| The transformation set + deterministic image ops | CLIP similarity scores |
| The metamorphic-relation library and types | the CV model under test (predictions authored per case) |
| Task-aware oracle logic (invariant / predictable / …) | the pass/fail outcomes (authored to tell a coherent story) |
| Testing memory structure, coverage, reporting | — |

Each mock lives behind its own module (`mockAgent`, `mockClip`, `mockModel`,
`mockTransformation`) so it can be swapped for a real model/API without touching the UI.
