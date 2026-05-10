# Navigation & Layout

## Purpose
Shared layout structure and navigation patterns across both portals.

## ASCII UI — Brand Dashboard Layout

```
+------------------------------------------------------------------+
|  LOGO    Campaigns    Discover    Profile   🔔3   [BrandCo]    |
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
|  Help   Privacy   Terms   (c) 2026 Influencer Marketing Platform |
+------------------------------------------------------------------+
```

## ASCII UI — Influencer Portal Layout

```
+------------------------------------------------------------------+
|  LOGO    Invitations    My Campaigns    Profile   🔍  🔔1 [@travel_jane]|
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
|  Help   Privacy   Terms   (c) 2026 Influencer Marketing Platform |
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
- Notification Bell: dropdown panel with recent notifications, unread badge (Major #10)
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

## Error Pages

### 404 — Not Found

```
+------------------------------------------------------------------+
|  LOGO    Campaigns    Discover    Profile   🔔0   [BrandCo]    |
+------------------------------------------------------------------+
|                                                                  |
|  +-------------------------------------------------------------+ |
|  |                                                             | |
|  |              [🔍 Illustration Placeholder]                  | |
|  |                                                             | |
|  |         Page not found                                      | |
|  |                                                             | |
|  |   The page you're looking for doesn't exist or was moved.   | |
|  |                                                             | |
|  |              [Go to Dashboard]                              | |
|  |                                                             | |
|  +-------------------------------------------------------------+ |
|                                                                  |
+------------------------------------------------------------------+
```

### 500 — Server Error

```
+------------------------------------------------------------------+
|  LOGO    Campaigns    Discover    Profile   🔔0   [BrandCo]    |
+------------------------------------------------------------------+
|                                                                  |
|  +-------------------------------------------------------------+ |
|  |                                                             | |
|  |              [⚠️ Illustration Placeholder]                  | |
|  |                                                             | |
|  |         Something went wrong                                | |
|  |                                                             | |
|  |   We're experiencing a server issue. Please try again.      | |
|  |                                                             | |
|  |              [Refresh Page]                                 | |
|  |                                                             | |
|  +-------------------------------------------------------------+ |
|                                                                  |
+------------------------------------------------------------------+
```

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
3. User identity section (avatar + name/handle + logout) appears at the top of the drawer
4. Navigation links stack vertically with larger tap targets below user identity
5. User clicks a link or the overlay to close the drawer
6. Drawer slides out; selected page loads (Moderate #20)

### Flow: Notifications
1. User clicks the notification bell icon in the top nav
2. Dropdown panel opens below the bell showing recent notifications
3. Unread notifications have a blue dot indicator
4. Unread count badge on the bell updates in real-time
5. User clicks a notification to navigate to the relevant page
6. Clicked notification is marked as read; badge count decrements (Major #10)

## Notes
- Both portals share the same layout shell but with different nav items
- **Notification bell**: Global notification dropdown accessible from all pages; shows unread count badge (Major #10)
- **Search in influencer portal**: Influencers get a search icon in the top nav for discovering campaigns or brands (Cross-cutting gap)
- **Footer quick links**: Help, Privacy, and Terms links provide easy access to legal and support pages (Minor #25)
- **Mobile nav user identity**: Placed at the top of the drawer for conventional accessibility (Moderate #20)
- **Error pages**: 404 and 500 pages have friendly illustrations, clear copy, and a primary CTA to recover (Cross-cutting gap)
- **Loading / skeleton states**: All pages with async data show skeleton placeholders during initial load (Cross-cutting gap)
- Page content has max-width container (e.g., 1280px) centered with padding
