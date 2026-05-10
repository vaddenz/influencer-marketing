# Backend Development

Standard operating procedure for developing backend features in this NestJS project. Covers module creation, coding standards, database access patterns, testing, and auth/authorization.

## When to use

Use this skill when:
- Creating a new feature module (e.g., `invitations`, `deliverables`, `notifications`).
- Adding or modifying API endpoints, DTOs, services, or controllers.
- Writing or updating service-level unit tests.
- Fixing backend bugs or refactoring domain logic.
- Extending the Prisma schema with new models or enums.

## Prerequisites

- The dev environment is set up (Postgres, Redis, MinIO running; `.env` configured; `yarn install` done).
- You have read `backend/CLAUDE.md` for project-specific coding standards.
- You have read `backend/src/common/README.md` and `backend/src/common/utils/README.md` to know what shared infrastructure exists.

## Workflow

### 1. Understand the requirement

Read the spec or user story. Identify:
- Which entities/models are involved.
- Who can access what (role-based permissions).
- Existing modules or utilities that can be reused.

Before writing code, check `src/common/` for existing decorators, guards, filters, interceptors, and utils that solve the problem. Avoid duplicating logic.

### 2. Extend the Prisma schema (if needed)

If the feature requires new tables or fields, edit `prisma/schema.prisma` first.

**Rules:**
- Primary keys: use `String @id @default(cuid(2))`.
- Field naming: use camelCase (e.g., `userId`, `contentType`).
- Soft delete: every entity **must** include `deletedAt DateTime?` for logical deletion.
- Enums: define in the schema and reuse them in DTOs via `class-validator` `@IsEnum()`.
- Relations: keep them minimal and explicit; avoid implicit many-to-many if a join table needs extra fields.

After editing the schema:
```bash
npx prisma migrate dev --name <descriptive_name>
yarn prisma:gen
```

If seed data is needed, update `prisma/seed.ts` and run `yarn prisma:seed`.

### 3. Create the feature module

Follow the NestJS standard modular structure: `Module -> Controller -> Service`.

Create the directory under `src/<feature>/`:
```
src/<feature>/
├── dto/
│   ├── create-<feature>.dto.ts
│   └── update-<feature>.dto.ts
├── <feature>.module.ts
├── <feature>.controller.ts
├── <feature>.service.ts
└── <feature>.service.spec.ts
```

**File naming:** kebab-case for files (`invitation.service.ts`), PascalCase for classes (`InvitationService`).

#### 3.1 Module

Register the module in `AppModule`.

```typescript
import { Module } from '@nestjs/common'
import { FeatureController } from './feature.controller'
import { FeatureService } from './feature.service'

@Module({
  controllers: [FeatureController],
  providers: [FeatureService],
  exports: [FeatureService],
})
export class FeatureModule {}
```

Export the service if other modules need to consume it. Import `PrismaModule` if the service uses the database.

#### 3.2 DTOs

All inputs must use DTOs with `class-validator` decorators. Use `@ApiProperty` / `@ApiPropertyOptional` for Swagger docs.

```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsString, IsNotEmpty, Length, IsOptional, IsEnum } from 'class-validator'
import { SomeStatus } from '@/common/enums/some-status.enum'

export class CreateFeatureDto {
  @ApiProperty({ description: '...', example: '...' })
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  name!: string

  @ApiPropertyOptional({ description: '...' })
  @IsOptional()
  @IsEnum(SomeStatus)
  status?: SomeStatus
}
```

- Use `!` (definite assignment) for required fields.
- Use `?` for optional fields with `@IsOptional()`.
- For cross-field validation (e.g., date ranges), use custom `@ValidatorConstraint` classes.

#### 3.3 Service

Services contain all business logic and database access.

**Template:**

```typescript
import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common'
import { PrismaService } from '@/common/prisma/prisma.service'
import { CreateFeatureDto } from './dto/create-feature.dto'
import { UpdateFeatureDto } from './dto/update-feature.dto'

@Injectable()
export class FeatureService {
  private readonly logger = new Logger(FeatureService.name)

  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateFeatureDto) {
    const record = await this.prisma.feature.create({
      data: { ...dto, ownerId: userId },
    })
    this.logger.log(`Feature created by ${userId}: ${record.id}`)
    return record
  }

  async findOne(userId: string, id: string) {
    const record = await this.prisma.feature.findUnique({ where: { id } })
    if (!record) throw new NotFoundException('Feature not found')
    if (record.ownerId !== userId) throw new ForbiddenException('Access denied')
    return record
  }
}
```

**Service rules:**
- Inject `PrismaService` via `constructor(private readonly prisma: PrismaService)`.
- Instantiate `private readonly logger = new Logger(ClassName.name)`.
- For ownership checks: query first, check `ownerId` (or equivalent), then proceed.
- Throw NestJS built-in exceptions (`NotFoundException`, `ForbiddenException`, `BadRequestException`, `ConflictException`). Never build error response objects manually.
- Handle Prisma race conditions: catch `Prisma.PrismaClientKnownRequestError` with code `P2002` and throw `ConflictException`.
- Extract reusable `select` or `include` objects as module-level `const` when used in multiple methods.

#### 3.4 Controller

Controllers handle HTTP routing, auth guards, and role guards.

**Template:**

```typescript
import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Logger } from '@nestjs/common'
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard'
import { RolesGuard } from '@/common/guards/roles.guard'
import { Roles } from '@/common/decorators/roles.decorator'
import { CurrentUser, UserPayload } from '@/common/decorators/current-user.decorator'
import { Role } from '@/common/enums/role.enum'
import { FeatureService } from './feature.service'
import { CreateFeatureDto } from './dto/create-feature.dto'

@ApiTags('Features')
@ApiBearerAuth()
@Controller('features')
export class FeatureController {
  private readonly logger = new Logger(FeatureController.name)

  constructor(private readonly featureService: FeatureService) {}

  @Post()
  @Roles(Role.Brand)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async create(@CurrentUser() user: UserPayload, @Body() dto: CreateFeatureDto) {
    return this.featureService.create(user.id, dto)
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@CurrentUser() user: UserPayload, @Param('id') id: string) {
    return this.featureService.findOne(user.id, id)
  }
}
```

**Controller rules:**
- Apply `@ApiTags()` and `@ApiBearerAuth()` at the class level.
- Use `@Roles(Role.Brand)` + `@UseGuards(JwtAuthGuard, RolesGuard)` for role-restricted routes.
- Use `@UseGuards(JwtAuthGuard)` alone for routes that only require authentication.
- Extract the current user with `@CurrentUser() user: UserPayload`.
- Return the raw data object; do **not** wrap responses manually (`TransformInterceptor` handles `{ success, data, error, requestId, time }`).

### 4. Implement role-based access and scoped queries

When a resource has different visibility per role:

```typescript
async findAll(user: UserPayload) {
  if (user.role === Role.Brand) {
    return this.prisma.campaign.findMany({ where: { brandId: user.id } })
  }
  // Influencer: scoped to their accepted invitations
  return this.prisma.campaign.findMany({
    where: { invitations: { some: { influencerId: user.id, status: 'accepted' } } },
  })
}
```

For `findOne` with cross-role access:
1. Fetch the record with necessary relations.
2. Check if the user is the owner OR has an accepted invitation.
3. If neither, throw `ForbiddenException`.
4. If the user is an influencer, filter the response payload to scope nested arrays to their own data.

### 5. Write unit tests

Every service must have a `*.service.spec.ts` using mock Prisma.

**Test template:**

```typescript
import { Test, TestingModule } from '@nestjs/testing'
import { NotFoundException } from '@nestjs/common'
import { FeatureService } from './feature.service'
import { PrismaService } from '@/common/prisma/prisma.service'

const mockPrismaService = () => ({
  feature: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findMany: jest.fn(),
  },
})

describe('FeatureService', () => {
  let service: FeatureService
  let prisma: ReturnType<typeof mockPrismaService>

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeatureService,
        { provide: PrismaService, useFactory: mockPrismaService },
      ],
    }).compile()

    service = module.get<FeatureService>(FeatureService)
    prisma = module.get(PrismaService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
```

**Testing rules:**
- Mock `PrismaService` at the repository level (mock `prisma.feature.findUnique`, etc.).
- Test success paths and error paths (`NotFoundException`, `ForbiddenException`, `ConflictException`).
- Assert on both return values and the exact arguments passed to Prisma methods.
- For P2002 race conditions, construct `new Prisma.PrismaClientKnownRequestError(...)` in the mock.

### 6. Run checks before finishing

```bash
# Type check
yarn build

# Lint
yarn lint

# Unit tests for the new module
yarn test <feature>

# Full test suite (if time permits)
yarn test
```

Fix any compilation errors, lint issues, or test failures before considering the task complete.

## Coding standards summary

| Concern | Rule |
|---------|------|
| Imports | Use `@/` aliases for `src/`; avoid `../../` except within the same module. |
| Injection | `constructor(private readonly service: Service)` |
| Logging | `private readonly logger = new Logger(ClassName.name)` |
| Responses | Return raw data; never manually wrap `{ success, data }`. |
| Errors | Throw `HttpException` subclasses; never return error objects. |
| Prisma errors | `AllExceptionsFilter` maps P2002/P2025 to HTTP automatically. |
| Soft delete | All entities must have `deletedAt DateTime?`; do not use `prisma.xxx.delete()` directly unless intentionally hard-deleting. |
| Field naming | camelCase in both Prisma schema and TypeScript code. |
| DTOs | `class-validator` + `@ApiProperty` on every field. |

## Reusable building blocks

Check these locations before writing new code:

- **Auth & roles**: `src/common/guards/jwt-auth.guard.ts`, `src/common/guards/roles.guard.ts`, `src/common/decorators/roles.decorator.ts`, `src/common/decorators/current-user.decorator.ts`
- **Config**: `src/common/config/` — use `registerAs('feature', ...)` for new config sections.
- **Utils**: `src/common/utils/` — `ErrorUtil`, `TimeUtil`, `PromiseUtil`, `RetryUtil`, `RandomUtil`, `FileUtil`, `HashUtil`, `JSONUtil`.
- **Decorators**: `src/common/decorators/` — `@TrackMetrics`, `@CacheGroup`, `@InvalidateCache`, `@RequestId`.
- **Filters/Interceptors**: `AllExceptionsFilter`, `TransformInterceptor`, `UserCacheInterceptor`.
- **Observability**: `@TrackMetrics({ name: 'operation_name' })` on critical service methods.

## References

- `backend/CLAUDE.md` — project coding standards (Chinese)
- `backend/src/common/README.md` — common modules overview
- `backend/src/common/utils/README.md` — utility classes
- Existing feature modules for reference patterns:
  - `src/brands/` — simple CRUD + ownership
  - `src/influencers/` — CRUD + search/filter + pagination
  - `src/campaigns/` — CRUD + role-based list + scoped detail + ownership checks
