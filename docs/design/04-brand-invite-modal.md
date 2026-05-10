# Brand — Invite Modal

## Purpose
Pick an existing campaign or create a new one inline. Attach a personal note. Send invitation to influencer.

## ASCII UI

```
+------------------------------------------------------------------+
|  LOGO    Campaigns    Discover    Profile              [BrandCo] |
+------------------------------------------------------------------+
|                                                                  |
|  +------------------------------------------------------------+  |
|  |  Invite @travel_jane                                 [x]   |  |
|  |  ========================================================  |  |
|  |                                                            |  |
|  |  Select Campaign:                                          |  |
|  |  +------------------------------------------------------+  |  |
|  |  | Summer Promo (Active)                            [v] |  |  |
|  |  +------------------------------------------------------+  |  |
|  |                                                            |  |
|  |  Campaign Brief Preview:                                   |  |
|  |  +------------------------------------------------------+  |  |
|  |  | Title: Summer Promo                                    |  |
|  |  | Budget: $500  |  Due: Aug 15                           |  |
|  |  |                                                        |  |
|  |  | Create a Reel showcasing our summer collection and     |  |
|  |  | 3 Stories with the discount code.                      |  |
|  |  |                                                        |  |
|  |  | Deliverables: 1 Reel + 3 Stories                       |  |
|  |  +------------------------------------------------------+  |  |
|  |                                                            |  |
|  |  Personalized Message (optional):                          |  |
|  |  +------------------------------------------------------+  |  |
|  |  | Hi! Love your travel content. We'd love to work with |  |  |
|  |  | you on our summer campaign...                          |  |
|  |  +------------------------------------------------------+  |  |
|  |                                                            |  |
|  |  The influencer will see your campaign brief and can       |  |
|  |  accept or decline.                                        |  |
|  |                                                            |  |
|  |  [Cancel]                           [Send Invitation]      |  |
|  |                                                            |  |
|  +------------------------------------------------------------+  |
|                                                                  |
+------------------------------------------------------------------+
```

## Empty State — No Campaigns

When the brand has zero campaigns, the dropdown is replaced with a prominent CTA:

```
+------------------------------------------------------------------+
|  LOGO    Campaigns    Discover    Profile              [BrandCo] |
+------------------------------------------------------------------+
|                                                                  |
|  +------------------------------------------------------------+  |
|  |  Invite @travel_jane                                 [x]   |  |
|  |  ========================================================  |  |
|  |                                                            |  |
|  |  You don't have any campaigns yet.                         |  |
|  |                                                            |  |
|  |  Create a campaign first to invite this influencer.        |  |
|  |                                                            |  |
|  |              [+ Create New Campaign]                       |  |
|  |                                                            |  |
|  |                                    [Cancel]                |  |
|  |                                                            |  |
|  +------------------------------------------------------------+  |
|                                                                  |
+------------------------------------------------------------------+
```

## Already Invited State

When the influencer already has a pending invitation to the selected campaign:

```
+------------------------------------------------------------------+
|  LOGO    Campaigns    Discover    Profile              [BrandCo] |
+------------------------------------------------------------------+
|                                                                  |
|  +------------------------------------------------------------+  |
|  |  Invite @travel_jane                                 [x]   |  |
|  |  ========================================================  |  |
|  |                                                            |  |
|  |  Select Campaign:                                          |  |
|  |  +------------------------------------------------------+  |  |
|  |  | Summer Promo (Active)                            [v] |  |  |
|  |  +------------------------------------------------------+  |  |
|  |                                                            |  |
|  |  ⚠ Invitation already pending to this campaign.            |  |
|  |                                                            |  |
|  |  [Cancel]                              [Send Invitation]   |  |
|  |  (disabled with tooltip: "Invite already sent")            |  |
|  |                                                            |  |
|  +------------------------------------------------------------+  |
|                                                                  |
+------------------------------------------------------------------+
```

## Key Elements
- **Modal Header**: Title with influencer handle, close button
- **Campaign Selector**: Dropdown of existing campaigns + "+ Create New Campaign" option
- **Brief Preview**: Read-only preview of selected campaign details
- **Message Input**: Optional personalized textarea
- **Info Text**: Explanation of what happens next
- **Actions**: Cancel (secondary), Send Invitation (primary)
- **Empty State**: When brand has 0 campaigns, show illustration, copy, and "+ Create New Campaign" CTA (Critical #1)
- **Already Invited Guardrail**: If influencer already has a pending invitation to the selected campaign, "Send Invitation" is disabled with a tooltip explaining why (Major #8)

## Action Flows

### Flow: Send Invitation to Existing Campaign
1. Modal opens with influencer handle displayed in header
2. Brand selects campaign from "Select Campaign" dropdown
3. Brief preview card updates dynamically to show selected campaign details
4. Brand optionally types a personalized message in the textarea (max 500 chars)
5. Brand clicks "Send Invitation"
6. System validates: campaign exists, influencer not already invited
7. System creates invitation record with `status: pending`
8. System creates notification for influencer (`type: invitation_received`)
9. Modal closes, success toast displays
10. Brand is redirected to Campaign Detail page

### Flow: Cancel Invitation
1. Brand clicks "Cancel" button
2. Modal closes without creating any records
3. Brand returns to the page they were on (Discover or Influencer Profile)

### Flow: Create New Campaign Instead
1. Brand selects "+ Create New Campaign" from dropdown
2. Modal closes
3. Page navigates to `/campaigns/new?influencer=:id`
4. Create Campaign + Invite flow begins with influencer pre-selected

## Notes
- Selecting "+ Create New Campaign" closes this modal and navigates to Create Campaign + Invite flow
- Brief preview updates when campaign selection changes
- Message has character limit (e.g., 500 chars)
- After sending, show success toast and redirect to Campaign Detail
- **Duplicate guardrail**: System validates influencer is not already invited to the selected campaign before allowing send (Major #8)
- **Campaign / invite expiry**: Invitations expire after 7 days of no response; expired invitations show "Expired" status and can be re-sent (Cross-cutting gap)
- **Empty state**: If brand has zero campaigns, dropdown is hidden and a prominent "+ Create New Campaign" CTA is shown instead (Critical #1)
