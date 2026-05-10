# Influencer — Invitations

## Purpose
View pending invites with brief preview. One-click accept or decline.

## ASCII UI

```
+------------------------------------------------------------------+
|  LOGO    Invitations    My Campaigns    Profile    [@travel_jane]|
+------------------------------------------------------------------+
|                                                                  |
|  New Invitations (2)                                             |
|  ----------------------------------------------------------------|
|                                                                  |
|  +-------------------------------------------------------------+ |
|  |                                                             | |
|  |  Summer Promo                                    Aug 15 due | |
|  |  From: BrandCo                                              | |
|  |                                                             | |
|  |  Budget: $500                                               | |
|  |                                                             | |
|  |  Create a Reel showcasing our summer collection and 3       | |
|  |  Stories with the discount code.                            | |
|  |                                                             | |
|  |  Deliverables: 1 Instagram Reel + 3 Instagram Stories       | |
|  |                                                             | |
|  |  [View Full Brief]     [Decline]  [Accept]                  | |
|  |                                                             | |
|  +-------------------------------------------------------------+ |
|                                                                  |
|  +-------------------------------------------------------------+ |
|  |                                                             | |
|  |  Product Launch                                  Sep 01 due | |
|  |  From: TechStart Inc                                        | |
|  |                                                             | |
|  |  Budget: $1,200                                             | |
|  |                                                             | |
|  |  Review our new smartphone and create an unboxing video     | |
|  |  plus 2 TikTok posts.                                       | |
|  |                                                             | |
|  |  Deliverables: 1 YouTube Video + 2 TikTok Posts             | |
|  |                                                             | |
|  |  [View Full Brief]     [Decline]  [Accept]                  | |
|  |                                                             | |
|  +-------------------------------------------------------------+ |
|                                                                  |
|  Accepted (3)                                                    |
|  ----------------------------------------------------------------|
|                                                                  |
|  +-------------------------------------------------------------+ |
|  | Spring Collection                                Completed  | |
|  | From: FashionBrand   Budget: $800   Due: May 01             | |
|  | [View Campaign]                                             | |
|  +-------------------------------------------------------------+ |
|                                                                  |
|  Declined (1)                                                    |
|  ----------------------------------------------------------------|
|                                                                  |
|  +-------------------------------------------------------------+ |
|  | Winter Sale                                      Aug 10 due | |
|  | From: RetailGiant    Budget: $300                           | |
|  | Declined on Jul 28                                          | |
|  +-------------------------------------------------------------+ |
|                                                                  |
+------------------------------------------------------------------+
```

## Key Elements
- **Top Navigation**: Logo, Invitations, My Campaigns, Profile + influencer handle
- **New Invitations Section**: Expandable cards with full brief preview
  - Campaign title, due date, brand name
  - Budget
  - Description snippet
  - Deliverables summary
  - Actions: View Full Brief, Decline, Accept
- **Accepted Section**: Collapsed list of accepted campaigns with link to view
- **Declined Section**: Collapsed list of declined invitations (read-only)

## Action Flows

### Flow: View Full Brief
1. Influencer clicks "View Full Brief" on a pending invitation card
2. Inline expansion or modal opens showing complete campaign details:
   - Full description and requirements
   - Complete deliverables list with due dates
   - Brand profile and contact info
3. Influencer clicks outside modal or "Close" to dismiss

### Flow: Accept Invitation
1. Influencer reviews invitation card or full brief
2. Influencer clicks "Accept" button
3. Confirmation dialog appears: "Accept this campaign?"
4. Influencer confirms acceptance
5. System updates invitation `status` to `accepted`
6. System creates deliverable records from campaign template with `status: pending`
7. System creates notification for brand (`type: invitation_accepted`)
8. Card moves from "New Invitations" to "Accepted" section
9. Page redirects to `/campaigns/:id` (Campaign View)

### Flow: Decline Invitation
1. Influencer clicks "Decline" button on a pending invitation
2. Confirmation dialog appears with optional reason textarea:
   - "Why are you declining? (optional)"
3. Influencer optionally enters reason and confirms
4. System updates invitation `status` to `declined`
5. System records decline reason if provided
6. System creates notification for brand (`type: invitation_declined`)
7. Card moves from "New Invitations" to "Declined" section
8. Declined cards are read-only and show decline date

### Flow: View Accepted Campaign
1. Influencer clicks "View Campaign" on an accepted campaign card
2. Page navigates to `/campaigns/:id` (Campaign View)
3. Campaign View loads with brief and deliverable checklist

## Notes
- "View Full Brief" expands the card inline or opens a modal with full details
- Accepting an invitation creates deliverables and redirects to Campaign View
- Declining shows a confirmation dialog with optional reason input
- Sections are collapsible accordion panels
