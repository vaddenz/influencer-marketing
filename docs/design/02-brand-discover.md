# Brand — Discover Influencers

## Purpose
Search freely with no campaign required. Filter by platform, location, follower range, scope tier, and keywords.

## ASCII UI

```
+------------------------------------------------------------------+
|  LOGO    Campaigns    Discover    Profile              [BrandCo] |
+------------------------------------------------------------------+
|                                                                  |
|  Discover Influencers                              12 found      |
|  =================================================================
|  | Filters              |                                         |
|  |                      |  [Search by keywords...          ] [Q] |
|  | Keywords             |  -------------------------------------  |
|  | [travel            ] |                                         |
|  |                      |  +-----------------------------------+  |
|  | Niche                |  | +--+  @travel_jane                |  |
|  | [All Niches       v] |  | |👤|  Travel  |  125K  | 4.2%    |  |
|  |                      |  | +--+  🇺🇸  California              |  |
|  | Platform             |  |       Instagram, TikTok           |  |
|  | [x] Instagram        |  |                                   |  |
|  | [ ] TikTok           |  |       [View Profile]  [Invite]    |  |
|  | [ ] Douyin           |  +-----------------------------------+  |
|  | [ ] YouTube          |                                         |
|  |                      |  +-----------------------------------+  |
|  | Location             |  | +--+  @fitness_mike               |  |
|  | [United States   v]  |  | |👤|  Fitness |  450K  | 3.8%    |  |
|  | [California      v]  |  | +--+  🇬🇧  London                  |  |
|  |                      |  |       Instagram, YouTube          |  |
|  | Followers            |  |                                   |  |
|  | 1K ----[====]---- 10M|  |       [View Profile]  [Invite]    |  |
|  | 10K - 500K           |  +-----------------------------------+  |
|  |                      |                                         |
|  | Scope                |  +-----------------------------------+  |
|  | [x] Nano  (1-10K)    |  | +--+  @tech_sarah                 |  |
|  | [x] Micro (10-100K)  |  | |👤|  Tech    |  85K   | 5.1%    |  |
|  | [ ] Macro (100K-1M)  |  | +--+  🇺🇸  Texas                   |  |
|  | [ ] Mega  (1M+)      |  |       TikTok, YouTube             |  |
|  |                      |  |                                   |  |
|  | [Clear All]          |  |       [View Profile]  [Invite]    |  |
|  |                      |  +-----------------------------------+  |
|  =================================================================
+------------------------------------------------------------------+
```

## Key Elements
- **Left Sidebar**: Collapsible filter panel
  - Keywords text input
  - Niche dropdown (All, Fashion, Travel, Fitness, Food, Tech, Beauty)
  - Platform multi-select checkboxes
  - Location: Country + Region cascading dropdowns
  - Followers: Range slider with min/max display
  - Scope tier checkboxes (Nano, Micro, Macro, Mega)
  - Clear All button
- **Right Content Area**:
  - Search bar with search button
  - Result count
  - Influencer cards: avatar, handle, niche, follower count, engagement rate, location, platforms
  - Action buttons: View Profile, Invite
  - Pagination

## Action Flows

### Flow: Search and Filter
1. Brand types keywords in search bar and presses Enter or clicks [Q]
2. System sends `GET /api/v1/influencers?q=keyword` request
3. Results update in the right panel with matching influencers
4. Brand adjusts filters (platform, location, followers, scope)
5. Filters apply with 300ms debounce; API request fires on change
6. Result count and pagination update automatically

### Flow: View Influencer Profile
1. Brand clicks "View Profile" on any influencer card
2. Page navigates to `/discover?influencer=:id`
3. Influencer Profile (Brand View) loads with full stats, bio, and CTAs

### Flow: Invite from Discover
1. Brand clicks "Invite" on any influencer card
2. Invite Modal opens pre-filled with the selected influencer
3. Brand selects campaign, adds message, and sends invitation

## Notes
- Filters apply in real-time (debounced 300ms)
- "Invite" button opens Invite Modal directly
- "View Profile" navigates to Influencer Profile (Brand View)
