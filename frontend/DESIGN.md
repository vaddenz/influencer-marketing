# Dashboard Redesign — Design Decisions & Guidelines

## Overview

The current brand and influencer dashboard pages use a dark-gray sidebar (`bg-gray-900`) and plain card layouts that feel like a generic admin panel. This redesign creates a **warm, inviting creative-studio aesthetic** that aligns with the homepage's friendly, collaborative tone (as seen in the homepage illustration showing diverse creators working together).

## Design Direction

**Tone**: Warm editorial minimalism meets creative studio dashboard. Think "creative director's workspace" rather than "database admin." The space is influencer marketing — a creative industry — so the tools should feel inspiring to use.

**Differentiation**: A light, airy sidebar with iconography, warm accent colors drawn from the homepage illustration, cards that feel like magazine editorial spreads, and generous whitespace that lets content breathe. The one thing users will remember: *this doesn't look like every other SaaS dashboard.*

## Homepage Reference

The homepage (`app/page.tsx`) establishes the brand language:
- **Color**: Clean white backgrounds with a single blue accent (`#0066ff`)
- **Typography**: Plus Jakarta Sans (bold, geometric, modern)
- **Mood**: Friendly, professional, approachable
- **Hero image**: Warm illustration with mustard yellow, teal green, coral orange, and cobalt blue tones

The dashboard extends this language but shifts the accent from cool blue to **warm coral** (`#E85D4C`) to evoke creativity and energy, while keeping the clean white/cream spatial language.

## Color Palette

```
/* Dashboard Extension Tokens */
--d-sidebar-bg: #ffffff
--d-sidebar-border: #f0ebe5
--d-sidebar-text: #5c5c5c
--d-sidebar-active: #fef6f5
--d-sidebar-active-border: #E85D4C
--d-sidebar-active-text: #1a1a1a

--d-content-bg: #FAF8F5
--d-content-bg-warm: #f5f0eb

--d-accent: #E85D4C
--d-accent-hover: #D44A3A
--d-accent-light: #FEF0EE
--d-accent-subtle: rgba(232, 93, 76, 0.08)

--d-card-bg: #ffffff
--d-card-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.03)
--d-card-shadow-hover: 0 4px 12px rgba(0,0,0,0.06), 0 16px 48px rgba(0,0,0,0.04)
--d-card-border: #f0ebe5

--d-text: #1a1a1a
--d-text-secondary: #6b6560
--d-text-muted: #a8a29e

--d-success: #2A9D8F
--d-success-light: #E8F5F3
--d-warning: #E9C46A
--d-warning-light: #FDF8ED
--d-error: #E85D4C
--d-error-light: #FEF0EE
```

## Typography

- **Headings**: Plus Jakarta Sans (already loaded in layout). Used at larger sizes with tight line-height (1.2) for impact.
- **Body**: System sans-serif stack. The geometric quality of Plus Jakarta Sans works well for UI labels and nav items too.
- **Scale**: Page titles at 28px/32px, section headers at 18px/20px, body at 14px/16px.
- **Weights**: 600 for headings and labels, 500 for nav items, 400 for body.

## Layout System

### Sidebar
- Width: 260px, fixed
- Background: white with a subtle warm right border (`#f0ebe5`)
- Padding: 24px
- Logo area: 32px bold text, brand color
- Navigation: vertical stack with 4px gap
  - Each item: 40px height, 12px horizontal padding, 8px border-radius
  - Icon (20px) + label, gap 12px
  - Inactive: `--d-sidebar-text`
  - Hover: background `--d-content-bg`, text `--d-text`
  - Active: background `--d-sidebar-active`, left 3px border `--d-sidebar-active-border`, text `--d-sidebar-active-text`
  - Transition: 200ms ease

### Content Area
- Background: `--d-content-bg` (warm off-white)
- Padding: 32px (desktop), 20px (mobile)
- Max content width: fluid within the remaining viewport

### Cards
- Background: white
- Border: 1px solid `--d-card-border`
- Border-radius: 16px
- Shadow: `--d-card-shadow`
- Hover: translateY(-2px) + `--d-card-shadow-hover`
- Transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1)
- Internal padding: 24px

## Component Guidelines

### Buttons
- **Primary**: `--d-accent` background, white text, 10px 20px padding, 10px border-radius, font-weight 600. Hover: `--d-accent-hover` + slight scale(1.02).
- **Secondary**: white background, `--d-card-border` border, `--d-text` text. Hover: `--d-content-bg` background.
- **Text/Link**: `--d-accent` text, no background. Hover: underline.

### Stats / Metrics
- Large number: 32px bold, `--d-text`
- Label: 13px, `--d-text-muted`, uppercase tracking wide
- Container: card with vertical padding emphasis

### Forms / Inputs
- Background: white
- Border: 1px solid `--d-card-border`
- Border-radius: 12px
- Padding: 12px 16px
- Focus: border `--d-accent`, subtle ring `0 0 0 3px var(--d-accent-subtle)`
- Placeholder: `--d-text-muted`

### Tags / Badges
- Padding: 6px 12px
- Border-radius: 8px
- Font: 12px, weight 600
- Status colors mapped to the warm palette

### Empty States
- Centered illustration area (emoji or icon at 48px)
- Title: 16px semibold
- Description: 14px, `--d-text-secondary`
- CTA button below

## Animations

### Page Load
- Sidebar: fade in from left, 300ms, ease-out
- Content cards: staggered fade-up (opacity 0→1, translateY 12px→0), 400ms each, 60ms stagger delay

### Card Hover
- translateY(-2px)
- Shadow deepens
- Border color shifts slightly warmer
- Duration: 300ms, easing: cubic-bezier(0.4, 0, 0.2, 1)

### Button Hover
- Background darkens
- Optional: scale(1.02)
- Duration: 150ms

### Sidebar Nav Active State
- Left border slides in (pseudo-element width animation)
- Background color fades in
- Duration: 200ms

## Responsive Behavior

- **Desktop (>= 1024px)**: Full sidebar visible, multi-column grids
- **Tablet (768px - 1023px)**: Sidebar collapses to icon-only (80px width), tooltips on hover
- **Mobile (< 768px)**: Sidebar becomes a bottom tab bar or hamburger menu; content stacks to single column

## Accessibility

- All interactive elements have visible focus states (2px outline, offset 2px, `--d-accent` color)
- Color contrast ratios meet WCAG AA (warm charcoal on cream, white on coral)
- Reduced motion: disable all translate/scale animations, keep only opacity transitions

## Files to Modify

1. `app/globals.css` — add new dashboard design tokens and animation utilities
2. `app/brand/layout.tsx` — new sidebar layout
3. `app/brand/dashboard/page.tsx` — redesigned campaign dashboard
4. `app/brand/discover/page.tsx` — redesigned influencer discovery
5. `app/brand/campaigns/new/page.tsx` — redesigned campaign creation form
6. `app/brand/campaigns/[id]/page.tsx` — redesigned campaign detail
7. `app/brand/influencers/[id]/page.tsx` — redesigned influencer profile view
8. `app/influencer/layout.tsx` — new sidebar layout
9. `app/influencer/profile/page.tsx` — redesigned profile editor
10. `app/influencer/invitations/page.tsx` — redesigned invitations list
11. `app/influencer/campaigns/[id]/page.tsx` — redesigned campaign deliverables
