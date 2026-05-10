# Frontend Development

Develop and maintain the Next.js 16 frontend application. Covers setup, coding standards, common tasks, and quality gates for this React 19 + TypeScript + Tailwind CSS 4 project.

## When to use

Use this skill when:
- Starting new frontend feature work, bug fixes, or refactors.
- Creating new pages, components, API integrations, or i18n translations.
- Setting up the local dev environment or running quality checks.
- You need to understand project conventions for Server Components, styling, auth, or data fetching.

## Prerequisites

- Node.js 22+ and Yarn are installed.
- Backend API is running (or mock data is available) if the feature requires data.
- Read `CLAUDE.md` in the project root for architecture and design-system context.

## Local Setup

```bash
yarn install
yarn dev
```

The dev server runs on `http://localhost:3001` by default.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router, `output: 'standalone'`) |
| Runtime | React 19, TypeScript 5 (strict mode) |
| Styling | Tailwind CSS 4 with PostCSS |
| State / Data | `@tanstack/react-query`, React Context |
| i18n | `next-intl` v4 (cookie-based locale detection) |
| Auth | JWT with automatic token refresh |
| Package Manager | Yarn |

## Project Structure

```
app/                    # Next.js App Router pages
  page.tsx              # Homepage
  layout.tsx            # Root layout (fonts, metadata, providers)
  globals.css           # Design system (CSS variables + utility classes)
  sitemap.ts            # Dynamic sitemap
  [route]/              # Additional pages and layouts

components/             # Shared UI components
  Navbar.tsx
  Footer.tsx
  AuthButton.tsx
  PublicLayout.tsx
  LanguageSwitcher.tsx

lib/                    # Core utilities
  auth.tsx              # AuthContext, JWT token management, refresh flow
  api.ts                # API fetch wrappers (`apiFetch`, `fetchCategories`)
  config.ts             # `getApiUrl()` — builds full API URLs
  types.ts              # Shared TypeScript interfaces
  locale.ts             # Server-side locale detection
  hooks.ts              # Custom React hooks
  analytics.ts          # Analytics helpers
  query-provider.tsx    # React Query provider setup

messages/               # i18n translation files
  zh.json               # Default locale
  en.json
  ja.json

i18n/
  request.ts            # next-intl request configuration
```

## Coding Standards

### TypeScript

- `strict: true` is enabled in `tsconfig.json`. Do not disable it.
- Prefer explicit return types on exported functions in `lib/`.
- Use the path alias `@/` for all internal imports. Never use relative paths like `../../`.

### Components

- **Prefer Server Components by default.** Only add `'use client'` when the component uses state, effects, or browser-only APIs.
- Keep shared components in `components/`. Page-specific components can live in `app/[route]/`.
- Use named exports for components.

### Styling

- Use **Tailwind CSS** utilities for layout and spacing.
- Reference the design system via CSS custom properties defined in `globals.css`.
- Prefer `var(--c-*)` tokens over arbitrary Tailwind values when a design-system variable exists.
- Utility classes (`.btn-primary`, `.card`, `.section-title`, etc.) are defined in `globals.css` and may be used alongside Tailwind.
- Write mobile-first responsive styles with `sm:`, `md:`, `lg:` breakpoints.

### Internationalization (i18n)

- **All user-facing strings must go through `next-intl`.** Never hardcode UI text.
- Server Components: use `getTranslations()` from `next-intl/server`.
- Client Components: use `useTranslations()` from `next-intl`.
- Supported locales: `zh` (default), `en`, `ja`.
- Locale resolution order: cookie (`NEXT_LOCALE`) → `Accept-Language` header → fallback `zh`.
- Add new keys to all three JSON files in `messages/` to keep translations in sync. Use the source locale (`zh`) as the reference.

### Data Fetching

- Server Components should fetch directly with `fetch()`.
- Use `next: { revalidate: N }` for cacheable data.
- Use `cache: 'no-store'` for dynamic or user-specific data.
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

Error shape:

```json
{
  "success": false,
  "data": null,
  "error": { "code": "ERROR_CODE", "message": "Error description" },
  "requestId": "...",
  "time": "..."
}
```

- `error` may be a plain `string` or an `ApiError` object. The `ApiResponse<T>` type in `lib/types.ts` handles both shapes.
- Use `apiFetch<T>()` in `lib/api.ts` as the canonical fetch wrapper. It handles auth headers, 401 redirects, and envelope unwrapping.
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

- Only `NEXT_PUBLIC_*` variables are used. They are inlined at build time.
- Do not assume runtime env var changes after the Docker image is built.
- For Docker builds, pass them as `--build-arg`.

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_BRAND_NAME` | Site name in metadata and navbar |
| `NEXT_PUBLIC_API_BASE_URL` | Backend API base URL |
| `NEXT_PUBLIC_ADVERTISED_HOST` | Public host for canonical URLs and OG images |
| `NEXT_PUBLIC_UMAMI_WEBSITE_ID` | Umami analytics website ID |
| `NEXT_PUBLIC_CONTACT_EMAIL` | Contact email in footer |

## Common Tasks

### Creating a New Page

1. Create `app/[route]/page.tsx`.
2. Export `generateMetadata()` using `getTranslations()` for SEO.
3. Keep the page a Server Component unless it needs client interactivity.
4. If the route needs a layout, create `app/[route]/layout.tsx`.

### Creating a New Shared Component

1. Create `components/ComponentName.tsx`.
2. Use a named export.
3. Only add `'use client'` if the component uses state, effects, or browser APIs.
4. Import with `@/components/ComponentName`.

### Adding a New API Wrapper

1. Define the response type in `lib/types.ts` if it does not exist.
2. Add the wrapper in `lib/api.ts` using `apiFetch<T>` or `fetch` + `getApiUrl()` for unauthenticated endpoints.
3. Handle errors by throwing with a clear message extracted from `result.error`.

### Adding Translations

1. Add the key to `messages/zh.json` first.
2. Mirror the key and value (translated) to `messages/en.json` and `messages/ja.json`.
3. Use the key in components via `t('key.subkey')`.

## Quality Gates

Before merging any changes, run:

```bash
yarn lint
yarn build
```

- `yarn lint` runs ESLint across the project.
- `yarn build` performs a production build with TypeScript strict checking.
- There is no test framework configured yet. If you add one, update this skill and the `package.json` scripts.

## Docker Deployment

The project builds a standalone Next.js output via a multi-stage `Dockerfile`:

```bash
docker build \
  --build-arg NEXT_PUBLIC_API_BASE_URL=https://HOSTNAME/api/v1 \
  --build-arg NEXT_PUBLIC_UMAMI_WEBSITE_ID=<website-id> \
  -t PROJECTNAME-frontend .
```

Traefik handles SSL termination and routing. See `traefik/README.md` for gateway setup.

## Important Patterns

- **Metadata**: Each page defines metadata via `generateMetadata()` using translations.
- **Error Handling**: API fetch wrappers log errors and return empty arrays or throw as appropriate.
- **Responsive**: Mobile-first with `sm:`, `md:`, `lg:` breakpoints.
