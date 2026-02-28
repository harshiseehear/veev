# Deploy to Cloud Run

## Prerequisites
- Google Cloud SDK (gcloud CLI) installed
- Access to GCP project `hvrc-web` (883511463333)
- Domain `hvrc.place` configured in GCP

## Step 1: Push files to GitHub

First, commit and push the new files to your GitHub repo:

```bash
git add Dockerfile nginx.conf .dockerignore cloudbuild.yaml vite.config.js
git commit -m "Add Cloud Run deployment configuration"
git push origin main
```

## Step 2: Set up Cloud Build GitHub Integration

1. Go to [Google Cloud Console - Cloud Build Triggers](https://console.cloud.google.com/cloud-build/triggers)
2. Make sure you're in project `hvrc-web`
3. Click **"Connect Repository"**
4. Select **GitHub** as source
5. Authenticate with GitHub if needed
6. Select repository: `harshiseehear/veev`
7. Click **"Create Trigger"** with these settings:
   - Name: `veev-deploy`
   - Event: Push to a branch
   - Branch: `^main$`
   - Configuration: Cloud Build configuration file (yaml or json)
   - Location: `/cloudbuild.yaml`

## Step 3: Enable Required APIs

Run these commands to enable necessary APIs:

```bash
gcloud config set project hvrc-web

gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
```

## Step 4: Grant Permissions to Cloud Build

```bash
# Get your project number
PROJECT_NUMBER=883511463333

# Grant Cloud Run Admin role to Cloud Build
gcloud projects add-iam-policy-binding hvrc-web \
  --member=serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com \
  --role=roles/run.admin

# Grant Service Account User role to Cloud Build
gcloud projects add-iam-policy-binding hvrc-web \
  --member=serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com \
  --role=roles/iam.serviceAccountUser
```

## Step 5: Trigger First Build

Option A - Automatic (push to GitHub):
```bash
# Make any small change and push to trigger build
git commit --allow-empty -m "Trigger first deployment"
git push origin main
```

Option B - Manual (build locally and deploy):
```bash
# Set your project
gcloud config set project hvrc-web

# Build and submit to Cloud Build
gcloud builds submit --config cloudbuild.yaml

# Or build locally and deploy directly
docker build -t gcr.io/hvrc-web/veev .
docker push gcr.io/hvrc-web/veev
gcloud run deploy veev \
  --image gcr.io/hvrc-web/veev \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

## Step 6: Map Custom Domain

After your service is deployed:

1. Go to [Cloud Run Services](https://console.cloud.google.com/run)
2. Click on your `veev` service
3. Click **"Manage Custom Domains"** tab
4. Click **"Add Mapping"**
5. Select Service: `veev`
6. Select Domain: `hvrc.place`
7. Enter subdomain: `veev`
8. Click **"Continue"**
9. You'll get DNS records to add to your domain

### Add DNS Records

In your domain registrar (wherever hvrc.place is managed), add the DNS records provided by Google Cloud. Typically:

```
Type: CNAME
Name: veev
Value: ghs.googlehosted.com
```

## Step 7: Verify Deployment

Once DNS propagates (can take up to 48 hours, but usually minutes):

Visit: https://veev.hvrc.place

## Monitoring

- View builds: https://console.cloud.google.com/cloud-build/builds
- View service: https://console.cloud.google.com/run
- View logs: Click on your service → Logs tab

## Future Updates

Every push to the `main` branch on GitHub will automatically:
1. Build a new Docker image
2. Deploy to Cloud Run
3. Update your site at veev.hvrc.place

## Troubleshooting

### Build fails
- Check Cloud Build logs in GCP Console
- Verify all files are committed to GitHub
- Ensure Docker builds locally first

### Domain mapping fails
- Verify domain ownership in GCP
- Check DNS records are correct
- Wait for DNS propagation

### Site not loading
- Check Cloud Run logs
- Verify service is running in GCP Console
- Check if the service URL works before domain mapping
