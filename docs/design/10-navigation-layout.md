# Navigation & Layout

## Purpose
Shared layout structure and navigation patterns across both portals.

## ASCII UI — Brand Dashboard Layout

```
+------------------------------------------------------------------+
|  LOGO    Campaigns    Discover    Profile              [BrandCo] |
+------------------------------------------------------------------+
|                                                                  |
|  [PAGE CONTENT AREA]                                             |
|                                                                  |
|                                                                  |
|                                                                  |
|                                                                  |
|                                                                  |
|                                                                  |
|                                                                  |
|                                                                  |
|                                                                  |
|                                                                  |
+------------------------------------------------------------------+
|  Footer:  (c) 2026 Influencer Marketing Platform                 |
+------------------------------------------------------------------+
```

## ASCII UI — Influencer Portal Layout

```
+------------------------------------------------------------------+
|  LOGO    Invitations    My Campaigns    Profile    [@travel_jane]|
+------------------------------------------------------------------+
|                                                                  |
|  [PAGE CONTENT AREA]                                             |
|                                                                  |
|                                                                  |
|                                                                  |
|                                                                  |
|                                                                  |
|                                                                  |
|                                                                  |
|                                                                  |
|                                                                  |
|                                                                  |
+------------------------------------------------------------------+
|  Footer:  (c) 2026 Influencer Marketing Platform                 |
+------------------------------------------------------------------+
```

## Navigation Structure

### Brand Dashboard
| Route | Label | Description |
|-------|-------|-------------|
| `/` | Dashboard | Overview, stats, campaign list |
| `/campaigns` | Campaigns | All campaigns (active, draft, completed) |
| `/campaigns/:id` | Campaign Detail | Single campaign with influencers |
| `/campaigns/new` | New Campaign | Create campaign + invite flow |
| `/discover` | Discover | Search and filter influencers |
| `/discover?influencer=:id` | Influencer Profile | Brand view of influencer |
| `/profile` | Profile | Brand company profile settings |

### Influencer Portal
| Route | Label | Description |
|-------|-------|-------------|
| `/` | Invitations | Pending, accepted, declined invites |
| `/campaigns` | My Campaigns | All active/completed campaigns |
| `/campaigns/:id` | Campaign View | Single campaign with deliverables |
| `/profile` | Profile | Public influencer profile (view + edit) |

## Shared Components

### Top Navigation Bar
```
+------------------------------------------------------------------+
| [Logo]  [Link]  [Link]  [Link]                 [User Identity]  |
+------------------------------------------------------------------+
```
- Fixed position, full width
- Background: white with subtle bottom border
- Logo: clickable, returns to `/`
- Links: active state with underline or highlight
- User Identity: avatar + name/handle dropdown with Logout

### Mobile Collapsed Navigation
```
+----------------------------------+
| [Logo]                  [Menu ≡] |
+----------------------------------+
```
- Menu icon opens drawer/sheet from right
- Links stacked vertically
- User identity at bottom

## Responsive Breakpoints

| Breakpoint | Width | Layout Changes |
|------------|-------|----------------|
| Mobile | < 640px | Single column, hamburger nav, stacked filters |
| Tablet | 640-1024px | Two columns where applicable, condensed nav |
| Desktop | > 1024px | Full layout, sidebar filters, multi-column grids |

## Action Flows

### Flow: Navigate Between Pages
1. User clicks any link in the top navigation bar
2. Active link highlights with underline or accent color
3. Page content area transitions (fade or slide)
4. New page loads with corresponding content

### Flow: Open User Dropdown
1. User clicks their avatar/name in the top-right corner
2. Dropdown menu opens below the avatar
3. Menu contains:
   - Profile Settings
   - Account Settings
   - Help / Support
   - Logout
4. User clicks any option or outside the dropdown to close

### Flow: Logout
1. User opens user dropdown
2. User clicks "Logout"
3. System clears JWT token from storage
4. Page redirects to `/login`

### Flow: Mobile Navigation
1. On mobile (< 640px), user clicks hamburger menu icon (≡)
2. Drawer/sheet slides in from the right side
3. Navigation links stack vertically with larger tap targets
4. User identity section appears at the bottom of the drawer
5. User clicks a link or the overlay to close the drawer
6. Drawer slides out; selected page loads

## Notes
- Both portals share the same layout shell but with different nav items
- Footer is minimal — copyright only
- Page content has max-width container (e.g., 1280px) centered with padding
