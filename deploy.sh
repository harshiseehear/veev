#!/usr/bin/env bash
# Deploy Quiz Wizard to Google Cloud Run (account: harshrajmachikar@gmail.com).
# One command builds the container (Cloud Build) and deploys it, returning a
# public https://<service>-<hash>-<region>.run.app URL.
#
# Prereqs (one time):
#   gcloud auth login
#   gcloud config set project <PROJECT_ID>
#   gcloud services enable run.googleapis.com cloudbuild.googleapis.com
#   # optional, for the AI assistant:
#   printf '%s' "$ANTHROPIC_API_KEY" | gcloud secrets create anthropic-api-key --data-file=-
set -euo pipefail

# Hub conventions (see HVRC cloud architecture): project hvrc-web, region
# us-east1, one Cloud Run service + one subdomain per app.
PROJECT="${GCP_PROJECT:-$(gcloud config get-value project 2>/dev/null)}"
REGION="${REGION:-us-east1}"
SERVICE="${SERVICE:-wizard}"

if [ -z "$PROJECT" ]; then echo "Set a project: gcloud config set project <id>"; exit 1; fi
echo "Deploying '$SERVICE' to project '$PROJECT' ($REGION)…"

COMMON=(--source . --project "$PROJECT" --region "$REGION"
  --allow-unauthenticated --port 8787 --min-instances 1 --max-instances 1
  --memory 512Mi --cpu 1)

# Attach the Anthropic secret if it exists; otherwise deploy without the AI key.
if gcloud secrets describe anthropic-api-key --project "$PROJECT" >/dev/null 2>&1; then
  gcloud run deploy "$SERVICE" "${COMMON[@]}" --set-secrets ANTHROPIC_API_KEY=anthropic-api-key:latest
else
  echo "(no 'anthropic-api-key' secret found — deploying without the AI assistant)"
  gcloud run deploy "$SERVICE" "${COMMON[@]}"
fi

echo
echo "Done. To map the custom subdomain wizard.hvrc.place:"
echo "  gcloud beta run domain-mappings create --service $SERVICE --domain wizard.hvrc.place --region $REGION --project $PROJECT"
echo "  # then at Squarespace DNS for hvrc.place add:  CNAME  wizard  ->  ghs.googlehosted.com"
