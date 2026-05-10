# Bootstrap Dev Environment

Bootstraps the local development environment for this NestJS backend project by starting Docker containers (Postgres, Redis, MinIO), generating the `.env` file, installing dependencies, and setting up the Prisma client.

## When to use

Use this skill when:
- A developer clones this repo for the first time and needs to set up the local dev environment.
- The existing dev containers are missing, stopped, or misconfigured.
- You need to reset or recreate the local dev environment from scratch.

## Prerequisites

- Docker is installed and running.
- Node.js 22+ and Yarn are installed.
- The developer has read the project `CLAUDE.md` for coding standards.

## Workflow

### 1. Determine project identity

Read `package.json` and use the `name` field as the container name prefix (e.g., `template`).
If the name is generic (like `template`), ask the user for a preferred prefix to avoid collisions with other projects.

### 2. Check for existing containers and conflicts

**Mandatory**: Before starting any container, run the following checks to avoid name and port collisions:

```bash
docker ps -a --format "table {{.Names}}\t{{.Ports}}\t{{.Status}}"
docker volume ls
docker port <existing_container_name> 2>/dev/null || true
```

- **Container names**: The target names are `<prefix>-postgres`, `<prefix>-redis`, and `<prefix>-minio`.
  - If a container with the same name already exists and belongs to this project, report its status. Ask whether to reuse, remove, or recreate it.
  - If a container with the same name exists but belongs to a different project, pick a new prefix or append a numeric suffix (e.g., `<prefix>-postgres-1`).
- **Ports**: Default target ports are `5432` (Postgres), `6379` (Redis), `9000` (MinIO API), and `9001` (MinIO Console).
  - For each target port, check if it is already in use by another container.
  - If a port is taken, automatically find the next available port starting from the default + 1 (e.g., `5433`, `5434`, ...).
  - Do **not** stop or remove containers that belong to other projects.

### 3. Start infrastructure containers

Use the raw `docker run` commands (the original scripts are preserved in `references/` for manual use). Replace all placeholders dynamically based on the conflict detection above.

**Postgres**
```bash
docker run -d \
  --name <prefix>-postgres \
  --platform linux/arm64 \
  -e POSTGRES_PASSWORD=<password> \
  -e POSTGRES_USER=rootuser \
  -e POSTGRES_DB=develop \
  -p <pg_port>:5432 \
  -v <prefix>-postgres:/var/lib/postgresql/data \
  postgres:15
```

**Redis**
```bash
docker run -d \
  --name <prefix>-redis \
  -e REDIS_PASSWORD=<password> \
  -p <redis_port>:6379 \
  -v <prefix>-redis:/data \
  redis:7 redis-server --requirepass <password>
```

**MinIO**
```bash
docker run -d \
  --name <prefix>-minio \
  -e MINIO_ROOT_USER=rootuser \
  -e MINIO_ROOT_PASSWORD=<password> \
  -p <minio_api_port>:9000 \
  -p <minio_console_port>:9001 \
  -v <prefix>-minio:/data \
  minio/minio server /data --console-address ":9001"
```

Use a simple default password for local development (e.g., `password`) and print it clearly in the final summary.

### 4. Generate `.env` from `.env.example`

If `.env` does not exist, copy `.env.example` to `.env`. Then update the following variables with the actual local dev values derived from the running containers:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | `postgresql://rootuser:<password>@localhost:<pg_port>/develop?schema=public` |
| `REDIS_HOST` | `localhost` |
| `REDIS_PORT` | `<redis_port>` |
| `REDIS_PASSWORD` | `<password>` |
| `S3_ENDPOINT` | `localhost` |
| `S3_PORT` | `<minio_api_port>` |
| `S3_USE_SSL` | `false` |
| `S3_ACCESS_KEY` | `rootuser` |
| `S3_SECRET_KEY` | `<password>` |
| `S3_PUBLIC_URL_PREFIX` | `http://localhost:<minio_api_port>` |
| `S3_DEFAULT_BUCKET` | `default-bucket` |

Leave all other variables (OAuth, SMTP, LLM, Weaviate, OpenTelemetry, etc.) exactly as they appear in `.env.example` because they require external accounts or secrets.

**JWT Secrets**: You must replace `JWT_SECRET` and `JWT_REFRESH_SECRET` with securely generated random strings so that authentication works out of the box. Generate them with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 5. Install dependencies and generate Prisma client

```bash
yarn install
yarn prisma:gen
```

### 6. Set up the database

**Migrations**

- If `prisma/migrations/` exists and contains files, run:
  ```bash
  npx prisma migrate dev
  ```
- If **no migrations exist** (common for a fresh clone), create and apply the initial migration:
  ```bash
  npx prisma migrate dev --name init
  ```

**Seeding**

If `prisma/seed.ts` exists, run:
```bash
yarn prisma:seed
```

> **Note**: The seed command may fail with an `EACCES` npm cache error on some systems. If this happens, fix ownership and retry:
> ```bash
> sudo chown -R $(whoami) ~/.npm
> yarn prisma:seed
> ```

### 7. Final summary

Print a clear summary table:

```
Dev Environment Summary
=======================
Project prefix:   <prefix>
Postgres:         <prefix>-postgres  ->  localhost:<pg_port>
Redis:            <prefix>-redis     ->  localhost:<redis_port>
MinIO API:        <prefix>-minio     ->  localhost:<minio_api_port>
MinIO Console:    <prefix>-minio     ->  http://localhost:<minio_console_port>
Default password: <password>
Env file:         ./.env
```

Remind the user to start the application with:
```bash
yarn dev
```

## References

The original manual container scripts are preserved in the `references/` folder:
- `references/startpg.sh`
- `references/startredis.sh`
- `references/startminio.sh`
