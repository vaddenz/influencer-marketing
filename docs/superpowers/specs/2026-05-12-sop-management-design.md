# SOP Management — Design Specification

## Overview

Enable brands to automatically generate AI-powered Standard Operating Procedure (SOP) workflows from campaign briefs, push them to Feishu groups bound to influencers, and send automated deadline reminders.

### Goals
- Reduce SOP creation time from 2 hours/份 to under 5 minutes
- Improve influencer on-time submission rate via automated reminders
- Reduce brand manual follow-up time by providing a structured workflow timeline

### Non-Goals
- Real-time chat or WebSocket messaging (Feishu bot uses async text commands only)
- Content approval workflow within SOP steps (content approval stays in existing Deliverable flow)
- PDF export or multi-language document generation
- SOP template library management (templates may be added post-MVP)

---

## Terminology

| Term | Definition |
|------|------------|
| **SOP** | A structured workflow timeline attached to a Campaign, consisting of ordered steps with deadlines relative to a publish date. |
| **SOP Step** | One stage in the SOP (e.g., "初稿提交", "视频审核"). Stored as a JSON object within the `Sop.steps` array. |
| **SopBinding** | A link between an SOP, an accepted Invitation, and a Feishu chat ID. Created when an influencer runs `/绑定` in a Feishu group. |
| **Brief** | The campaign description and requirements that the brand provides when creating a campaign. Used as input for AI SOP generation. |

---

## Data Model

### New Models

#### `Sop`

One SOP per Campaign. Steps are stored as a JSON array (no separate step table for MVP).

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | String | PK, cuid(2) | |
| `campaignId` | String | FK → Campaign, unique | One SOP per campaign |
| `title` | String | | AI-generated or brand-edited title |
| `publishDate` | DateTime | db.Date | Final publish deadline |
| `targetMarket` | String | | `kr` or `jp` |
| `influencerType` | String | | `beauty`, `fashion`, `lifestyle` |
| `sellingPoints` | Json | | Array of strings from brief |
| `steps` | Json | | Array of `{ name, description, dueDateOffset, requirements }` |
| `status` | Enum | | `generated`, `active`, `completed` |
| `createdAt` | DateTime | default(now()) | |
| `updatedAt` | DateTime | @updatedAt | |
| `deletedAt` | DateTime? | | Soft delete per project rules |

**`steps` JSON schema:**
```json
[
  {
    "name": "初稿提交",
    "description": "提交短视频脚本框架",
    "dueDateOffset": -7,
    "requirements": ["15秒开头抓眼球", "卖点韩语标注"]
  }
]
```

- `dueDateOffset`: integer, days relative to `publishDate`. Negative = before publish.
- `requirements`: array of strings, market-specific content rules.

#### `SopBinding`

Links an SOP to a specific influencer's Feishu group chat.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | String | PK, cuid(2) | |
| `sopId` | String | FK → Sop | |
| `invitationId` | String | FK → Invitation | Ensures influencer accepted the campaign |
| `chatId` | String | | Feishu chat/thread ID |
| `boundAt` | DateTime | default(now()) | When `/绑定` succeeded |
| `sopPushedAt` | DateTime? | | When SOP was first sent to this chat |
| `createdAt` | DateTime | default(now()) | |
| `updatedAt` | DateTime | @updatedAt | |

#### `SopReminderLog`

Prevents duplicate reminder messages.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | String | PK, cuid(2) | |
| `sopBindingId` | String | FK → SopBinding | |
| `stepIndex` | Int | | 0-based index into `Sop.steps` array |
| `reminderType` | String | | `3_day` or `1_day` |
| `sentAt` | DateTime | default(now()) | |

**Unique constraint:** `@@unique([sopBindingId, stepIndex, reminderType])`

### Changes to Existing Models

#### `Campaign`
No schema changes. `Sop` is fetched via `campaignId` FK.

#### `NotificationType` (enum)
Add three new values:
- `sop_pushed` — SOP was pushed to a Feishu group
- `sop_reminder` — Reminder sent (logged for brand visibility)
- `sop_delay_requested` — Influencer requested deadline extension

---

## Business Flow

```
1. Brand creates Campaign (existing flow)
        |
        v
2. Brand clicks "Generate SOP" on Campaign Detail
   → Brief refinement modal opens (target market, influencer type, selling points, publish date)
   → AI reads refined brief
   → Generates structured SOP JSON with steps
   → SOP.status = generated
        |
        v
3. Brand edits SOP if needed (web UI)
   → Can adjust title, publishDate, step names, offsets, requirements
   → Can click "Regenerate" to re-run AI with modified brief
   → SOP.status = active (when brand confirms)
        |
        v
4. Brand invites Influencer (existing flow)
   → Influencer accepts → Invitation.status = accepted
        |
        v
5. Brand creates Feishu group, adds bot, shares link with Influencer
        |
        v
6. Influencer joins group, types: /绑定 <influencerId>
   → Bot validates:
     a. Influencer ID exists
     b. Invitation for this campaign is accepted
     c. No existing binding for this invitation
   → Creates SopBinding (chatId + invitationId)
   → Replies: "绑定成功，将为您推送SOP"
        |
        v
7. Brand clicks "Push SOP to Feishu"
   → Bot sends formatted SOP message to all bound chatIds
   → Records sopPushedAt on each SopBinding
        |
        v
8. Daily 9:00 AM cron job scans active SOPs
   → For each SopBinding of active SOPs:
     a. Iterate steps array
     b. stepDueDate = sop.publishDate + step.dueDateOffset
     c. If today = stepDueDate - 3 days and no log → send 3-day reminder
     d. If today = stepDueDate - 1 day and no log → send 1-day reminder
   → Skip steps where stepDueDate is in the past
        |
        v
9. Influencer types /进度
   → Bot finds current step (nearest upcoming deadline)
   → Calculates days remaining = stepDueDate - today
   → Replies: "您当前处于【{step.name}】阶段，截止日{date}，剩余{days}天"
        |
        v
10. Influencer types /延期 <reason>
    → Bot creates Notification for brand:
        type: sop_delay_requested,
        title: "达人申请延期",
        message: "{influencerName} 申请延期: {reason}",
        relatedEntityType: "sop",
        relatedEntityId: sop.id
    → Replies to group: "延期申请已提交，运营将手动处理"
```

---

## Backend Architecture

### New Modules

#### `sop` module

**`SopController`** (`/v1/sops`)
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/` | Brand | Generate SOP from campaign brief. Body: `{ campaignId, targetMarket, influencerType, sellingPoints, publishDate }` |
| GET | `/campaign/:campaignId` | Brand / Influencer | Get SOP for campaign. Influencer sees only their own campaign's SOP. |
| PATCH | `/:id` | Brand | Edit SOP fields. Body: partial SopUpdateDto |
| POST | `/:id/regenerate` | Brand | Re-run AI generation with updated brief context |
| POST | `/:id/push` | Brand | Trigger Feishu push to all bindings |
| POST | `/:id/activate` | Brand | Mark SOP as active (allows reminders) |

**`SopService`**
- CRUD operations with access control (brand must own the campaign)
- `generate(campaignId)` — orchestrates AI call, validates output, persists SOP
- `pushToFeishu(sopId)` — delegates to `FeishuService`

**`SopGenerationService`**
- Uses existing `LLMService.createTypedCompletion<T>()`
- Loads prompt template via `PromptService.getPrompt('sop-generator', variables)`
- Validates returned JSON against expected schema
- Includes retry logic (1 retry on failure)

#### `feishu` module

**`FeishuController`** (`/webhooks/feishu`)
- `POST /` — Receives Feishu webhook events
- Handles challenge verification on first configuration
- Verifies request signature using app secret
- Delegates `im.message.receive_v1` events to `FeishuCommandService`

**`FeishuService`**
- `sendMessage(chatId, content)` — wraps Feishu Message API
- `verifySignature(body, signature, timestamp)` — validates webhook authenticity
- Rate limit handling: retries with exponential backoff on 429

**`FeishuCommandService`**
- `parseCommand(text)` — extracts command name and arguments
- `handleBind(chatId, influencerId)` — validates invitation, creates `SopBinding`
- `handleProgress(chatId)` — finds current step, calculates days remaining
- `handleDelay(chatId, reason)` — creates notification for brand

**`FeishuSchedulerService`**
- `@Cron('0 9 * * *')` — daily at 9:00 AM **Asia/Tokyo** time (covers both Korea and Japan markets)
- Uses `timezone: 'Asia/Tokyo'` in the cron decorator
- `sendReminders()` — scans active SOPs, sends 3-day and 1-day reminders
- Checks `SopReminderLog` before sending to prevent duplicates

### Changes to Existing Modules

#### `campaigns` module
- `CampaignsService.findOne` — include `sop: true` in Prisma query so Campaign Detail includes SOP data for both brand and influencer views

#### `notifications` module
- `NotificationType` enum extended with `sop_pushed`, `sop_reminder`, `sop_delay_requested`
- `NotificationsService` handles these types in list views

#### `app.module.ts`
- Import `SopModule` and `FeishuModule`
- `FeishuController` uses `@Controller('webhooks/feishu')` without API version prefix so Feishu can reach it at `https://<domain>/webhooks/feishu`

---

## Frontend UI

### Campaign Detail Page (`/brand/campaigns/[id]`)

Add an **SOP Card** below the Brief Card.

**No SOP yet:**
- CTA button: "Generate SOP"
- On click: opens a brief refinement modal pre-filled from campaign data
  - Fields: target market (`kr`/`jp`), influencer type (`beauty`/`fashion`/`lifestyle`), selling points (tag input), publish date
  - These may be extracted from the campaign description by AI or provided manually by the brand
- Brand clicks "Generate" → calls `POST /v1/sops` with the refined brief
- Loading spinner during generation

**SOP exists (status = generated):**
- Collapsible timeline showing steps
- Each step: name, due date (calculated from publishDate + offset), requirements list
- Action bar: "Edit SOP", "Regenerate", "Activate SOP"
- "Push to Feishu" button (disabled until SOP.status = active and at least one binding exists)

**SOP active:**
- Same timeline view, read-only by default
- "Edit" button for adjustments
- "Push to Feishu" enabled
- Shows push status: "Pushed to N groups"

### Influencer Cards (in Campaign Detail)

Add Feishu binding status badge:
- `not_bound` — gray badge
- `bound` — green badge with `boundAt` timestamp

If not bound, show hint: "Share Feishu group link and ask influencer to /绑定"

### SOP Edit Modal

Inline modal for editing the AI-generated SOP:
- Title input
- Publish date picker
- Steps list (each step editable):
  - Name input
  - Description textarea
  - Due date offset (number input, days before publish)
  - Requirements (tag input, add/remove strings)
- "Add Step" button
- "Remove Step" button
- "Save Changes" / "Cancel"

### Influencer Campaign View (`/influencer/campaigns/[id]`)

Influencers see a **read-only SOP timeline** in their campaign detail page.

- Collapsible timeline showing all steps
- Each step: name, due date, description, requirements list
- Highlights the **current step** (nearest upcoming deadline) with a distinct badge
- Shows days remaining for the current step
- No action buttons (cannot edit, regenerate, or push)
- If SOP has not been generated yet, show placeholder: "SOP尚未生成，请联系品牌方"

### Access Control Summary

| Action | Brand | Influencer |
|--------|-------|------------|
| Generate SOP | Yes | No |
| Edit SOP | Yes | No |
| Activate / Push to Feishu | Yes | No |
| View SOP timeline | Yes | Yes |
| Receive Feishu reminders | No | Yes |
| Query progress (`/进度`) | No | Yes |
| Request delay (`/延期`) | No | Yes |

---

## Feishu Bot Integration

### Webhook Setup

1. Create Feishu app (user does this in Feishu Developer Console)
2. Enable "Robot" capability
3. Configure webhook URL: `https://<domain>/webhooks/feishu`
4. Copy `app_id` and `app_secret` into backend `.env`

### Environment Variables

```
FEISHU_APP_ID=
FEISHU_APP_SECRET=
FEISHU_WEBHOOK_VERIFY_TOKEN=
```

### Message Format

**SOP Push Message (text format for MVP):**
```
【{sop.title}】

1. {step1.name}：{step1.dueDate}前
   {step1.description}
   要求：{step1.requirements.join('、')}

2. {step2.name}：{step2.dueDate}前
   ...

请确认收到SOP，如有问题请联系运营。
```

**Reminder Message:**
```
提醒：距离{step.name}还有{days}天（截止日：{dueDate}）
{step.description}
```

### Command Reference

| Command | Example | Bot Response (success) | Bot Response (failure) |
|---------|---------|------------------------|------------------------|
| `/绑定 <id>` | `/绑定 KR_001` | "绑定成功，将为您推送SOP" | "未找到该达人ID，请联系运营确认" |
| `/进度` | `/进度` | "您当前处于【视频审核】阶段，截止日2026-06-07，剩余3天" | "暂无进行中的SOP，请联系运营" |
| `/延期 <reason>` | `/延期 设备故障` | "延期申请已提交，运营将手动处理" | "绑定后才能申请延期" |

---

## AI SOP Generation

### Prompt Strategy

**Prompt key:** `sop-generator`

**Input variables:**
- `campaignTitle`
- `description` (campaign brief)
- `targetMarket` (`kr` or `jp`)
- `influencerType` (`beauty`, `fashion`, `lifestyle`)
- `sellingPoints` (JSON array)
- `publishDate`

**Output schema (structured JSON):**
```typescript
interface SOPGenerationOutput {
  title: string
  steps: {
    name: string
    description: string
    dueDateOffset: number // days relative to publishDate, negative = before
    requirements: string[]
  }[]
}
```

**Prompt includes:**
1. Role definition: "You are an expert in influencer marketing operations in Korea and Japan."
2. Output format instructions with JSON schema
3. Few-shot examples:
   - Korean beauty example: 15-second video script requirement
   - Japanese fashion example: detail-focused layout requirement
4. Market-specific rules:
   - Korean workflows: tighter deadlines, video-first
   - Japanese workflows: +1 day buffer, detail-oriented content

### Implementation

```typescript
// SopGenerationService
async generate(dto: GenerateSopDto) {
  const prompt = await this.promptService.getPrompt('sop-generator', {
    campaignTitle: dto.title,
    description: dto.description,
    targetMarket: dto.targetMarket,
    influencerType: dto.influencerType,
    sellingPoints: JSON.stringify(dto.sellingPoints),
    publishDate: dto.publishDate,
  })

  const result = await this.llmService.createTypedCompletion<SOPGenerationOutput>([
    { role: 'system', content: 'You are a helpful assistant...' },
    { role: 'user', content: prompt },
  ])

  if (!result || !this.validateSchema(result)) {
    throw new BadRequestException('AI generated invalid SOP structure')
  }

  return result
}
```

### Validation

`SopGenerationService.validateSchema()` checks:
- `title` is non-empty string
- `steps` is non-empty array
- Each step has `name`, `description`, `dueDateOffset` (integer), `requirements` (array of strings)
- `dueDateOffset` values are negative or zero (before/on publish date)

---

## Error Handling

| Scenario | HTTP Status / Behavior |
|----------|------------------------|
| AI generation fails (API error) | `503` — "SOP generation failed, please try again" (1 internal retry) |
| AI generates invalid JSON schema | `422` — "AI generated invalid SOP structure" with field details |
| Feishu webhook signature invalid | `401` — log suspicious request |
| `/绑定` with non-existent influencer ID | Bot replies: "未找到该达人ID，请联系运营确认" |
| `/绑定` when invitation not accepted | Bot replies: "该达人尚未接受合作邀请，请先完成邀请流程" |
| Push SOP but Feishu API fails | Log error, surface failed bindings in UI with retry button |
| Reminder cron fails for one binding | Log error, continue to next binding (don't block others) |
| Duplicate reminder (race condition) | `SopReminderLog` unique constraint prevents double-send |
| Influencer types unknown command | Bot replies: "未知命令。可用命令：/绑定, /进度, /延期" |

---

## Testing Strategy

### Unit Tests

| Test | Module | Coverage |
|------|--------|----------|
| SOP generation schema validation | `sop` | Rejects missing fields, wrong types, empty steps array |
| Command parser | `feishu` | Extracts `/绑定 KR_001`, `/延期 设备故障`, handles extra spaces |
| Reminder scheduler logic | `feishu` | Given SOP steps and current date, returns correct reminders to send |
| Feishu signature verification | `feishu` | Accepts valid signature, rejects invalid/tampered requests |
| Access control | `sop` | Influencer cannot generate SOP; brand cannot edit another's SOP |

### E2E Tests

| Test | Flow |
|------|------|
| Full SOP lifecycle | Create campaign → generate SOP → edit → activate → push → verify Feishu API called |
| Webhook binding flow | Simulate Feishu webhook with `/绑定` → verify `SopBinding` created → verify reply message queued |
| Reminder cron | Seed SOP with step due in 3 days → run scheduler → verify reminder sent, log created |
| Influencer SOP view | Log in as influencer → fetch campaign detail → verify SOP timeline is visible and read-only |
| Access control | Influencer calls `POST /v1/sops` or `PATCH /v1/sops/:id` → verify `403` |
| Security | Send webhook with bad signature → verify `401`, no DB changes |

### Manual Testing

- Feishu app creation and webhook configuration
- Actual group chat binding and SOP push
- Command responses in real Feishu client

---

## Migration Plan

1. **Prisma migration**: Add `Sop`, `SopBinding`, `SopReminderLog` tables; extend `NotificationType` enum
2. **Seed prompt**: Insert `sop-generator` prompt into `Prompt` table
3. **Environment**: Add `FEISHU_APP_ID`, `FEISHU_APP_SECRET` to `.env.example`
4. **Feishu app setup**: User creates app in Feishu Developer Console, configures webhook

---

## Open Questions (Post-MVP)

1. Should SOP steps map to Deliverables for progress tracking? (Currently separate systems)
2. Should brands be able to save AI-tuned SOPs as reusable templates?
3. Should the Feishu bot support interactive cards (buttons) instead of text commands?
4. Should reminders support custom schedules per brand (e.g., 7-day instead of 3-day)?
