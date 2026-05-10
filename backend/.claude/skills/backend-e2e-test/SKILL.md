# Backend E2E Testing

Standard operating procedure for writing end-to-end (E2E) tests in this NestJS backend. Covers test structure, app bootstrap, database cleanup, authentication patterns, multi-actor flows, negative cases, and external verification.

## When to use

Use this skill when:
- Adding E2E tests for new API endpoints or business flows.
- Extending existing multi-actor flows (e.g., brand + influencer interactions).
- Fixing flaky E2E tests or debugging integration issues.
- Verifying real external integrations (S3/MinIO, database state).

## Prerequisites

- The dev environment is set up (Postgres, Redis, MinIO running; `.env` configured; `yarn install` done).
- Unit tests for the corresponding service already pass.
- You have read `backend/CLAUDE.md` for project coding standards.
- You have read the `backend-dev` skill for feature development conventions.

## Workflow

### 1. Scope the E2E test

Decide what the test covers:
- Which endpoints are involved?
- How many actors (users/roles) participate?
- What state transitions happen (e.g., register -> login -> create -> invite)?
- What external side effects need verification (S3 file existence, DB rows)?

Prefer one E2E spec per cohesive business flow rather than one per endpoint.

### 2. Create the test file

Create the file under `test/` using kebab-case:

```
test/<flow>.e2e-spec.ts
```

Examples: `brand-flow.e2e-spec.ts`, `file.e2e-spec.ts`, `user-auth.e2e-spec.ts`.

All E2E tests live in this single flat directory.

### 3. Bootstrap the NestJS application

Every E2E test must bootstrap the full application with the same global configuration used in production.

**Standard bootstrap template:**

```typescript
import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import request from 'supertest'
import { AppModule } from '@/app.module'
import { PrismaService } from '@/common/prisma/prisma.service'
import { TransformInterceptor } from '@/common/interceptors/transform.interceptor'
import { GLOBAL_PREFIX, HEALTH_CHECK_PATH } from '@/common/const/app'

describe('Feature Flow (e2e)', () => {
  let app: INestApplication
  let prisma: PrismaService

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleFixture.createNestApplication()
    app.setGlobalPrefix(GLOBAL_PREFIX)
    app.useGlobalPipes(new ValidationPipe({ transform: true }))
    app.useGlobalInterceptors(new TransformInterceptor([HEALTH_CHECK_PATH]))
    prisma = app.get(PrismaService)
    await app.init()
  })

  afterAll(async () => {
    await prisma.$disconnect()
    await app.close()
  })
})
```

**Bootstrap rules:**
- Always import `AppModule`; do not manually assemble modules.
- Apply `setGlobalPrefix(GLOBAL_PREFIX)` to match production routing (`/api/v1/...`).
- Apply `useGlobalPipes(new ValidationPipe({ transform: true }))` for DTO validation.
- Apply `useGlobalInterceptors(new TransformInterceptor([HEALTH_CHECK_PATH]))` so response wrapping is active.
- Retrieve `PrismaService` via `app.get(PrismaService)` for cleanup and verification.

### 4. Clean up the database

Remove test data in `beforeAll` (and optionally `afterAll`) to avoid state leakage between runs.

**Dependency-order cleanup:**

```typescript
beforeAll(async () => {
  // ... bootstrap ...

  await prisma.notification.deleteMany()
  await prisma.deliverable.deleteMany()
  await prisma.invitation.deleteMany()
  await prisma.campaign.deleteMany()
  await prisma.brandProfile.deleteMany()
  await prisma.influencerProfile.deleteMany()
  await prisma.user.deleteMany()
})
```

**Cleanup rules:**
- Delete child tables before parent tables to avoid foreign-key constraint errors.
- Use hardcoded test emails to target specific rows when you do not want to wipe the entire table.
- Do not rely on global setup/teardown files; each spec is self-contained.

### 5. Authenticate test actors

E2E tests use real JWT tokens obtained through the actual register/login endpoints.

**Single-actor auth helper:**

```typescript
const TEST_EMAIL = 'test@example.com'
const TEST_PASSWORD = 'password123'
let authToken: string

const login = async () => {
  const res = await request(app.getHttpServer())
    .post('/api/v1/auth/login')
    .send({ email: TEST_EMAIL, password: TEST_PASSWORD })
    .expect(201)
  authToken = res.body.data.accessToken
  return authToken
}

// In a protected test:
if (!authToken) await login()
```

**Multi-actor pattern (brand + influencer):**

```typescript
let brandAccessToken: string
let influencerAccessToken: string

it('logs in as brand', async () => {
  const res = await request(app.getHttpServer())
    .post('/api/v1/auth/login')
    .send({ email: BRAND_EMAIL, password: BRAND_PASSWORD })
    .expect(201)
  brandAccessToken = res.body.data.accessToken
})
```

**Auth rules:**
- Do not mock `JwtAuthGuard` or bypass authentication.
- Use unique emails per actor to avoid collisions.
- Lazily initialize tokens (`if (!token) await login()`) so tests can run independently if reordered.

### 6. Write test cases

Structure the flow as sequential `it()` blocks that build state:

```typescript
it('registers a user', async () => {
  const res = await request(app.getHttpServer())
    .post('/api/v1/auth/register')
    .send({ email: TEST_EMAIL, password: TEST_PASSWORD, name: 'Test', role: 'brand' })
    .expect(201)
  expect(res.body.data.email).toEqual(TEST_EMAIL)
})

it('creates a resource', async () => {
  if (!authToken) await login()
  const res = await request(app.getHttpServer())
    .post('/api/v1/features')
    .set('Authorization', `Bearer ${authToken}`)
    .send({ name: 'New Feature' })
    .expect(201)
  featureId = res.body.data.id
  expect(featureId).toBeDefined()
})
```

**Test-writing rules:**
- Assert both HTTP status codes and response body structure.
- Store created IDs in scoped `let` variables for use in later tests.
- Use `request(app.getHttpServer())` for all HTTP calls.
- Remember the global prefix is `/api/v1`.

### 7. Cover negative cases

Every flow should verify error handling:

```typescript
it('returns 401 for unauthorized access', async () => {
  await request(app.getHttpServer())
    .get('/api/v1/features')
    .expect(401)
})

it('returns 409 for duplicate registration', async () => {
  await request(app.getHttpServer())
    .post('/api/v1/auth/register')
    .send({ email: TEST_EMAIL, password: TEST_PASSWORD, name: 'Dup', role: 'brand' })
    .expect(409)
})

it('returns 404 for non-existent resource', async () => {
  if (!authToken) await login()
  await request(app.getHttpServer())
    .get('/api/v1/features/nonexistent-id')
    .set('Authorization', `Bearer ${authToken}`)
    .expect(404)
})

it('returns 400 for invalid input', async () => {
  if (!authToken) await login()
  await request(app.getHttpServer())
    .post('/api/v1/features')
    .set('Authorization', `Bearer ${authToken}`)
    .send({ name: '' })
    .expect(400)
})
```

### 8. Verify external side effects

When the endpoint interacts with S3, queues, or other externals, verify the result directly:

```typescript
it('uploads a file and persists to S3', async () => {
  if (!authToken) await login()
  const res = await request(app.getHttpServer())
    .post('/api/v1/files/upload')
    .set('Authorization', `Bearer ${authToken}`)
    .attach('file', Buffer.from('hello'), 'test.txt')
    .expect(201)

  const { key, bucket } = res.body.data
  const exists = await s3Client.isFileExists(bucket, key)
  expect(exists).toBe(true)
})
```

**External verification rules:**
- Import the real client (e.g., `S3Client`) from `src/common/clients/`.
- Verify DB state via `prisma.<model>.findUnique()` when the HTTP response is not enough.
- Do not mock external services in E2E tests.

### 9. Run and debug

```bash
# Run the full E2E suite
yarn test:e2e

# Run a single E2E spec
yarn test:e2e -- test/brand-flow.e2e-spec.ts

# Run with verbose output
yarn test:e2e -- --verbose
```

**Debugging tips:**
- If tests fail with connection errors, verify Postgres, Redis, and MinIO are running.
- If `409 Conflict` appears unexpectedly, stale test data may remain; check cleanup logic.
- If `401 Unauthorized` appears unexpectedly, verify the global prefix (`/api/v1`) is set in bootstrap.
- Use `--detectOpenHandles` (already enabled in `test:e2e`) to catch unclosed DB connections or timers.

### 10. Final checks

```bash
yarn build
yarn lint
yarn test:e2e
```

Fix any compilation errors, lint issues, or test failures before finishing.

## Coding standards summary

| Concern | Rule |
|---------|------|
| File naming | kebab-case, suffix `.e2e-spec.ts` |
| Location | `backend/test/` (flat structure) |
| Imports | Use `@/` aliases for `src/` modules |
| Bootstrap | Full `AppModule`, apply global prefix/pipes/interceptors |
| Auth | Real register/login; no mocked guards |
| Cleanup | Explicit `deleteMany` in child-before-parent order |
| State sharing | Scoped `let` variables across sequential `it()` blocks |
| Assertions | Check status code + response body structure |
| Externals | Verify real side effects (S3, DB) when applicable |
| Negatives | Always cover 400, 401, 404, 409 where relevant |

## Reusable building blocks

Check these before writing new test code:

- **Jest config**: `test/jest-e2e.json` — path aliases, `ts-jest`, `.e2e-spec.ts` regex
- **App bootstrap**: `AppModule` from `@/app.module`
- **Global prefix**: `GLOBAL_PREFIX` from `@/common/const/app`
- **Response interceptor**: `TransformInterceptor` from `@/common/interceptors/transform.interceptor`
- **Prisma**: `PrismaService` from `@/common/prisma/prisma.service` for DB cleanup/verification
- **S3**: `S3Client` from `@/common/clients/s3.client` for storage verification
- **Config**: `ConfigService` from `@nestjs/config` for reading bucket names or endpoints

## References

- `backend/CLAUDE.md` — project coding standards
- `backend-dev` skill — feature development workflow
- Existing E2E specs for reference patterns:
  - `test/user-auth.e2e-spec.ts` — auth lifecycle, cache verification
  - `test/brand-flow.e2e-spec.ts` — multi-actor business flow
  - `test/file.e2e-spec.ts` — file upload with S3 verification
  - `test/s3.client.e2e-spec.ts` — direct S3 client integration
