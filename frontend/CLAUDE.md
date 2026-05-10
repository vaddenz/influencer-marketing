# CLAUDE.md

## Project Overview

A minimal, production-ready **Next.js 16 template** built with React 19, TypeScript, and Tailwind CSS 4. It includes internationalization (`next-intl`), JWT auth scaffolding, Docker deployment, and a CSS-variable-based design system. Use this as a starting point for new frontend projects.

## Tech Stack

- **Framework**: Next.js 16 (App Router, `output: 'standalone'`)
- **Runtime**: React 19, TypeScript 5
- **Styling**: Tailwind CSS 4 with PostCSS
- **i18n**: `next-intl` v4 with cookie-based locale detection
- **Package Manager**: Yarn (lockfile present)

## Project Structure

```
app/                 # Next.js App Router pages
  page.tsx           # Homepage
  layout.tsx         # Root layout with fonts, metadata, providers
  globals.css        # Design system (CSS variables + utility classes)
  sitemap.ts         # Dynamic sitemap
  [other routes]/    # Additional pages

components/          # Shared UI components (Navbar, Footer, etc.)

lib/                 # Core utilities
  auth.tsx           # AuthContext, JWT token management, refresh flow
  api.ts             # API fetch helpers
  config.ts          # `getApiUrl()` — builds full API URLs
  types.ts           # Shared TypeScript interfaces
  locale.ts          # Server-side locale detection (cookie + Accept-Language)
  hooks.ts           # Custom React hooks
  analytics.ts       # Analytics helpers

messages/            # i18n translation files (zh.json, en.json, ja.json)

i18n/
  request.ts         # next-intl request configuration

traefik/             # Traefik reverse proxy config for Docker deployment
```

## Coding Rules and Conventions

### TypeScript
- `strict: true` is enabled in `tsconfig.json`. Do not disable it.
- Prefer explicit return types on exported functions in `lib/`.
- Use path alias `@/` for all internal imports.

### Components
- **Prefer Server Components by default.** Only add `'use client'` when the component uses state, effects, or browser-only APIs.
- Keep components in `components/` if they are shared across pages; page-specific components can live in `app/[route]/`.

### Styling
- Use **Tailwind CSS** utilities for layout and spacing.
- Reference the design system via CSS custom properties defined in `globals.css`.
- Prefer `var(--c-*)` tokens over arbitrary Tailwind values when a design-system variable exists.
- Utility classes (`.btn-primary`, `.card`, `.section-title`, etc.) are defined in `globals.css` and may be used alongside Tailwind.

### Internationalization (i18n)
- **All user-facing strings must go through `next-intl`.** Never hardcode UI text.
- Server Components: use `getTranslations()` from `next-intl/server`.
- Client Components: use `useTranslations()` from `next-intl`.
- Supported locales: `zh` (default), `en`, `ja`.
- Locale resolution: cookie (`NEXT_LOCALE`) → `Accept-Language` header → fallback `zh`.

### Data Fetching
- Server Components should fetch directly with `fetch()`.
- Use `next: { revalidate: N }` for cacheable data.
- Use `cache: 'no-store'` for dynamic/user-specific data.
- Always construct API URLs with `getApiUrl()` from `lib/config.ts`.

### Backend API Integration

The backend returns a standardized JSON envelope:

```json
{
  "success": true,
  "data": { ... },
  "error": null,
  "requestId": "...",
  "time": "..."
}
```

Error response example:

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description"
  },
  "requestId": "...",
  "time": "..."
}
```

- `error` may be a plain `string` or an `ApiError` object with `code` and `message`. The shared `ApiResponse<T>` type in `lib/types.ts` handles both shapes.
- Use the helper functions in `lib/api.ts` as the reference pattern: wrap `fetch()` with `getApiUrl()`, parse the response as `ApiResponse<T>`, check `success`, and either return `data` or throw an error that extracts the message correctly.
- When adding a new endpoint, create a typed wrapper in `lib/api.ts` following the existing `fetchCategories` pattern.

### Auth
- Do not access `localStorage` directly outside `lib/auth.tsx`.
- Use the `useAuth()` hook in components.
- Use exported helpers (`getTokens`, `setTokens`, `clearTokens`, `getAccessToken`) for token management.
- Token refresh is handled automatically on 401 responses.

### Images
- Always use `next/image` with explicit `width` and `height`.
- Default `quality={75}` unless a specific quality is required.
- Formats: `webp`, `avif` (configured in `next.config.ts`).

### Environment Variables
- Only `NEXT_PUBLIC_*` variables are used. They are **inlined at build time**.
- Do not assume runtime env var changes after the Docker image is built.
- Pass them as `--build-arg` when building the Docker image.

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_BRAND_NAME` | Site name used in metadata and navbar |
| `NEXT_PUBLIC_API_BASE_URL` | Backend API base URL |
| `NEXT_PUBLIC_ADVERTISED_HOST` | Public host for canonical URLs and OG images |
| `NEXT_PUBLIC_UMAMI_WEBSITE_ID` | Umami analytics website ID |
| `NEXT_PUBLIC_CONTACT_EMAIL` | Contact email displayed in footer |

## Scripts

```bash
yarn dev      # Dev server on localhost:3000
yarn build    # Production build (standalone output)
yarn start    # Start production server
```

## Testing

### Current State
No test framework is currently configured.

### Minimum Quality Gate (Now)
Before merging any changes, run:
```bash
yarn lint
yarn build
```
Type-checking is enforced by `strict: true` during `next build`.

### Recommended Setup
Add the following test tooling and update `package.json` scripts:
- **Unit / Integration**: [Vitest](https://vitest.dev/) with `@testing-library/react`
- **E2E**: [Playwright](https://playwright.dev/)

Once configured, add these scripts:
```bash
yarn test        # Run unit/integration tests
yarn test:e2e    # Run Playwright E2E tests
yarn type-check  # Run tsc --noEmit
```

## Docker Deployment

Multi-stage `Dockerfile` using `node:22-alpine`:
1. **Builder**: installs deps with Yarn, builds standalone output
2. **Runner**: copies `public/`, `.next/standalone`, `.next/static`

Traefik is used for SSL termination and routing. See `traefik/README.md` for gateway setup.

## Important Patterns

- **Metadata**: Each page defines metadata via `generateMetadata()` using translations.
- **Error Handling**: API fetch wrappers log errors and return empty arrays or throw as appropriate.
- **Responsive**: Mobile-first with `sm:`, `md:`, `lg:` breakpoints.
