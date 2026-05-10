# Error Pages

## Purpose
Global error pages for 404 (Not Found) and 500 (Server Error) to help users recover from failures gracefully.

## ASCII UI — 404 Not Found

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

## ASCII UI — 500 Server Error

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

## Key Elements
- **Illustration**: Friendly, on-brand illustration placeholder
- **Headline**: Clear error type (404 / 500)
- **Subcopy**: Helpful explanation of what happened
- **Primary CTA**: Action to recover (Go to Dashboard / Refresh Page)

## Action Flows

### Flow: Encounter 404
1. User navigates to a non-existent route
2. Server returns 404 status
3. Client renders 404 error page with layout shell (nav + footer)
4. User clicks "Go to Dashboard" to return to their role-appropriate home page

### Flow: Encounter 500
1. User performs an action that triggers a server error
2. Server returns 500 status
3. Client renders 500 error page with layout shell
4. User clicks "Refresh Page" to retry loading the current page
5. If error persists, user can use navigation to go elsewhere

## Notes
- Error pages preserve the top navigation so users are not trapped
- Both brand and influencer portals use the same error page components with appropriate nav items
- No error details or stack traces are shown to users in production
- 404 and 500 pages are server-rendered where possible for SEO and fast recovery
