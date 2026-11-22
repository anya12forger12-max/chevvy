# Deployment

Chevvy is a Vite/React single-page app. It can be deployed either as a static
site behind nginx (Docker image / GHCR) or to Firebase Hosting using the
existing GitHub Actions workflow. The Capacitor/Flutter directories are for the
mobile app and are not part of either web deployment.

> **Secrets:** the Vite `VITE_FIREBASE_*` values are embedded in the JavaScript
> bundle at **build time**. `.env` is git-ignored; only `.env.example` contains
> placeholders. Never commit real credentials, and rebuild the image/site
> whenever these values change.

## Prerequisites

- Docker Engine with the Compose v2 plugin (`docker compose version`) for the
  container deployment.
- Node.js 22+ for local verification (Vite 8 requires Node >= 20.19).
- Firebase CLI and a service account for the optional Firebase path.
- Host port `8080` free (configurable; see below).

## Configuration

Copy the example file and fill in your own values locally:

```bash
cp .env.example .env
# edit .env; it is ignored by git
```

| Variable | When used | Purpose |
| --- | --- | --- |
| `VITE_FIREBASE_API_KEY` | build | Firebase Web API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | build | Firebase auth domain |
| `VITE_FIREBASE_PROJECT_ID` | build | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | build | Firebase storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | build | FCM sender ID |
| `VITE_FIREBASE_APP_ID` | build | Firebase Web app ID |
| `HOST_PORT` | Compose | Host port mapped to container port 80 (default `8080`) |
| `CHEVVY_IMAGE` | Compose | Local image tag (default `chevvy:latest`) |

All six `VITE_FIREBASE_*` keys are passed as build args to the Dockerfile and
exported as `ENV` for the `npm run build` step. Changing them at runtime (for
example via `env_file` alone) does **not** change the compiled bundle.

## Build and run with Docker Compose

```bash
# From the repository root (where docker-compose.yml lives)
docker compose build
docker compose up -d
curl -I http://localhost:8080/
docker compose logs -f web
docker compose down
```

The site listens on `http://localhost:8080` by default. Set `HOST_PORT` in
`.env` to expose a different host port, e.g. `HOST_PORT=8443`. The container
always listens on port 80; nginx serves `/usr/share/nginx/html` with an SPA
history fallback (`try_files $uri $uri/ /index.html`), so deep links such as
`/settings` work while missing hashed assets in `/assets/` return a real 404.
The Compose service uses `restart: unless-stopped` and loads `.env` via
`env_file`.

Equivalent direct build (read values from your shell environment; nothing is
written to the repo):

```bash
docker build \
  --build-arg VITE_FIREBASE_API_KEY="$VITE_FIREBASE_API_KEY" \
  --build-arg VITE_FIREBASE_AUTH_DOMAIN="$VITE_FIREBASE_AUTH_DOMAIN" \
  --build-arg VITE_FIREBASE_PROJECT_ID="$VITE_FIREBASE_PROJECT_ID" \
  --build-arg VITE_FIREBASE_STORAGE_BUCKET="$VITE_FIREBASE_STORAGE_BUCKET" \
  --build-arg VITE_FIREBASE_MESSAGING_SENDER_ID="$VITE_FIREBASE_MESSAGING_SENDER_ID" \
  --build-arg VITE_FIREBASE_APP_ID="$VITE_FIREBASE_APP_ID" \
  -t chevvy:local .
docker run -d --name chevvy -p "${HOST_PORT:-8080}:80" chevvy:local
```

The image is multi-stage: `node:22-alpine` runs `npm ci && npm run build`, and
`nginx:alpine` contains only the built `dist/` plus `nginx.conf`. A health
check probes `http://127.0.0.1/` inside the container.

## GitHub Container Registry image

`.github/workflows/docker.yml` builds on pull requests and pushes to `main`.
On `main` it logs in to `ghcr.io` with the built-in `GITHUB_TOKEN` and pushes
tags derived from metadata: the branch name (`main`), the commit SHA
(`sha-<short-sha>`), and `latest`. PR builds are validated but never logged in
or pushed. The workflow needs `contents: read` and `packages: write`; GitHub
repository settings must allow the token to write packages. GHCR image names
are lowercased automatically.

Run a published image by pinning a digest or SHA tag (recommended over
`latest`):

```bash
docker pull ghcr.io/<OWNER>/<REPO>:sha-<short-sha>
docker run -d --name chevvy -p 8080:80 ghcr.io/<OWNER>/<REPO>:sha-<short-sha>
```

To use a published image with Compose instead of a local build, set
`CHEVVY_IMAGE` to that reference in `.env` and start with
`docker compose up -d --no-build` (pull the image first).

## Firebase Hosting alternative

`.github/workflows/firebase-deploy.yml` (unchanged by this scaffolding) builds
with the same six secrets and deploys to the live Hosting channel on pushes to
`main` or via `workflow_dispatch`. Required repository secrets:
`VITE_FIREBASE_*` (six values) and `FIREBASE_SERVICE_ACCOUNT`. Firebase tools
are pinned to `15.33.0` in that workflow for a documented service-account
permission reason; do not unpin it until the service account has
`roles/serviceusage.serviceUsageViewer`. `firebase.json` already rewrites all
paths to `/index.html`, so SPA routing works there too.

Manual equivalent:

```bash
npm ci
npm run build             # with the six VITE_FIREBASE_* values exported
firebase deploy --only hosting --project <PROJECT_ID>
```

## Upgrade and rollback

- **Upgrade (Docker):** a merge to `main` produces a new, immutable
  `sha-<commit>` tag. Pull the new tag and replace the running container
  (`docker stop chevvy && docker rm chevvy`, then `docker run ...` with the new
  tag) or point `CHEVVY_IMAGE` at it and use
  `docker compose up -d --no-build`. Verify with `curl -I` and the container
  health status before removing the old image.
- **Rollback (Docker):** redeploy the previously known-good `sha-<commit>`
  tag the same way; keep at least the last two tagged images available. If a
  config value caused the regression, fix `.env` and rebuild — runtime env
  alone cannot undo a baked-in Vite value.
- **Upgrade/rollback (Firebase):** use the Hosting release history in the
  Firebase console or restore/redo the commit and re-run the deploy workflow
  (`workflow_dispatch`). Each deploy creates a new release that can be rolled
  back to directly.

## Local verification

Run native commands from a normal filesystem, not a VFAT mount (npm cannot
create symlinks there):

```bash
npm ci
npm run build
npm run lint
npm run test:run
```
