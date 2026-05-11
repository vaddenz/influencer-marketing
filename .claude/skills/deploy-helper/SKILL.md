# Deploy Helper

Automate the full deployment pipeline for this monorepo: build Docker images tagged with the 8-character git commit SHA, push them to a remote image hub, deploy or update services on the dev server via Docker Compose, and run post-deploy connectivity tests.

This skill can also be invoked as `deploy+`.

## When to use

Use this skill when:
- You need to deploy the latest code to the dev server.
- You want to update running services after merging changes or fixing bugs.
- You are setting up deployment for the first time and need to configure the image hub and dev server.

## Prerequisites

- Docker is installed locally and on the dev server.
- Docker Compose v2+ is installed on the dev server.
- SSH access to the dev server (key-based or password).
- The project has a working `frontend/Dockerfile`, `backend/Dockerfile`, and `frontend/traefik/Dockerfile`.
- The backend `.env` file for the target environment is available (or can be generated).
- The project-root `docker-compose.yml` has been reviewed and configured.

## Workflow

### 1. Read or create local deployment config

The skill stores deployment settings in a local JSON file at:
```
~/.config/agentplanet-deploy.json
```

If this file does not exist, create it with the following structure:
```json
{
  "projectName": "agentplanet",
  "imageHub": {
    "url": "registry.example.com",
    "username": "",
    "password": ""
  },
  "devServer": {
    "host": "dev-server.example.com",
    "sshUser": "root",
    "sshKeyPath": "~/.ssh/id_rsa"
  },
  "frontendBuildArgs": {
    "NEXT_PUBLIC_API_BASE_URL": "https://api.example.com/api/v1",
    "NEXT_PUBLIC_ADVERTISED_HOST": "https://www.example.com",
    "NEXT_PUBLIC_BRAND_NAME": "AgentPlanet",
    "NEXT_PUBLIC_UMAMI_WEBSITE_ID": "",
    "NEXT_PUBLIC_CONTACT_EMAIL": ""
  }
}
```

**If any required field is missing, ask the user to provide it.**
- `imageHub.url` — the Docker registry URL (e.g., `registry.cn-hangzhou.aliyuncs.com`, `ghcr.io`, Docker Hub username for `docker.io`).
- `imageHub.username` / `imageHub.password` — registry credentials.
- `devServer.host` — hostname or IP of the dev server.
- `devServer.sshUser` — SSH login user.
- `devServer.sshKeyPath` — path to the private SSH key (optional if using ssh-agent).
- `projectName` — used for image names, container names, and network names.
- `frontendBuildArgs` — the `NEXT_PUBLIC_*` build arguments required by the frontend Dockerfile.

### 2. Determine the image tag

Get the current 8-character git commit SHA:
```bash
git rev-parse --short=8 HEAD
```

This becomes the image tag for all three services. Example: `backend:3f4a9b2c`.

### 3. Build images

#### 3.1 Backend
```bash
cd backend
docker build -t ${IMAGE_HUB_URL}/${PROJECT_NAME}/backend:${IMAGE_TAG} .
```

#### 3.2 Frontend
```bash
cd frontend
docker build \
  --build-arg NEXT_PUBLIC_API_BASE_URL="${NEXT_PUBLIC_API_BASE_URL}" \
  --build-arg NEXT_PUBLIC_ADVERTISED_HOST="${NEXT_PUBLIC_ADVERTISED_HOST}" \
  --build-arg NEXT_PUBLIC_BRAND_NAME="${NEXT_PUBLIC_BRAND_NAME}" \
  --build-arg NEXT_PUBLIC_UMAMI_WEBSITE_ID="${NEXT_PUBLIC_UMAMI_WEBSITE_ID}" \
  --build-arg NEXT_PUBLIC_CONTACT_EMAIL="${NEXT_PUBLIC_CONTACT_EMAIL}" \
  -t ${IMAGE_HUB_URL}/${PROJECT_NAME}/frontend:${IMAGE_TAG} .
```

Read the build-arg values from the config file. If any are missing, ask the user.

#### 3.3 Gateway (Traefik)
```bash
cd frontend/traefik
docker build -t ${IMAGE_HUB_URL}/${PROJECT_NAME}/gateway:${IMAGE_TAG} .
```

### 4. Push images to the hub

Log in to the registry if not already authenticated:
```bash
docker login ${IMAGE_HUB_URL} -u ${USERNAME} -p ${PASSWORD}
```

Push all three images:
```bash
docker push ${IMAGE_HUB_URL}/${PROJECT_NAME}/backend:${IMAGE_TAG}
docker push ${IMAGE_HUB_URL}/${PROJECT_NAME}/frontend:${IMAGE_TAG}
docker push ${IMAGE_HUB_URL}/${PROJECT_NAME}/gateway:${IMAGE_TAG}
```

### 5. Deploy to dev server

#### 5.1 Prepare the Docker Compose file

The project-root `docker-compose.yml` uses environment variable substitution and is ready for deployment. Set the required variables:

| Variable | Value |
|----------|-------|
| `PROJECT_NAME` | Config `projectName` (default: `influencer-marketing`) |
| `IMAGE_HUB_URL` | Config `imageHub.url` |
| `IMAGE_TAG` | 8-character git SHA |
| `BACKEND_ENV_FILE` | Path to the backend production env file |

Export these locally before running compose commands, or write them to a `.env` file alongside `docker-compose.yml`.

#### 5.2 Prepare the backend environment file

The backend service in the compose file references an `.env` file. Ensure the dev server has a valid `.env` at `/opt/${PROJECT_NAME}/.env`.

- If the user has provided a production env file locally, copy it to the server.
- If not, remind the user that the backend requires `.env` and ask whether to copy from `backend/.env.example` or use an existing one.

#### 5.3 Copy files and deploy

Use `references/deploy.sh` as the deployment script template, or run the equivalent commands inline:

```bash
REMOTE_DIR="/opt/${PROJECT_NAME}"
ssh ${SSH_OPTS} ${SSH_USER}@${SERVER_HOST} "mkdir -p ${REMOTE_DIR}"

# Copy the project docker-compose.yml
scp ${SSH_OPTS} docker-compose.yml "${SSH_USER}@${SERVER_HOST}:${REMOTE_DIR}/docker-compose.yml"

# Copy .env if available
if [[ -f "backend/.env.production" ]]; then
  scp ${SSH_OPTS} backend/.env.production "${SSH_USER}@${SERVER_HOST}:${REMOTE_DIR}/.env"
fi

# Ensure acme.json exists with correct permissions
ssh ${SSH_OPTS} ${SSH_USER}@${SERVER_HOST} "touch ${REMOTE_DIR}/acme.json && chmod 600 ${REMOTE_DIR}/acme.json"

# Pull images and restart services
ssh ${SSH_OPTS} ${SSH_USER}@${SERVER_HOST} \
  "cd ${REMOTE_DIR} && \
   export IMAGE_HUB_URL='${IMAGE_HUB_URL}' IMAGE_TAG='${IMAGE_TAG}' PROJECT_NAME='${PROJECT_NAME}' BACKEND_ENV_FILE='./.env' && \
   docker compose pull && \
   docker compose up -d --remove-orphans"
```

#### 5.4 Local deployment (alternative)

If `devServer.host` is `localhost` or `127.0.0.1`, skip SSH and run directly:
```bash
mkdir -p /opt/${PROJECT_NAME}
cp docker-compose.yml /opt/${PROJECT_NAME}/docker-compose.yml
touch /opt/${PROJECT_NAME}/acme.json && chmod 600 /opt/${PROJECT_NAME}/acme.json
cd /opt/${PROJECT_NAME} && \
  export IMAGE_HUB_URL='${IMAGE_HUB_URL}' IMAGE_TAG='${IMAGE_TAG}' PROJECT_NAME='${PROJECT_NAME}' BACKEND_ENV_FILE='./.env' && \
  docker compose pull && \
  docker compose up -d --remove-orphans
```

### 6. Post-deploy monitoring and connectivity tests

Wait 10 seconds for containers to start, then run health checks.

Use `references/health-check.sh` or run equivalent `curl` commands:

```bash
# Backend health endpoint (excluded from api/v1 global prefix)
curl -sf --max-time 30 "http://${SERVER_HOST}:3000/health"

# Frontend via gateway (HTTPS)
curl -sfk --max-time 30 "https://${SERVER_HOST}/"

# Gateway direct
curl -sfk --max-time 30 "https://${SERVER_HOST}/"
```

Report results in a clear table:

```
Post-Deploy Health Check
========================
Backend /health:   PASS / FAIL
Frontend /:        PASS / FAIL
Gateway /:         PASS / FAIL
```

If any check fails:
1. Show the last 50 lines of the failing service: `docker compose logs --tail 50 <service>`
2. Ask the user whether to roll back to the previous running image or investigate further.

## References

- `docker-compose.yml` (project root) — Production Docker Compose file with env var substitution.
- `references/docker-compose.yml` — Template version with placeholder substitution.
- `references/deploy.sh` — Remote deployment script template.
- `references/health-check.sh` — Post-deploy connectivity test script.
- `frontend/Dockerfile` — Multi-stage Next.js build.
- `backend/Dockerfile` — Multi-stage NestJS build.
- `frontend/traefik/Dockerfile` — Traefik gateway image.
- `frontend/traefik/traefik.yml` — Traefik static configuration.
- `frontend/traefik/dynamic.yml` — Traefik routing rules.
