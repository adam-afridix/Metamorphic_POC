# Metamorph — Frontend POC

Interactive proof-of-concept frontend for our FYP: **Metamorph**, an Agentic Metamorphic Testing
Framework for Computer Vision Models. It demonstrates the full proposed workflow — input → MR discovery →
transformation → CLIP semantic validation → CV model → MR oracle → failure analysis → robustness
report — using **deterministic mock services**. No ML/LLM backend, no API keys, no internet needed.

**Themes:** two modes of one design system, switched from the header and persisted —
`Dark` (computational / operational) and `Warm Lab` (analytical parchment / technical-editorial).
All colours are CSS custom-property tokens in `src/index.css`; components never hard-code hex.

## Run

```bash
npm install
npm run dev        # http://localhost:5173
```

```bash
npm run build      # type-check + production build to dist/
npm run preview    # serve the production build
```

## Deploy (Vercel)

Static Vite SPA (hash routing, no backend, no env vars). `vercel.json` sets the SPA
fallback and long-cache headers; Vercel runs `vite build` → serves `dist/`.

**CLI**
```bash
npm i -g vercel
vercel          # first run: log in + link + accept the detected Vite settings
vercel --prod   # production deploy
```

**GitHub → vercel.com** — push this repo, then *Add New → Project → Import*; the Vite
preset auto-fills. Every push redeploys. Keep the repo private (it contains the draft
FYP handbook PDF), or `git rm --cached BS-FYP-Handbook-2026_DRAFT.pdf` first.

## Demo flow (≈3–5 min)

1. **Test Setup** — click *Upload Model*, *Upload Dataset*, then *Use example (autonomous driving)* → *Start Agentic Test*.
2. **Testing** — watch the pipeline step through 10 images (Pause / Step / Skip to end; *Presenter* / *Fast* speed toggle in the header).
3. **AI Analysis** — baseline profile, initial failure profile, domain identification, per-image scene analysis + transformation selection.
4. **MR Generation** — 21 base MRs + 6 LLM-discovered generative/domain MRs, the MR validator, and the candidate pool.
5. **Results** — every test record, expandable to image comparison + prediction deltas + oracle verdict.
6. **Violations** — the 4 failing cases with agent failure analysis; *All transformed images* gallery with PNG export.
7. **Final Report** — robustness-by-condition chart, most problematic MRs, most affected class, and the metamorphic robustness assessment (explicitly *not* a production-readiness guarantee).

## Architecture

```
data_work/         build_dataset.py  (downloads KITTI + generates transforms → public/ + json)
public/dataset/     10 original + 10 transformed JPEGs
src/
├── data/           testCases.ts (loads generated/dataset.json), MR library
├── services/       mockAgent · mockClip · mockModel · mockTransformation · pipeline
├── hooks/          useTestingPipeline  (the deterministic run engine + context)
├── components/     DatasetImage (img + box overlay), ImageComparison, MRCard, EventLog, …
└── pages/          Dashboard · TestSetup · AIAnalysis · MRGeneration · Testing · Results · Violations · Report
```

### Dataset

10 real object-detection frames from **KITTI** (`nateraw/kitti` on Hugging Face, CC BY-NC-SA 3.0 —
research/non-commercial, fine for an FYP demo). `data_work/build_dataset.py` downloads the images +
ground-truth boxes, applies one deterministic transformation per image (brightness, contrast, blur,
rotation, fog, rain, night, partial occlusion, BGR reorder, object insertion — all from the FYP
spec), authors the simulated model predictions / oracle outcome, and emits `public/dataset/*.jpg`
and `src/data/generated/dataset.json`. Re-run it any time:

```bash
pip install pillow numpy opencv-python requests
python data_work/build_dataset.py
```

Each mock service is isolated so it can later be replaced with a real model / API without touching
the UI. Everything downstream of a test is derived deterministically from `dataset.json` — the same
run always produces the same results.

`scripts/smoke.mjs` drives the app headlessly through the full flow (needs local Chrome) and fails
on any runtime/console error.
