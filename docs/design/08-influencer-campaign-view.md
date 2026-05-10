# Influencer — Campaign View

## Purpose
Read the full brief and check off deliverables as they are completed.

## ASCII UI

```
+------------------------------------------------------------------+
|  LOGO    Invitations    My Campaigns    Profile    [@travel_jane]|
+------------------------------------------------------------------+
|                                                                  |
|  < Back to My Campaigns                                          |
|                                                                  |
|  Summer Promo                                        [In Progress]|
|  From: BrandCo   |   Budget: $500   |   Due: Aug 15             |
|                                                                  |
|  +-------------------------------------------------------------+ |
|  | Campaign Brief                                              | |
|  | ------------------------------------------------------------| |
|  | Create a Reel showcasing our summer collection and 3 Stories| |
|  | with the discount code SUMMER20.                            | |
|  |                                                             | |
|  | Requirements:                                               | |
|  | • Tag @brandco in all posts                                 | |
|  | • Use hashtag #SummerWithBrandCo                            | |
|  | • Submit content for approval 48hrs before posting          | |
|  +-------------------------------------------------------------+ |
|                                                                  |
|  Deliverables                                                    |
|  ----------------------------------------------------------------|
|                                                                  |
|  +-------------------------------------------------------------+ |
|  | [✓] 1 Instagram Reel                                        | |
|  |     Due: Aug 15                                             | |
|  |     Status: Approved on Aug 10                              | |
|  |                                                             | |
|  |     [View Submitted Content]                                | |
|  +-------------------------------------------------------------+ |
|                                                                  |
|  +-------------------------------------------------------------+ |
|  | [ ] 3 Instagram Stories                                     | |
|  |     Due: Aug 15                                             | |
|  |     Status: Pending                                         | |
|  |                                                             | |
|  |     [Mark as Complete]                                      | |
|  |                                                             | |
|  |     +----------------------------------------------------+  | |
|  |     | Notes (optional):                                  |  | |
|  |     | [Post links, feedback, etc...                  ]   |  | |
|  |     +----------------------------------------------------+  | |
|  +-------------------------------------------------------------+ |
|                                                                  |
|  +-------------------------------------------------------------+ |
|  | [⏳] 1 TikTok Video                                         | |
|  |     Due: Aug 20                                             | |
|  |     Status: Pending Review — awaiting brand approval        | |
|  |                                                             | |
|  |     Submitted notes: "Link to draft: ..."                   | |
|  |                                                             | |
|  |     [View Submitted Content]                                | |
|  +-------------------------------------------------------------+ |
|                                                                  |
|  Progress: 1 of 2 deliverables complete                          |
|  [========>          ] 50%                                       |
|                                                                  |
|  [Message BrandCo]                                               |
|                                                                  |
+------------------------------------------------------------------+
```

## Key Elements
- **Campaign Header**: Title, status badge, brand name, budget, due date
- **Brief Card**: Full description + requirements list
- **Deliverables Section**: Individual deliverable cards
  - Checkbox (checked = completed)
  - Due date
  - Status text
  - "Mark as Complete" button (for pending items)
  - Optional notes textarea
  - "View Submitted Content" link (for completed items)
- **Progress Bar**: Visual progress across all deliverables
- **Message Button**: Opens chat/message interface with brand

## Action Flows

### Flow: Mark Deliverable as Complete
1. Influencer reviews pending deliverable card
2. Influencer optionally types notes in the "Notes" textarea (e.g., post links)
3. Influencer clicks "Mark as Complete" button
4. Confirmation dialog appears: "Mark this deliverable as complete?"
5. Influencer confirms
6. System updates deliverable `status` to `pending_review`
7. System sets `submitted_at` timestamp
8. System creates notification for brand (`type: deliverable_pending_review`)
9. Deliverable card updates: status shows "Pending Review", notes are visible
10. Brand must approve the deliverable before it moves to `completed` (Major #9)
11. Progress bar updates to reflect submission (but campaign remains "In Progress" until brand approves)
12. If brand rejects, deliverable returns to `pending` with a rejection note

### Flow: View Completed Deliverable
1. Influencer clicks "View Submitted Content" on a completed deliverable
2. Modal or expanded view shows the notes/URLs submitted when marking complete
3. Influencer can copy links or close the view

### Flow: Message Brand
1. Influencer clicks "Message BrandCo" button
2. Messaging modal or sidebar slides in from the right
3. Influencer types message and clicks Send
4. System delivers message to brand
5. Message appears in the conversation thread

## Notes
- Checkbox is interactive — checking it triggers "Mark as Complete" flow
- **Content approval workflow**: After influencer marks complete, deliverable enters `pending_review` status. Brand must approve before it becomes `completed`. Campaign status stays "In Progress" until all deliverables are approved (Major #9)
- Optional notes allow influencer to add links or comments when completing
- Message button opens a simple messaging modal or sidebar
- **Confirmation dialog**: "Mark as Complete" shows a confirmation dialog to prevent accidental submissions
- **Error state**: If marking complete fails (network error, validation error), show inline error message and allow retry (Cross-cutting gap)
- **Loading state**: Show spinner on "Mark as Complete" button while API request is in-flight (Cross-cutting gap)
