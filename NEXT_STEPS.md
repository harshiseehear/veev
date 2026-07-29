# Quiz Wizard — Next Steps

Status as of 2026-07-29: platform built, verified locally, and pushed to
`github.com/hvrc/quiz-wizard` (branch `app` → `main`). **Not yet deployed.**

Run these from `~/Documents/offline/veev` unless noted.

## 1. Deploy to Cloud Run (GCP `hvrc-web`, us-east1)

Publishes the app as the Cloud Run service `wizard`. Must run in your own
terminal (auto-mode blocks `--allow-unauthenticated`).

```bash
gcloud config set project hvrc-web
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com
./deploy.sh                 # builds via Cloud Build + deploys; prints the https://…run.app URL
```

Verify the printed URL: `/` (landing), `/veev`, `/uber`, `/admin`.

## 2. Map the subdomain wizard.hvrc.place

```bash
gcloud beta run domain-mappings create \
  --service wizard --domain wizard.hvrc.place \
  --region us-east1 --project hvrc-web
```

Then in **Squarespace DNS** for `hvrc.place` add:

```
CNAME   wizard   ->   ghs.googlehosted.com
```

Wait for propagation → live at https://wizard.hvrc.place (quizzes at `/veev`,
`/uber`; editor at `/admin`).

## 3. Enable the AI assistant (optional)

The admin AI panel is wired but shows "not configured" until a key is present.
Add it as a Secret Manager secret and redeploy with it attached:

```bash
printf '%s' "$YOUR_ANTHROPIC_KEY" | gcloud secrets create anthropic-api-key --data-file=- --project hvrc-web
./deploy.sh                 # deploy.sh auto-attaches the secret if it exists
```

(Locally: put the key in `.env` as `ANTHROPIC_API_KEY=...`.)
Model defaults to `claude-sonnet-4-6` (override with `WIZARD_AI_MODEL`).

## 4. Durable storage (before heavy multi-editor use) — optional

Config/asset writes currently live on the Cloud Run instance filesystem (service
is pinned to 1 instance so edits persist within it). For durability across
restarts / multiple instances, back `server/data` with a GCS bucket (GCS FUSE
volume mount) or move the store to Firestore/GCS. Only `server/store.js` needs to
change.

## Reference

- Admin logins: `hvrc` / `fullmetalbitch`, `michelle` / `mawg` (override via `ADMIN_USERS` env).
- Quizzes are configs in `server/data/configs/<slug>.json`; edits made in `/admin`
  are drafts until **Publish**.
- Local run: `npm install && npm run serve` → http://localhost:8787
- Full details: `README.md`.
