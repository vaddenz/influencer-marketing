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

## Known codebase issues to check before deploying

### Backend Dockerfile must copy `prisma.config.ts`
The production `backend/Dockerfile` runner stage must include `prisma.config.ts`. If it is missing, `npx prisma migrate deploy` will fail with:
> `Error: The datasource.url property is required in your Prisma config file`

**Fix:** Add this line to the runner stage of `backend/Dockerfile`:
```dockerfile
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
```

### Traefik config placeholders
`frontend/traefik/dynamic.yml` contains placeholder values `HOSTNAME_1` and `HOSTNAME_2`. `frontend/traefik/traefik.yml` contains `postmaster@HOSTNAME_1`. These **must** be replaced with the actual domain (e.g., `agentplanet.ai`) before building the gateway image, or Traefik will not route traffic.

### Backend health endpoint location
The backend health endpoint is at `/api/v1/health` (under the global prefix), **not** `/health`. The deploy-helper skill historically assumed it was excluded from the prefix, but the actual `main.ts` does not exclude it. Do **not** rely on `/health`.

### Frontend health check uses `wget`
The frontend image is based on `node:22-alpine`, which does **not** include `wget`. The docker-compose health check that uses `wget` will always fail. Either install `wget` in the frontend Dockerfile or remove the frontend health check from docker-compose.

### Registry namespace must exist
Pushing to Tencent Cloud CCR (and some other registries) requires the namespace/repository to be created in the registry console first. If push fails with "no permission", the namespace likely does not exist. In that case, build images directly on the dev server and deploy using local images (skip `docker compose pull`).

## Workflow

### 1. Read or create local deployment config

The skill stores deployment settings in a local JSON file at:
```
~/.config/deploy-skill/influencer-marketing-deploy.json
```

If this file does not exist, create it with the following structure:
```json
{
  "projectName": "influencer-marketing",
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
    "NEXT_PUBLIC_BRAND_NAME": "Influencer Marketing Demo",
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

#### 3.1 Build locally (default)

**Backend**
```bash
cd backend
docker build -t ${IMAGE_HUB_URL}/${PROJECT_NAME}/backend:${IMAGE_TAG} .
```

**Frontend**
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

**Gateway (Traefik)**
```bash
cd frontend/traefik
docker build -t ${IMAGE_HUB_URL}/${PROJECT_NAME}/gateway:${IMAGE_TAG} .
```

#### 3.2 Build on the dev server (fallback)

If local Docker fails (permission errors, buildx issues, etc.), copy the source to the server and build there:

```bash
rsync -avz --exclude='.git' --exclude='node_modules' --exclude='dist' --exclude='.next' \
  -e "ssh -i ${SSH_KEY_PATH}" ./ ${SSH_USER}@${SERVER_HOST}:/opt/${PROJECT_NAME}/source/

ssh -i ${SSH_KEY_PATH} ${SSH_USER}@${SERVER_HOST} \
  "cd /opt/${PROJECT_NAME}/source/backend && docker build -t ${IMAGE_HUB_URL}/${PROJECT_NAME}/backend:${IMAGE_TAG} ."

ssh -i ${SSH_KEY_PATH} ${SSH_USER}@${SERVER_HOST} \
  "cd /opt/${PROJECT_NAME}/source/frontend && docker build ... -t ${IMAGE_HUB_URL}/${PROJECT_NAME}/frontend:${IMAGE_TAG} ."

ssh -i ${SSH_KEY_PATH} ${SSH_USER}@${SERVER_HOST} \
  "cd /opt/${PROJECT_NAME}/source/frontend/traefik && docker build -t ${IMAGE_HUB_URL}/${PROJECT_NAME}/gateway:${IMAGE_TAG} ."
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
- **Important**: If you need to run one-off containers (e.g., `npx prisma migrate deploy`) using `docker run --env-file`, Docker includes literal quotes from the `.env` file values. This breaks `DATABASE_URL` and other quoted values. For one-off commands, pass env vars explicitly with `-e KEY=value` instead of using `--env-file`.

#### 5.3 Set up infrastructure (optional)

If the user asks to bootstrap the backend dev environment on the server, use the `bootstrap-dev-environment` skill from `backend/.claude/skills/bootstrap-dev-environment/SKILL.md`. This starts Postgres, Redis, and MinIO containers on the server.

When configuring the backend `.env` for Docker deployment, use the host's docker bridge IP (`172.17.0.1` on most Linux setups) so the backend container can reach the infrastructure containers:

| Variable | Example Value |
|----------|---------------|
| `DATABASE_URL` | `postgresql://rootuser:<pass>@172.17.0.1:5432/develop?schema=public` |
| `REDIS_HOST` | `172.17.0.1` |
| `S3_ENDPOINT` | `172.17.0.1` |

#### 5.4 Copy files and deploy

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

**If images were built on the server** (registry push failed or skipped), skip `docker compose pull` because the images already exist locally:
```bash
ssh ${SSH_OPTS} ${SSH_USER}@${SERVER_HOST} \
  "cd ${REMOTE_DIR} && \
   export IMAGE_HUB_URL='${IMAGE_HUB_URL}' IMAGE_TAG='${IMAGE_TAG}' PROJECT_NAME='${PROJECT_NAME}' BACKEND_ENV_FILE='./.env' && \
   docker compose up -d --remove-orphans"
```

#### 5.5 Local deployment (alternative)

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
# Backend health endpoint (at /api/v1/health, under the global prefix)
curl -sfk --max-time 30 "https://${SERVER_HOST}/api/v1/health"

# Frontend via gateway (HTTPS)
curl -sfk --max-time 30 "https://${SERVER_HOST}/"

# Gateway direct
curl -sfk --max-time 30 "https://${SERVER_HOST}/"
```

**If testing from the server host directly** (backend port is not exposed to host by default):
```bash
# Test from inside the Docker network
docker run --rm --network ${PROJECT_NAME}_app-net alpine/curl \
  curl -sf --max-time 30 http://backend:3000/api/v1/health
```

Report results in a clear table:

```
Post-Deploy Health Check
========================
Backend /api/v1/health:   PASS / FAIL
Frontend /:               PASS / FAIL
Gateway /:                PASS / FAIL
```

If any check fails:
1. Show the last 50 lines of the failing service: `docker compose logs --tail 50 <service>`
2. Ask the user whether to roll back to the previous running image or investigate further.

**Common post-deploy issues**
- **Backend 404 on health check**: The health endpoint is `/api/v1/health`, not `/health`.
- **Traefik returns 404**: Check that `frontend/traefik/dynamic.yml` has the actual domain name, not `HOSTNAME_1`/`HOSTNAME_2`.
- **Let's Encrypt fails**: Ensure ports 80 and 443 are open to the internet. Port 80 is required for the HTTP challenge even when serving HTTPS.
- **Frontend unhealthy in `docker ps`**: The frontend image (Alpine) does not have `wget`. Either install it in the Dockerfile or remove the frontend health check from docker-compose.

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
