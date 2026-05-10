# NestJS Backend Template

A robust, scalable, and production-ready NestJS backend template pre-configured with essential tools and best practices.

## Features

- **Framework**: [NestJS](https://nestjs.com/) (v11) - A progressive Node.js framework.
- **Database**: [PostgreSQL](https://www.postgresql.org/) with [Prisma ORM](https://www.prisma.io/).
- **Caching**: [Redis](https://redis.io/) integration using `@nestjs/cache-manager` and `keyv`.
- **Storage**: S3-compatible object storage client (MinIO/AWS S3) with built-in health checks.
- **Rate Limiting**: Advanced distributed rate limiting backed by Redis:
  - Global and route-specific policies
  - Smart throttling based on User ID (if authenticated) or IP address
- **Queue**: Background job processing with [BullMQ](https://docs.bullmq.io/).
- **Authentication**: Secure JWT authentication with Passport (Access & Refresh Tokens).
- **Configuration**: Environment-based configuration via `@nestjs/config`.
- **Architecture**: Modular design with Separation of Concerns (SoC).
- **API Standards**:
  - Global API Prefix: `api/v1`
  - Global Validation Pipe (`class-validator`)
  - Global Exception Filter
  - Global Response Transform Interceptor
  - CORS enabled
  - JSON Logging (in production)
- **Health Checks**: Built-in health check endpoint (`/health`) with Terminus
  - Database connectivity check
  - Redis connectivity check
  - S3/MinIO connectivity check
  - Memory usage check
  - Disk storage check
- **Observability**: OpenTelemetry integration for Metrics, Logs, and Traces.
  - **Metrics**: Prometheus (pull) or OTLP (push) support.
  - **Logs**: Winston logger with automatic trace context injection.
  - **Traces**: Auto-instrumentation for HTTP, Express, NestJS, etc.
  - **Configurable**: Fully controlled via environment variables.

## Environment Variables

The application is configured using environment variables. Copy `.env.example` to `.env` and configure the following:

### Application
| Variable | Description | Default |
| :--- | :--- | :--- |
| `PORT` | Application port | `3000` |
| `NODE_ENV` | Environment (development/production) | `development` |
| `ADVERTISED_HOST` | Public URL of the application | `http://localhost:3000` |

### Database
| Variable | Description | Example |
| :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/db?schema=public` |

### Redis
| Variable | Description | Default |
| :--- | :--- | :--- |
| `REDIS_HOST` | Redis host | `localhost` |
| `REDIS_PORT` | Redis port | `6379` |
| `REDIS_PASSWORD` | Redis password | `""` |
| `REDIS_DB` | Redis database index | `0` |

### Authentication (JWT)
| Variable | Description | Example |
| :--- | :--- | :--- |
| `JWT_SECRET` | Secret key for access tokens | `your-secret-key` |
| `JWT_EXPIRES_IN` | Access token expiration | `1d` |
| `JWT_REFRESH_SECRET` | Secret key for refresh tokens | `your-refresh-secret` |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token expiration | `7d` |

### Storage (S3/MinIO)
| Variable | Description | Example |
| :--- | :--- | :--- |
| `S3_ENDPOINT` | S3 endpoint URL (exclude protocol for AWS) | `s3.amazonaws.com` or `localhost` |
| `S3_PORT` | S3 service port | `443` or `9000` |
| `S3_REGION` | AWS Region | `us-east-1` |
| `S3_ACCESS_KEY` | Access Key ID | `minioadmin` |
| `S3_SECRET_KEY` | Secret Access Key | `minioadmin` |
| `S3_USE_SSL` | Enable SSL | `true` |
| `S3_DEFAULT_BUCKET` | Default bucket name | `my-bucket` |
| `S3_BUCKETS` | JSON map of additional buckets | `{"biz":"biz-bucket"}` |

### Health Check
| Variable | Description | Default |
| :--- | :--- | :--- |
| `HEALTH_CHECK_MAX_MEMORY_UTILIZATION` | Max memory usage threshold in GB | `8` |
| `HEALTH_CHECK_MAX_DISK_USAGE_PERCENT` | Max disk usage percentage (0-1) | `0.95` |

### Observability (OpenTelemetry)
| Variable | Description | Default |
| :--- | :--- | :--- |
| `OTEL_ENABLE_METRICS` | Enable metrics collection | `true` |
| `OTEL_ENABLE_LOGS` | Enable log collection | `true` |
| `OTEL_METRICS_EXPORTER` | Metrics exporter (`otlp`, `prometheus`, `console`) | `otlp` |
| `OTEL_LOGS_EXPORTER` | Logs exporter (`otlp`, `console`) | `otlp` |
| `OTLP_ENDPOINT` | OTLP collector endpoint | `http://otel-collector:4318/v1` |
| `OTEL_METRICS_EXPORT_INTERVAL` | Metrics export interval in seconds | `30` (prod) / `10` (dev) |
| `PROMETHEUS_PORT` | Port for Prometheus metrics (if exporter is `prometheus`) | `9464` |
| `OTEL_OTLP_HEADERS` | Additional headers for OTLP (e.g., auth) | `""` |
| `SERVICE_NAME` | Service name for telemetry | `backend` |
| `DEPLOY_ENV` | Deployment environment tag | `prod` |

### Configuration Examples

**1. Development (Prometheus Metrics + Console Logs)**

```bash
OTEL_ENABLE_METRICS=true
OTEL_ENABLE_LOGS=true
OTEL_METRICS_EXPORTER=prometheus
OTEL_LOGS_EXPORTER=console
PROMETHEUS_PORT=9464
```

Access metrics at: `http://localhost:9464/metrics`

**2. Production (OTLP for everything)**

```bash
OTEL_ENABLE_METRICS=true
OTEL_ENABLE_LOGS=true
OTEL_METRICS_EXPORTER=otlp
OTEL_LOGS_EXPORTER=otlp
OTLP_ENDPOINT=http://otel-collector:4318/v1
OTEL_METRICS_EXPORT_INTERVAL=30
```

### Usage Guide

**1. Injecting Metrics**

Use `OTEL_METER` token to inject the Meter into your services or controllers:

```typescript
import { Inject, Controller, Get } from '@nestjs/common';
import { OTEL_METER } from '@/common/otel/otel.constants';
import { Meter, Counter } from '@opentelemetry/api';

@Controller('cats')
export class CatsController {
  private readonly catsCounter: Counter;

  constructor(@Inject(OTEL_METER) private readonly meter: Meter) {
    this.catsCounter = this.meter.createCounter('cats_created_total', {
      description: 'Total number of cats created',
    });
  }

  @Get()
  findAll() {
    this.catsCounter.add(1);
    return 'This action returns all cats';
  }
}
```

**2. Using Decorators (Recommended)**

For cleaner code, use the provided decorators in your services or providers.

```typescript
import { Injectable } from '@nestjs/common';
import { TrackMetrics, TrackDuration, TrackCount } from '@/common/decorators';

@Injectable()
export class CatsService {

  // Option A: Track both duration and count (Recommended)
  // Generates: cats_create_duration_seconds, cats_create_total
  @TrackMetrics({ name: 'cats_create' })
  async create(cat: CreateCatDto) {
    // ... logic
  }

  // Option B: Track only duration
  @TrackDuration('cats_process_time')
  async process(cat: Cat) {
    // ... logic
  }

  // Option C: Track only execution count
  @TrackCount('cats_validate_total')
  async validate(cat: Cat) {
    // ... logic
  }
}
```

**3. Using Logs**

The standard `Logger` is automatically instrumented. Trace Context (TraceId, SpanId) is automatically injected into logs.

```typescript
import { Logger, Injectable } from '@nestjs/common';

@Injectable()
export class CatsService {
  private readonly logger = new Logger(CatsService.name);

  create(cat: CreateCatDto) {
    // This log will automatically include trace_id and span_id
    this.logger.log(`Creating a new cat: ${cat.name}`);
    return 'This action adds a new cat';
  }
}
```

## API Endpoints

The application exposes the following endpoints under the `api/v1` prefix:

### Authentication (`/auth`)
- `POST /auth/register`: Register a new user
- `POST /auth/login`: Login and receive access/refresh tokens
- `GET /auth/me`: Get current user profile (Requires Auth)
- `PATCH /auth/me`: Update current user profile (Requires Auth)

### Health (`/health`)
- `GET /health`: Check system health status

### Files (`/files`)
- `POST /files/upload`: Upload a file (Requires Auth, multipart/form-data)

## Prerequisites

Ensure you have the following installed:

- **Node.js**: v22 (Recommended)
- **Yarn**: Package manager
- **PostgreSQL**: Relational database
- **Redis**: In-memory data structure store

## Installation

1.  **Clone the repository**

    ```bash
    git clone <repository-url>
    cd <project-directory>
    ```

2.  **Install dependencies**

    ```bash
    yarn install
    ```

3.  **Environment Configuration**

    Copy the example environment file and update the values:

    ```bash
    cp .env.example .env
    ```

    Update `.env` with your database, Redis, and other credentials.

4.  **Database Setup**

    Generate the Prisma client and run migrations:

    ```bash
    yarn prisma:gen
    # If you have migrations to apply:
    # yarn prisma migrate dev
    ```

## Running the Application

### Development

```bash
# Watch mode
yarn dev
# OR
yarn start:dev
```

### Production

```bash
# Build the application
yarn build

# Run the production build
yarn start:prod
```

## Testing

The project includes comprehensive testing setup:

- **Unit Tests**: Cover individual services and components.
- **E2E Tests**: Cover full application flows including:
  - User Authentication (Register, Login, Profile)
  - File Upload (S3 integration mocked)

```bash
# Unit tests
yarn test

# E2E tests
yarn test:e2e

# Test coverage
yarn test:cov
```

## Project Structure

```
src/
├── common/             # Shared modules, configs, decorators, filters, etc.
│   ├── auth/           # Authentication logic
│   ├── clients/        # External clients (S3, HTTP, etc.)
│   ├── config/         # Environment configurations
│   ├── decorators/     # Custom decorators
│   ├── filters/        # Global exception filters
│   ├── guards/         # Auth & Throttling guards
│   ├── interceptors/   # Response & Cache interceptors
│   ├── prisma/         # Prisma database module
│   └── redis/          # Redis module
├── user/               # User feature module
│   ├── dto/            # Data Transfer Objects
│   ├── user.controller.ts
│   ├── user-auth.controller.ts
│   ├── user.service.ts
│   └── email.processor.ts # Background job processor
├── health/             # Health check module
├── app.module.ts       # Root module
└── main.ts             # Application entry point
```

## Scripts

- `yarn prisma:gen`: Generate Prisma client and types.
- `yarn prisma:seed`: Seed the database.
- `yarn lint`: Lint and fix code style issues.
- `yarn format`: Format code with Prettier.

## CLI

This project integrates [nest-commander](https://nest-commander.jaymcdoniel.dev/) to run command-line tasks.

### Show help

- `help`: Show help for all available commands.

### Usage

**Development**

```bash
yarn cli help
```

**Production**

To run CLI commands in production, use the built files:

```bash
# 1. Build the project
yarn build

# 2. Run the command
node dist/src/cli help
```
