# Kiosk

A modular, fully-customizable kiosk **quiz management platform**. One app hosts
many quizzes; each is a data-only config that controls **everything** — images,
text, fonts, colours, per-element position/size/layer, game rules, the analytics
sheet, banner, backgrounds, and timings. Non-technical editors customize quizzes
in a Photoshop-like admin editor (or by asking the built-in AI), then publish
each to its own slug (e.g. `/veev`, `/uber`).

Built to replace one-off per-client quiz apps: instead of editing code for every
update, the whole quiz is a config you edit in the browser.

## What's included

- **Two live quizzes**, shipped as configs:
  - `/veev` — VEEV flavour **recommendation** quiz (pick-2 / pick-1 → device → flavour table).
  - `/uber` — Uber Eats × CH **trivia** quiz (5 questions, 3 random sets, 0–5 score, French).
- **Modular engine** that renders any quiz from JSON and supports two result
  types: `recommendation` (answer → track → lookup table) and `score` (trivia).
- **Editor at `/control`** (username + password; `/` redirects here → login) with:
  - A **visual, Photoshop-like editor** — click any element on the 1080×1920
    canvas to select it; drag to move, drag the corner to resize, arrow-keys to
    nudge, and set exact X/Y/W/H, z-order (front/back), font, size, weight,
    alignment, colours, corner radius, etc. Per screen, per element.
  - **Content** editor (questions, options, correct answers, sets),
    **Rules** editor (device maps / flavour tables / scoring),
    **Assets** manager (upload images & fonts), and **Settings**
    (name, analytics Sheet URL, timings, banner, backgrounds, fonts).
  - **AI assistant** — describe a change or upload a client brief; Claude edits
    *this* project's config. Review, then Save/Publish.
  - **Publish → /slug** and **New project** (blank or cloned from an existing quiz).
- **Backend** (Express): config store (draft + published), asset uploads,
  a **Google Sheets analytics proxy** (per-project Web App URL), and the AI proxy
  (the Anthropic key lives only on the server).

## Run locally

```bash
npm install
cp .env.example .env      # optionally add ANTHROPIC_API_KEY for the AI assistant
npm run dev               # Vite (5173) + Express (8787), proxied
# or a production-style single server:
npm run serve             # builds, then serves everything on :8787
```

- Players: `http://localhost:8787/veev`, `/uber`
- Editor: `http://localhost:8787/control` (or just `/`, which redirects here → login)

### Editor credentials

Defaults (override with the `ADMIN_USERS` env var, a JSON `{"user":"pass"}` map):

- `hvrc` / `fullmetalbitch`
- `michelle` / `mawg`

## How a quiz is defined

Each quiz is one JSON file in `server/data/configs/<slug>.json`:

- `theme` — canvas size, fonts (`@font-face` from `/assets/...`), colours.
- `banner`, `background`, `timings` (transition + auto-reset).
- `questions` (or `sets[]` for randomized trivia).
- `resultLogic` — `type: "recommendation"` (deviceMap + tracks + table) or
  `type: "score"` (correct answers + scoreQuestions).
- `screens[]` — each has a `background` and `elements[]`. Every element has
  `id, type, x, y, w, h, z` and a `style` object. Element types: `text`,
  `prompt`, `pickLabel`, `button`, `image`, `options`, `resultList`,
  `scoreCircle`, `answerSummary`, `timer`.

Editing in `/control` writes a **draft**; **Publish** promotes it to the live
config served at `/<slug>`. Analytics rows are posted through the server to the
project's Google Sheets Apps Script URL (set per project in Settings).

## Deploy (Google Cloud Run)

Runs on `harshrajmachikar@gmail.com`'s GCP — not GitHub Pages.

```bash
gcloud auth login
gcloud config set project <PROJECT_ID>
gcloud services enable run.googleapis.com cloudbuild.googleapis.com
# optional, for the AI assistant:
printf '%s' "$ANTHROPIC_API_KEY" | gcloud secrets create anthropic-api-key --data-file=-

./deploy.sh                 # builds the container + deploys, prints the run.app URL
```

### Custom subdomain `kiosk.hvrc.place`

```bash
gcloud beta run domain-mappings create \
  --service kiosk --domain kiosk.hvrc.place \
  --region us-east1 --project hvrc-web
```

Then add the CNAME/A records it prints to the `hvrc.place` DNS zone (Squarespace:
`CNAME kiosk -> ghs.googlehosted.com`). Once DNS propagates, the platform is live
at `https://kiosk.hvrc.place`, with quizzes at `/veev` and `/uber` and the editor
at `/control`.

### Persistence note

Config/asset writes go to the container filesystem. `deploy.sh` pins the service
to a single always-on instance (`--min-instances 1 --max-instances 1`) so edits
persist within that instance. For durable, multi-instance storage, back the
`server/data` directory with a GCS bucket (via GCS FUSE volume mount) or move the
store to Firestore/GCS — the store layer (`server/store.js`) is the only thing to
swap.

## Architecture & how to extend

The codebase is deliberately modular so a new session can jump in and change one
thing without touching the rest. Three layers, cleanly separated:

```
src/
  engine/            RENDER + PLAY (shared by players AND the editor canvas)
    renderer.jsx       Stage + every element type's visual (edit this to add a visual)
    QuizPlayer.jsx     the live flow: transitions, timer, auto-reset, analytics
    quizLogic.js       pure rules: result engines, scoring, analytics rows
  admin/             THE EDITOR ("/control") — pure UI over a config
    AdminApp.jsx       auth gate + data (load/save/publish/new) + masthead + editor
    useEditor.js       ALL edit logic: selection, drag/resize, per-set scope, groups, clipboard
    elements.js        element registry (add an element TYPE here)
    ui.jsx             control kit (Num/Txt/Color/Select/Toggle/Panel/Btn/Chip…)
    theme.css          the entire skin — design tokens + component styles (reskin here)
    Masthead / Navigator / Workspace / Inspector.jsx   layout regions
    panels/*.jsx       one file per inspector tab (Design/Content/Logic/Assets/Project/AI)
  App.jsx            routes: / → /control ; /control → editor ; /:slug → player
server/
  index.js           Express: static + SPA fallback + API
  store.js           config store (draft + published) — swap this for GCS/Firestore
  auth.js  ai.js      login (ADMIN_USERS) + Anthropic proxy (server-only key)
  data/configs/*.json  LIVE quiz configs      data/drafts/*.json  editor working copies
```

**Golden rule:** the veev/uber *players* are just `engine/` + their JSON. The
editor never has bespoke per-quiz code — everything a quiz needs lives in its
config. Keep it that way.

### Recipes

- **Edit a quiz's content/style/rules** — use `/control` (Save = draft, Publish =
  live), or hand-edit `server/data/configs/<slug>.json` then **reload any open
  `/control` tab** (an open editor holds the config in memory and can overwrite a
  file edit on Save). Commit config changes so a redeploy keeps them.
- **Add a new quiz (sub-app)** — `/control → New project` (blank or cloned), or
  drop a `server/data/configs/<slug>.json`. It's instantly live at `/<slug>` and
  appears in the editor's project switcher. No code.
- **Add a new element type** — add one entry to `admin/elements.js` (glyph, label,
  `makeElement` default) and one `case` in `engine/renderer.jsx` `ElementContent`.
  The layers list, add-buttons, and inspector pick it up automatically.
- **Add an inspector tab/panel** — create `admin/panels/XPanel.jsx` and add one
  entry to the `TABS` array in `admin/Inspector.jsx`.
- **Reskin the editor** — everything visual is in `admin/theme.css`. Colours are
  role-based tokens (`--k-tang-*` = selection/primary, `--k-lime-*` = publish,
  `--k-mango-*` = editing highlight, `--k-cherry` = danger, greys = surfaces).
  Change tokens, not individual rules. The players (`.qw-*`) are untouched by it.
- **Add a result engine** — extend `engine/quizLogic.js` (`computeResult` +
  `buildAnalyticsRow`); set `resultLogic.type` in the config.

### Verifying a quiz matches its original

The veev/uber rules are mirrored from the original standalone apps
(`~/Documents/offline` `main` branch = veev; `~/Documents/offline/uber` = uber):

- **veev** — `resultLogic.deviceMap` must match `checkAnswerCombination` for all
  q1 pairs, and `resultLogic.table[track][q3][q4]` must match the original
  `RECOMMENDATIONS` table (verified: 10/10 device combos, 32/32 flavour cells).
- **uber** — each set's `questions[qk].correct` must match the original
  `QUESTION_SETS` (verified: 15/15 answers; scoring = count correct over q1–q5,
  random set per play).

### Deploy checklist

1. `npm run build` (sanity) → commit config + code changes.
2. `git push hvrc app:main`.
3. `./deploy.sh` (or the `gcloud run deploy kiosk …` in `deploy.sh`) → serves
   `kiosk.hvrc.place`. A redeploy resets instance data to the committed configs,
   so commit config changes first.
