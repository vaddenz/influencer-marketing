# Common Modules

This directory contains the shared infrastructure, cross-cutting concerns, and utility modules for the application. These components are designed to be reusable across different feature modules. LLMs should use these modules to ensure consistent behavior and avoid duplicating logic.

## Directory Structure

- `auth/`: Authentication services and interfaces.
- `clients/`: External service clients (HTTP, S3).
- `config/`: Centralized configuration loading.
- `const/`: Global constants.
- `decorators/`: Custom NestJS decorators.
- `filters/`: Global exception filters.
- `guards/`: Authentication and throttling guards.
- `interceptors/`: Response transformation and caching interceptors.
- `middlewares/`: Express middlewares.
- `otel/`: OpenTelemetry integration for observability.
- `prisma/`: Database client service.
- `redis/`: Redis client service.
- `strategies/`: Passport authentication strategies.
- `utils/`: Stateless utility functions (see [Utils README](./utils/README.md)).

---

## Capabilities Overview

### Authentication (`auth/`, `strategies/`)
- **AuthService**: Handles JWT generation (access & refresh tokens) and verification.
- **JwtStrategy**: Passport strategy for verifying Bearer tokens.
- **Payloads**: Defines `JwtPayload` and `TokenResponse` interfaces.

### Clients (`clients/`)
- **BaseHTTPClient**: A robust fetch wrapper with:
  - Automatic retries (exponential backoff for network errors).
  - Timeout management.
  - Authentication header injection (`getHeaders(true)`).
  - File download capabilities (stream to file or buffer).
- **S3Client**: MinIO/S3 wrapper for object storage:
  - Uploads (Form files, Text, Buffers, URLs).
  - Presigned URLs.
  - Bucket management (auto-creation).

### Configuration (`config/`)
- Centralized configuration loader using `@nestjs/config`.
- Modules: `app`, `database`, `jwt`, `redis`, `storage`, `otel`, `http-client`, `health-check`.

### Decorators (`decorators/`)
- `@CurrentUser(key?)`: Extracts user payload from request.
- `@CacheGroup(name)`: Assigns a cache group for batch invalidation.
- `@InvalidateCache(options)`: Triggers cache invalidation after method execution.
- `@RequestId()`: Extracts the unique request ID.

### Filters (`filters/`)
- **AllExceptionsFilter**: Global error handler.
  - Standardizes error responses: `{ success: false, error: { code, message } }`.
  - Handles `Prisma` errors (unique constraints, foreign keys).
  - Skips logging for `ThrottlerException`.

### Guards (`guards/`)
- **JwtAuthGuard**: Protects routes using JWT.
- **CustomThrottlerGuard**: Rate limiting based on User ID (if auth) or IP address.

### Interceptors (`interceptors/`)
- **TransformInterceptor**: Standardizes success responses: `{ success: true, data: ... }`.
- **UserCacheInterceptor**: Advanced caching:
  - Extends `CacheInterceptor`.
  - User-aware and Tenant-aware caching (keys include Entity ID).
  - Supports `@CacheGroup` for grouped invalidation.
  - Prevents caching of `refresh=true` requests.

### Observability (`otel/`)
- **OtelModule**: Configures OpenTelemetry SDK.
- **Trace/Metrics/Logs**: Supports OTLP export (production) and Console export (dev).
- **@TrackMetrics()**: Decorator to automatically record method duration and execution count.

### Database & Cache (`prisma/`, `redis/`)
- **PrismaService**: Extends `PrismaClient` with `pg` adapter.
- **RedisService**: Provides access to raw Redis client.

### Middlewares (`middlewares/`)
- **RequestIdMiddleware**: Assigns `X-Request-Id` (UUID) to every request.

---

## Usage Guidelines for LLM

1.  **Prefer Utils**: Always check `src/common/utils` before writing helper functions.
2.  **Standard Response**: Do not manually format success responses; let `TransformInterceptor` handle it.
3.  **Error Handling**: Throw standard `HttpException` or `BadRequestException`; `AllExceptionsFilter` will format it.
4.  **HTTP Calls**: Extend `BaseHTTPClient` for external API integrations to inherit retry/timeout logic.
5.  **Caching**: Use `UserCacheInterceptor` for endpoints that need caching, and use `@InvalidateCache` on mutation methods.
6.  **Observability**: Add `@TrackMetrics()` to critical business logic methods.
