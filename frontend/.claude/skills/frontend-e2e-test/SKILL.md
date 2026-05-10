# Frontend E2E Testing

Write and run browser-based end-to-end tests for the Next.js frontend using Playwright. Covers setup, auth handling, test organization, selector patterns, and running tests against local dev servers.

## When to use

Use this skill when:
- Adding or updating E2E tests for brand portal, influencer portal, auth flows, or shared navigation.
- Setting up Playwright E2E testing from scratch.
- Debugging flaky tests or investigating frontend regressions.
- Running the existing test suite before merging frontend changes.

## Prerequisites

- Node.js 22+ and Yarn are installed.
- The frontend and backend can be started locally (see `frontend-dev` and `backend-dev` skills).
- You have read the test case specifications in `docs/testcases/`.

## Test Case Source of Truth

The project maintains detailed test specifications in:

```
docs/testcases/
  auth-and-onboarding.md      # OAuth login, onboarding flows
  brand-portal.md             # Dashboard, discover, campaigns, invites
  influencer-portal.md        # Invitations, campaigns, profile
  messaging.md                # Notifications, communication
  navigation-and-cross-cutting.md  # Layout, nav, responsive, a11y
```

These files contain Playwright-style TypeScript snippets with fixture references. Use them as the specification when implementing tests.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Test Runner | `@playwright/test` |
| Browser | Chromium (primary), WebKit, Firefox for cross-browser |
| Auth Strategy | API-based seeding + session storage (bypass OAuth UI) |
| Server Orchestration | `webapp-testing` skill helpers OR `package.json` scripts |

## Setup

### 1. Install Playwright

```bash
cd frontend
yarn add -D @playwright/test
npx playwright install chromium
```

### 2. Add Scripts to package.json

```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug"
  }
}
```

### 3. Create playwright.config.ts

```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3001',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: {
    command: 'yarn dev',
    url: 'http://localhost:3001',
    reuseExistingServer: !process.env.CI,
  },
})
```

> **Note**: The frontend runs on `localhost:3001` in dev mode. The backend must also be running (default `localhost:3000`). For full E2E coverage, start both servers before running tests.

### 4. Create Test Directory Structure

```
frontend/e2e/
  fixtures/
    users.ts              # Brand / influencer seeding helpers
  pages/
    login.page.ts         # Page object for auth
    dashboard.page.ts     # Page object for brand dashboard
    discover.page.ts      # Page object for discover
    invitations.page.ts   # Page object for influencer invitations
  specs/
    auth.spec.ts
    brand-portal.spec.ts
    influencer-portal.spec.ts
    navigation.spec.ts
```

## Authentication Strategy

The frontend uses **Google OAuth** only. Do not attempt to automate the Google login UI — it is blocked by Google and unreliable.

Instead, use **API-based seeding + session injection**:

### 1. Seed users via backend API

Use the backend's `/api/v1/auth/register` and `/api/v1/auth/login` endpoints to create test accounts and obtain JWT tokens.

### 2. Inject auth state into browser context

```typescript
// e2e/fixtures/users.ts
import { request } from '@playwright/test'
import { getApiUrl } from '@/lib/config'

const API_BASE = 'http://localhost:3000'

export async function seedBrandUser() {
  // Register
  await request.newContext().post(`${API_BASE}/api/v1/auth/register`, {
    data: {
      email: 'e2e-brand@flow.test',
      password: 'password123',
      name: 'E2E Brand',
      role: 'brand',
    },
  })

  // Login to get tokens
  const res = await request.newContext().post(`${API_BASE}/api/v1/auth/login`, {
    data: {
      email: 'e2e-brand@flow.test',
      password: 'password123',
    },
  })

  const { accessToken, refreshToken } = await res.json().then(r => r.data)
  return { accessToken, refreshToken }
}
```

### 3. Use fixture to authenticate page

```typescript
// e2e/fixtures/auth.fixture.ts
import { test as base } from '@playwright/test'
import { seedBrandUser, seedInfluencerUser } from './users'

export const test = base.extend<{
  brandPage: Page
  influencerPage: Page
}>({
  brandPage: async ({ browser }, use) => {
    const { accessToken, refreshToken } = await seedBrandUser()
    const context = await browser.newContext()
    const page = await context.newPage()

    // Inject tokens into localStorage (auth.tsx reads from localStorage)
    await page.goto('/')
    await page.evaluate(({ at, rt }) => {
      localStorage.setItem('access_token', at)
      localStorage.setItem('refresh_token', rt)
    }, { at: accessToken, rt: refreshToken })

    // Refresh to apply auth
    await page.goto('/')
    await use(page)
    await context.close()
  },

  influencerPage: async ({ browser }, use) => {
    const { accessToken, refreshToken } = await seedInfluencerUser()
    const context = await browser.newContext()
    const page = await context.newPage()

    await page.goto('/')
    await page.evaluate(({ at, rt }) => {
      localStorage.setItem('access_token', at)
      localStorage.setItem('refresh_token', rt)
    }, { at: accessToken, rt: refreshToken })

    await page.goto('/')
    await use(page)
    await context.close()
  },
})
```

> **Note**: `lib/auth.tsx` stores tokens in `localStorage` under keys `access_token` and `refresh_token`. The `useAuth()` hook reads these on mount.

## Selector Patterns

Prefer user-centric, resilient selectors in this order:

1. **Role + name** (most resilient)
   ```typescript
   page.getByRole('button', { name: 'Sign In' })
   page.getByRole('link', { name: 'Discover' })
   ```

2. **Label / placeholder**
   ```typescript
   page.getByLabel('Email')
   page.getByPlaceholder('Search influencers...')
   ```

3. **Text content**
   ```typescript
   page.getByText('Active Campaigns')
   page.getByText('No active campaigns yet')
   ```

4. **Test IDs** (for elements without accessible text)
   ```typescript
   page.getByTestId('skeleton-stats')
   page.getByTestId('user-identity')
   ```

5. **CSS selectors** (last resort)
   ```typescript
   page.locator('[data-testid="campaign-card"]').first()
   ```

### Discovering Selectors

If you need to identify selectors on a dynamic page:

1. Start the dev server: `yarn dev`
2. Use the `webapp-testing` skill's reconnaissance approach:
   ```python
   page.goto('http://localhost:3001')
   page.wait_for_load_state('networkidle')
   page.screenshot(path='/tmp/inspect.png', full_page=True)
   ```
3. Inspect the screenshot or DOM to find accessible selectors.

## Writing Tests

### Example: Brand Dashboard

```typescript
// e2e/specs/brand-portal.spec.ts
import { test, expect } from '../fixtures/auth.fixture'

test.describe('Brand Portal', () => {
  test('dashboard shows stats and active campaigns', async ({ brandPage }) => {
    await expect(brandPage.getByText('Active Campaigns')).toBeVisible()
    await expect(brandPage.getByText('Total Influencers')).toBeVisible()
    await expect(brandPage.getByText('Avg Engagement')).toBeVisible()
  })

  test('empty state shows create campaign CTA', async ({ brandPage }) => {
    // Requires emptyBrand fixture variant
    await expect(brandPage.getByText('No active campaigns yet')).toBeVisible()
    await expect(brandPage.getByRole('button', { name: /create campaign/i })).toBeVisible()
  })

  test('clicking campaign card navigates to detail', async ({ brandPage }) => {
    await brandPage.getByText('Summer Promo').click()
    await expect(brandPage).toHaveURL(/\/campaigns\/\d+/)
    await expect(brandPage.getByText('Campaign Brief')).toBeVisible()
  })
})
```

### Example: Auth Flow

```typescript
// e2e/specs/auth.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Auth', () => {
  test('unauthenticated user sees login button', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('button', { name: 'Login' })).toBeVisible()
  })

  test('clicking login opens provider dropdown', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Login' }).click()
    await expect(page.getByText('Login with Google')).toBeVisible()
  })

  test('logout redirects to home and clears session', async ({ brandPage }) => {
    await brandPage.getByTestId('user-identity').click()
    await brandPage.getByText('Logout').click()
    await expect(brandPage.getByRole('button', { name: 'Login' })).toBeVisible()
  })
})
```

### Example: Navigation

```typescript
// e2e/specs/navigation.spec.ts
import { test, expect } from '../fixtures/auth.fixture'

test.describe('Navigation', () => {
  test('discover nav link works for brand', async ({ brandPage }) => {
    await brandPage.goto('/')
    await brandPage.getByRole('link', { name: 'Discover' }).click()
    await expect(brandPage).toHaveURL('/discover')
  })

  test('active nav link is highlighted', async ({ brandPage }) => {
    await brandPage.goto('/discover')
    const discoverLink = brandPage.getByRole('link', { name: 'Discover' })
    await expect(discoverLink).toHaveClass(/active/)
  })
})
```

## Test Data Management

### Database Cleanup

Before running the E2E suite, ensure a clean database state. Options:

1. **Backend seed script** (preferred): Use the backend's `prisma/seed.ts` or create an E2E-specific seed endpoint.
2. **API cleanup**: Call backend APIs in `test.beforeAll` to reset state.
3. **Docker reset**: Stop and recreate the Postgres container before the test run.

### Isolated Users

Use unique email addresses per test run to avoid conflicts:

```typescript
const timestamp = Date.now()
const email = `e2e-brand-${timestamp}@flow.test`
```

## Running Tests

### Local Development

Start both backend and frontend, then run tests:

```bash
# Terminal 1: Backend
yarn dev   # or yarn start in backend/

# Terminal 2: Frontend
yarn dev   # in frontend/

# Terminal 3: Tests
yarn test:e2e
```

### Using webapp-testing Skill Helpers

For quick ad-hoc automation without installing `@playwright/test`, use the `webapp-testing` skill:

```bash
python scripts/with_server.py \
  --server "cd backend && yarn dev" --port 3000 \
  --server "cd frontend && yarn dev" --port 3001 \
  -- python your_automation.py
```

This is useful for one-off debugging or CI scripts where you don't need the full test framework.

### CI Configuration

```yaml
# .github/workflows/e2e.yml (example)
- name: Install dependencies
  run: yarn install

- name: Install Playwright browsers
  run: npx playwright install --with-deps chromium

- name: Start backend
  run: yarn dev &
  working-directory: backend

- name: Run E2E tests
  run: yarn test:e2e
  working-directory: frontend

- name: Upload report
  uses: actions/upload-artifact@v4
  with:
    name: playwright-report
    path: frontend/playwright-report/
```

## Quality Gates

Before merging E2E test changes:

1. Run `yarn lint` in the frontend.
2. Run `yarn build` to ensure the app compiles.
3. Run `yarn test:e2e` against a local backend.
4. Review failing tests for flakiness (add retries or waits, not timeouts).

## Common Pitfalls

- **OAuth automation**: Do not try to fill Google login forms. Use API seeding + localStorage injection.
- **Race conditions**: Always wait for network idle or specific elements, not arbitrary timeouts.
  ```typescript
  await page.waitForLoadState('networkidle')
  await expect(page.getByText('Loaded')).toBeVisible()
  ```
- **Hardcoded URLs**: Use `baseURL` from playwright.config.ts and relative paths in tests.
- **Shared state**: Each test should create its own user or use deterministic fixtures. Do not rely on state from previous tests.
- **Missing translations**: If a test fails because text is not found, check `messages/*.json` — the key may be missing in a non-default locale.

## References

- `docs/testcases/` — Test specification source of truth
- `webapp-testing` skill — Python Playwright helpers for ad-hoc automation
- `frontend-dev` skill — Frontend coding standards and project structure
