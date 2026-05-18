# External Search Source Design

## Overview

Extend the influencer discovery feature to search niche external websites in addition to the internal `InfluencerProfile` database. Results stream to the frontend in real-time via SSE, while a background BullMQ worker persists, deduplicates, and merges scraped data into the existing `InfluencerProfile` table.

## Goals

- Users see internal results instantly, with external results appending dynamically.
- External scraping is modular — adding a new site requires only a new adapter.
- Anti-detection measures are centralized and strict.
- Scraped data is reconciled with existing profiles automatically.

## Non-Goals

- Solving CAPTCHAs automatically (graceful degradation instead).
- Scraping mainstream platforms (Instagram, TikTok, YouTube).
- Real-time bidirectional communication (WebSocket).

---

## Architecture & Components

### 1. SearchSseController

Extends the existing `InfluencersController` with a new SSE endpoint.

- **Endpoint:** `GET /influencers/search-stream`
- **Accepts:** `SearchInfluencersDto` (same filters as existing search)
- **Behavior:**
  1. Opens SSE connection.
  2. Queries internal DB via `InfluencersService` and emits `internal` events.
  3. Invokes `ScraperService` to run matching external adapters in parallel.
  4. Forwards scraped results as `external` events.
  5. Emits `done` event when all adapters finish or timeout.

### 2. ScraperModule + ScraperService

A dedicated NestJS module managing the scraping lifecycle.

- **Browser pool:** Maintains Playwright browser instances using `playwright-extra` with stealth plugins.
- **Context isolation:** Each adapter receives a fresh `BrowserContext` with unique viewport, locale, and user-agent.
- **Adapter registry:** Loads all `ScraperAdapter` implementations at startup.
- **Execution:** Runs matching adapters in parallel, yields results via async iterables.

### 3. ScraperAdapter Interface

Each external site implements this interface.

```ts
interface ScraperAdapter {
  readonly sourceName: string;
  readonly sourceUrl: string;
  canHandle(query: SearchInfluencersDto): boolean;
  scrape(
    browser: BrowserContext,
    query: SearchInfluencersDto
  ): AsyncIterable<RawScrapedProfile>;
}
```

Adapters live in `src/scraper/adapters/`. Adding a new site means adding one adapter file.

### 4. ScrapedProfileProcessor (BullMQ Worker)

Background worker attached to the `scraped-profiles` queue.

- Receives batches of `RawScrapedProfile[]`.
- Deduplicates against existing `InfluencerProfile` records.
- Merges fields into existing profiles or creates new unclaimed profiles.
- Emits metrics and logs.

### 5. Frontend useSearchStream Hook

Wraps `EventSource` to consume the SSE endpoint.

- Incrementally appends `external` events to the result list.
- Handles `done` and `warning` events.
- Disconnects on unmount.

---

## Data Model

### InfluencerProfile Extensions

| Field | Type | Purpose |
|-------|------|---------|
| `userId` | `String?` | Nullable for unclaimed external profiles |
| `handle` | `String` | Remove `@unique`; replaced with `@@index([handle])` |
| `deletedAt` | `DateTime?` | Logical deletion (project convention) |
| `nick` | `String?` | Platform-specific nickname |
| `age` | `Int?` | Age |
| `likes` | `Int?` | Total likes |
| `postedImages` | `Int?` | Image count |
| `postedVideos` | `Int?` | Video count |
| `subscriptionFee` | `Decimal?` | Fee amount |
| `isFree` | `Boolean?` | Free/paid flag |
| `sampleMedia` | `Json?` | Array of media URLs |
| `homepageUrl` | `String?` | Profile link on external site |
| `socialMedia` | `Json?` | Cross-platform social links |
| `props` | `Json?` | Platform-specific extra properties |
| `sourceName` | `String?` | Which scraper produced this |
| `sourceUrl` | `String?` | Exact scraped URL |
| `lastScrapedAt` | `DateTime?` | Last scrape timestamp |

### Deduplication Strategy

No database unique constraint spans external sites. The background worker uses a composite heuristic:

1. `homepageUrl` exact match.
2. `handle` + `sourceName` exact match.
3. Fuzzy name similarity fallback (e.g., Levenshtein on `displayName`).

### RawScrapedProfile Payload

```ts
interface RawScrapedProfile {
  sourceName: string;
  sourceUrl: string;
  nick?: string;
  name?: string;
  avatar?: string;
  bio?: string;
  age?: number;
  fans?: number;
  likes?: number;
  postedImages?: number;
  postedVideos?: number;
  subscriptionFee?: number;
  isFree?: boolean;
  sampleMedia?: string[];
  homepageUrl?: string;
  socialMedia?: Record<string, string>;
  props?: Record<string, unknown>;
}
```

---

## Data Flow

```
Frontend          SearchSseController          InfluencersService
  |                        |                           |
  |--- SSE CONNECT ------->|                           |
  |                        |--- search(dto) ----------->|
  |<-- event: internal ----|                           |
  |                        |                           |
  |                        |--- scrape(dto) ---------->|
  |                        |     (ScraperService)      |
  |                        |                           |
  |                        |<-- RawScrapedProfile* ----|
  |<-- event: external ----|                           |
  |                        |--- enqueue(batch) ------->|
  |                        |     (BullMQ)              |
  |<-- event: done --------|                           |

BullMQ Queue      ScrapedProfileProcessor      InfluencerProfile
     |                      |                           |
     |--- job dequeued ---->|                           |
     |                      |--- deduplicate ---------->|
     |                      |--- merge or insert ------>|
     |                      |                           |
```

### Step-by-Step

1. **Frontend opens SSE** connection to `/influencers/search-stream`.
2. **Controller generates** a `searchId` and creates an SSE-scoped event emitter.
3. **Internal search** runs immediately; results pushed as `internal` events.
4. **External scraping** starts in parallel for all adapters where `canHandle(query)` is true.
5. **Each scraped result** is:
   - Pushed to the SSE stream as an `external` event.
   - Buffered into a batch (every 10 results or 5 seconds).
6. **Batch is enqueued** to the `scraped-profiles` BullMQ queue.
7. **Background worker** deduplicates, merges, and persists.
8. **Controller emits** `done` and closes the connection when adapters finish or timeout.

---

## API Design

### SSE Endpoint

```
GET /api/v1/influencers/search-stream?q=travel&location=US
Accept: text/event-stream
Authorization: Bearer <token>
```

### Event Types

| Event | Data | Description |
|-------|------|-------------|
| `internal` | `InfluencerProfile[]` | Existing DB results |
| `external` | `RawScrapedProfile` | Single scraped profile |
| `warning` | `{ message: string }` | Adapter failure, rate-limit, etc. |
| `done` | `{ searchId: string }` | All sources completed |

### Example Stream

```
event: internal
data: [{"id":"...","displayName":"Jane",...}]

event: external
data: {"sourceName":"site-a","name":"John","fans":5000,...}

event: external
data: {"sourceName":"site-b","name":"Alice","fans":12000,...}

event: done
data: {"searchId":"uuid"}
```

---

## Anti-Detection Strategy

| Layer | Implementation |
|-------|----------------|
| **Stealth** | `playwright-extra` + `puppeteer-extra-plugin-stealth` |
| **Context isolation** | Fresh `BrowserContext` per adapter with randomized viewport, locale, timezone |
| **User-agent rotation** | Rotate realistic desktop/mobile UAs per adapter config |
| **Proxy support** | Configurable proxy pool; each context binds to a different proxy |
| **Human-like behavior** | Randomized delays (800ms–2500ms), mouse movement via `page.mouse.move()` |
| **Rate limiting** | Per-adapter `minRequestInterval` enforced by `ScraperService` |

---

## Error Handling

| Scenario | Behavior |
|----------|----------|
| **Page blocked / CAPTCHA** | Adapter throws `ScraperBlockedError`; one retry with fresh context + proxy, then graceful abort. |
| **Timeout** | Per-adapter `scrapeTimeout` (default 30s); aborts, continues with other adapters. |
| **Adapter crash** | Caught by `ScraperService`; logged, metric emitted, other adapters unaffected. |
| **SSE client disconnect** | `AbortController` cancels in-flight scraping to free browser contexts. |
| **BullMQ worker failure** | Retries with backoff (3 attempts); dead-letter queue for manual inspection. |
| **All adapters fail** | User still sees internal results + `warning` event. |

---

## Background Worker

### Queue: `scraped-profiles`

**Job Data:**
```ts
interface ScrapedProfileJob {
  searchId: string;
  profiles: RawScrapedProfile[];
}
```

**Processing Logic:**
1. For each `RawScrapedProfile`:
   a. Query `InfluencerProfile` by `homepageUrl` exact match.
   b. If no match, query by `handle` + `sourceName`.
   c. If still no match, fuzzy match on `displayName`.
2. **If match found:**
   - Merge non-null scraped fields into existing record.
   - Update `lastScrapedAt`.
3. **If no match:**
   - Create new `InfluencerProfile` with `userId: null`.
4. Log counts: `new`, `updated`, `skipped`.

### Merge Rules

- Scraper-provided non-null values overwrite existing values.
- Existing values are preserved when scraper provides `null` or `undefined`.
- `lastScrapedAt` is always updated.

---

## Testing

| Type | Scope | Approach |
|------|-------|----------|
| **Unit** | Adapter implementations | Mock `BrowserContext`/`Page`; verify selectors and extraction |
| **Unit** | Deduplication/merge logic | Feed fixtures, assert insert vs. update decisions |
| **Integration** | `ScraperService` | Real browser against local static HTML mimicking external site |
| **Integration** | SSE endpoint | Connect `EventSource`; verify event sequence |
| **E2E** | Full flow | Seed DB, trigger search, assert SSE + final DB state |

---

## Future Work

- Claim flow: allow real users to claim an unclaimed `InfluencerProfile` by verifying ownership.
- Proxy provider integration: rotate residential proxies automatically.
- Scraper health dashboard: track per-adapter success rates and block rates.
- Incremental scraping: schedule periodic re-scrapes of known profiles to keep data fresh.
