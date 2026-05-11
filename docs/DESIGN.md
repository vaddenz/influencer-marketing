# Design Audit: m2ie.io

## Overview

**Site**: [株式会社マシュマロエンタメ (Marshmallow Entertainment)](https://www.m2ie.io/)  
**Type**: Japanese corporate / entertainment business website  
**Pages Audited**:
- `/` — Homepage
- `/business/` — Business overview
- `/business/creators/` — Creator growth & content IP

**Design Direction**: Modern, clean corporate site with playful, editorial touches. Combines Swiss-style minimalism with soft, organic visual accents (gradient orbs, rounded everything, generous whitespace). Dark navy sections contrast against airy white backgrounds to create rhythm.

---

## Color Palette

| Token | Value | Usage |
|-------|-------|-------|
| `--black` | `#0c0c0c` | Primary text, dark buttons, borders |
| `--gray` | `#888888` | Secondary text, muted labels |
| `--white` | `#ffffff` | Page backgrounds, inverted text on dark sections |
| `--light-gray` | `#f6f6f6` | Subtle section backgrounds, card fills |
| `--border-gray` | `#eeeeee` | Divider lines, borders |
| `--accent-navy` | `#2a2f4e` | Dark section backgrounds ("Our Business") |
| `--accent-red` | `#ff3636` | Link hover, emphasis text |
| `--accent-blue` | `#2a2f4e` | Deep blue for featured sections |

**Gradient Accents** (hero decorative orbs):
- Warm orange-to-pink sphere
- Cool purple-to-blue sphere
- Soft peach-to-cream sphere

---

## Typography

| Role | Font | Weights | Usage |
|------|------|---------|-------|
| Display / Headings | **Chillax** | 500 (Medium) | Hero titles, section headers, mega-menu titles, footer giant text |
| Body / UI | **Noto Sans JP** | 400, 500, 700, 900 | Body copy, navigation, labels, buttons |
| Fallback | Helvetica, Arial, sans-serif | — | System fallback stack |

### Type Scale

| Size | Value | Usage |
|------|-------|-------|
| Display XL | `clamp(4.563rem, 2.299rem + 3.696vw, 5.625rem)` (~73–90px) | Footer giant text |
| Display L | `clamp(3.25rem, -3.141rem + 10.435vw, 6.25rem)` | Hero headlines |
| H1 | `80px` | Page titles |
| H2 | `60px` | Major section headings |
| H3 | `46px` | Mega-menu titles |
| H4 | `40px` | Sub-section headings |
| H5 | `34px` | Card titles |
| H6 | `30px` | Minor headings |
| Body Large | `20px` | Lead paragraphs |
| Body | `16px` | Standard body copy |
| Body Small | `14px` | Captions, meta text |
| Label | `12px` | Numbered counters, tags |

### Typography Patterns
- **Line-height**: 1.6 for headings, 1.8 for body text
- **Letter-spacing**: Default (slightly tight for Chillax display text)
- **Font-smoothing**: Antialiased rendering implied by modern stack

---

## Spacing System

| Token | Value |
|-------|-------|
| Section padding (vertical) | `140px` – `260px` (generous) |
| Container max-width | `1140px` (content), `1600px` (footer) |
| Container padding | `20px` mobile, `30px` tablet, `80px` desktop |
| Grid gap | `20px` standard |
| Component gap | `10px`, `20px`, `30px`, `40px` |
| Header inner padding | `20px` vertical, `30px` horizontal |

**Spacing scale**: Fluid spacing using `clamp()` for responsive scaling between mobile and desktop.

---

## Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `radius-sm` | `10px` | Cards, images, media containers |
| `radius-md` | `15px` | Small buttons, badges |
| `radius-lg` | `20px` | Header background, large cards |
| `radius-xl` | `30px` | Primary buttons, pill buttons, menu links |
| `radius-full` | `50px` | Circular buttons, avatar containers |
| `radius-pill` | `9999px` | WordPress block buttons |
| `radius-none` | `0px` | Clean edges where needed |

---

## Shadows

| Token | Value | Usage |
|-------|-------|-------|
| `shadow-sm` | `rgba(0, 0, 0, 0.08) 0px 0px 30px` | Header background on scroll |
| `shadow-md` | `rgba(0, 0, 0, 0.16) 0px 0px 30px` | Elevated cards, dropdowns |
| `shadow-side` | `rgba(0, 0, 0, 0.1) -4px 0px 20px` | Side panels, drawers |

---

## Layout

### Grid
- **Standard grid**: 4-column for mega-menu items
- **Content grid**: Flexible, often 2-column for text + image layouts
- **Gap**: Consistently `20px`

### Breakpoints
| Name | Width | Notes |
|------|-------|-------|
| Mobile | `≤ 980px` | Single column, hamburger menu, stacked layout |
| Desktop | `> 980px` | Full navigation, multi-column grids |

### Z-Index Hierarchy
| Layer | Z-Index | Element |
|-------|---------|---------|
| Modal / Overlay | `100000` | Screen reader focus |
| Mega Menu | `1000` | Full-width dropdown |
| Fixed Header | `100` | Scrolled state |
| Header default | `9` | Absolute positioned hero header |
| Background | `-1`, `-3` | Decorative layers |

---

## Components

### Header / Navigation
- **Position**: Absolute on hero, fixed on scroll
- **Background**: Transparent → white pill with `shadow-sm` on scroll
- **Border radius**: `20px` for the floating header background
- **Logo**: "m2ie" wordmark + company name in Japanese
- **Nav links**: Underline slide-in hover effect (`transform: translateX(-100%) → 0`)
- **CTA Button**: Black pill button (`#0c0c0c`, white text, `radius: 30px`)
- **Mega Menu**: Full-width dropdown with 4-column grid, numbered items (`01`, `02`, etc.), thumbnail images with `radius: 10px`

### Buttons
- **Primary**: Black background, white text, `radius: 30px`, `height: 50px`
- **Secondary / Outline**: White/black border, transparent background, `radius: 30px`
- **Hover**: Background fill inversion, opacity `0.7` on CTA

### Cards
- **Media cards**: `radius: 10px`, overflow hidden, image `scale(1.05)` on hover
- **Business cards** (dark section): Numbered (`01`, `02`, `03`), navy background, white text, image + description layout
- **Service cards**: Large imagery with text overlay or side-by-side layout

### Footer
- **Background**: White
- **Giant text**: Chillax font at `clamp(4.563rem, 2.299rem + 3.696vw, 5.625rem)`
- **Layout**: Flex row with large gap (`clamp(40px, 8vw, 130px)`)
- **Image embeds**: Small rounded inline images within the giant text (`radius: 10px`)

---

## Animation & Motion

### Easing Curve
**Primary**: `cubic-bezier(0.26, 0.27, 0.1, 1)`  
Used universally for transitions, hovers, dropdowns, and reveals. Creates a smooth, slightly delayed ease-out feel.

### Keyframe Animations

| Name | Effect | Duration | Usage |
|------|--------|----------|-------|
| `slideUp` | `translateY(110%) → 0` | — | Text reveal on scroll |
| `scroll-left` | `translateX(0) → -50%` | — | Infinite logo marquee |
| `scroll-left-100` | `translateX(0) → -100%` | — | Full-width marquee |
| `rotate` | `rotate(0deg → 360deg)` | — | Decorative spinners |
| `spin` / `splide-loading` | `rotate(0 → 360deg)` | `1s linear infinite` | Loading states |
| `blink` | `opacity: 0 → 1 → 0` | — | Cursor / indicator blink |

### Interaction Patterns
- **Nav underline**: Slides in from left on hover (`transform: translateX(-100%) → 0`)
- **Mega menu**: Height expansion with `max-height` transition (`0.4s`)
- **Image hover**: `scale(1.05)` with `0.3s` transition
- **Header scroll**: Background opacity fade (`0.4s`), visibility toggle
- **Card arrow icons**: Fill color swap on hover (circle fills black, arrow turns white)

### Scroll Behaviors
- Header hides when scrolling down, reappears on scroll up
- Header gains solid white background after scrolling past hero
- Sections use scroll-triggered fade/slide-up reveals

---

## Visual Assets

### Decorative Elements
- **Gradient Orbs**: Large, soft-edged spheres in hero sections (orange, pink, purple, peach)
- **Line Illustrations**: Simple, friendly line-art illustrations in "Our Strengths" and "Why" sections
- **Inline Photos**: Small rounded images embedded within large display text

### Image Treatment
- **Border radius**: `10px` universally on photos
- **Object-fit**: `cover` for all media containers
- **Hover**: Subtle zoom (`scale(1.05)`) with overflow hidden

---

## Page-Specific Notes

### Homepage (`/`)
- Hero features massive Chillax headline with floating gradient orbs
- "Our Business" section uses dark navy (`#2a2f4e`) background with numbered cards
- News section with date + title list layout
- Service showcase with large imagery

### Business (`/business/`)
- Hero: "Business" title with gradient orbs
- "Global growth for great products." — large editorial text block
- "Our Strengths": 4 numbered items with line illustrations and accordion-style expand
- Dark "Our Business" section with 3 numbered service cards

### Creators (`/business/creators/`)
- Hero: "WHAT One Million?" with large display typography and illustration
- "Why One Million?" section with 2-column grid of illustrated value props
- Partner logo marquee (infinite scroll)
- Creator portrait gallery with `radius: 10px` images
- Reuses dark "Our Business" and "Our Service" sections

---

## Design System Summary

This is a **refined corporate editorial** design system:
- **Typography**: Geometric display font (Chillax) paired with functional Japanese sans-serif (Noto Sans JP)
- **Shape language**: Everything is rounded — no sharp corners
- **Color rhythm**: White → light gray → dark navy sections create visual pacing
- **Motion philosophy**: Smooth, unhurried transitions with a signature easing curve
- **Detail density**: Sparse but intentional — generous whitespace with focused content clusters
- **Visual play**: Gradient orbs and line illustrations add personality to an otherwise minimal corporate shell
