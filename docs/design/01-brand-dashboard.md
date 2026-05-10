# Brand Dashboard

## Purpose
Overview of campaigns, quick stats, and entry points to create or discover.

## ASCII UI

```
+------------------------------------------------------------------+
|  LOGO    Campaigns    Discover    Profile              [BrandCo] |
+------------------------------------------------------------------+
|                                                                  |
|  +------------------+  +------------------+  +----------------+  |
|  | Active Campaigns |  | Total Influencers|  | Avg Engagement |  |
|  |                  |  |                  |  |                |  |
|  |        3         |  |        7         |  |     4.1%       |  |
|  +------------------+  +------------------+  +----------------+  |
|                                                                  |
|  Active Campaigns (3)                              [+ New Camp]  |
|  ----------------------------------------------------------------|
|                                                                  |
|  +-------------------------------------------------------------+ |
|  | Summer Promo                                          Active | |
|  | 2/5 influencers onboarded    Budget: $2,500    Due: Aug 15 | |
|  | [=====>                    ] 40% complete                  | |
|  +-------------------------------------------------------------+ |
|                                                                  |
|  +-------------------------------------------------------------+ |
|  | Product Launch                                        Active | |
|  | 1/3 influencers onboarded    Budget: $1,200    Due: Sep 01 | |
|  | [===>                      ] 33% complete                  | |
|  +-------------------------------------------------------------+ |
|                                                                  |
|  +-------------------------------------------------------------+ |
|  | Fall Collection                                      Draft   | |
|  | 0/4 influencers onboarded    Budget: $3,000    Due: Oct 01 | |
|  | [                          ] 0% complete                   | |
|  +-------------------------------------------------------------+ |
|                                                                  |
|  Recent Activity                                                 |
|  ----------------------------------------------------------------|
|  [14:32]  @travel_jane accepted invitation to Summer Promo       |
|  [11:15]  @fitness_mike completed deliverable for Product Launch |
|  [09:00]  New campaign "Fall Collection" created                 |
|                                                                  |
+------------------------------------------------------------------+
```

## Key Elements
- **Top Navigation**: Logo, Campaigns, Discover, Profile links + brand identity
- **Stats Cards**: Quick metrics at a glance (3 cards)
- **Campaign List**: Active campaigns with progress bars, budget, due dates
- **Activity Feed**: Recent notifications/actions
- **Primary CTA**: "+ New Campaign" button

## Action Flows

### Flow: View Campaign Detail
1. Brand clicks on any campaign card in the Active Campaigns list
2. Page navigates to `/campaigns/:id` (Campaign Detail)
3. Campaign Detail loads with full brief, influencer list, and deliverable progress

### Flow: Create New Campaign
1. Brand clicks "+ New Campaign" button
2. Page navigates to `/campaigns/new` (Create Campaign + Invite flow)
3. Brand fills campaign details and sends invitation

### Flow: Discover Influencers
1. Brand clicks "Discover" in top navigation
2. Page navigates to `/discover`
3. Brand can search and filter influencers

## Notes
- Progress bar shows % of deliverables completed across all invited influencers
- Campaign status badge (Active/Draft/Completed) on each card
- Clicking a campaign navigates to Campaign Detail
