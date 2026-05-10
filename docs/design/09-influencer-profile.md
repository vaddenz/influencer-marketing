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
|  |    | Instagram |  |  TikTok   |  |  YouTube  |  |  Micro  | | |
|  |    |  80K 4.5% |  |  45K 3.8% |  |   --  --  |  |  Scope  | | |
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
|  |    [👁 Preview Public Profile]                               | |
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
|  | | FashionB |  | BrandCo  |  | TravelCo |                    | |
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
|  |  | Travel & Lifestyle  |             | United States [v]|  | |
|  |  +----------------------+             +------------------+  | |
|  |                                       +------------------+  | |
|  |                                       | California    [v]|  | |
|  |                                       +------------------+  | |
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
|  |  Per-Platform Stats *                                        | |
|  |  Instagram  Followers: [80000    ]  Engagement: [4.5     %]  | |
|  |  TikTok     Followers: [45000    ]  Engagement: [3.8     %]  | |
|  |  YouTube    Followers: [0        ]  Engagement: [ --    %]  | |
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
  - Stats row: per-platform follower counts and engagement rates, scope, active campaigns (Critical #4)
  - Bio, platforms, niche categories, languages
  - Private email
  - Campaign history grid with brand names (Moderate #17)
  - "Preview Public Profile" toggle to see what brands see (Moderate #16)
- **Edit Mode**:
  - All fields editable with form inputs
  - Photo upload
  - Platform multi-checkboxes
  - Tag-style niche categories and languages (add/remove)
  - Location: cascading country/region dropdowns (Moderate #15)
  - Per-platform follower counts and engagement rates (Critical #4)
  - Cancel / Save actions
- **Empty States**: Missing bio, no campaign history, no audience data (Critical #1)

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
- **Per-platform stats**: Each platform has its own follower count and engagement rate; no misleading global aggregate is shown (Critical #4)
- **Location consistency**: Edit mode uses the same cascading country/region dropdowns as onboarding instead of a text input (Moderate #15)
- **Preview Public Profile**: Influencers can toggle a preview mode to see exactly how their profile appears to brands (Moderate #16)
- **Campaign history with brand names**: Each history card displays the brand name prominently so influencers know who they worked with (Moderate #17)
- **Empty states**: If bio is missing, show placeholder encouraging the influencer to add one. If no campaign history, show "No campaigns yet" message. (Critical #1)
- **Loading state**: Skeleton placeholders shown while profile data loads (Cross-cutting gap)
