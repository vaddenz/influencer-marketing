# Influencer — Profile

## Purpose
Public-facing stats and bio. Editable by the influencer. What brands see during discovery.

## ASCII UI

```
+------------------------------------------------------------------+
|  LOGO    Invitations    My Campaigns    Profile    [@travel_jane]|
+------------------------------------------------------------------+
|                                                                  |
|  +-------------------------------------------------------------+ |
|  |                                                             | |
|  |    +------+                                                 | |
|  |    |      |  @travel_jane                          [Edit]   | |
|  |    |  👤  |  Travel & Lifestyle                                     | |
|  |    |      |  California, United States                              | |
|  |    +------+                                                 | |
|  |                                                             | |
|  |    +-----------+  +-----------+  +-----------+  +---------+ | |
|  |    |   125K    |  |   4.2%    |  |  Micro   |  |  Active  | | |
|  |    | Followers |  | Engagement|  |  Scope   |  | Campaigns| | |
|  |    +-----------+  +-----------+  +-----------+  +---------+ | |
|  |                                                             | |
|  |    Bio                                                      | |
|  |    -------------------------------------------------------  | |
|  |    Exploring the world one destination at a time. Sharing    | |
|  |    travel tips, hidden gems, and budget hacks.               | |
|  |                                                             | |
|  |    Platforms:  [Instagram] [TikTok] [YouTube]                | |
|  |                                                             | |
|  |    Niche Categories:  Travel, Lifestyle, Photography         | |
|  |                                                             | |
|  |    Languages: English, Spanish                               | |
|  |                                                             | |
|  |    Email (private): jane@email.com                           | |
|  |                                                             | |
|  +-------------------------------------------------------------+ |
|                                                                  |
|  +-------------------------------------------------------------+ |
|  | Campaign History                                            | |
|  | ------------------------------------------------------------| |
|  | +----------+  +----------+  +----------+                    | |
|  | | Spring   |  | Summer   |  | Winter   |                    | |
|  | | Coll.    |  | Promo    |  | Travel   |                    | |
|  | | $800     |  | $500     |  | $1,200   |                    | |
|  | | Complete |  | Active   |  | Complete |                    | |
|  | +----------+  +----------+  +----------+                    | |
|  +-------------------------------------------------------------+ |
|                                                                  |
+------------------------------------------------------------------+
```

## Edit Mode

```
+------------------------------------------------------------------+
|  LOGO    Invitations    My Campaigns    Profile    [@travel_jane]|
+------------------------------------------------------------------+
|                                                                  |
|  +-------------------------------------------------------------+ |
|  |                                                             | |
|  |    +------+                                                 | |
|  |    |      |  Display Name *                                 | |
|  |    |  👤  |  +------------------------------------------+    | |
|  |    |      |  | travel_jane                               |    | |
|  |    |      |  +------------------------------------------+    | |
|  |    |      |                                                 | |
|  |    +------+  [Change Photo]                                 | |
|  |                                                             | |
|  |  Niche *                              Location *            | |
|  |  +----------------------+             +------------------+  | |
|  |  | Travel & Lifestyle  |             | California, USA  |  | |
|  |  +----------------------+             +------------------+  | |
|  |                                                             | |
|  |  Bio *                                                      | |
|  |  +------------------------------------------------------+   | |
|  |  | Exploring the world one destination at a time...      |   | |
|  |  +------------------------------------------------------+   | |
|  |                                                             | |
|  |  Platforms                                                  | |
|  |  [x] Instagram  [x] TikTok  [x] YouTube  [ ] X/Twitter     | |
|  |                                                             | |
|  |  Niche Categories                                           | |
|  |  [Travel] [Lifestyle] [Photography] [+ Add]                 | |
|  |                                                             | |
|  |  Languages                                                  | |
|  |  [English] [Spanish] [+ Add]                                | |
|  |                                                             | |
|  |  Follower Count *              Engagement Rate *             | |
|  |  +------------------+          +------------------+         | |
|  |  | 125000           |          | 4.2                |         | |
|  |  +------------------+          +------------------+         | |
|  |                                                             | |
|  |  [Cancel]                                    [Save Changes] | |
|  |                                                             | |
|  +-------------------------------------------------------------+ |
|                                                                  |
+------------------------------------------------------------------+
```

## Key Elements
- **View Mode**:
  - Avatar with edit button
  - Display name, niche, location
  - Stats row: followers, engagement, scope, active campaigns
  - Bio, platforms, niche categories, languages
  - Private email
  - Campaign history grid
- **Edit Mode**:
  - All fields editable with form inputs
  - Photo upload
  - Platform multi-checkboxes
  - Tag-style niche categories and languages (add/remove)
  - Cancel / Save actions

## Action Flows

### Flow: Edit Profile
1. Influencer clicks "Edit" button on profile page
2. Page switches to Edit Mode with all fields editable
3. Influencer modifies any field:
   - Display Name (text input)
   - Niche (dropdown)
   - Location (text input or location picker)
   - Bio (textarea)
   - Platforms (checkboxes)
   - Niche Categories (tag input with add/remove)
   - Languages (tag input with add/remove)
   - Follower Count (numeric input)
   - Engagement Rate (numeric input)
4. Influencer clicks "Change Photo" to upload new avatar
5. System validates all required fields (marked with *)
6. Influencer clicks "Save Changes"
7. System updates `influencer_profiles` record
8. System recalculates Scope tier based on updated follower count
9. Page switches back to View Mode with updated data
10. Success toast confirms profile updated

### Flow: Cancel Edit
1. Influencer clicks "Cancel" button in Edit Mode
2. Confirmation dialog appears if any changes were made: "Discard unsaved changes?"
3. Influencer confirms cancellation
4. Page switches back to View Mode with original data unchanged

### Flow: Add Tag (Niche Category or Language)
1. Influencer clicks "+ Add" button next to Niche Categories or Languages
2. Inline input field or dropdown appears
3. Influencer types or selects a value
4. Pressing Enter or clicking outside adds the tag to the list
5. Tag appears as a removable pill/badge

### Flow: Remove Tag
1. Influencer clicks the "x" on any Niche Category or Language tag
2. Tag is removed from the list immediately (UI only)
3. Changes are persisted only when "Save Changes" is clicked

## Notes
- Scope is auto-calculated from follower count (cannot be edited directly)
- Profile is public — what brands see during discovery
- Campaign history shows past collaborations with brand names
