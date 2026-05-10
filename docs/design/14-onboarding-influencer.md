# Onboarding — Influencer

## Purpose
Collect essential influencer profile information after account creation. Required before the profile becomes discoverable by brands.

## ASCII UI

```
+------------------------------------------------------------------+
|                                                                  |
|                                                                  |
|                        +--------------------+                    |
|                        |     [LOGO]         |                    |
|                        |  InfluencerHub     |                    |
|                        +--------------------+                    |
|                                                                  |
|                        +------------------------------------+    |
|                        |  Set Up Your Profile               |    |
|                        |  Step 1 of 2                       |    |
|                        |  ================================  |    |
|                        |                                    |    |
|                        |  Profile Photo                     |    |
|                        |  +------+                          |    |
|                        |  |  ⭐  |  [Upload Photo]          |    |
|                        |  +------+                          |    |
|                        |                                    |    |
|                        |  Display Name / Handle *           |    |
|                        |  +------------------------------+  |    |
|                        |  | @travel_jane                 |  |    |
|                        |  +------------------------------+  |    |
|                        |                                    |    |
|                        |  Niche *                           |    |
|                        |  +------------------------------+  |    |
|                        |  | Travel & Lifestyle         [v]|  |    |
|                        |  +------------------------------+  |    |
|                        |                                    |    |
|                        |  Bio *                             |    |
|                        |  +------------------------------+  |    |
|                        |  | Exploring the world one...   |  |    |
|                        |  +------------------------------+  |    |
|                        |  0 / 300 characters                |    |
|                        |                                    |    |
|                        |  Location *                        |    |
|                        |  +------------------------------+  |    |
|                        |  | California, United States  [v]|  |    |
|                        |  +------------------------------+  |    |
|                        |                                    |    |
|                        |         [   Next: Platforms  > ]   |    |
|                        +------------------------------------+    |
|                                                                  |
+------------------------------------------------------------------+
```

## Step 2: Platforms & Stats

```
+------------------------------------------------------------------+
|                                                                  |
|                                                                  |
|                        +--------------------+                    |
|                        |     [LOGO]         |                    |
|                        |  InfluencerHub     |                    |
|                        +--------------------+                    |
|                                                                  |
|                        +------------------------------------+    |
|                        |  Set Up Your Profile               |    |
|                        |  Step 2 of 2                       |    |
|                        |  ================================  |    |
|                        |                                    |    |
|                        |  Platforms *                       |    |
|                        |  Select at least one               |    |
|                        |                                    |    |
|                        |  [x] Instagram  [x] TikTok         |    |
|                        |  [ ] YouTube    [ ] X/Twitter      |    |
|                        |  [ ] Douyin     [ ] Other          |    |
|                        |                                    |    |
|                        |  Follower Count *                  |    |
|                        |  +------------------------------+  |    |
|                        |  | 125,000                      |  |    |
|                        |  +------------------------------+  |    |
|                        |  Auto-calculated scope: Micro      |    |
|                        |                                    |    |
|                        |  Engagement Rate (%) *             |    |
|                        |  +------------------------------+  |    |
|                        |  | 4.2                          |  |    |
|                        |  +------------------------------+  |    |
|                        |                                    |    |
|                        |  Niche Categories                  |    |
|                        |  [Travel] [Lifestyle] [+ Add]      |    |
|                        |                                    |    |
|                        |  Languages                         |    |
|                        |  [English] [Spanish] [+ Add]       |    |
|                        |                                    |    |
|                        |  [< Back]  [  Complete Setup  ]    |    |
|                        +------------------------------------+    |
|                                                                  |
+------------------------------------------------------------------+
```

## Key Elements
- **Step Indicator**: "Step X of 2" shows two-step onboarding
- **Step 1 — Profile Basics**:
  - Profile Photo upload
  - Display Name / Handle (required)
  - Niche dropdown (required)
  - Bio textarea with character counter (required, max 300)
  - Location picker (required)
- **Step 2 — Platforms & Stats**:
  - Platform multi-select checkboxes (required, at least one)
  - Follower Count numeric input (required)
  - Auto-calculated Scope display (Nano/Micro/Macro/Mega)
  - Engagement Rate numeric input (required)
  - Niche Categories tag input (optional)
  - Languages tag input (optional)

## Action Flows

### Flow: Step 1 — Fill Profile Basics
1. Influencer uploads profile photo (optional, JPG/PNG, max 2MB)
2. Influencer enters Display Name / Handle (required, max 50 chars)
3. Client validates handle format (alphanumeric, underscores, no spaces)
4. Influencer selects Niche from dropdown (required)
5. Influencer types Bio (required, max 300 chars)
6. Character counter updates in real-time
7. Influencer selects Location from cascading dropdown (Country → Region)
8. Client validates all required fields
9. Influencer clicks "Next: Platforms"
10. Client validates Step 1 fields before advancing
11. If valid, page transitions to Step 2
12. If invalid, inline errors appear; influencer remains on Step 1

### Flow: Step 2 — Fill Platforms & Stats
1. Step 2 loads with data from Step 1 preserved
2. Influencer selects at least one Platform via checkboxes
3. Influencer enters Follower Count (numeric, required)
4. Client auto-calculates and displays Scope tier:
   - 1K–10K → Nano
   - 10K–100K → Micro
   - 100K–1M → Macro
   - 1M+ → Mega
5. Influencer enters Engagement Rate (numeric, 0–100, required)
6. Influencer optionally adds Niche Category tags
7. Influencer optionally adds Language tags
8. Client validates all required fields
9. Influencer clicks "Complete Setup"
10. Client validates Step 2 fields
11. Client sends `POST /api/v1/influencer-profiles` with all onboarding data
12. Server creates `influencer_profiles` record linked to user
13. Server updates user `status` to `active`
14. Server returns created profile data
15. Client stores profile in global state
16. Client redirects to Influencer Invitations (`/`)
17. Success toast: "Welcome to InfluencerHub, @travel_jane!"

### Flow: Go Back from Step 2
1. Influencer clicks "< Back" button on Step 2
2. Page transitions back to Step 1
3. All previously entered Step 1 data is preserved in form fields
4. Influencer can edit and proceed forward again

### Flow: Add Tag (Niche Category or Language)
1. Influencer clicks "+ Add" button
2. Inline input field appears
3. Influencer types value and presses Enter
4. Tag appears as a removable pill
5. Tag is included in the final submission

## Notes
- Onboarding is gated — influencer cannot access portal until completed
- Profile photo is optional; placeholder shown if skipped
- Handle uniqueness checked on blur (debounced 500ms)
- Location uses two-level cascading dropdown: Country → Region/State
- Scope is read-only, auto-calculated from follower count
- Engagement rate stored as decimal (e.g., 4.2 = 4.2%)
- Two-step onboarding reduces cognitive load vs. single long form
