# Messaging UI

## Purpose
Simple messaging modal for brand-to-influencer and influencer-to-brand communication. Referenced in Campaign Detail, Influencer Invitations, and Influencer Campaign View.

## ASCII UI — Brand View

```
+------------------------------------------------------------------+
|  LOGO    Campaigns    Discover    Profile   🔔3   [BrandCo]    |
+------------------------------------------------------------------+
|                                                                  |
|  +------------------------------------------------------------+  |
|  |  Message @travel_jane                              [x]   |  |
|  |  ========================================================  |  |
|  |                                                            |  |
|  |  +------------------------------------------------------+  |  |
|  |  | @travel_jane  Aug 10, 14:32                          |  |
|  |  | Hi! I've completed the Reel. Here's the link: ...    |  |
|  |  |                                                      |  |
|  |  | [BrandCo]  Aug 10, 15:05                             |  |
|  |  | Great work, thanks for the update!                   |  |
|  |  |                                                      |  |
|  |  | @travel_jane  Aug 11, 09:15                          |  |
|  |  | I've submitted the Stories for review.               |  |
|  |  +------------------------------------------------------+  |  |
|  |                                                            |  |
|  |  +------------------------------------------------------+  |  |
|  |  | Type a message...                                    |  |
|  |  +------------------------------------------------------+  |  |
|  |                                                            |  |
|  |  [Cancel]                              [Send Message]      |  |
|  |                                                            |  |
|  +------------------------------------------------------------+  |
|                                                                  |
+------------------------------------------------------------------+
```

## ASCII UI — Influencer View

```
+------------------------------------------------------------------+
|  LOGO    Invitations    My Campaigns    Profile   🔍  🔔1 [@jane]|
+------------------------------------------------------------------+
|                                                                  |
|  +------------------------------------------------------------+  |
|  |  Message BrandCo                                   [x]   |  |
|  |  ========================================================  |  |
|  |                                                            |  |
|  |  +------------------------------------------------------+  |  |
|  |  | [BrandCo]  Aug 10, 15:05                             |  |
|  |  | Great work, thanks for the update!                   |  |
|  |  |                                                      |  |
|  |  | @travel_jane  Aug 11, 09:15                          |  |
|  |  | I've submitted the Stories for review.               |  |
|  |  |                                                      |  |
|  |  | [BrandCo]  Aug 11, 11:00                             |  |
|  |  | Approved! They look perfect.                         |  |
|  |  +------------------------------------------------------+  |  |
|  |                                                            |  |
|  |  +------------------------------------------------------+  |  |
|  |  | Type a message...                                    |  |
|  |  +------------------------------------------------------+  |  |
|  |                                                            |  |
|  |  [Cancel]                              [Send Message]      |  |
|  |                                                            |  |
|  +------------------------------------------------------------+  |
|                                                                  |
+------------------------------------------------------------------+
```

## Key Elements
- **Modal Header**: Recipient name/brand, close button
- **Message Thread**: Scrollable conversation history
  - Each message shows sender handle, timestamp, and message text
  - Messages from the user are right-aligned; from the other party are left-aligned
- **Message Input**: Textarea for typing
- **Actions**: Cancel (close modal), Send Message (primary)

## Action Flows

### Flow: Send Message
1. User opens messaging modal from Campaign Detail, Invitations, or Campaign View
2. Modal loads with existing conversation history (if any)
3. User types a message in the input textarea
4. User clicks "Send Message" button
5. System creates a message record linked to the campaign and recipient
6. System creates a notification for the recipient (`type: message_received`)
7. Message appears in the thread with a timestamp
8. Input textarea clears

### Flow: Close Messaging Modal
1. User clicks the `[x]` close button or "Cancel" button
2. Modal closes without creating any records (if no message was typed)
3. User returns to the page they were on

## Notes
- Messages are campaign-scoped — each campaign has its own conversation thread
- No real-time chat (WebSockets) in MVP; messages are polled or refreshed on page load
- Character limit: 1000 chars per message
- Empty state: If no messages exist yet, show "Start the conversation..." placeholder in the thread area
