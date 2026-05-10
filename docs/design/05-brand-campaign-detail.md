# Brand — Campaign Detail

## Purpose
Track who accepted, view deliverable progress, and manage campaign status.

## ASCII UI

```
+------------------------------------------------------------------+
|  LOGO    Campaigns    Discover    Profile              [BrandCo] |
+------------------------------------------------------------------+
|                                                                  |
|  < Back to Campaigns                                             |
|                                                                  |
|  Summer Promo                                         [Active]   |
|  Budget: $2,500  |  Due: Aug 15  |  2/5 influencers             |
|                                                                  |
|  [Edit Campaign]  [Mark Complete]  [Cancel Campaign]             |
|                                                                  |
|  +-------------------------------------------------------------+ |
|  | Campaign Brief                                              | |
|  | ------------------------------------------------------------| |
|  | Create a Reel showcasing our summer collection and 3 Stories| |
|  | with the discount code SUMMER20.                            | |
|  +-------------------------------------------------------------+ |
|                                                                  |
|  Influencers (5 invited)                              [+ Invite] |
|  ----------------------------------------------------------------|
|                                                                  |
|  +-------------------------------------------------------------+ |
|  | [ ] @travel_jane                      [accepted]  [green]   | |
|  | Travel | IG: 80K/4.5%  TikTok: 45K/3.8%                    | |
|  |                                                             | |
|  | Deliverables:                                               | |
|  |  [Completed] Instagram Reel              Due Aug 15         | |
|  |  [Pending Review] 3 Instagram Stories    Due Aug 15         | |
|  |                    [Approve]  [Reject]                      | |
|  |  [Completed] 1 TikTok Video              Due Aug 15         | |
|  |                                                             | |
|  | [Message]  [View Profile]  [Remove Influencer]              | |
|  +-------------------------------------------------------------+ |
|                                                                  |
|  +-------------------------------------------------------------+ |
|  | [ ] @fitness_mike                     [pending]  [orange] | |
|  | Fitness | IG: 300K/3.5%  YouTube: 150K/4.2%                | |
|  |                                                             | |
|  | Deliverables:                                               | |
|  |  [Pending] Instagram Reel                Due Aug 15         | |
|  |  [Pending] 3 Instagram Stories           Due Aug 15         | |
|  |                                                             | |
|  | [Message]  [View Profile]  [Withdraw Invite]                | |
|  +-------------------------------------------------------------+ |
|                                                                  |
|  +-------------------------------------------------------------+ |
|  | [ ] @foodie_lisa                     [declined]  [red]    | |
|  | Food | IG: 120K/5.5%  TikTok: 80K/4.8%                     | |
|  |                                                             | |
|  | Declined on Aug 3.                                          | |
|  |                                                             | |
|  | [View Profile]                                              | |
|  +-------------------------------------------------------------+ |
|                                                                  |
|  +-------------------------------------------------------------+ |
|  | Bulk Actions:  3 selected                                   | |
|  | [Message Selected]  [Withdraw Selected]  [Remove Selected]  | |
|  +-------------------------------------------------------------+ |
|                                                                  |
+------------------------------------------------------------------+
```

## Empty State — No Influencers Invited

```
+------------------------------------------------------------------+
|  LOGO    Campaigns    Discover    Profile              [BrandCo] |
+------------------------------------------------------------------+
|                                                                  |
|  < Back to Campaigns                                             |
|                                                                  |
|  Summer Promo                                         [Active]   |
|  Budget: $2,500  |  Due: Aug 15  |  0/5 influencers             |
|                                                                  |
|  [Edit Campaign]  [Mark Complete]  [Cancel Campaign]             |
|                                                                  |
|  +-------------------------------------------------------------+ |
|  | Campaign Brief                                              | |
|  | ------------------------------------------------------------| |
|  | Create a Reel showcasing our summer collection and 3 Stories| |
|  | with the discount code SUMMER20.                            | |
|  +-------------------------------------------------------------+ |
|                                                                  |
|  Influencers (0 invited)                              [+ Invite] |
|  ----------------------------------------------------------------|
|                                                                  |
|  +-------------------------------------------------------------+ |
|  |                                                             | |
|  |              [📋 Illustration Placeholder]                  | |
|  |                                                             | |
|  |         No influencers invited yet                          | |
|  |                                                             | |
|  |   Invite influencers to start tracking progress.            | |
|  |                                                             | |
|  |              [+ Invite Influencers]                         | |
|  |                                                             | |
|  +-------------------------------------------------------------+ |
|                                                                  |
+------------------------------------------------------------------+
```

## Key Elements
- **Campaign Header**: Title, status badge, budget, due date, influencer count
- **Action Bar**: Edit, Mark Complete, Cancel Campaign
- **Brief Card**: Campaign description/requirements
- **Influencers Section**: List of invited influencers with status
- **Influencer Cards**:
  - Header: handle, niche, per-platform stats, status badge
  - Bulk select checkbox on each card header
  - Deliverables list with status pills (not read-only checkboxes; Major #5)
  - Action buttons: Message, View Profile, Withdraw Invite, Remove Influencer
- **Bulk Actions Bar**: Appears when influencers are selected; Message Selected, Withdraw Selected, Remove Selected (Minor #23)
- **Content Approval Workflow**: Brand sees "Pending Review" status on deliverables and can Approve or Reject (Major #9)
- **Empty State**: Illustrated placeholder with "+ Invite Influencers" CTA when no influencers invited (Critical #1)

## Status Badges
- `pending`  — orange
- `accepted` — green
- `declined` — red
- `withdrawn` — gray
- `pending_review` — blue (awaiting brand approval; Major #9)
- `completed` — green (brand approved; Major #9)

## Action Flows

### Flow: Edit Campaign
1. Brand clicks "Edit Campaign" button
2. Page navigates to campaign edit form or inline edit mode activates
3. Brand modifies title, description, budget, or due date
4. Brand saves changes; system updates campaign record
5. Page refreshes with updated campaign details

### Flow: Mark Campaign Complete
1. Brand clicks "Mark Complete" button
2. System checks if all deliverables across all `accepted` influencers are `completed`
3. If all deliverables are completed, system updates campaign `status` to `completed`
4. Success toast appears; status badge updates to "Completed"
5. If not all deliverables are completed, a warning dialog appears: "Some deliverables are still pending. Are you sure you want to mark this campaign complete?"
6. Brand can confirm to force-complete the campaign, or cancel and review remaining work (Major #6)
7. If an influencer is unresponsive, brand can use "Remove Influencer" to exclude them from the completion check

### Flow: Cancel Campaign
1. Brand clicks "Cancel Campaign" button
2. Confirmation dialog appears: "This will withdraw all pending invites. Are you sure?"
3. Brand confirms cancellation
4. System updates campaign `status` to `cancelled`
5. System updates all pending invitations to `status: withdrawn`
6. Notifications sent to all affected influencers
7. Page refreshes with updated status

### Flow: Withdraw Invite
1. Brand clicks "Withdraw Invite" on an influencer card with `pending` status
2. Confirmation dialog appears
3. Brand confirms withdrawal
4. System updates invitation `status` to `withdrawn`
5. Notification sent to influencer
6. Influencer card updates or is removed from list

### Flow: Message Influencer
1. Brand clicks "Message" button on any influencer card
2. Messaging modal or sidebar opens
3. Brand types and sends message
4. System delivers message to influencer

### Flow: Approve / Reject Deliverable
1. Influencer marks a deliverable as complete
2. System updates deliverable `status` to `pending_review`
3. Brand sees "Pending Review" status badge on the deliverable in Campaign Detail
4. Brand clicks "Approve" or "Reject" next to the pending deliverable
5. If approved: system updates deliverable `status` to `completed`; notification sent to influencer
6. If rejected: system updates deliverable `status` back to `pending`; brand can add rejection note; notification sent to influencer
7. Progress bar updates accordingly (Major #9)

### Flow: Remove Influencer
1. Brand clicks "Remove Influencer" on an accepted or pending influencer card
2. Confirmation dialog appears: "This will remove the influencer and all their deliverables from this campaign. Are you sure?"
3. Brand confirms removal
4. System deletes the invitation and associated deliverables for this influencer
5. Influencer is removed from the campaign detail view
6. Campaign progress recalculates without this influencer's deliverables (Major #6)

### Flow: Bulk Actions
1. Brand checks the bulk select checkbox on one or more influencer cards
2. Bulk Actions bar appears at the bottom of the influencer list
3. Brand selects an action: "Message Selected", "Withdraw Selected", or "Remove Selected"
4. Confirmation dialog appears summarizing the action and affected influencers
5. Brand confirms; system applies the action to all selected influencers
6. Page refreshes with updated influencer list (Minor #23)

## Notes
- **Status pills replace checkboxes**: Deliverables show status badges (Pending, Pending Review, Completed) instead of read-only checkboxes to avoid interactive-looking but non-interactive UI (Major #5)
- **Mark Complete with warning**: Brand can force-complete a campaign even if some deliverables are pending; a confirmation dialog warns about incomplete work (Major #6)
- **Remove Influencer**: Brands can remove unresponsive influencers so they don't block campaign completion (Major #6)
- **Content approval workflow**: Deliverables move to `pending_review` when influencer marks complete; brand must approve before status becomes `completed` (Major #9)
- **Per-platform stats**: Influencer cards show follower counts and engagement rates per platform (Critical #4)
- **Bulk actions**: Select multiple influencers to message, withdraw, or remove at once (Minor #23)
- **Cancel Campaign** withdraws all pending invites and sets status to cancelled
- **Empty state**: When no influencers are invited, show a CTA to invite influencers (Critical #1)
- **Loading state**: Skeleton cards shown while influencer list loads (Cross-cutting gap)
