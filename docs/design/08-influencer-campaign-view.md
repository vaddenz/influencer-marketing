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
|  | [x] 1 Instagram Reel                                        | |
|  |     Due: Aug 15                                             | |
|  |     Status: Completed on Aug 10                             | |
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
6. System updates deliverable `status` to `completed`
7. System sets `completed_at` timestamp
8. System checks if all deliverables in the campaign are now completed
9. If all complete, system updates campaign `status` to `completed`
10. System creates notification for brand (`type: deliverables_completed`)
11. Deliverable card updates: checkbox becomes checked, status shows completion date
12. "View Submitted Content" link appears if notes/URLs were provided
13. Progress bar updates to reflect new completion percentage

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
- When all deliverables are complete, status auto-updates to "Completed"
- Optional notes allow influencer to add links or comments when completing
- Message button opens a simple messaging modal or sidebar
