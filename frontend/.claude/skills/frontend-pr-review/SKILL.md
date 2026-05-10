# Frontend PR Review

Request, conduct, and act on code reviews for the Next.js frontend. Ensures technical correctness, convention compliance, and catch regressions before merge.

## When to use

Use this skill when:
- You have completed a frontend feature, fix, or refactor and need review before merge.
- You are reviewing someone else's frontend PR.
- You need a structured checklist for frontend quality gates.
- Acting on review feedback from a human or subagent reviewer.

## When to request review

**Mandatory:**
- After completing any feature, fix, or refactor that touches `app/`, `components/`, `lib/`, or `messages/`.
- Before merging to `main`.
- After resolving merge conflicts on frontend files.

**Optional but valuable:**
- Before starting a dependent task (catch issues early).
- When touching auth, routing, or i18n (high blast radius).

## How to request review

### 1. Prepare the branch

```bash
git add -A
git diff --cached --stat   # Review what you're about to commit
git commit -m "feat(frontend): descriptive message"
```

### 2. Self-review first

Run the quality gates locally **before** asking anyone else:

```bash
yarn lint
yarn build
```

Fix all errors. Do not submit a PR with lint or build failures.

### 3. Get git SHAs

```bash
BASE_SHA=$(git merge-base HEAD origin/main)  # or HEAD~1 for single-commit PRs
HEAD_SHA=$(git rev-parse HEAD)
```

### 4. Dispatch code reviewer subagent

Use the `requesting-code-review` skill workflow. Provide:
- **Description**: What the PR does (e.g., "Add influencer profile edit page with form validation").
- **Requirements**: Link to task/plan or acceptance criteria.
- **BASE_SHA** and **HEAD_SHA**: Commit range for the reviewer to inspect.

### 5. Act on feedback

| Severity | Action |
|----------|--------|
| Critical (breaks, security, data loss) | Fix immediately. Do not merge without fix. |
| Important (performance, a11y, correctness) | Fix before merge. |
| Minor (style, naming, nits) | Fix if trivial; defer if out of scope. |

If you disagree with feedback, push back with technical reasoning. Do not blindly implement.

## Review Checklist (Reviewer)

Use this checklist when reviewing frontend PRs or doing self-review.

### Architecture & Next.js

- [ ] **Route correctness**: Path segments match App Router conventions. No conflicting parallel routes.
- [ ] **Server vs Client Components**: `use client` is only added when state, effects, or browser APIs are used. Default to Server Components.
- [ ] **Dynamic routes**: `[id]/page.tsx` params are properly typed and used.
- [ ] **Metadata**: Pages export `generateMetadata()` using `getTranslations()` where applicable.
- [ ] **Navigation**: Internal links use `next/link` with correct paths. No hardcoded URLs that break when route structure changes.

### TypeScript

- [ ] **Strict mode**: No `any`, no `@ts-ignore`, no disabling strict rules.
- [ ] **Explicit return types**: Exported functions in `lib/` have explicit return types.
- [ ] **Path aliases**: All internal imports use `@/`. No relative paths like `../../`.
- [ ] **Interface naming**: PascalCase, descriptive, no unused interfaces.

### Components

- [ ] **Props typing**: Component props are typed with interfaces; avoid inline object types.
- [ ] **Key prop**: Lists use stable `key` values (not array index unless static).
- [ ] **Accessibility**: Buttons have `type="button"` when not submitting forms. Images have `alt` text. Interactive elements have focus states.
- [ ] **Conditional rendering**: Loading, error, and empty states are all handled.

### Styling

- [ ] **Tailwind usage**: Layout and spacing use Tailwind utilities.
- [ ] **Design system**: Colors and tokens reference CSS variables (`var(--c-*)`) instead of arbitrary hex values where a token exists.
- [ ] **Responsive**: Mobile-first breakpoints (`sm:`, `md:`, `lg:`) are used appropriately.
- [ ] **No inline styles**: Except for dynamic values not covered by the design system.

### Internationalization (i18n)

- [ ] **No hardcoded strings**: All user-facing text goes through `next-intl` (`useTranslations` or `getTranslations`).
- [ ] **Translation keys**: Added to all three locale files (`zh.json`, `en.json`, `ja.json`).
- [ ] **Key naming**: Hierarchical and descriptive (e.g., `Campaign.createTitle`, not `title1`).

### Data Fetching & API

- [ ] **URL construction**: API calls use `getApiUrl()` from `lib/config.ts`.
- [ ] **Auth headers**: Authenticated requests use `apiFetch()` which injects the Bearer token automatically.
- [ ] **Error handling**: API errors are caught and surfaced to the UI. No silent failures.
- [ ] **Loading states**: Queries show loading spinners or skeletons; mutations show pending states on buttons.
- [ ] **Cache keys**: React Query `queryKey` values are consistent and invalidated correctly on mutations.

### Auth

- [ ] **No direct localStorage**: Token access goes through `lib/auth.tsx` helpers.
- [ ] **useAuth hook**: Components use `useAuth()` for auth state, not manual checks.
- [ ] **Role guards**: Brand/influencer routes check roles appropriately.

### Images

- [ ] **next/image**: Used for all images with explicit `width` and `height`.
- [ ] **Quality**: Default `quality={75}` unless specified otherwise.

### Environment Variables

- [ ] **NEXT_PUBLIC prefix**: Only `NEXT_PUBLIC_*` vars are used in client code.
- [ ] **Build-time assumption**: No runtime env var changes expected after Docker build.

### Performance

- [ ] **Font loading**: Fonts use `next/font/google` with `display: 'swap'`.
- [ ] **Script loading**: Third-party scripts (e.g., Umami) use appropriate `strategy` (`afterInteractive`, `lazyOnload`).

## Common Issues from Project History

Based on past PRs in this repo, watch for these specific pitfalls:

### Route Group Conflicts
Next.js App Router route groups like `(brand)` and `(influencer)` can cause parallel page conflicts when child routes share the same URL path. If adding route groups, verify no conflicting `page.tsx` files exist at the same effective path.

**Red flag**: Two different layout groups both defining `/campaigns/[id]/page.tsx`.

### Hardcoded Paths in Multiple Places
When routes change, internal links must be updated everywhere. A PR that restructures routes but only updates `page.tsx` files while leaving `Link href` values in other components is incomplete.

**Red flag**: `router.push('/dashboard')` or `<Link href="/discover">` after route prefix changes.

### Missing i18n Coverage
New UI text added without corresponding entries in `messages/zh.json`, `messages/en.json`, and `messages/ja.json`.

**Red flag**: Hardcoded strings in JSX or missing translation keys in non-default locales.

### Incorrect Client/Server Boundary
Adding `'use client'` at the top of a file that only renders static content and accepts no interactivity. Or, using `useState`/`useEffect` in a Server Component without the directive.

**Red flag**: `'use client'` on a component with no hooks or event handlers.

### TypeScript `any` or Missing Types
Using `any` to bypass strict mode, or forgetting to type API response data.

**Red flag**: `data: any`, implicit `any` in function parameters, or untyped `useQuery` results.

### Auth State Leaks
Accessing `localStorage` directly for tokens instead of using `lib/auth.tsx` helpers.

**Red flag**: `localStorage.getItem('access_token')` outside `lib/auth.tsx`.

## Reviewing External PRs

If you are reviewing a PR from another contributor:

1. **Check out the branch** locally and run:
   ```bash
   yarn install
   yarn lint
   yarn build
   ```
2. **Start the dev server** and verify the feature works in the browser (golden path + edge cases).
3. **Check for regressions** in related features (e.g., changing a shared component may affect multiple pages).
4. **Verify i18n**: If the PR adds text, confirm all three locale files are updated.
5. **Check responsive behavior**: Resize the browser to mobile width and verify layouts don't break.

## Acting on Review Feedback

When you receive feedback, follow the `receiving-code-review` skill principles:

1. **Read all feedback** before reacting.
2. **Restate** unclear items in your own words and ask for clarification if needed.
3. **Verify** against the codebase. Do not assume the reviewer has full context.
4. **Implement** one item at a time, testing each fix.
5. **No performative agreement**. State what you changed factually:
   - ✅ "Fixed. Replaced hardcoded path with `/brand/dashboard`."
   - ✅ "Good catch — added missing `messages/ja.json` keys."
   - ❌ "You're absolutely right!" / "Thanks for catching that!"

## Quality Gates (Before Merge)

A frontend PR is **not ready to merge** until:

- [ ] `yarn lint` passes with zero errors.
- [ ] `yarn build` completes successfully (TypeScript strict check included).
- [ ] All new user-facing strings are internationalized.
- [ ] Internal links are updated if routes changed.
- [ ] Loading, error, and empty states are implemented for new data fetching.
- [ ] Review feedback is addressed or explicitly deferred with reasoning.
- [ ] No `console.log` or debug code left in production paths.

## References

- `frontend-dev` skill — Coding standards and project structure
- `requesting-code-review` skill — How to dispatch a reviewer subagent
- `receiving-code-review` skill — How to act on feedback without performative agreement
- `docs/testcases/` — E2E test specifications (use to verify feature completeness)
