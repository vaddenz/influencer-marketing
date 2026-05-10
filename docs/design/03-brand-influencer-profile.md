# Brand — Influencer Profile (Brand View)

## Purpose
Full stats and bio of an influencer. Two CTA paths: invite to existing campaign, or create new campaign + invite in one flow.

## ASCII UI

```
+------------------------------------------------------------------+
|  LOGO    Campaigns    Discover    Profile              [BrandCo] |
+------------------------------------------------------------------+
|                                                                  |
|  < Back to Discover                                              |
|                                                                  |
|  +-------------------------------------------------------------+ |
|  |                                                             | |
|  |    +------+                                                 | |
|  |    |      |  @travel_jane                                   | |
|  |    |  👤  |  Travel & Lifestyle                             | |
|  |    |      |  California, United States                      | |
|  |    +------+                                                 | |
|  |                                                             | |
|  |    +-----------+  +-----------+  +-----------+  +---------+ | |
|  |    |   125K    |  |   4.2%    |  |  Micro   |  |  4.8/5  | | |
|  |    | Followers |  | Engagement|  |  Scope   |  |  Rating | | |
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
|  |    [Invite to Existing Campaign]  [Create Campaign + Invite] | |
|  |                                                             | |
|  +-------------------------------------------------------------+ |
|                                                                  |
|  +-------------------------------------------------------------+ |
|  | Recent Work                                                 | |
|  | ----------------------------------------------------------- | |
|  | +----------+  +----------+  +----------+  +----------+      | |
|  | | [img]    |  | [img]    |  | [img]    |  | [img]    |      | |
|  | | Reel     |  | Story    |  | Reel     |  | Story    |      | |
|  | | 12K views|  | 3K views |  | 45K views|  | 8K views |      | |
|  | +----------+  +----------+  +----------+  +----------+      | |
|  +-------------------------------------------------------------+ |
|                                                                  |
|  +-------------------------------------------------------------+ |
|  | Audience Insights                                           | |
|  | ----------------------------------------------------------- | |
|  |  Gender:  62% F  |  38% M                                   | |
|  |  Age:     18-24: 35%  25-34: 40%  35-44: 20%  45+: 5%      | |
|  |  Top Loc: USA 45%  |  UK 20%  |  CA 12%  |  Other 23%       | |
|  +-------------------------------------------------------------+ |
|                                                                  |
+------------------------------------------------------------------+
```

## Key Elements
- **Profile Header**: Avatar, handle, niche, location
- **Stats Row**: Followers, Engagement Rate, Scope Tier, Rating (if available)
- **Bio Section**: Full bio text
- **Platforms**: Platform badges with links
- **Niche Categories**: Tag-style display
- **Languages**: Spoken languages
- **CTA Row**: Two primary actions side by side
- **Recent Work**: Grid of recent content previews
- **Audience Insights**: Demographics breakdown

## Action Flows

### Flow: Invite to Existing Campaign
1. Brand clicks "Invite to Existing Campaign" button
2. Invite Modal opens with `@travel_jane` pre-filled as the target influencer
3. Brand selects a campaign from the dropdown
4. Brief preview updates to show selected campaign details
5. Brand optionally types a personalized message
6. Brand clicks "Send Invitation"
7. System creates invitation record with status `pending`
8. Modal closes, success toast appears, brand remains on profile page

### Flow: Create Campaign + Invite
1. Brand clicks "Create Campaign + Invite" button
2. Page navigates to `/campaigns/new?influencer=:id`
3. Campaign creation form loads with influencer pre-selected
4. Brand fills campaign title, description, budget, due date
5. Brand adds deliverables using "+ Add Deliverable"
6. Brand clicks "Next: Invite" to review
7. Brand reviews campaign preview and influencer details
8. Brand optionally adds a personalized message
9. Brand clicks "Send Invitation"
10. System creates campaign (status `active`), creates invitation (status `pending`), creates deliverables from template
11. Page redirects to Campaign Detail

## Notes
- "Invite to Existing Campaign" opens Invite Modal pre-filled with this influencer
- "Create Campaign + Invite" navigates to Create Campaign flow with influencer pre-selected
- Audience insights are optional MVP — can be placeholder/coming soon
