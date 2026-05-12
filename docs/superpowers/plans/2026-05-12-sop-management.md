# SOP Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build AI-powered SOP generation, Feishu bot integration for push/reminders/commands, and brand/influencer UI for SOP management.

**Architecture:** New `sop` and `feishu` backend modules. SOP steps stored as JSON array. Feishu bot receives webhooks at `/webhooks/feishu` (bypasses API version prefix), handles text commands, and runs a daily cron for reminders. Frontend adds SOP card to brand campaign detail and read-only timeline to influencer campaign detail.

**Tech Stack:** NestJS + Prisma + PostgreSQL (backend), Next.js 16 + Tailwind v4 (frontend), Feishu Messaging API, OpenAI GPT-4o via existing LLMService.

---

## File Structure

### Backend — New Files

| File | Responsibility |
|------|-------------|
| `backend/prisma/migrations/*/migration.sql` | Add `Sop`, `SopBinding`, `SopReminderLog`; extend `NotificationType` |
| `backend/src/sop/sop.module.ts` | Module registration |
| `backend/src/sop/sop.controller.ts` | REST endpoints under `/v1/sops` |
| `backend/src/sop/sop.service.ts` | CRUD, access control, push orchestration |
| `backend/src/sop/sop-generation.service.ts` | AI generation via LLMService + PromptService |
| `backend/src/sop/dto/generate-sop.dto.ts` | `POST /v1/sops` input |
| `backend/src/sop/dto/update-sop.dto.ts` | `PATCH /v1/sops/:id` input |
| `backend/src/sop/dto/sop-step.dto.ts` | Shared step schema for validation |
| `backend/src/feishu/feishu.module.ts` | Module registration |
| `backend/src/feishu/feishu.controller.ts` | Webhook receiver at `/webhooks/feishu` |
| `backend/src/feishu/feishu.service.ts` | Feishu Message API wrapper + signature verify |
| `backend/src/feishu/feishu-command.service.ts` | `/绑定`, `/进度`, `/延期` command handlers |
| `backend/src/feishu/feishu-scheduler.service.ts` | Daily 9:00 AM Asia/Tokyo reminder cron |
| `backend/src/feishu/dto/feishu-webhook.dto.ts` | Webhook payload types |
| `backend/src/common/config/feishu.config.ts` | Feishu env vars (`FEISHU_APP_ID`, etc.) |

### Backend — Modified Files

| File | Change |
|------|--------|
| `backend/prisma/schema.prisma` | Add models and enum values |
| `backend/src/app.module.ts` | Import `SopModule`, `FeishuModule`, `ScheduleModule` |
| `backend/src/main.ts` | Exclude `FeishuController` from global prefix |
| `backend/src/campaigns/campaigns.service.ts` | Include `sop: true` in `findOne` |
| `backend/src/common/config/index.ts` | Export `feishuConfig` |
| `backend/.env.example` | Add Feishu env vars |

### Frontend — New Files

| File | Responsibility |
|------|-------------|
| `frontend/app/brand/campaigns/[id]/components/sop-card.tsx` | SOP display + actions for brand |
| `frontend/app/brand/campaigns/[id]/components/sop-generate-modal.tsx` | Brief refinement + generate form |
| `frontend/app/brand/campaigns/[id]/components/sop-edit-modal.tsx` | Edit SOP steps inline |
| `frontend/app/influencer/campaigns/[id]/components/sop-timeline.tsx` | Read-only SOP timeline |

### Frontend — Modified Files

| File | Change |
|------|--------|
| `frontend/app/brand/campaigns/[id]/page.tsx` | Import and render `<SopCard>` |
| `frontend/app/influencer/campaigns/[id]/page.tsx` | Import and render `<SopTimeline>` |
| `frontend/messages/zh.json` | Add SOP-related i18n keys |
| `frontend/messages/en.json` | Add SOP-related i18n keys |
| `frontend/messages/ja.json` | Add SOP-related i18n keys |

### Tests — New Files

| File | Responsibility |
|------|-------------|
| `backend/src/sop/sop.service.spec.ts` | CRUD, access control, push |
| `backend/src/sop/sop-generation.service.spec.ts` | Schema validation, retry logic |
| `backend/src/feishu/feishu-command.service.spec.ts` | Command parser, bind, progress, delay |
| `backend/src/feishu/feishu-scheduler.service.spec.ts` | Reminder eligibility logic |

---

## Task 1: Database Schema & Migration

**Files:**
- Modify: `backend/prisma/schema.prisma`
- Create: migration (via `npx prisma migrate dev`)

- [ ] **Step 1: Add Prisma models and enum values**

Add to `backend/prisma/schema.prisma` after the `Notification` model:

```prisma
enum SopStatus {
  generated
  active
  completed
}

model Sop {
  id             String    @id @default(cuid(2))
  campaignId     String    @unique
  title          String
  publishDate    DateTime  @db.Date
  targetMarket   String
  influencerType String
  sellingPoints  Json
  steps          Json
  status         SopStatus @default(generated)
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
  deletedAt      DateTime?

  campaign   Campaign      @relation(fields: [campaignId], references: [id], onDelete: Cascade)
  bindings   SopBinding[]
}

model SopBinding {
  id           String   @id @default(cuid(2))
  sopId        String
  invitationId String
  chatId       String
  boundAt      DateTime @default(now())
  sopPushedAt  DateTime?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  sop        Sop        @relation(fields: [sopId], references: [id], onDelete: Cascade)
  invitation Invitation @relation(fields: [invitationId], references: [id], onDelete: Cascade)

  @@unique([invitationId])
  @@index([sopId])
}

model SopReminderLog {
  id           String   @id @default(cuid(2))
  sopBindingId String
  stepIndex    Int
  reminderType String
  sentAt       DateTime @default(now())

  sopBinding SopBinding @relation(fields: [sopBindingId], references: [id], onDelete: Cascade)

  @@unique([sopBindingId, stepIndex, reminderType])
  @@index([sopBindingId])
}
```

Extend the existing `NotificationType` enum:

```prisma
enum NotificationType {
  invitation_received
  invitation_accepted
  invitation_declined
  campaign_updated
  deliverable_due
  deliverables_completed
  sop_pushed
  sop_reminder
  sop_delay_requested
}
```

Add the `sop` relation to `Campaign`:

```prisma
model Campaign {
  // ... existing fields ...
  sop          Sop?
}
```

- [ ] **Step 2: Generate migration and Prisma client**

Run:
```bash
cd /Users/pw/workspace/src/influencer-marketing/backend
npx prisma migrate dev --name add_sop
npx prisma generate
```

Expected: Migration created, Prisma client regenerated in `src/generated/prisma`.

- [ ] **Step 3: Commit**

```bash
git add backend/prisma/schema.prisma backend/prisma/migrations/
git commit -m "feat(sop): add Sop, SopBinding, SopReminderLog tables; extend NotificationType"
```

---

## Task 2: Feishu Configuration

**Files:**
- Create: `backend/src/common/config/feishu.config.ts`
- Modify: `backend/src/common/config/index.ts`
- Modify: `backend/.env.example`

- [ ] **Step 1: Create Feishu config**

```typescript
import { registerAs } from '@nestjs/config'

export default registerAs('feishu', () => ({
  appId: process.env.FEISHU_APP_ID || '',
  appSecret: process.env.FEISHU_APP_SECRET || '',
  webhookVerifyToken: process.env.FEISHU_WEBHOOK_VERIFY_TOKEN || '',
}))
```

- [ ] **Step 2: Register in config index**

In `backend/src/common/config/index.ts`, add:
```typescript
import feishuConfig from './feishu.config'

export const configurations = [
  // ... existing configs ...
  feishuConfig,
]

export {
  // ... existing exports ...
  feishuConfig,
}
```

- [ ] **Step 3: Update `.env.example`**

Append:
```
FEISHU_APP_ID=
FEISHU_APP_SECRET=
FEISHU_WEBHOOK_VERIFY_TOKEN=
```

- [ ] **Step 4: Commit**

```bash
git add backend/src/common/config/ backend/.env.example
git commit -m "feat(feishu): add feishu configuration"
```

---

## Task 3: SOP DTOs

**Files:**
- Create: `backend/src/sop/dto/generate-sop.dto.ts`
- Create: `backend/src/sop/dto/update-sop.dto.ts`
- Create: `backend/src/sop/dto/sop-step.dto.ts`

- [ ] **Step 1: Create sop-step.dto.ts**

```typescript
import { IsString, IsInt, IsArray, IsNotEmpty, ArrayNotEmpty } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class SopStepDto {
  @ApiProperty({ example: '初稿提交' })
  @IsString()
  @IsNotEmpty()
  name!: string

  @ApiProperty({ example: '提交短视频脚本框架' })
  @IsString()
  @IsNotEmpty()
  description!: string

  @ApiProperty({ example: -7, description: 'Days relative to publishDate. Negative = before.' })
  @IsInt()
  dueDateOffset!: number

  @ApiProperty({ example: ['15秒开头抓眼球', '卖点韩语标注'] })
  @IsArray()
  @IsString({ each: true })
  requirements!: string[]
}
```

- [ ] **Step 2: Create generate-sop.dto.ts**

```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsString, IsNotEmpty, IsDateString, IsArray, IsOptional } from 'class-validator'

export class GenerateSopDto {
  @ApiProperty({ example: 'campaign_cuid' })
  @IsString()
  @IsNotEmpty()
  campaignId!: string

  @ApiProperty({ example: 'kr', enum: ['kr', 'jp'] })
  @IsString()
  @IsNotEmpty()
  targetMarket!: string

  @ApiProperty({ example: 'beauty', enum: ['beauty', 'fashion', 'lifestyle'] })
  @IsString()
  @IsNotEmpty()
  influencerType!: string

  @ApiProperty({ example: ['天然成分', '持久度'] })
  @IsArray()
  @IsString({ each: true })
  sellingPoints!: string[]

  @ApiProperty({ example: '2026-06-10' })
  @IsDateString()
  publishDate!: string
}
```

- [ ] **Step 3: Create update-sop.dto.ts**

```typescript
import { PartialType } from '@nestjs/swagger'
import { IsString, IsOptional, IsDateString, IsArray, ValidateNested, IsEnum } from 'class-validator'
import { Type } from 'class-transformer'
import { SopStepDto } from './sop-step.dto'
import { SopStatus } from '@/generated/prisma'

export class UpdateSopDto {
  @IsOptional()
  @IsString()
  title?: string

  @IsOptional()
  @IsDateString()
  publishDate?: string

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SopStepDto)
  steps?: SopStepDto[]

  @IsOptional()
  @IsEnum(SopStatus)
  status?: SopStatus
}
```

- [ ] **Step 4: Commit**

```bash
git add backend/src/sop/dto/
git commit -m "feat(sop): add SOP DTOs"
```

---

## Task 4: SOP Generation Service

**Files:**
- Create: `backend/src/sop/sop-generation.service.ts`
- Create: `backend/src/sop/sop-generation.service.spec.ts`

- [ ] **Step 1: Implement SopGenerationService**

```typescript
import { Injectable, Logger, BadRequestException, ServiceUnavailableException } from '@nestjs/common'
import { LLMService } from '@/ai/llm/llm.service'
import { PromptService } from '@/ai/prompt/prompt.service'
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions'

export interface SOPGenerationOutput {
  title: string
  steps: {
    name: string
    description: string
    dueDateOffset: number
    requirements: string[]
  }[]
}

@Injectable()
export class SopGenerationService {
  private readonly logger = new Logger(SopGenerationService.name)

  constructor(
    private readonly llmService: LLMService,
    private readonly promptService: PromptService
  ) {}

  async generate(variables: {
    campaignTitle: string
    description: string
    targetMarket: string
    influencerType: string
    sellingPoints: string
    publishDate: string
  }): Promise<SOPGenerationOutput> {
    const prompt = await this.promptService.getPrompt('sop-generator', variables)

    const messages: ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content:
          'You are an expert in influencer marketing operations in Korea and Japan. You generate structured SOP workflows as JSON. All deadlines must be on or before the publish date (dueDateOffset <= 0).',
      },
      { role: 'user', content: prompt },
    ]

    let result: SOPGenerationOutput | null = null
    let attempts = 0
    const maxAttempts = 2

    while (attempts < maxAttempts && !result) {
      attempts++
      try {
        result = await this.llmService.createTypedCompletion<SOPGenerationOutput>(messages)
      } catch (error) {
        this.logger.warn(`SOP generation attempt ${attempts} failed`, error)
      }
    }

    if (!result) {
      throw new ServiceUnavailableException('SOP generation failed, please try again')
    }

    if (!this.validateSchema(result)) {
      this.logger.error('AI generated invalid SOP structure', JSON.stringify(result))
      throw new BadRequestException('AI generated invalid SOP structure')
    }

    return result
  }

  validateSchema(output: unknown): output is SOPGenerationOutput {
    if (typeof output !== 'object' || output === null) return false
    const o = output as Record<string, unknown>
    if (typeof o.title !== 'string' || o.title.length === 0) return false
    if (!Array.isArray(o.steps) || o.steps.length === 0) return false

    for (const step of o.steps) {
      if (typeof step !== 'object' || step === null) return false
      if (typeof step.name !== 'string' || step.name.length === 0) return false
      if (typeof step.description !== 'string' || step.description.length === 0) return false
      if (typeof step.dueDateOffset !== 'number' || !Number.isInteger(step.dueDateOffset)) return false
      if (step.dueDateOffset > 0) return false
      if (!Array.isArray(step.requirements)) return false
      if (!step.requirements.every((r: unknown) => typeof r === 'string')) return false
    }

    return true
  }
}
```

- [ ] **Step 2: Write unit tests**

```typescript
import { Test, TestingModule } from '@nestjs/testing'
import { SopGenerationService, SOPGenerationOutput } from './sop-generation.service'
import { LLMService } from '@/ai/llm/llm.service'
import { PromptService } from '@/ai/prompt/prompt.service'

describe('SopGenerationService', () => {
  let service: SopGenerationService
  let llmService: jest.Mocked<LLMService>
  let promptService: jest.Mocked<PromptService>

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SopGenerationService,
        {
          provide: LLMService,
          useValue: { createTypedCompletion: jest.fn() },
        },
        {
          provide: PromptService,
          useValue: { getPrompt: jest.fn().mockResolvedValue('test prompt') },
        },
      ],
    }).compile()

    service = module.get(SopGenerationService)
    llmService = module.get(LLMService)
    promptService = module.get(PromptService)
  })

  it('should generate and validate valid SOP', async () => {
    const valid: SOPGenerationOutput = {
      title: 'Test SOP',
      steps: [
        { name: 'Step 1', description: 'Desc', dueDateOffset: -7, requirements: ['req'] },
      ],
    }
    llmService.createTypedCompletion.mockResolvedValueOnce(valid)

    const result = await service.generate({
      campaignTitle: 'Test',
      description: 'Desc',
      targetMarket: 'kr',
      influencerType: 'beauty',
      sellingPoints: '[]',
      publishDate: '2026-06-10',
    })

    expect(result.title).toBe('Test SOP')
    expect(promptService.getPrompt).toHaveBeenCalledWith('sop-generator', expect.any(Object))
  })

  it('should retry once on failure then succeed', async () => {
    const valid: SOPGenerationOutput = {
      title: 'Test',
      steps: [{ name: 'S', description: 'D', dueDateOffset: -3, requirements: [] }],
    }
    llmService.createTypedCompletion
      .mockRejectedValueOnce(new Error('timeout'))
      .mockResolvedValueOnce(valid)

    const result = await service.generate({
      campaignTitle: 'Test',
      description: 'Desc',
      targetMarket: 'kr',
      influencerType: 'beauty',
      sellingPoints: '[]',
      publishDate: '2026-06-10',
    })

    expect(result).toEqual(valid)
    expect(llmService.createTypedCompletion).toHaveBeenCalledTimes(2)
  })

  it('should throw ServiceUnavailableException after max retries', async () => {
    llmService.createTypedCompletion.mockRejectedValue(new Error('timeout'))

    await expect(
      service.generate({
        campaignTitle: 'Test',
        description: 'Desc',
        targetMarket: 'kr',
        influencerType: 'beauty',
        sellingPoints: '[]',
        publishDate: '2026-06-10',
      })
    ).rejects.toThrow('SOP generation failed')
  })

  it('should throw BadRequestException for invalid schema', async () => {
    llmService.createTypedCompletion.mockResolvedValueOnce({
      title: '',
      steps: [],
    })

    await expect(
      service.generate({
        campaignTitle: 'Test',
        description: 'Desc',
        targetMarket: 'kr',
        influencerType: 'beauty',
        sellingPoints: '[]',
        publishDate: '2026-06-10',
      })
    ).rejects.toThrow('AI generated invalid SOP structure')
  })

  describe('validateSchema', () => {
    it('rejects missing fields', () => {
      expect(service.validateSchema({ title: 'T', steps: [{ name: 'S' }] })).toBe(false)
    })

    it('rejects positive dueDateOffset', () => {
      expect(
        service.validateSchema({
          title: 'T',
          steps: [{ name: 'S', description: 'D', dueDateOffset: 1, requirements: [] }],
        })
      ).toBe(false)
    })

    it('accepts zero dueDateOffset', () => {
      expect(
        service.validateSchema({
          title: 'T',
          steps: [{ name: 'S', description: 'D', dueDateOffset: 0, requirements: [] }],
        })
      ).toBe(true)
    })
  })
})
```

- [ ] **Step 3: Run tests**

```bash
cd /Users/pw/workspace/src/influencer-marketing/backend
yarn test src/sop/sop-generation.service.spec.ts --no-coverage
```

Expected: All 7 tests pass.

- [ ] **Step 4: Commit**

```bash
git add backend/src/sop/sop-generation.service.ts backend/src/sop/sop-generation.service.spec.ts
git commit -m "feat(sop): add SopGenerationService with validation and retry"
```

---

## Task 5: SOP Service & Controller

**Files:**
- Create: `backend/src/sop/sop.service.ts`
- Create: `backend/src/sop/sop.controller.ts`
- Create: `backend/src/sop/sop.module.ts`
- Create: `backend/src/sop/sop.service.spec.ts`

- [ ] **Step 1: Implement SopService**

```typescript
import { ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common'
import { PrismaService } from '@/common/prisma/prisma.service'
import { Role } from '@/common/enums/role.enum'
import type { UserPayload } from '@/common/decorators/current-user.decorator'
import { SopGenerationService } from './sop-generation.service'
import { GenerateSopDto } from './dto/generate-sop.dto'
import { UpdateSopDto } from './dto/update-sop.dto'
import { SopStatus } from '@/generated/prisma'

const SOP_SELECT = {
  id: true,
  campaignId: true,
  title: true,
  publishDate: true,
  targetMarket: true,
  influencerType: true,
  sellingPoints: true,
  steps: true,
  status: true,
  createdAt: true,
  updatedAt: true,
}

@Injectable()
export class SopService {
  private readonly logger = new Logger(SopService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly generationService: SopGenerationService
  ) {}

  private async assertBrandOwnsCampaign(userId: string, campaignId: string) {
    const campaign = await this.prisma.campaign.findUnique({ where: { id: campaignId } })
    if (!campaign) throw new NotFoundException('Campaign not found')
    if (campaign.brandId !== userId) throw new ForbiddenException('You do not own this campaign')
  }

  async create(userId: string, dto: GenerateSopDto) {
    await this.assertBrandOwnsCampaign(userId, dto.campaignId)

    const campaign = await this.prisma.campaign.findUnique({
      where: { id: dto.campaignId },
    })
    if (!campaign) throw new NotFoundException('Campaign not found')

    const existing = await this.prisma.sop.findUnique({
      where: { campaignId: dto.campaignId },
    })
    if (existing) throw new ForbiddenException('SOP already exists for this campaign')

    const generated = await this.generationService.generate({
      campaignTitle: campaign.title,
      description: campaign.description,
      targetMarket: dto.targetMarket,
      influencerType: dto.influencerType,
      sellingPoints: JSON.stringify(dto.sellingPoints),
      publishDate: dto.publishDate,
    })

    const sop = await this.prisma.sop.create({
      data: {
        campaignId: dto.campaignId,
        title: generated.title,
        publishDate: new Date(dto.publishDate),
        targetMarket: dto.targetMarket,
        influencerType: dto.influencerType,
        sellingPoints: dto.sellingPoints,
        steps: generated.steps,
        status: SopStatus.generated,
      },
      select: SOP_SELECT,
    })

    this.logger.log(`SOP created for campaign ${dto.campaignId}: ${sop.id}`)
    return sop
  }

  async findByCampaign(user: UserPayload, campaignId: string) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
      include: { invitations: true },
    })
    if (!campaign) throw new NotFoundException('Campaign not found')

    const isBrandOwner = campaign.brandId === user.id
    const isAcceptedInfluencer = campaign.invitations.some(
      (inv) => inv.influencerId === user.id && inv.status === 'accepted'
    )

    if (!isBrandOwner && !isAcceptedInfluencer) {
      throw new ForbiddenException('You do not have access to this campaign')
    }

    const sop = await this.prisma.sop.findUnique({
      where: { campaignId },
      select: SOP_SELECT,
    })

    if (!sop) throw new NotFoundException('SOP not found for this campaign')
    return sop
  }

  async update(userId: string, sopId: string, dto: UpdateSopDto) {
    const sop = await this.prisma.sop.findUnique({ where: { id: sopId } })
    if (!sop) throw new NotFoundException('SOP not found')

    await this.assertBrandOwnsCampaign(userId, sop.campaignId)

    const updated = await this.prisma.sop.update({
      where: { id: sopId },
      data: {
        ...dto,
        publishDate: dto.publishDate ? new Date(dto.publishDate) : undefined,
      },
      select: SOP_SELECT,
    })

    this.logger.log(`SOP updated: ${sopId}`)
    return updated
  }

  async regenerate(userId: string, sopId: string, dto: GenerateSopDto) {
    const sop = await this.prisma.sop.findUnique({ where: { id: sopId } })
    if (!sop) throw new NotFoundException('SOP not found')
    await this.assertBrandOwnsCampaign(userId, sop.campaignId)

    const campaign = await this.prisma.campaign.findUnique({
      where: { id: sop.campaignId },
    })
    if (!campaign) throw new NotFoundException('Campaign not found')

    const generated = await this.generationService.generate({
      campaignTitle: campaign.title,
      description: campaign.description,
      targetMarket: dto.targetMarket,
      influencerType: dto.influencerType,
      sellingPoints: JSON.stringify(dto.sellingPoints),
      publishDate: dto.publishDate,
    })

    const updated = await this.prisma.sop.update({
      where: { id: sopId },
      data: {
        title: generated.title,
        publishDate: new Date(dto.publishDate),
        targetMarket: dto.targetMarket,
        influencerType: dto.influencerType,
        sellingPoints: dto.sellingPoints,
        steps: generated.steps,
        status: SopStatus.generated,
      },
      select: SOP_SELECT,
    })

    this.logger.log(`SOP regenerated: ${sopId}`)
    return updated
  }

  async activate(userId: string, sopId: string) {
    const sop = await this.prisma.sop.findUnique({ where: { id: sopId } })
    if (!sop) throw new NotFoundException('SOP not found')
    await this.assertBrandOwnsCampaign(userId, sop.campaignId)

    const updated = await this.prisma.sop.update({
      where: { id: sopId },
      data: { status: SopStatus.active },
      select: SOP_SELECT,
    })

    this.logger.log(`SOP activated: ${sopId}`)
    return updated
  }

  async push(userId: string, sopId: string) {
    const sop = await this.prisma.sop.findUnique({
      where: { id: sopId },
      include: { bindings: true },
    })
    if (!sop) throw new NotFoundException('SOP not found')
    await this.assertBrandOwnsCampaign(userId, sop.campaignId)

    if (sop.status !== SopStatus.active) {
      throw new ForbiddenException('SOP must be active before pushing')
    }

    return { sop, bindings: sop.bindings }
  }
}
```

- [ ] **Step 2: Implement SopController**

```typescript
import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
  Logger,
} from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard'
import { RolesGuard } from '@/common/guards/roles.guard'
import { Roles } from '@/common/decorators/roles.decorator'
import { CurrentUser } from '@/common/decorators/current-user.decorator'
import type { UserPayload } from '@/common/decorators/current-user.decorator'
import { Role } from '@/common/enums/role.enum'
import { SopService } from './sop.service'
import { GenerateSopDto } from './dto/generate-sop.dto'
import { UpdateSopDto } from './dto/update-sop.dto'

@ApiTags('SOPs')
@ApiBearerAuth()
@Controller('sops')
export class SopController {
  private readonly logger = new Logger(SopController.name)

  constructor(private readonly sopService: SopService) {}

  @Post()
  @Roles(Role.Brand)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async create(@CurrentUser() user: UserPayload, @Body() dto: GenerateSopDto) {
    return this.sopService.create(user.id, dto)
  }

  @Get('campaign/:campaignId')
  @UseGuards(JwtAuthGuard)
  async findByCampaign(
    @CurrentUser() user: UserPayload,
    @Param('campaignId') campaignId: string
  ) {
    return this.sopService.findByCampaign(user, campaignId)
  }

  @Patch(':id')
  @Roles(Role.Brand)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async update(
    @CurrentUser() user: UserPayload,
    @Param('id') id: string,
    @Body() dto: UpdateSopDto
  ) {
    return this.sopService.update(user.id, id, dto)
  }

  @Post(':id/regenerate')
  @Roles(Role.Brand)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async regenerate(
    @CurrentUser() user: UserPayload,
    @Param('id') id: string,
    @Body() dto: GenerateSopDto
  ) {
    return this.sopService.regenerate(user.id, id, dto)
  }

  @Post(':id/activate')
  @Roles(Role.Brand)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async activate(@CurrentUser() user: UserPayload, @Param('id') id: string) {
    return this.sopService.activate(user.id, id)
  }

  @Post(':id/push')
  @Roles(Role.Brand)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async push(@CurrentUser() user: UserPayload, @Param('id') id: string) {
    return this.sopService.push(user.id, id)
  }
}
```

- [ ] **Step 3: Implement SopModule**

```typescript
import { Module } from '@nestjs/common'
import { PrismaModule } from '@/common/prisma/prisma.module'
import { PromptModule } from '@/ai/prompt/prompt.module'
import { LLMModule } from '@/ai/llm/llm.module'
import { SopController } from './sop.controller'
import { SopService } from './sop.service'
import { SopGenerationService } from './sop-generation.service'

@Module({
  controllers: [SopController],
  providers: [SopService, SopGenerationService],
  imports: [PrismaModule, PromptModule, LLMModule],
  exports: [SopService],
})
export class SopModule {}
```

- [ ] **Step 4: Write SopService unit tests**

```typescript
import { Test, TestingModule } from '@nestjs/testing'
import { SopService } from './sop.service'
import { PrismaService } from '@/common/prisma/prisma.service'
import { SopGenerationService } from './sop-generation.service'
import { Role } from '@/common/enums/role.enum'
import { ForbiddenException, NotFoundException } from '@nestjs/common'
import { SopStatus } from '@/generated/prisma'

describe('SopService', () => {
  let service: SopService
  let prisma: jest.Mocked<PrismaService>
  let generationService: jest.Mocked<SopGenerationService>

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SopService,
        {
          provide: PrismaService,
          useValue: {
            campaign: { findUnique: jest.fn() },
            sop: {
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
          },
        },
        {
          provide: SopGenerationService,
          useValue: { generate: jest.fn() },
        },
      ],
    }).compile()

    service = module.get(SopService)
    prisma = module.get(PrismaService)
    generationService = module.get(SopGenerationService)
  })

  describe('create', () => {
    it('should create SOP for brand owner', async () => {
      prisma.campaign.findUnique.mockResolvedValue({ id: 'c1', brandId: 'b1', title: 'T', description: 'D' } as any)
      prisma.sop.findUnique.mockResolvedValue(null)
      generationService.generate.mockResolvedValue({
        title: 'Generated',
        steps: [{ name: 'S', description: 'D', dueDateOffset: -7, requirements: [] }],
      })
      prisma.sop.create.mockResolvedValue({ id: 's1' } as any)

      const result = await service.create('b1', {
        campaignId: 'c1',
        targetMarket: 'kr',
        influencerType: 'beauty',
        sellingPoints: ['a'],
        publishDate: '2026-06-10',
      })

      expect(result.id).toBe('s1')
    })

    it('should reject non-brand owner', async () => {
      prisma.campaign.findUnique.mockResolvedValue({ id: 'c1', brandId: 'b1' } as any)

      await expect(
        service.create('b2', {
          campaignId: 'c1',
          targetMarket: 'kr',
          influencerType: 'beauty',
          sellingPoints: [],
          publishDate: '2026-06-10',
        })
      ).rejects.toThrow(ForbiddenException)
    })
  })

  describe('findByCampaign', () => {
    it('should allow accepted influencer to view', async () => {
      prisma.campaign.findUnique.mockResolvedValue({
        id: 'c1',
        brandId: 'b1',
        invitations: [{ influencerId: 'i1', status: 'accepted' }],
      } as any)
      prisma.sop.findUnique.mockResolvedValue({ id: 's1' } as any)

      const result = await service.findByCampaign(
        { id: 'i1', email: 'i@example.com', role: Role.Influencer },
        'c1'
      )
      expect(result.id).toBe('s1')
    })

    it('should reject influencer with no accepted invitation', async () => {
      prisma.campaign.findUnique.mockResolvedValue({
        id: 'c1',
        brandId: 'b1',
        invitations: [{ influencerId: 'i1', status: 'pending' }],
      } as any)

      await expect(
        service.findByCampaign(
          { id: 'i1', email: 'i@example.com', role: Role.Influencer },
          'c1'
        )
      ).rejects.toThrow(ForbiddenException)
    })
  })

  describe('push', () => {
    it('should reject push if sop is not active', async () => {
      prisma.campaign.findUnique.mockResolvedValue({ id: 'c1', brandId: 'b1' } as any)
      prisma.sop.findUnique.mockResolvedValue({
        id: 's1',
        campaignId: 'c1',
        status: SopStatus.generated,
        bindings: [],
      } as any)

      await expect(service.push('b1', 's1')).rejects.toThrow(ForbiddenException)
    })
  })
})
```

- [ ] **Step 5: Run tests**

```bash
cd /Users/pw/workspace/src/influencer-marketing/backend
yarn test src/sop/sop.service.spec.ts --no-coverage
```

Expected: All tests pass.

- [ ] **Step 6: Commit**

```bash
git add backend/src/sop/
git commit -m "feat(sop): add SopService and SopController with access control"
```

---

## Task 6: Feishu Service & Webhook Controller

**Files:**
- Create: `backend/src/feishu/feishu.service.ts`
- Create: `backend/src/feishu/feishu.controller.ts`
- Create: `backend/src/feishu/dto/feishu-webhook.dto.ts`

- [ ] **Step 1: Install @nestjs/schedule**

```bash
cd /Users/pw/workspace/src/influencer-marketing/backend
yarn add @nestjs/schedule
```

- [ ] **Step 2: Create Feishu webhook DTO**

```typescript
export interface FeishuWebhookBody {
  uuid?: string
  token?: string
  ts?: string
  type?: string
  challenge?: string
  event?: FeishuEvent
}

export interface FeishuEvent {
  type?: string
  message?: FeishuMessage
}

export interface FeishuMessage {
  chat_id?: string
  message_type?: string
  content?: string
}
```

- [ ] **Step 3: Implement FeishuService**

```typescript
import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { createHmac } from 'crypto'

@Injectable()
export class FeishuService {
  private readonly logger = new Logger(FeishuService.name)
  private readonly appId: string
  private readonly appSecret: string
  private readonly verifyToken: string
  private tenantAccessToken: string | null = null
  private tokenExpiresAt = 0

  constructor(private readonly configService: ConfigService) {
    this.appId = this.configService.get('feishu.appId') || ''
    this.appSecret = this.configService.get('feishu.appSecret') || ''
    this.verifyToken = this.configService.get('feishu.webhookVerifyToken') || ''
  }

  verifySignature(body: string, signature: string, timestamp: string): boolean {
    if (!this.verifyToken) return true
    const sign = createHmac('sha256', this.verifyToken)
      .update(`${timestamp}\n${body}`)
      .digest('base64')
    return sign === signature
  }

  async sendMessage(chatId: string, content: string): Promise<void> {
    const token = await this.getTenantAccessToken()
    const url = 'https://open.feishu.cn/open-apis/im/v1/messages'
    const response = await fetch(`${url}?receive_id_type=chat_id`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        receive_id: chatId,
        msg_type: 'text',
        content: JSON.stringify({ text: content }),
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      this.logger.error(`Feishu API error: ${response.status} ${err}`)
      throw new Error(`Feishu API error: ${response.status}`)
    }
  }

  private async getTenantAccessToken(): Promise<string> {
    const now = Date.now()
    if (this.tenantAccessToken && this.tokenExpiresAt > now + 60000) {
      return this.tenantAccessToken
    }

    const response = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ app_id: this.appId, app_secret: this.appSecret }),
    })

    const data = await response.json()
    if (data.code !== 0) {
      throw new Error(`Feishu auth error: ${data.msg}`)
    }

    this.tenantAccessToken = data.tenant_access_token
    this.tokenExpiresAt = now + data.expire * 1000
    return this.tenantAccessToken
  }
}
```

- [ ] **Step 4: Implement FeishuController**

```typescript
import { Controller, Post, Body, Headers, Logger, UnauthorizedException } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { FeishuService } from './feishu.service'
import { FeishuCommandService } from './feishu-command.service'
import { FeishuWebhookBody } from './dto/feishu-webhook.dto'

@ApiTags('Feishu')
@Controller('webhooks/feishu')
export class FeishuController {
  private readonly logger = new Logger(FeishuController.name)

  constructor(
    private readonly feishuService: FeishuService,
    private readonly commandService: FeishuCommandService
  ) {}

  @Post()
  async handleWebhook(
    @Body() body: FeishuWebhookBody,
    @Headers('x-lark-signature') signature: string,
    @Headers('x-lark-timestamp') timestamp: string,
    @Headers('x-lark-request-timeout') _timeout: string
  ) {
    const rawBody = JSON.stringify(body)
    if (!this.feishuService.verifySignature(rawBody, signature, timestamp)) {
      this.logger.warn('Invalid Feishu webhook signature')
      throw new UnauthorizedException()
    }

    if (body.challenge) {
      return { challenge: body.challenge }
    }

    if (body.event?.type === 'im.message.receive_v1' && body.event.message) {
      const message = body.event.message
      if (message.message_type === 'text' && message.content) {
        const content = JSON.parse(message.content)
        const text = content.text?.trim() || ''
        await this.commandService.handleCommand(message.chat_id || '', text)
      }
    }

    return { code: 0 }
  }
}
```

- [ ] **Step 5: Commit**

```bash
git add backend/src/feishu/feishu.service.ts backend/src/feishu/feishu.controller.ts backend/src/feishu/dto/
git commit -m "feat(feishu): add FeishuService and webhook controller"
```

---

## Task 7: Feishu Command Service

**Files:**
- Create: `backend/src/feishu/feishu-command.service.ts`
- Create: `backend/src/feishu/feishu-command.service.spec.ts`

- [ ] **Step 1: Implement FeishuCommandService**

```typescript
import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '@/common/prisma/prisma.service'
import { FeishuService } from './feishu.service'
import { NotificationType, SopStatus } from '@/generated/prisma'

@Injectable()
export class FeishuCommandService {
  private readonly logger = new Logger(FeishuCommandService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly feishuService: FeishuService
  ) {}

  parseCommand(text: string): { command: string; args: string } {
    const trimmed = text.trim()
    const spaceIndex = trimmed.indexOf(' ')
    if (spaceIndex === -1) {
      return { command: trimmed, args: '' }
    }
    return {
      command: trimmed.slice(0, spaceIndex).trim(),
      args: trimmed.slice(spaceIndex + 1).trim(),
    }
  }

  async handleCommand(chatId: string, text: string) {
    const { command, args } = this.parseCommand(text)

    try {
      switch (command) {
        case '/绑定':
          await this.handleBind(chatId, args)
          break
        case '/进度':
          await this.handleProgress(chatId)
          break
        case '/延期':
          await this.handleDelay(chatId, args)
          break
        default:
          await this.feishuService.sendMessage(chatId, '未知命令。可用命令：/绑定, /进度, /延期')
      }
    } catch (error) {
      this.logger.error(`Command error: ${command}`, error)
      await this.feishuService.sendMessage(chatId, '处理命令时出错，请稍后重试')
    }
  }

  async handleBind(chatId: string, influencerIdRaw: string) {
    const influencerId = influencerIdRaw.trim()
    if (!influencerId) {
      await this.feishuService.sendMessage(chatId, '用法: /绑定 <达人ID>')
      return
    }

    const user = await this.prisma.user.findUnique({
      where: { id: influencerId },
      include: { influencerProfile: true },
    })
    if (!user || !user.influencerProfile) {
      await this.feishuService.sendMessage(chatId, '未找到该达人ID，请联系运营确认')
      return
    }

    const invitation = await this.prisma.invitation.findFirst({
      where: {
        influencerId: user.id,
        status: 'accepted',
      },
      include: { campaign: { include: { sop: true } } },
      orderBy: { createdAt: 'desc' },
    })

    if (!invitation) {
      await this.feishuService.sendMessage(chatId, '该达人尚未接受合作邀请，请先完成邀请流程')
      return
    }

    if (!invitation.campaign.sop) {
      await this.feishuService.sendMessage(chatId, '该活动暂无SOP，请联系运营')
      return
    }

    const existing = await this.prisma.sopBinding.findUnique({
      where: { invitationId: invitation.id },
    })
    if (existing) {
      await this.feishuService.sendMessage(chatId, '您已绑定，无需重复操作')
      return
    }

    await this.prisma.sopBinding.create({
      data: {
        sopId: invitation.campaign.sop.id,
        invitationId: invitation.id,
        chatId,
      },
    })

    await this.feishuService.sendMessage(chatId, '绑定成功，将为您推送SOP')
    this.logger.log(`Influencer ${influencerId} bound to chat ${chatId}`)
  }

  async handleProgress(chatId: string) {
    const binding = await this.prisma.sopBinding.findFirst({
      where: { chatId },
      include: { sop: true },
    })

    if (!binding || !binding.sop) {
      await this.feishuService.sendMessage(chatId, '暂无进行中的SOP，请联系运营')
      return
    }

    const steps = binding.sop.steps as Array<{
      name: string
      description: string
      dueDateOffset: number
      requirements: string[]
    }>

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const publishDate = new Date(binding.sop.publishDate)
    publishDate.setHours(0, 0, 0, 0)

    let currentStepIndex = -1
    let minDiff = Infinity

    for (let i = 0; i < steps.length; i++) {
      const dueDate = new Date(publishDate)
      dueDate.setDate(dueDate.getDate() + steps[i].dueDateOffset)
      const diff = dueDate.getTime() - today.getTime()
      if (diff >= 0 && diff < minDiff) {
        minDiff = diff
        currentStepIndex = i
      }
    }

    if (currentStepIndex === -1) {
      await this.feishuService.sendMessage(chatId, '所有SOP步骤已结束')
      return
    }

    const step = steps[currentStepIndex]
    const dueDate = new Date(publishDate)
    dueDate.setDate(dueDate.getDate() + step.dueDateOffset)
    const daysRemaining = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    const dateStr = dueDate.toISOString().split('T')[0]

    await this.feishuService.sendMessage(
      chatId,
      `您当前处于【${step.name}】阶段，截止日${dateStr}，剩余${daysRemaining}天`
    )
  }

  async handleDelay(chatId: string, reason: string) {
    if (!reason.trim()) {
      await this.feishuService.sendMessage(chatId, '用法: /延期 <原因>')
      return
    }

    const binding = await this.prisma.sopBinding.findFirst({
      where: { chatId },
      include: {
        sop: { include: { campaign: true } },
        invitation: { include: { influencer: { include: { influencerProfile: true } } } },
      },
    })

    if (!binding) {
      await this.feishuService.sendMessage(chatId, '绑定后才能申请延期')
      return
    }

    const influencerName =
      binding.invitation.influencer.influencerProfile?.displayName ||
      binding.invitation.influencer.influencerProfile?.handle ||
      'Unknown'

    await this.prisma.notification.create({
      data: {
        userId: binding.sop.campaign.brandId,
        type: NotificationType.sop_delay_requested,
        title: '达人申请延期',
        message: `${influencerName} 申请延期: ${reason}`,
        relatedEntityType: 'sop',
        relatedEntityId: binding.sop.id,
      },
    })

    await this.feishuService.sendMessage(chatId, '延期申请已提交，运营将手动处理')
    this.logger.log(`Delay request from chat ${chatId}: ${reason}`)
  }
}
```

- [ ] **Step 2: Write unit tests**

```typescript
import { Test, TestingModule } from '@nestjs/testing'
import { FeishuCommandService } from './feishu-command.service'
import { PrismaService } from '@/common/prisma/prisma.service'
import { FeishuService } from './feishu.service'

describe('FeishuCommandService', () => {
  let service: FeishuCommandService
  let prisma: jest.Mocked<PrismaService>
  let feishuService: jest.Mocked<FeishuService>

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeishuCommandService,
        {
          provide: PrismaService,
          useValue: {
            user: { findUnique: jest.fn() },
            invitation: { findFirst: jest.fn() },
            sopBinding: { findFirst: jest.fn(), findUnique: jest.fn(), create: jest.fn() },
            notification: { create: jest.fn() },
          },
        },
        {
          provide: FeishuService,
          useValue: { sendMessage: jest.fn().mockResolvedValue(undefined) },
        },
      ],
    }).compile()

    service = module.get(FeishuCommandService)
    prisma = module.get(PrismaService)
    feishuService = module.get(FeishuService)
  })

  describe('parseCommand', () => {
    it('parses /绑定 KR_001', () => {
      expect(service.parseCommand('/绑定 KR_001')).toEqual({ command: '/绑定', args: 'KR_001' })
    })

    it('parses /延期 设备故障', () => {
      expect(service.parseCommand('/延期 设备故障')).toEqual({ command: '/延期', args: '设备故障' })
    })

    it('handles extra spaces', () => {
      expect(service.parseCommand('  /进度  ')).toEqual({ command: '/进度', args: '' })
    })
  })

  describe('handleBind', () => {
    it('rejects non-existent influencer ID', async () => {
      prisma.user.findUnique.mockResolvedValue(null)
      await service.handleBind('chat1', 'BAD_ID')
      expect(feishuService.sendMessage).toHaveBeenCalledWith('chat1', '未找到该达人ID，请联系运营确认')
    })

    it('rejects unaccepted invitation', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'i1', influencerProfile: {} } as any)
      prisma.invitation.findFirst.mockResolvedValue(null)
      await service.handleBind('chat1', 'i1')
      expect(feishuService.sendMessage).toHaveBeenCalledWith(
        'chat1',
        '该达人尚未接受合作邀请，请先完成邀请流程'
      )
    })
  })
})
```

- [ ] **Step 3: Run tests**

```bash
cd /Users/pw/workspace/src/influencer-marketing/backend
yarn test src/feishu/feishu-command.service.spec.ts --no-coverage
```

Expected: All tests pass.

- [ ] **Step 4: Commit**

```bash
git add backend/src/feishu/feishu-command.service.ts backend/src/feishu/feishu-command.service.spec.ts
git commit -m "feat(feishu): add command service with /绑定 /进度 /延期 handlers"
```

---

## Task 8: Feishu Scheduler Service

**Files:**
- Create: `backend/src/feishu/feishu-scheduler.service.ts`
- Create: `backend/src/feishu/feishu-scheduler.service.spec.ts`

- [ ] **Step 1: Implement FeishuSchedulerService**

```typescript
import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { PrismaService } from '@/common/prisma/prisma.service'
import { FeishuService } from './feishu.service'
import { SopStatus, NotificationType } from '@/generated/prisma'

@Injectable()
export class FeishuSchedulerService {
  private readonly logger = new Logger(FeishuSchedulerService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly feishuService: FeishuService
  ) {}

  @Cron('0 9 * * *', { timeZone: 'Asia/Tokyo' })
  async sendReminders() {
    this.logger.log('Running daily SOP reminder check')

    const activeSops = await this.prisma.sop.findMany({
      where: { status: SopStatus.active, deletedAt: null },
      include: {
        bindings: {
          include: {
            invitation: {
              include: {
                influencer: {
                  include: { influencerProfile: true },
                },
              },
            },
          },
        },
        campaign: true,
      },
    })

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    for (const sop of activeSops) {
      const steps = sop.steps as Array<{
        name: string
        description: string
        dueDateOffset: number
        requirements: string[]
      }>
      const publishDate = new Date(sop.publishDate)
      publishDate.setHours(0, 0, 0, 0)

      for (const binding of sop.bindings) {
        for (let stepIndex = 0; stepIndex < steps.length; stepIndex++) {
          const step = steps[stepIndex]
          const dueDate = new Date(publishDate)
          dueDate.setDate(dueDate.getDate() + step.dueDateOffset)

          if (dueDate.getTime() < today.getTime()) continue

          const daysUntilDue = Math.round((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

          for (const reminderType of ['3_day', '1_day'] as const) {
            const expectedDays = reminderType === '3_day' ? 3 : 1
            if (daysUntilDue !== expectedDays) continue

            const existingLog = await this.prisma.sopReminderLog.findUnique({
              where: {
                sopBindingId_stepIndex_reminderType: {
                  sopBindingId: binding.id,
                  stepIndex,
                  reminderType,
                },
              },
            })

            if (existingLog) continue

            try {
              await this.feishuService.sendMessage(
                binding.chatId,
                `提醒：距离${step.name}还有${expectedDays}天（截止日：${dueDate.toISOString().split('T')[0]}）\n${step.description}`
              )

              await this.prisma.sopReminderLog.create({
                data: {
                  sopBindingId: binding.id,
                  stepIndex,
                  reminderType,
                },
              })

              await this.prisma.notification.create({
                data: {
                  userId: sop.campaign.brandId,
                  type: NotificationType.sop_reminder,
                  title: 'SOP提醒已发送',
                  message: `已发送 ${step.name} 的${expectedDays}天前提醒`,
                  relatedEntityType: 'sop',
                  relatedEntityId: sop.id,
                },
              })

              this.logger.log(`Sent ${reminderType} reminder for binding ${binding.id}, step ${stepIndex}`)
            } catch (error) {
              this.logger.error(`Failed to send reminder to binding ${binding.id}`, error)
            }
          }
        }
      }
    }
  }
}
```

- [ ] **Step 2: Write scheduler unit tests**

```typescript
import { Test, TestingModule } from '@nestjs/testing'
import { FeishuSchedulerService } from './feishu-scheduler.service'
import { PrismaService } from '@/common/prisma/prisma.service'
import { FeishuService } from './feishu.service'
import { SopStatus } from '@/generated/prisma'

describe('FeishuSchedulerService', () => {
  let service: FeishuSchedulerService
  let prisma: jest.Mocked<PrismaService>
  let feishuService: jest.Mocked<FeishuService>

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeishuSchedulerService,
        {
          provide: PrismaService,
          useValue: {
            sop: { findMany: jest.fn() },
            sopReminderLog: {
              findUnique: jest.fn(),
              create: jest.fn(),
            },
            notification: { create: jest.fn() },
          },
        },
        {
          provide: FeishuService,
          useValue: { sendMessage: jest.fn().mockResolvedValue(undefined) },
        },
      ],
    }).compile()

    service = module.get(FeishuSchedulerService)
    prisma = module.get(PrismaService)
    feishuService = module.get(FeishuService)
  })

  it('sends 3-day reminder when due date is 3 days away', async () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const publishDate = new Date(today)
    publishDate.setDate(publishDate.getDate() + 3)

    prisma.sop.findMany.mockResolvedValue([
      {
        id: 's1',
        status: SopStatus.active,
        publishDate,
        steps: [{ name: '初稿提交', description: '提交脚本', dueDateOffset: 0, requirements: [] }],
        bindings: [{ id: 'b1', chatId: 'c1', invitation: { influencer: { influencerProfile: {} } } }],
        campaign: { brandId: 'brand1' },
      } as any,
    ])
    prisma.sopReminderLog.findUnique.mockResolvedValue(null)

    await service.sendReminders()

    expect(feishuService.sendMessage).toHaveBeenCalledWith(
      'c1',
      expect.stringContaining('距离初稿提交还有3天')
    )
  })

  it('skips past due dates', async () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const publishDate = new Date(today)
    publishDate.setDate(publishDate.getDate() - 1)

    prisma.sop.findMany.mockResolvedValue([
      {
        id: 's1',
        status: SopStatus.active,
        publishDate,
        steps: [{ name: '初稿提交', description: '提交脚本', dueDateOffset: 0, requirements: [] }],
        bindings: [{ id: 'b1', chatId: 'c1', invitation: { influencer: { influencerProfile: {} } } }],
        campaign: { brandId: 'brand1' },
      } as any,
    ])

    await service.sendReminders()

    expect(feishuService.sendMessage).not.toHaveBeenCalled()
  })

  it('does not send duplicate reminders', async () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const publishDate = new Date(today)
    publishDate.setDate(publishDate.getDate() + 1)

    prisma.sop.findMany.mockResolvedValue([
      {
        id: 's1',
        status: SopStatus.active,
        publishDate,
        steps: [{ name: '初稿提交', description: '提交脚本', dueDateOffset: 0, requirements: [] }],
        bindings: [{ id: 'b1', chatId: 'c1', invitation: { influencer: { influencerProfile: {} } } }],
        campaign: { brandId: 'brand1' },
      } as any,
    ])
    prisma.sopReminderLog.findUnique.mockResolvedValue({ id: 'log1' } as any)

    await service.sendReminders()

    expect(feishuService.sendMessage).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 3: Run tests**

```bash
cd /Users/pw/workspace/src/influencer-marketing/backend
yarn test src/feishu/feishu-scheduler.service.spec.ts --no-coverage
```

Expected: All tests pass.

- [ ] **Step 4: Commit**

```bash
git add backend/src/feishu/feishu-scheduler.service.ts backend/src/feishu/feishu-scheduler.service.spec.ts
git commit -m "feat(feishu): add daily reminder scheduler"
```

---

## Task 9: Feishu Module & Backend Integration

**Files:**
- Create: `backend/src/feishu/feishu.module.ts`
- Modify: `backend/src/app.module.ts`
- Modify: `backend/src/main.ts`
- Modify: `backend/src/campaigns/campaigns.service.ts`

- [ ] **Step 1: Create FeishuModule**

```typescript
import { Module } from '@nestjs/common'
import { PrismaModule } from '@/common/prisma/prisma.module'
import { FeishuController } from './feishu.controller'
import { FeishuService } from './feishu.service'
import { FeishuCommandService } from './feishu-command.service'
import { FeishuSchedulerService } from './feishu-scheduler.service'

@Module({
  controllers: [FeishuController],
  providers: [FeishuService, FeishuCommandService, FeishuSchedulerService],
  imports: [PrismaModule],
  exports: [FeishuService],
})
export class FeishuModule {}
```

- [ ] **Step 2: Modify AppModule**

In `backend/src/app.module.ts`, add to imports:
```typescript
import { ScheduleModule } from '@nestjs/schedule'
import { SopModule } from '@/sop/sop.module'
import { FeishuModule } from '@/feishu/feishu.module'
```

Then add `ScheduleModule.forRoot()`, `SopModule`, and `FeishuModule` to the `imports` array.

- [ ] **Step 3: Exclude FeishuController from global prefix**

In `backend/src/main.ts`, before `app.setGlobalPrefix(GLOBAL_PREFIX)`:

```typescript
const feishuController = app.get(FeishuController)
// Actually we need to set global prefix but exclude the Feishu controller path.
// NestJS setGlobalPrefix supports exclude option.
```

Replace the existing `app.setGlobalPrefix(GLOBAL_PREFIX)` with:

```typescript
app.setGlobalPrefix(GLOBAL_PREFIX, {
  exclude: [{ path: 'webhooks/feishu', method: RequestMethod.POST }],
})
```

Add import at top:
```typescript
import { RequestMethod } from '@nestjs/common'
import { FeishuController } from '@/feishu/feishu.controller'
```

Actually, the simpler NestJS pattern is:
```typescript
app.setGlobalPrefix(GLOBAL_PREFIX, {
  exclude: [{ path: 'webhooks/feishu', method: RequestMethod.ALL }],
})
```

- [ ] **Step 4: Include SOP in campaign detail**

In `backend/src/campaigns/campaigns.service.ts`, in the `findOne` method, add `sop: true` to the `include` object:

```typescript
const campaign = await this.prisma.campaign.findUnique({
  where: { id: campaignId },
  include: {
    invitations: {
      include: {
        influencer: {
          select: {
            id: true,
            name: true,
            email: true,
            influencerProfile: true,
          },
        },
      },
    },
    deliverables: true,
    sop: true,
  },
})
```

- [ ] **Step 5: Commit**

```bash
git add backend/src/feishu/feishu.module.ts backend/src/app.module.ts backend/src/main.ts backend/src/campaigns/campaigns.service.ts
git commit -m "feat(sop,feishu): wire up modules, expose webhook, include sop in campaign detail"
```

---

## Task 10: Frontend Brand SOP Components

**Files:**
- Create: `frontend/app/brand/campaigns/[id]/components/sop-generate-modal.tsx`
- Create: `frontend/app/brand/campaigns/[id]/components/sop-edit-modal.tsx`
- Create: `frontend/app/brand/campaigns/[id]/components/sop-card.tsx`

- [ ] **Step 1: Create sop-generate-modal.tsx**

```tsx
'use client'

import { useState } from 'react'
import { apiFetch } from '@/lib/api'
import { useMutation } from '@tanstack/react-query'

interface GenerateSopModalProps {
  campaignId: string
  onClose: () => void
  onSuccess: () => void
}

export default function SopGenerateModal({ campaignId, onClose, onSuccess }: GenerateSopModalProps) {
  const [targetMarket, setTargetMarket] = useState('kr')
  const [influencerType, setInfluencerType] = useState('beauty')
  const [sellingPoints, setSellingPoints] = useState('')
  const [publishDate, setPublishDate] = useState('')

  const generateMutation = useMutation({
    mutationFn: () =>
      apiFetch('/sops', {
        method: 'POST',
        body: JSON.stringify({
          campaignId,
          targetMarket,
          influencerType,
          sellingPoints: sellingPoints.split(',').map((s) => s.trim()).filter(Boolean),
          publishDate,
        }),
      }),
    onSuccess: () => {
      onSuccess()
      onClose()
    },
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="d-card w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold" style={{ color: 'var(--d-text)' }}>
            Generate SOP
          </h2>
          <button onClick={onClose} className="text-sm" style={{ color: 'var(--d-text-muted)' }}>
            Close
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--d-text-secondary)' }}>
              Target Market
            </label>
            <select
              value={targetMarket}
              onChange={(e) => setTargetMarket(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--d-border)', color: 'var(--d-text)' }}>
              <option value="kr">Korea</option>
              <option value="jp">Japan</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--d-text-secondary)' }}>
              Influencer Type
            </label>
            <select
              value={influencerType}
              onChange={(e) => setInfluencerType(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--d-border)', color: 'var(--d-text)' }}>
              <option value="beauty">Beauty</option>
              <option value="fashion">Fashion</option>
              <option value="lifestyle">Lifestyle</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--d-text-secondary)' }}>
              Selling Points (comma separated)
            </label>
            <input
              type="text"
              value={sellingPoints}
              onChange={(e) => setSellingPoints(e.target.value)}
              placeholder="e.g. natural ingredients, long lasting"
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--d-border)', color: 'var(--d-text)' }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--d-text-secondary)' }}>
              Publish Date
            </label>
            <input
              type="date"
              value={publishDate}
              onChange={(e) => setPublishDate(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--d-border)', color: 'var(--d-text)' }}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="d-btn-secondary text-sm">
            Cancel
          </button>
          <button
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending || !publishDate}
            className="d-btn-primary text-sm">
            {generateMutation.isPending ? 'Generating...' : 'Generate'}
          </button>
        </div>

        {generateMutation.isError && (
          <p className="text-sm mt-3" style={{ color: 'var(--d-accent)' }}>
            {generateMutation.error instanceof Error ? generateMutation.error.message : 'Failed to generate'}
          </p>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create sop-edit-modal.tsx**

```tsx
'use client'

import { useState } from 'react'
import { apiFetch } from '@/lib/api'
import { useMutation } from '@tanstack/react-query'

interface Step {
  name: string
  description: string
  dueDateOffset: number
  requirements: string[]
}

interface Sop {
  id: string
  title: string
  publishDate: string
  steps: Step[]
  status: string
}

interface SopEditModalProps {
  sop: Sop
  onClose: () => void
  onSuccess: () => void
}

export default function SopEditModal({ sop, onClose, onSuccess }: SopEditModalProps) {
  const [title, setTitle] = useState(sop.title)
  const [publishDate, setPublishDate] = useState(sop.publishDate.split('T')[0])
  const [steps, setSteps] = useState<Step[]>(sop.steps)

  const updateMutation = useMutation({
    mutationFn: () =>
      apiFetch(`/sops/${sop.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ title, publishDate, steps }),
      }),
    onSuccess: () => {
      onSuccess()
      onClose()
    },
  })

  const updateStep = (index: number, field: keyof Step, value: unknown) => {
    const next = [...steps]
    next[index] = { ...next[index], [field]: value }
    setSteps(next)
  }

  const addStep = () => {
    setSteps([...steps, { name: '', description: '', dueDateOffset: -1, requirements: [] }])
  }

  const removeStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="d-card w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold" style={{ color: 'var(--d-text)' }}>
            Edit SOP
          </h2>
          <button onClick={onClose} className="text-sm" style={{ color: 'var(--d-text-muted)' }}>
            Close
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--d-text-secondary)' }}>
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--d-border)', color: 'var(--d-text)' }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--d-text-secondary)' }}>
              Publish Date
            </label>
            <input
              type="date"
              value={publishDate}
              onChange={(e) => setPublishDate(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--d-border)', color: 'var(--d-text)' }}
            />
          </div>

          <div className="space-y-3">
            {steps.map((step, idx) => (
              <div key={idx} className="d-card" style={{ backgroundColor: 'var(--d-content-bg-warm)' }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium" style={{ color: 'var(--d-text)' }}>
                    Step {idx + 1}
                  </span>
                  <button onClick={() => removeStep(idx)} className="text-xs" style={{ color: 'var(--d-accent)' }}>
                    Remove
                  </button>
                </div>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Name"
                    value={step.name}
                    onChange={(e) => updateStep(idx, 'name', e.target.value)}
                    className="w-full rounded-lg border px-3 py-2 text-sm"
                    style={{ borderColor: 'var(--d-border)', color: 'var(--d-text)' }}
                  />
                  <textarea
                    placeholder="Description"
                    value={step.description}
                    onChange={(e) => updateStep(idx, 'description', e.target.value)}
                    rows={2}
                    className="w-full rounded-lg border px-3 py-2 text-sm"
                    style={{ borderColor: 'var(--d-border)', color: 'var(--d-text)' }}
                  />
                  <input
                    type="number"
                    placeholder="Days before publish"
                    value={step.dueDateOffset}
                    onChange={(e) => updateStep(idx, 'dueDateOffset', parseInt(e.target.value, 10) || 0)}
                    className="w-full rounded-lg border px-3 py-2 text-sm"
                    style={{ borderColor: 'var(--d-border)', color: 'var(--d-text)' }}
                  />
                </div>
              </div>
            ))}
          </div>

          <button onClick={addStep} className="d-btn-secondary text-sm w-full">
            + Add Step
          </button>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="d-btn-secondary text-sm">
            Cancel
          </button>
          <button
            onClick={() => updateMutation.mutate()}
            disabled={updateMutation.isPending}
            className="d-btn-primary text-sm">
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create sop-card.tsx**

```tsx
'use client'

import { useState } from 'react'
import { apiFetch } from '@/lib/api'
import { useMutation } from '@tanstack/react-query'
import SopGenerateModal from './sop-generate-modal'
import SopEditModal from './sop-edit-modal'

interface Step {
  name: string
  description: string
  dueDateOffset: number
  requirements: string[]
}

interface Sop {
  id: string
  title: string
  publishDate: string
  steps: Step[]
  status: string
}

interface Binding {
  id: string
  boundAt: string
  sopPushedAt: string | null
  invitationId: string
}

interface SopCardProps {
  campaignId: string
  sop: Sop | null | undefined
  invitations: { id: string; status: string; influencer: { id: string; name?: string } }[]
  onSopChange: () => void
}

export default function SopCard({ campaignId, sop, invitations, onSopChange }: SopCardProps) {
  const [showGenerate, setShowGenerate] = useState(false)
  const [showEdit, setShowEdit] = useState(false)

  const activateMutation = useMutation({
    mutationFn: () => apiFetch(`/sops/${sop!.id}/activate`, { method: 'POST' }),
    onSuccess: onSopChange,
  })

  const pushMutation = useMutation({
    mutationFn: () => apiFetch(`/sops/${sop!.id}/push`, { method: 'POST' }),
    onSuccess: onSopChange,
  })

  const regenerateMutation = useMutation({
    mutationFn: () =>
      apiFetch(`/sops/${sop!.id}/regenerate`, {
        method: 'POST',
        body: JSON.stringify({
          campaignId,
          targetMarket: sop!.targetMarket,
          influencerType: sop!.influencerType,
          sellingPoints: sop!.sellingPoints,
          publishDate: sop!.publishDate.split('T')[0],
        }),
      }),
    onSuccess: onSopChange,
  })

  if (!sop) {
    return (
      <div className="d-card mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-lg" style={{ color: 'var(--d-text)' }}>
              SOP
            </h2>
            <p className="text-sm" style={{ color: 'var(--d-text-secondary)' }}>
              No SOP generated yet.
            </p>
          </div>
          <button onClick={() => setShowGenerate(true)} className="d-btn-primary text-sm">
            Generate SOP
          </button>
        </div>
        {showGenerate && (
          <SopGenerateModal campaignId={campaignId} onClose={() => setShowGenerate(false)} onSuccess={onSopChange} />
        )}
      </div>
    )
  }

  const publishDate = new Date(sop.publishDate)
  publishDate.setHours(0, 0, 0, 0)

  const acceptedInvitations = invitations.filter((i) => i.status === 'accepted')
  const bindings: Binding[] = (sop as any).bindings || []
  const canPush = sop.status === 'active' && bindings.length > 0

  return (
    <div className="d-card mb-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-semibold text-lg" style={{ color: 'var(--d-text)' }}>
            {sop.title}
          </h2>
          <span className="d-tag d-tag-neutral text-[10px]">{sop.status}</span>
        </div>
        <div className="flex gap-2">
          {sop.status === 'generated' && (
            <>
              <button onClick={() => setShowEdit(true)} className="d-btn-secondary text-sm">
                Edit
              </button>
              <button onClick={() => regenerateMutation.mutate()} disabled={regenerateMutation.isPending} className="d-btn-secondary text-sm">
                Regenerate
              </button>
              <button onClick={() => activateMutation.mutate()} disabled={activateMutation.isPending} className="d-btn-primary text-sm">
                Activate
              </button>
            </>
          )}
          {sop.status === 'active' && (
            <>
              <button onClick={() => setShowEdit(true)} className="d-btn-secondary text-sm">
                Edit
              </button>
              <button
                onClick={() => pushMutation.mutate()}
                disabled={pushMutation.isPending || !canPush}
                className="d-btn-primary text-sm"
                title={!canPush ? 'Activate SOP and ensure at least one binding exists' : ''}>
                Push to Feishu
              </button>
            </>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {sop.steps.map((step: Step, idx: number) => {
          const dueDate = new Date(publishDate)
          dueDate.setDate(dueDate.getDate() + step.dueDateOffset)
          return (
            <div key={idx} className="flex items-start gap-3 p-3 rounded-lg" style={{ backgroundColor: 'var(--d-content-bg-warm)' }}>
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{ backgroundColor: 'var(--d-accent)', color: '#fff' }}>
                {idx + 1}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm" style={{ color: 'var(--d-text)' }}>
                    {step.name}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--d-text-muted)' }}>
                    Due: {dueDate.toISOString().split('T')[0]}
                  </span>
                </div>
                <p className="text-sm mt-1" style={{ color: 'var(--d-text-secondary)' }}>
                  {step.description}
                </p>
                {step.requirements.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {step.requirements.map((r, i) => (
                      <span key={i} className="d-tag d-tag-neutral text-[10px]">
                        {r}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {acceptedInvitations.length > 0 && (
        <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--d-border)' }}>
          <h3 className="text-sm font-medium mb-2" style={{ color: 'var(--d-text-secondary)' }}>
            Feishu Binding Status
          </h3>
          <div className="space-y-2">
            {acceptedInvitations.map((inv) => {
              const binding = bindings.find((b) => b.invitationId === inv.id)
              return (
                <div key={inv.id} className="flex items-center justify-between text-sm">
                  <span style={{ color: 'var(--d-text)' }}>{inv.influencer.name || inv.influencer.id}</span>
                  {binding ? (
                    <span className="d-tag d-tag-success text-[10px]">
                      Bound {new Date(binding.boundAt).toLocaleDateString()}
                    </span>
                  ) : (
                    <span className="d-tag d-tag-neutral text-[10px]">Not bound</span>
                  )}
                </div>
              )
            })}
          </div>
          {bindings.length === 0 && (
            <p className="text-xs mt-2" style={{ color: 'var(--d-text-muted)' }}>
              Share Feishu group link and ask influencer to /绑定
            </p>
          )}
          {bindings.length > 0 && bindings.some((b) => b.sopPushedAt) && (
            <p className="text-xs mt-2" style={{ color: 'var(--d-success)' }}>
              Pushed to {bindings.filter((b) => b.sopPushedAt).length} group(s)
            </p>
          )}
        </div>
      )}

      {showEdit && <SopEditModal sop={sop} onClose={() => setShowEdit(false)} onSuccess={onSopChange} />}
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add frontend/app/brand/campaigns/[id]/components/
git commit -m "feat(frontend): add brand SOP generate, edit, and card components"
```

---

## Task 11: Frontend Influencer SOP Timeline

**Files:**
- Create: `frontend/app/influencer/campaigns/[id]/components/sop-timeline.tsx`
- Modify: `frontend/app/influencer/campaigns/[id]/page.tsx`

- [ ] **Step 1: Create sop-timeline.tsx**

```tsx
'use client'

interface Step {
  name: string
  description: string
  dueDateOffset: number
  requirements: string[]
}

interface Sop {
  id: string
  title: string
  publishDate: string
  steps: Step[]
  status: string
}

interface SopTimelineProps {
  sop: Sop | null | undefined
}

export default function SopTimeline({ sop }: SopTimelineProps) {
  if (!sop) {
    return (
      <div className="d-card mb-6">
        <p className="text-sm text-center py-6" style={{ color: 'var(--d-text-secondary)' }}>
          SOP尚未生成，请联系品牌方
        </p>
      </div>
    )
  }

  const publishDate = new Date(sop.publishDate)
  publishDate.setHours(0, 0, 0, 0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  let currentStepIndex = -1
  let minDiff = Infinity

  for (let i = 0; i < sop.steps.length; i++) {
    const dueDate = new Date(publishDate)
    dueDate.setDate(dueDate.getDate() + sop.steps[i].dueDateOffset)
    const diff = dueDate.getTime() - today.getTime()
    if (diff >= 0 && diff < minDiff) {
      minDiff = diff
      currentStepIndex = i
    }
  }

  return (
    <div className="d-card mb-6">
      <div className="flex items-center gap-2 mb-4">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{ color: 'var(--d-text-secondary)' }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <h2 className="font-semibold text-lg" style={{ color: 'var(--d-text)' }}>
          SOP Timeline
        </h2>
        <span className="d-tag d-tag-neutral text-[10px] py-1 px-2">{sop.status}</span>
      </div>

      <div className="space-y-3">
        {sop.steps.map((step: Step, idx: number) => {
          const dueDate = new Date(publishDate)
          dueDate.setDate(dueDate.getDate() + step.dueDateOffset)
          const isCurrent = idx === currentStepIndex
          const daysRemaining = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

          return (
            <div
              key={idx}
              className="flex items-start gap-3 p-3 rounded-lg"
              style={{
                backgroundColor: isCurrent ? 'var(--d-accent-light)' : 'var(--d-content-bg-warm)',
                borderLeft: isCurrent ? '3px solid var(--d-accent)' : '3px solid transparent',
              }}>
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{
                  backgroundColor: isCurrent ? 'var(--d-accent)' : 'var(--d-border)',
                  color: isCurrent ? '#fff' : 'var(--d-text-muted)',
                }}>
                {idx + 1}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm" style={{ color: 'var(--d-text)' }}>
                      {step.name}
                    </span>
                    {isCurrent && (
                      <span className="d-tag d-tag-warning text-[10px]">Current</span>
                    )}
                  </div>
                  <span className="text-xs" style={{ color: 'var(--d-text-muted)' }}>
                    Due: {dueDate.toISOString().split('T')[0]}
                  </span>
                </div>
                <p className="text-sm mt-1" style={{ color: 'var(--d-text-secondary)' }}>
                  {step.description}
                </p>
                {isCurrent && daysRemaining >= 0 && (
                  <p className="text-xs mt-1 font-medium" style={{ color: 'var(--d-accent)' }}>
                    {daysRemaining} days remaining
                  </p>
                )}
                {step.requirements.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {step.requirements.map((r, i) => (
                      <span key={i} className="d-tag d-tag-neutral text-[10px]">
                        {r}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Modify brand campaign detail page**

In `frontend/app/brand/campaigns/[id]/page.tsx`:

1. Add `sop` and `bindings` to the `CampaignDetail` interface:

```typescript
interface CampaignDetail {
  id: string
  title: string
  description: string
  status: string
  invitations: {
    id: string
    status: string
    influencer: {
      id: string
      influencerProfile: {
        handle: string
        displayName?: string
        profileImageUrl?: string
      }
    }
  }[]
  deliverables: {
    id: string
    description: string
    status: string
    influencerId: string
  }[]
  sop: {
    id: string
    title: string
    publishDate: string
    steps: unknown[]
    status: string
    targetMarket: string
    influencerType: string
    sellingPoints: unknown
    bindings?: {
      id: string
      invitationId: string
      boundAt: string
      sopPushedAt: string | null
    }[]
  } | null
}
```

2. Import `SopCard` at top:
```typescript
import SopCard from './components/sop-card'
```

3. Import `useQueryClient` from `@tanstack/react-query` and add `const queryClient = useQueryClient()` in the component.

4. Add `<SopCard>` between the Participants and Deliverables sections:

```tsx
{/* SOP */}
<SopCard
  campaignId={campaign.id}
  sop={campaign.sop}
  invitations={campaign.invitations}
  onSopChange={() => queryClient.invalidateQueries({ queryKey: ['campaign', id] })}
/>
```

- [ ] **Step 3: Modify influencer campaign detail page**

In `frontend/app/influencer/campaigns/[id]/page.tsx`:

1. Add `sop` to the `Campaign` interface:

```typescript
interface Campaign {
  id: string
  title: string
  description: string
  sop: {
    id: string
    title: string
    publishDate: string
    steps: unknown[]
    status: string
  } | null
}
```

2. Import `SopTimeline` at top:
```typescript
import SopTimeline from './components/sop-timeline'
```

3. Add `<SopTimeline sop={campaign.sop} />` between the Header and Progress sections.

- [ ] **Step 4: Commit**

```bash
git add frontend/app/brand/campaigns/[id]/page.tsx frontend/app/influencer/campaigns/[id]/page.tsx frontend/app/influencer/campaigns/[id]/components/
git commit -m "feat(frontend): integrate SOP card and timeline into campaign detail pages"
```

---

## Task 12: i18n Keys

**Files:**
- Modify: `frontend/messages/zh.json`, `frontend/messages/en.json`, `frontend/messages/ja.json`

- [ ] **Step 1: Add SOP keys to zh.json**

Under a new `sop` object:

```json
{
  "sop": {
    "title": "SOP",
    "generate": "生成 SOP",
    "edit": "编辑 SOP",
    "regenerate": "重新生成",
    "activate": "激活 SOP",
    "pushToFeishu": "推送至飞书",
    "noSop": "尚未生成 SOP",
    "step": "步骤 {number}",
    "dueDate": "截止日",
    "daysRemaining": "剩余 {days} 天",
    "currentStep": "当前阶段",
    "notGenerated": "SOP尚未生成，请联系品牌方",
    "bindStatus": {
      "bound": "已绑定",
      "notBound": "未绑定"
    },
    "bindHint": "分享飞书群链接并让达人发送 /绑定",
    "pushedToGroups": "已推送至 {count} 个群组"
  }
}
```

Repeat similar structures for `en.json` and `ja.json` with appropriate translations.

- [ ] **Step 2: Commit**

```bash
git add frontend/messages/
git commit -m "feat(i18n): add SOP translation keys"
```

---

## Task 13: Prompt Seed

**Files:**
- Modify: `backend/prisma/seed.ts` or equivalent seed script

- [ ] **Step 1: Seed sop-generator prompt**

Find the seed file and add:

```typescript
await prisma.prompt.upsert({
  where: { key: 'sop-generator', version: 1 },
  update: {},
  create: {
    key: 'sop-generator',
    content: `You are an expert in influencer marketing operations in Korea and Japan.

Campaign: {campaignTitle}
Description: {description}
Target Market: {targetMarket}
Influencer Type: {influencerType}
Selling Points: {sellingPoints}
Publish Date: {publishDate}

Generate a structured SOP workflow as JSON with this exact schema:
{{
  "title": "string",
  "steps": [
    {{
      "name": "string",
      "description": "string",
      "dueDateOffset": integer (days relative to publishDate, must be <= 0),
      "requirements": ["string"]
    }}
  ]
}}

Rules:
- Korean workflows: tighter deadlines, video-first. Example offsets: -7 (draft), -3 (review), -1 (final confirm).
- Japanese workflows: +1 day buffer, detail-oriented content. Example offsets: -8 (draft), -4 (review), -2 (final confirm).
- Beauty influencers need script/framework requirements.
- Fashion influencers need styling/detail shot requirements.
- Lifestyle influencers need authentic/natural content requirements.
- All requirements should be in the target market's language context.
- Output ONLY valid JSON, no markdown.`,
    version: 1,
  },
})
```

- [ ] **Step 2: Commit**

```bash
git add backend/prisma/seed.ts
git commit -m "feat(seed): add sop-generator prompt template"
```

---

## Task 14: Final Verification

- [ ] **Step 1: Backend build and tests**

```bash
cd /Users/pw/workspace/src/influencer-marketing/backend
yarn build
yarn test --no-coverage
```

Expected: Build succeeds, all new tests pass.

- [ ] **Step 2: Frontend build**

```bash
cd /Users/pw/workspace/src/influencer-marketing/frontend
yarn build
```

Expected: Build succeeds with no TypeScript errors.

- [ ] **Step 3: Final commit**

```bash
git commit -m "feat(sop): complete SOP management feature with Feishu integration" --allow-empty
```

---

## Spec Coverage Checklist

| Spec Requirement | Task |
|---|---|
| `Sop` model with JSON steps | Task 1 |
| `SopBinding` model | Task 1 |
| `SopReminderLog` model | Task 1 |
| `NotificationType` extension | Task 1 |
| AI SOP generation via `LLMService` | Task 4 |
| Prompt template `sop-generator` | Task 13 |
| Schema validation & retry | Task 4 |
| `POST /v1/sops` | Task 5 |
| `GET /v1/sops/campaign/:campaignId` | Task 5 |
| `PATCH /v1/sops/:id` | Task 5 |
| `POST /v1/sops/:id/regenerate` | Task 5 |
| `POST /v1/sops/:id/activate` | Task 5 |
| `POST /v1/sops/:id/push` | Task 5 |
| Feishu webhook at `/webhooks/feishu` | Task 6, 9 |
| Signature verification | Task 6 |
| `/绑定 <id>` command | Task 7 |
| `/进度` command | Task 7 |
| `/延期 <reason>` command | Task 7 |
| Daily 9:00 AM Asia/Tokyo reminder cron | Task 8 |
| 3-day and 1-day reminders with dedup | Task 8 |
| Brand campaign detail SOP card | Task 10, 11 |
| Influencer read-only SOP timeline | Task 11 |
| Access control (brand/influencer) | Task 5 |
| Frontend i18n | Task 12 |

---

## Execution Options

**Plan complete and saved to `docs/superpowers/plans/2026-05-12-sop-management.md`.**

Two execution options:

1. **Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration.
2. **Inline Execution** — Execute tasks in this session using the executing-plans skill, batch execution with checkpoints for review.

Which approach would you like?
