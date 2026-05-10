# Backend PR Review

Standard operating procedure for reviewing backend pull requests in this NestJS project. Covers architectural correctness, coding standards, security, performance, testing, and data integrity.

## When to use

Use this skill when:
- Reviewing a backend pull request (new features, bug fixes, refactors).
- Performing a pre-merge quality check on a backend branch.
- Auditing existing backend code for compliance with project standards.

## Prerequisites

- You have read `backend/CLAUDE.md` for project-specific coding standards.
- You have read the `backend-dev` skill for feature development conventions.
- You have read the `backend-e2e-test` skill for testing conventions.
- You can check out the branch locally and run quality gates.

## Workflow

### 1. Understand the change

Read the PR description and related tickets. Identify:
- Which entities/models are affected.
- Whether the change introduces new API endpoints, modifies existing ones, or is internal.
- Security implications (auth changes, data exposure, input validation).
- Whether database schema changes are included.

### 2. Verify structural compliance

Check that the file and naming conventions are followed:

| Concern | Rule |
|---------|------|
| File naming | kebab-case (e.g., `invitation.service.ts`, `create-campaign.dto.ts`) |
| Class naming | PascalCase (e.g., `InvitationService`, `CreateCampaignDto`) |
| Variable/function | camelCase (e.g., `createCampaign`, `findOne`) |
| Imports | Use `@/` aliases for `src/`; avoid `../../` except within the same module |
| Module structure | `Module -> Controller -> Service`, DTOs in `dto/` |

Flag any deviation.

### 3. Review the Prisma schema (if modified)

If `prisma/schema.prisma` is changed, verify:
- **Primary keys**: `String @id @default(cuid(2))`.
- **Field naming**: camelCase (e.g., `userId`, `contentType`).
- **Soft delete**: Every entity **must** include `deletedAt DateTime?`. If missing, block the PR.
- **Enums**: Defined in schema and reused in DTOs.
- **Relations**: Explicit and minimal; avoid implicit many-to-many if a join table needs extra fields.
- **Migrations**: A matching migration file should be present.

### 4. Review DTOs

Every input must have a DTO with `class-validator` decorators.

Checklist:
- [ ] Required fields use `@IsString()`, `@IsNotEmpty()`, `@IsEnum()`, etc.
- [ ] Optional fields use `@IsOptional()`.
- [ ] Swagger decorators `@ApiProperty` / `@ApiPropertyOptional` are present.
- [ ] Cross-field validation (e.g., date ranges) uses custom `@ValidatorConstraint` classes.
- [ ] Pagination DTOs include `@Min(1)`, `@Max(100)`, `@Type(() => Number)`.
- [ ] No raw `@Query('param')` or `@Body()` without a DTO class.

### 5. Review services

Services contain all business logic and database access.

Checklist:
- [ ] **Constructor injection**: `constructor(private readonly prisma: PrismaService)`.
- [ ] **Logger**: `private readonly logger = new Logger(ClassName.name)`.
- [ ] **Existence checks**: Query before updating; throw `NotFoundException` if missing.
- [ ] **Ownership checks**: Verify `ownerId` or equivalent before mutating.
- [ ] **Error types**: Throw NestJS `HttpException` subclasses (`NotFoundException`, `ForbiddenException`, `BadRequestException`, `ConflictException`). **Never** throw raw `Error`.
- [ ] **Prisma errors**: Catch `Prisma.PrismaClientKnownRequestError` code `P2002` and throw `ConflictException`.
- [ ] **Soft deletes**: Use `prisma.xxx.update({ data: { deletedAt: new Date() } })`, never `prisma.xxx.delete()` unless hard-deletion is explicitly justified.
- [ ] **Select constants**: Repeated `select`/`include` blocks should be extracted as module-level constants.
- [ ] **Transactions**: Multi-step writes must use `prisma.$transaction(async (tx) => { ... })` (interactive form), not the raw promise array form. Read-check-update sequences must be inside the same transaction to avoid race conditions.
- [ ] **Data leaks**: Verify that `select` does not expose sensitive fields (e.g., `email`, `passwordHash`) in public-facing or cross-role endpoints.
- [ ] **Role scoping**: `findAll` and `findOne` must scope results to the caller's role/ownership.

### 6. Review controllers

Controllers handle HTTP routing, guards, and decorators.

Checklist:
- [ ] **Path prefix**: Use `@Controller('features')`, not `@Controller('api/v1/features')`. The global prefix is handled in `main.ts`.
- [ ] **Swagger**: `@ApiTags()`, `@ApiBearerAuth()`, `@ApiOperation()`, `@ApiResponse()` must be present. New controllers without Swagger are incomplete.
- [ ] **Auth guards**: `@UseGuards(JwtAuthGuard)` for authenticated routes; `@Roles(Role.Brand)` + `@UseGuards(JwtAuthGuard, RolesGuard)` for role-restricted routes.
- [ ] **Current user**: Extract with `@CurrentUser() user: UserPayload`.
- [ ] **Response wrapping**: Return raw data objects; do not manually wrap `{ success, data }`. `TransformInterceptor` handles this.
- [ ] **`@Res()` usage**: If `@Res()` is used, it must include `passthrough: true` unless there is an explicit justification. Using `@Res()` without `passthrough` disables global interceptors.
- [ ] **DELETE responses**: Return `204 No Content` (`@HttpCode(HttpStatus.NO_CONTENT)`) with `Promise<void>`, not `200 OK` with a body.
- [ ] **Empty stubs**: Remove or populate empty controllers.

### 7. Review authentication & authorization

- [ ] New endpoints that should be protected have guards.
- [ ] Role checks use `@Roles()` + `RolesGuard`, not manual `if (role !== ...)` in controllers.
- [ ] OAuth/linking logic throws `HttpException` subclasses, not raw `Error`.
- [ ] Rate limiting considerations: new public or expensive endpoints should be reviewed for throttling needs.

### 8. Review security

- [ ] **Input validation**: All user inputs pass through validated DTOs.
- [ ] **SQL injection**: Prisma queries are safe by default; flag any raw query usage.
- [ ] **Data exposure**: Check that nested relations in responses do not leak other users' data.
- [ ] **CORS**: Do not widen `origin: '*'` or `methods: '*'`. Use environment-based configuration.
- [ ] **Secrets**: No hardcoded secrets, tokens, or credentials in code.

### 9. Review tests

- [ ] **Unit tests**: Every new service must have a `*.service.spec.ts`.
- [ ] **Mock level**: Mock `PrismaService` at the repository level (mock `prisma.feature.findUnique`, etc.).
- [ ] **Coverage**: Test success paths and error paths (`NotFoundException`, `ForbiddenException`, `ConflictException`).
- [ ] **E2E tests**: New business flows should have E2E coverage in `test/`. Follow the `backend-e2e-test` skill.
- [ ] **Race conditions**: If the code handles `P2002`, the test should verify it with a mock error.
- [ ] **Build passes**: `yarn build` succeeds (type check + compile).

### 10. Run quality gates

Since there is no CI/CD pipeline, you must run checks manually (or verify the author has):

```bash
# Type check and compile
yarn build

# Lint and auto-fix
yarn lint

# Unit tests
yarn test

# E2E tests (if integration touched)
yarn test:e2e
```

Flag any failures. Do not approve if `yarn build` or `yarn test` fails.

### 11. Final review checklist

Before approving, verify:
- [ ] No `console.log` or debug statements left in production code.
- [ ] No commented-out code blocks.
- [ ] Dead code (unused imports, unused variables, unused methods) is removed.
- [ ] Magic strings are replaced with enums or constants.
- [ ] Hardcoded values (salt rounds, pagination defaults, magic numbers) are extracted to constants or config.
- [ ] Consistency with existing modules (naming, structure, patterns).

## Common anti-patterns to flag

| Anti-pattern | Why it's wrong | Correct approach |
|--------------|----------------|------------------|
| `prisma.xxx.delete()` | Violates soft-delete convention | `prisma.xxx.update({ data: { deletedAt: new Date() } })` |
| `throw new Error('...')` | Bypasses global exception filter; returns unformatted 500 | `throw new NotFoundException(...)` or similar |
| `@Res() res: Response` | Disables `TransformInterceptor` and other global interceptors | `@Res({ passthrough: true }) res: Response` |
| `@Controller('api/v1/...')` | Causes double prefix with global prefix | `@Controller('features')` |
| `prisma.$transaction([...])` with raw promises | Cannot read results within transaction; race conditions | `prisma.$transaction(async (tx) => { ... })` |
| Missing `findUnique` before `update` | Produces unclear Prisma errors instead of clean 404 | Check existence and throw `NotFoundException` |
| Exposing `email` / `passwordHash` in public responses | Data leak / security risk | Use explicit `select` to exclude sensitive fields |
| Raw `@Query('id')` without DTO | No validation on query parameters | Create a DTO with `class-validator` decorators |
| `DELETE` returning `200 OK` with body | Violates REST convention for deletion | Return `204 No Content` with `Promise<void>` |
| Hardcoded bcrypt salt rounds | Inconsistent hashing configuration | Use a shared constant or config value |
| `if (user.role !== 'brand')` in controller | Bypasses `RolesGuard` | Use `@Roles(Role.Brand)` + `@UseGuards(RolesGuard)` |
| Empty controller with no routes | Confusing structure; dead code | Remove or add routes |

## Reusable building blocks to verify usage of

Before approving new code, check that existing infrastructure is reused rather than reinvented:

- **Auth & roles**: `src/common/guards/jwt-auth.guard.ts`, `src/common/guards/roles.guard.ts`, `src/common/decorators/roles.decorator.ts`, `src/common/decorators/current-user.decorator.ts`
- **Config**: `src/common/config/` — new config sections should use `registerAs()`
- **Utils**: `src/common/utils/` — `ErrorUtil`, `TimeUtil`, `PromiseUtil`, `RetryUtil`, `RandomUtil`, `FileUtil`, `HashUtil`, `JSONUtil`
- **Decorators**: `src/common/decorators/` — `@TrackMetrics`, `@CacheGroup`, `@InvalidateCache`, `@RequestId`
- **Filters/Interceptors**: `AllExceptionsFilter`, `TransformInterceptor`, `UserCacheInterceptor`
- **Observability**: `@TrackMetrics({ name: 'operation_name' })` on critical service methods

## References

- `backend/CLAUDE.md` — project coding standards
- `backend-dev` skill — feature development workflow
- `backend-e2e-test` skill — E2E testing workflow
- Existing modules for reference patterns:
  - `src/brands/` — simple CRUD + ownership + `select` constants
  - `src/influencers/` — CRUD + search/filter + pagination
  - `src/campaigns/` — CRUD + role-based list + scoped detail + transactions
  - `src/invitations/` — complex multi-entity transactions + notifications + race-condition guards
