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
|  | @travel_jane                        [accepted]  [green]     | |
|  | Travel | 125K | 4.2%                                        | |
|  |                                                             | |
|  | Deliverables:                                               | |
|  |  [x] Instagram Reel              Due Aug 15  [Completed]    | |
|  |  [x] 3 Instagram Stories         Due Aug 15  [Completed]    | |
|  |  [x] 1 TikTok Video              Due Aug 15  [Completed]    | |
|  |                                                             | |
|  | [Message]  [View Profile]                                   | |
|  +-------------------------------------------------------------+ |
|                                                                  |
|  +-------------------------------------------------------------+ |
|  | @fitness_mike                        [pending]  [orange]    | |
|  | Fitness | 450K | 3.8%                                       | |
|  |                                                             | |
|  | Deliverables:                                               | |
|  |  [ ] Instagram Reel              Due Aug 15  [Pending]      | |
|  |  [ ] 3 Instagram Stories         Due Aug 15  [Pending]      | |
|  |                                                             | |
|  | [Message]  [View Profile]  [Withdraw Invite]                | |
|  +-------------------------------------------------------------+ |
|                                                                  |
|  +-------------------------------------------------------------+ |
|  | @foodie_lisa                       [declined]  [red]        | |
|  | Food | 200K | 5.1%                                         | |
|  |                                                             | |
|  | Declined on Aug 3.                                          | |
|  |                                                             | |
|  | [View Profile]                                              | |
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
  - Header: handle, niche, stats, status badge
  - Deliverables list with checkboxes and status
  - Action buttons: Message, View Profile, Withdraw Invite

## Status Badges
- `pending`  — orange
- `accepted` — green
- `declined` — red
- `withdrawn` — gray

## Action Flows

### Flow: Edit Campaign
1. Brand clicks "Edit Campaign" button
2. Page navigates to campaign edit form or inline edit mode activates
3. Brand modifies title, description, budget, or due date
4. Brand saves changes; system updates campaign record
5. Page refreshes with updated campaign details

### Flow: Mark Campaign Complete
1. Brand clicks "Mark Complete" button
2. System validates that all deliverables across all `accepted` influencers are `completed`
3. If validation passes, system updates campaign `status` to `completed`
4. Success toast appears; status badge updates to "Completed"
5. If validation fails, error message explains remaining incomplete deliverables

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

## Notes
- Deliverable checkboxes are read-only for brand (influencer updates them)
- Mark Complete button enabled when all deliverables across all accepted influencers are done
- Cancel Campaign withdraws all pending invites and sets status to cancelled
