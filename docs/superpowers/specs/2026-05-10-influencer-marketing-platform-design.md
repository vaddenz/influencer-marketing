# Influencer Marketing Platform — MVP Design

## Overview

An influencer marketing platform that lets brands discover influencers, send collaboration invitations, and manage lightweight campaigns through a deliverables checklist. The MVP supports two roles: **brands** and **influencers**.

## Scope

### In Scope (MVP)

- User registration and authentication (brands and influencers)
- Influencer profile creation and public discovery
- Advanced influencer search with multi-condition filters
- Brand-led invitation workflow (search → profile → invite)
- Campaign brief creation and management
- Lightweight deliverables checklist (no content upload)
- In-app status notifications (no real-time chat)

### Out of Scope (MVP)

- Agencies as a distinct role (architected for later)
- Payments, escrow, or invoicing
- Content submission, review, or approval workflow
- In-app messaging between brand and influencer
- Publishing tracking or social media API integrations
- Analytics dashboards or ROI reporting

## Architecture

```
┌─────────────────────────────────────────────┐
│  NextJS Frontend (Role-Switching)           │
│  • Brand Dashboard layout                   │
│  • Influencer Portal layout                 │
│  • Shared auth, routing, components         │
└──────────────────┬──────────────────────────┘
                   │ HTTPS
┌──────────────────▼──────────────────────────┐
│  NestJS API                                 │
│  • Auth Module (JWT)                        │
│  • Users Module                             │
│  • Influencers Module (discovery)           │
│  • Campaigns Module                         │
│  • Invitations Module                       │
│  • Deliverables Module                      │
│  • Notifications Module                     │
└──────────────────┬──────────────────────────┘
                   │ SQL
┌──────────────────▼──────────────────────────┐
│  PostgreSQL                                 │
│  • Relational schema (see Data Model)       │
└─────────────────────────────────────────────┘
```

**Rationale:** The team has existing NestJS backend and NextJS frontend templates. A single NextJS app with role-based layout switching reduces overhead while keeping brand and influencer UIs clearly separated. Clean API separation allows mobile apps to reuse the backend later.

## Data Model

### `users`
Base authentication and identity.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| email | string, unique | |
| password_hash | string | bcrypt |
| role | enum | brand, influencer (agency reserved) |
| status | enum | active, inactive |
| created_at | timestamp | |
| updated_at | timestamp | |

### `brand_profiles`
Brand-specific public profile.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| user_id | UUID FK → users | 1:1 |
| company_name | string | |
| industry | string | |
| website | string | optional |
| description | text | optional |
| logo_url | string | optional |

### `influencer_profiles`
Influencer-specific public profile and discoverable data.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| user_id | UUID FK → users | 1:1 |
| display_name | string | |
| handle | string, unique | e.g. @travel_jane |
| bio | text | |
| niche | string | e.g. Travel, Fitness, Beauty |
| follower_count | integer | aggregate across platforms |
| engagement_rate | decimal | percentage, e.g. 4.2 |
| platforms | JSON | `[{platform, url, followers}]` |
| location_country | string | ISO code |
| location_region | string | state/province |
| profile_image_url | string | optional |

### `campaigns`
Campaign brief created by a brand.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| brand_id | UUID FK → users | brand role only |
| title | string | |
| description | text | requirements, creative direction |
| status | enum | draft, active, completed, cancelled |
| budget | decimal | optional, in brand's currency |
| start_date | date | optional |
| end_date | date | optional |
| created_at | timestamp | |
| updated_at | timestamp | |

### `invitations`
Connection between a campaign and an influencer.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| campaign_id | UUID FK → campaigns | |
| influencer_id | UUID FK → users | influencer role only |
| status | enum | pending, accepted, declined, withdrawn |
| message | text | brand's personalized note |
| created_at | timestamp | |
| responded_at | timestamp | nullable |

### `deliverables`
Tasks the influencer must complete for a campaign.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| campaign_id | UUID FK → campaigns | |
| influencer_id | UUID FK → users | |
| description | string | e.g. "1 Instagram Reel" |
| due_date | date | optional |
| status | enum | pending, in_progress, completed |
| completed_at | timestamp | nullable |
| created_at | timestamp | |

### `notifications`
System-generated status updates for users.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| user_id | UUID FK → users | recipient |
| type | enum | invitation_received, invitation_accepted, invitation_declined, campaign_updated, deliverable_due, deliverables_completed |
| title | string | |
| message | text | |
| read | boolean | default false |
| related_entity_type | string | campaign, invitation, deliverable |
| related_entity_id | UUID | |
| created_at | timestamp | |

## Workflows & Screens

### Brand Journey

1. **Dashboard** — Overview of active campaigns, stats, and entry points.
2. **Discover** — Search-first discovery with no campaign required.
   - Filters: keywords, niche, platform (multi-select), location (country + region), followers (min/max slider), scope (Nano/Micro/Macro/Mega).
   - Results list with quick "View Profile" action.
3. **Influencer Profile (Brand View)** — Full stats, bio, platforms.
   - Two CTAs: "Invite to Existing Campaign" or "Create Campaign + Invite".
4. **Invite Modal** — Select existing campaign from dropdown or pick "+ Create New Campaign" inline. Attach optional personal message.
5. **Campaign Detail** — View participants, invitation statuses, deliverable completion progress. Mark campaign complete.

### Influencer Journey

1. **Invitations** — List of pending invitations with brief preview (brand, campaign title, budget, due date). Accept/Decline actions.
2. **Campaign View** — Read full brief, view deliverables checklist with due dates, check off items as completed.
3. **Profile** — Public-facing stats and bio. Editable by influencer. What brands see during discovery.

### Scope Tier Definitions

| Tier | Follower Range |
|------|----------------|
| Nano | 1K – 10K |
| Micro | 10K – 100K |
| Macro | 100K – 1M |
| Mega | 1M+ |

## Data Flow

### Invitation State Machine

```
pending ──→ accepted ──→ in_progress ──→ completed
   │
   ├──→ declined (influencer action)
   └──→ withdrawn (brand action)
```

### Key Sequence: Brand Invites → Influencer Accepts → Deliverables Complete

1. Brand `POST /api/v1/campaigns` (if creating new campaign inline)
2. Brand `POST /api/v1/invitations` → system creates `notification` (type: invitation_received) for influencer
3. Influencer `GET /api/v1/invitations` → sees pending invitation
4. Influencer `PATCH /api/v1/invitations/:id/accept` → status becomes accepted
   - System creates `notification` (type: invitation_accepted) for brand
   - System creates `deliverables` from campaign template (status: pending)
5. Influencer `PATCH /api/v1/deliverables/:id/complete` → marks deliverable done
6. When all deliverables for an influencer are completed → system creates `notification` (type: deliverables_completed) for brand

## API Design

All endpoints prefixed with `/api/v1`.

### Auth
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`
- `POST /api/v1/auth/refresh`

### Discovery & Profiles
- `GET /api/v1/influencers` — search with query params:
  - `q` (keywords)
  - `niche`
  - `platforms` (comma-separated)
  - `location` (country code)
  - `region`
  - `followers_min` / `followers_max`
  - `scope` (nano/micro/macro/mega)
- `GET /api/v1/influencers/:id/profile`
- `PATCH /api/v1/influencers/me/profile`
- `GET /api/v1/brands/:id/profile`
- `PATCH /api/v1/brands/me/profile`

### Campaigns
- `GET /api/v1/campaigns` — list my campaigns
- `POST /api/v1/campaigns`
- `GET /api/v1/campaigns/:id`
- `PATCH /api/v1/campaigns/:id`
- `DELETE /api/v1/campaigns/:id`

### Invitations
- `POST /api/v1/invitations`
- `GET /api/v1/invitations`
- `PATCH /api/v1/invitations/:id/accept`
- `PATCH /api/v1/invitations/:id/decline`
- `PATCH /api/v1/invitations/:id/withdraw`

### Deliverables
- `GET /api/v1/deliverables?campaign_id=:id`
- `PATCH /api/v1/deliverables/:id/complete`
- `PATCH /api/v1/deliverables/:id/reopen` (optional for MVP)

### Notifications
- `GET /api/v1/notifications`
- `PATCH /api/v1/notifications/:id/read`
- `PATCH /api/v1/notifications/read-all`

## Error Handling

- Standard HTTP status codes: 400 validation, 401 unauthorized, 403 forbidden, 404 not found, 409 conflict.
- NestJS global exception filter returns `{ statusCode, message, error }`.
- Validation errors return 400 with field-level detail array.
- JWT guard on all routes except register/login.
- Role guards (`@Roles(Role.Brand)`, `@Roles(Role.Influencer)`) enforce endpoint access.

## Testing Strategy

- **Unit tests:** Service layer logic (Jest). Focus on invitation state transitions, deliverable completion rules, and search filtering.
- **Controller tests:** API contract validation, auth/role guard behavior, request/response shapes.
- **E2E tests:** At least one complete flow per critical path:
  1. Brand registers → creates campaign → searches → invites influencer
  2. Influencer registers → accepts invitation → completes deliverables
  3. Brand receives notifications at each key transition

## Future Considerations

- **Agencies:** Add `agency` role and `agency_profiles` table. Agencies manage multiple brand clients.
- **Payments:** Integrate payment provider for campaign budgets, escrow, and influencer payouts.
- **Content Submission:** Add file upload to deliverables so influencers can submit content for brand review.
- **Messaging:** Real-time chat between brand and influencer within a campaign context.
- **Publishing Tracking:** OAuth integrations with social platforms to verify posted content and auto-track engagement.
- **Analytics:** Campaign performance dashboards with reach, impressions, and ROI metrics.
