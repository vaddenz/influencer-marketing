# Brand — Create Campaign + Invite

## Purpose
Create the brief, define deliverables, and send the invitation to a specific influencer in one flow.

## ASCII UI

```
+------------------------------------------------------------------+
|  LOGO    Campaigns    Discover    Profile              [BrandCo] |
+------------------------------------------------------------------+
|                                                                  |
|  < Back                                                          |
|                                                                  |
|  Create Campaign + Invite @travel_jane                           |
|                                                                  |
|  +-------------------------------------------------------------+ |
|  | Step 1 of 2: Campaign Details                               | |
|  | ============================================================| |
|  |                                                             | |
|  |  Campaign Title *                                           | |
|  |  +------------------------------------------------------+   | |
|  |  | Summer Promo                                          |   | |
|  |  +------------------------------------------------------+   | |
|  |                                                             | |
|  |  Description & Requirements *                               | |
|  |  +------------------------------------------------------+   | |
|  |  | Create a Reel showcasing our summer collection and    |   | |
|  |  | 3 Stories with the discount code.                     |   | |
|  |  +------------------------------------------------------+   | |
|  |                                                             | |
|  |  Budget (USD) *                    Due Date *               | |
|  |  +------------------+              +------------------+     | |
|  |  | $500             |              | Aug 15, 2026     |     | |
|  |  +------------------+              +------------------+     | |
|  |                                                             | |
|  |  Deliverables:                                              | |
|  |  +------------------------------------------------------+   | |
|  |  | 1 Instagram Reel                           [remove]   |   | |
|  |  | Due: Aug 15                                           |   | |
|  |  +------------------------------------------------------+   | |
|  |  +------------------------------------------------------+   | |
|  |  | 3 Instagram Stories                        [remove]   |   | |
|  |  | Due: Aug 15                                           |   | |
|  |  +------------------------------------------------------+   | |
|  |                                                             | |
|  |  [+ Add Deliverable]                                        | |
|  |                                                             | |
|  |                                    [Cancel]  [Next: Invite] | |
|  |                                                             | |
|  +-------------------------------------------------------------+ |
|                                                                  |
```

## Step 2: Send Invitation

```
+------------------------------------------------------------------+
|  LOGO    Campaigns    Discover    Profile              [BrandCo] |
+------------------------------------------------------------------+
|                                                                  |
|  < Back                                                          |
|                                                                  |
|  Create Campaign + Invite @travel_jane                           |
|                                                                  |
|  +-------------------------------------------------------------+ |
|  | Step 2 of 2: Send Invitation                                | |
|  | ============================================================| |
|  |                                                             | |
|  |  Campaign Preview:                                          | |
|  |  +------------------------------------------------------+   | |
|  |  | Summer Promo                                           |   | |
|  |  | Budget: $500  |  Due: Aug 15                           |   | |
|  |  |                                                        |   | |
|  |  | Create a Reel showcasing our summer collection and     |   | |
|  |  | 3 Stories with the discount code.                      |   | |
|  |  |                                                        |   | |
|  |  | Deliverables: 1 Reel + 3 Stories                       |   | |
|  |  +------------------------------------------------------+   | |
|  |                                                             | |
|  |  Inviting: @travel_jane                                     | |
|  |  Travel & Lifestyle  |  125K  |  California, USA           | |
|  |                                                             | |
|  |  Personalized Message (optional):                           | |
|  |  +------------------------------------------------------+   | |
|  |  | Hi! Love your travel content. We'd love to work with |   | |
|  |  | you on our summer campaign...                          |   | |
|  |  +------------------------------------------------------+   | |
|  |                                                             | |
|  |  The influencer will see your campaign brief and can        | |
|  |  accept or decline.                                         | |
|  |                                                             | |
|  |                             [< Back]  [Send Invitation]     | |
|  |                                                             | |
|  +-------------------------------------------------------------+ |
|                                                                  |
+------------------------------------------------------------------+
```

## Key Elements
- **Step Indicator**: Progress through 2 steps
- **Step 1 — Campaign Details**:
  - Title input (required)
  - Description textarea (required)
  - Budget input (required)
  - Due date picker (required)
  - Deliverables list: editable items with platform, type, quantity, due date, remove button
  - "+ Add Deliverable" button
  - Cancel / Next actions
- **Step 2 — Send Invitation**:
  - Read-only campaign preview
  - Influencer being invited (pre-selected)
  - Optional personalized message
  - Back / Send Invitation actions

## Action Flows

### Flow: Add Deliverable
1. Brand clicks "+ Add Deliverable" button
2. New deliverable row/form appears in the list
3. Brand selects Platform from dropdown (Instagram, TikTok, YouTube, etc.)
4. Brand selects Type from dropdown (Reel, Story, Post, Video)
5. Brand enters Quantity (number input, default 1)
6. Brand picks Due Date from date picker
7. Brand can remove any deliverable using the "[remove]" link

### Flow: Step 1 — Fill Campaign Details
1. Brand enters Campaign Title (required, max 100 chars)
2. Brand enters Description & Requirements (required, textarea)
3. Brand enters Budget in USD (required, numeric input)
4. Brand selects Due Date from date picker (required)
5. Brand adds one or more deliverables
6. Brand clicks "Cancel" to abort, or "Next: Invite" to proceed
7. System validates all required fields before allowing Next
8. If validation fails, inline errors appear on invalid fields

### Flow: Step 2 — Review and Send Invitation
1. Step 2 loads with read-only Campaign Preview
2. Influencer being invited is displayed with avatar, handle, and stats
3. Brand reviews campaign details for accuracy
4. Brand optionally types a Personalized Message (textarea)
5. Brand clicks "< Back" to return to Step 1 and edit
6. Brand clicks "Send Invitation" to finalize
7. System creates campaign record with `status: active`
8. System creates invitation record with `status: pending`
9. System creates deliverable records from template with `status: pending`
10. System creates notification for influencer (`type: invitation_received`)
11. Page redirects to `/campaigns/:id` (Campaign Detail)

## Notes
- Deliverable form: Platform (dropdown), Type (dropdown: Reel, Story, Post, Video), Quantity, Due Date
- Campaign is created in `draft` status, invitation moves it to `active`
- After sending, redirect to Campaign Detail
