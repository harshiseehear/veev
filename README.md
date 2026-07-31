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
- **Admin app at `/admin`** (username + password) with:
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
- Admin: `http://localhost:8787/admin`

### Admin credentials

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

Editing in `/admin` writes a **draft**; **Publish** promotes it to the live
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
  --region us-central1 --project <PROJECT_ID>
```

Then add the CNAME/A records it prints to the `hvrc.place` DNS zone. Once DNS
propagates, the platform is live at `https://kiosk.hvrc.place`, with quizzes at
`/veev` and `/uber` and the editor at `/admin`.

### Persistence note

Config/asset writes go to the container filesystem. `deploy.sh` pins the service
to a single always-on instance (`--min-instances 1 --max-instances 1`) so edits
persist within that instance. For durable, multi-instance storage, back the
`server/data` directory with a GCS bucket (via GCS FUSE volume mount) or move the
store to Firestore/GCS — the store layer (`server/store.js`) is the only thing to
swap.
