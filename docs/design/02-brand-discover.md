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
|  Sort: [Relevance ▼]                                             |
|  =================================================================
|  | Filters              |  [Search by handle, name, or keywords] |
|  |                      |  -------------------------------------  |
|  | Niche                |                                         |
|  | [All Niches       v] |  +-----------------------------------+  |
|  |                      |  | +--+  @travel_jane  [Invited]     |  |
|  | Platform             |  | |👤|  Travel  |  Instagram       |  |
|  | [x] Instagram        |  | +--+  🇺🇸  California              |  |
|  | [ ] TikTok           |  |       IG: 80K / 4.5%              |  |
|  | [ ] Douyin           |  |       TikTok: 45K / 3.8%          |  |
|  | [ ] YouTube          |  |                                   |  |
|  |                      |  |       [View Profile]  [Invite]    |  |
|  | Location             |  +-----------------------------------+  |
|  | [United States   v]  |                                         |
|  | [California      v]  |  +-----------------------------------+  |
|  |                      |  | +--+  @fitness_mike               |  |
|  | Followers            |  | |👤|  Fitness |  Instagram       |  |
|  | 1K [●=======●] 10M   |  | +--+  🇬🇧  London                  |  |
|  |     10K   500K       |  |       IG: 450K / 3.8%             |  |
|  |                      |  |       YouTube: 200K / 4.1%        |  |
|  | Scope                |  |                                   |  |
|  | [x] Nano  (1-10K)    |  |       [View Profile]  [Invite]    |  |
|  | [x] Micro (10-100K)  |  +-----------------------------------+  |
|  | [ ] Macro (100K-1M)  |                                         |
|  | [ ] Mega  (1M+)      |  +-----------------------------------+  |
|  |                      |  | +--+  @tech_sarah                 |  |
|  | [Clear All]          |  | |👤|  Tech    |  TikTok          |  |
|  |                      |  | +--+  🇺🇸  Texas                   |  |
|  |                      |  |       TikTok: 85K / 5.1%          |  |
|  |                      |  |       YouTube: 30K / 6.2%         |  |
|  |                      |  |                                   |  |
|  |                      |  |       [View Profile]  [Invite]    |  |
|  |                      |  +-----------------------------------+  |
|  =================================================================
+------------------------------------------------------------------+
```

## Empty State — No Results

```
+------------------------------------------------------------------+
|  LOGO    Campaigns    Discover    Profile              [BrandCo] |
+------------------------------------------------------------------+
|                                                                  |
|  Discover Influencers                              0 found       |
|  Sort: [Relevance ▼]                                             |
|  =================================================================
|  | Filters              |  [Search by handle, name, or keywords] |
|  |                      |  -------------------------------------  |
|  | Niche                |                                         |
|  | [All Niches       v] |  +-----------------------------------+  |
|  |                      |  |                                   |  |
|  | Platform             |  |         [🔍 Illustration]         |  |
|  | [ ] Instagram        |  |                                   |  |
|  | [ ] TikTok           |  |     No influencers found          |  |
|  | [ ] Douyin           |  |                                   |  |
|  | [ ] YouTube          |  |   Try adjusting your filters or   |  |
|  |                      |  |   search terms.                   |  |
|  | Location             |  |                                   |  |
|  | [All Countries   v]  |  |        [Clear All Filters]        |  |
|  | [All Regions     v]  |  |                                   |  |
|  |                      |  +-----------------------------------+  |
|  | Followers            |                                         |
|  | 1K [●=========●] 10M |                                         |
|  |                      |                                         |
|  | Scope                |                                         |
|  | [ ] Nano  (1-10K)    |                                         |
|  | [ ] Micro (10-100K)  |                                         |
|  | [ ] Macro (100K-1M)  |                                         |
|  | [ ] Mega  (1M+)      |                                         |
|  |                      |                                         |
|  | [Clear All]          |                                         |
|  |                      |                                         |
|  =================================================================
+------------------------------------------------------------------+
```

## Key Elements
- **Left Sidebar**: Collapsible filter panel
  - Niche dropdown (All, Fashion, Travel, Fitness, Food, Tech, Beauty)
  - Platform multi-select checkboxes
  - Location: Country + Region cascading dropdowns
  - Followers: Dual-handle range slider with min/max labels (Minor #21)
  - Scope tier checkboxes (Nano, Micro, Macro, Mega)
  - Clear All button
- **Right Content Area**:
  - Search bar: "Search by handle, name, or keywords" (consolidated from dual search; Moderate #12)
  - Sort dropdown: Followers high/low, Engagement rate, Recently active (Moderate #13)
  - Result count
  - Influencer cards: avatar, handle, niche, per-platform follower counts and engagement rates, location, platforms (Critical #4)
  - "Already Invited" / "Invitation Pending" badge on cards where applicable; Invite button disabled (Major #8)
  - Action buttons: View Profile, Invite
  - Pagination
- **Empty State**: Illustrated placeholder, copy, and "Clear All Filters" CTA when no results match (Critical #1)

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
- **Search consolidated**: Single search input handles handle, name, and keywords; sidebar Keywords filter removed to avoid confusion (Moderate #12)
- **Sort options**: Brands can sort by followers (high/low), engagement rate, or recently active (Moderate #13)
- **Dual-handle range slider**: Follower filter uses a single slider with two handles showing selected min and max values (Minor #21)
- **Per-platform stats**: Cards show individual follower counts and engagement rates per platform instead of one misleading global number (Critical #4)
- **Already Invited guardrail**: Influencers with pending invitations display an "Invited" badge and have their Invite button disabled (Major #8)
- **Empty state**: No-results state provides a "Clear All Filters" CTA and guidance to adjust filters (Critical #1)
- **Loading state**: Skeleton cards shown while search results load (Cross-cutting gap)
