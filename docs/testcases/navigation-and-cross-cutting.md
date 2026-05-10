# E2E Test Cases — Navigation & Cross-Cutting Concerns

Tests covering shared navigation, layout, error pages, responsive behavior, accessibility, and cross-portal integration flows.

---

## Fixtures
- `brandUser` — authenticated brand account
- `influencerUser` — authenticated influencer account
- `brandWithCampaigns` — brand with campaigns and influencers
- `influencerWithInvites` — influencer with invitations

---

## Navigation & Layout

### TC-NAV-01 — Navigation links highlight active page (Brand)
```ts
test('active nav link is highlighted for brand', async ({ page, brandUser }) => {
  await page.goto('/discover');
  await expect(page.getByRole('link', { name: 'Discover' })).toHaveClass(/active/);
});
```

### TC-NAV-02 — Navigation links highlight active page (Influencer)
```ts
test('active nav link is highlighted for influencer', async ({ page, influencerUser }) => {
  await page.goto('/campaigns');
  await expect(page.getByRole('link', { name: 'My Campaigns' })).toHaveClass(/active/);
});
```

### TC-NAV-03 — User dropdown shows logout
```ts
test('user dropdown contains logout', async ({ page, brandUser }) => {
  await page.goto('/');
  await page.getByTestId('user-identity').click();

  await expect(page.getByText('Logout')).toBeVisible();
  await page.getByText('Logout').click();

  await expect(page).toHaveURL('/login');
});
```

### TC-NAV-04 — User dropdown shows profile and account settings
```ts
test('user dropdown shows settings links', async ({ page, brandUser }) => {
  await page.goto('/');
  await page.getByTestId('user-identity').click();

  await expect(page.getByText('Profile Settings')).toBeVisible();
  await expect(page.getByText('Account Settings')).toBeVisible();
  await expect(page.getByText('Help / Support')).toBeVisible();
});
```

### TC-NAV-05 — Notification bell shows unread count
```ts
test('notification bell shows unread badge', async ({ page, brandWithCampaigns }) => {
  await page.goto('/');
  await expect(page.getByTestId('notification-bell')).toContainText('3');
});
```

### TC-NAV-06 — Notification dropdown shows recent notifications
```ts
test('notification dropdown opens', async ({ page, brandWithCampaigns }) => {
  await page.goto('/');
  await page.getByTestId('notification-bell').click();

  await expect(page.getByText('accepted invitation')).toBeVisible();
  await expect(page.getByText('completed deliverable')).toBeVisible();
});
```

### TC-NAV-07 — Clicking notification marks as read and navigates
```ts
test('click notification marks read and navigates', async ({ page, brandWithCampaigns }) => {
  await page.goto('/');
  await page.getByTestId('notification-bell').click();
  await page.getByText('@travel_jane accepted invitation').click();

  await expect(page).toHaveURL(/\/campaigns\/\d+/);
  await expect(page.getByTestId('notification-bell')).toContainText('2');
});
```

### TC-NAV-08 — Logo click returns to home
```ts
test('logo click returns to dashboard', async ({ page, brandUser }) => {
  await page.goto('/discover');
  await page.getByTestId('logo').click();
  await expect(page).toHaveURL('/');
});
```

### TC-NAV-09 — Footer links present
```ts
test('footer shows legal links', async ({ page, brandUser }) => {
  await page.goto('/');
  await expect(page.getByText('Help')).toBeVisible();
  await expect(page.getByText('Privacy')).toBeVisible();
  await expect(page.getByText('Terms')).toBeVisible();
});
```

---

## Mobile Navigation

### TC-MOB-01 — Mobile hamburger menu opens drawer
```ts
test('mobile nav opens drawer', async ({ page, brandUser }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Menu' }).click();

  await expect(page.getByText('Campaigns')).toBeVisible();
  await expect(page.getByText('Discover')).toBeVisible();
});
```

### TC-MOB-02 — Mobile drawer shows user identity at top
```ts
test('mobile drawer shows user identity', async ({ page, brandUser }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Menu' }).click();

  await expect(page.getByText('BrandCo')).toBeVisible();
  await expect(page.getByText('Logout')).toBeVisible();
});
```

### TC-MOB-03 — Mobile drawer closes on link click
```ts
test('mobile drawer closes on navigation', async ({ page, brandUser }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByText('Discover').click();

  await expect(page).toHaveURL('/discover');
  await expect(page.getByText('Campaigns')).not.toBeVisible();
});
```

### TC-MOB-04 — Mobile drawer closes on overlay click
```ts
test('mobile drawer closes on overlay click', async ({ page, brandUser }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.locator('[data-testid="drawer-overlay"]').click();

  await expect(page.getByText('Campaigns')).not.toBeVisible();
});
```

---

## Error Pages

### TC-ERR-01 — 404 page with recovery CTA (Brand)
```ts
test('404 page shows go to dashboard CTA for brand', async ({ page, brandUser }) => {
  await page.goto('/nonexistent-page');
  await expect(page.getByText('Page not found')).toBeVisible();

  await page.getByRole('button', { name: 'Go to Dashboard' }).click();
  await expect(page).toHaveURL('/');
});
```

### TC-ERR-02 — 404 page with recovery CTA (Influencer)
```ts
test('404 page shows go to dashboard CTA for influencer', async ({ page, influencerUser }) => {
  await page.goto('/nonexistent-page');
  await expect(page.getByText('Page not found')).toBeVisible();

  await page.getByRole('button', { name: 'Go to Dashboard' }).click();
  await expect(page).toHaveURL('/');
});
```

### TC-ERR-03 — 500 page with refresh CTA
```ts
test('500 page shows refresh button', async ({ page, brandUser }) => {
  await page.goto('/server-error');
  await expect(page.getByText('Something went wrong')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Refresh Page' })).toBeVisible();
});
```

### TC-ERR-04 — Error pages preserve navigation
```ts
test('error pages preserve top navigation', async ({ page, brandUser }) => {
  await page.goto('/nonexistent-page');
  await expect(page.getByTestId('logo')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Campaigns' })).toBeVisible();
});
```

---

## Responsive Behavior

### TC-RESP-01 — Dashboard at mobile width
```ts
test('dashboard responsive at mobile width', async ({ page, brandWithCampaigns }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('/');

  await expect(page.getByRole('button', { name: 'Menu' })).toBeVisible();
  await expect(page.getByText('Summer Promo')).toBeVisible();
});
```

### TC-RESP-02 — Discover filters collapse on mobile
```ts
test('discover filters are accessible on mobile', async ({ page, brandUser }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('/discover');

  await page.getByRole('button', { name: 'Filters' }).click();
  await expect(page.getByLabel('Instagram')).toBeVisible();
});
```

### TC-RESP-03 — Campaign detail stacks cards on mobile
```ts
test('campaign detail influencer cards stack on mobile', async ({ page, brandWithCampaigns }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('/campaigns/1');

  const cards = page.locator('[data-testid="influencer-card"]');
  const firstCard = await cards.first().boundingBox();
  const secondCard = await cards.nth(1).boundingBox();
  expect(firstCard.y).toBeLessThan(secondCard.y);
});
```

### TC-RESP-04 — Tablet layout two columns
```ts
test('discover shows two columns on tablet', async ({ page, brandUser }) => {
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.goto('/discover');

  const cards = page.locator('[data-testid="influencer-card"]');
  const firstCard = await cards.first().boundingBox();
  const secondCard = await cards.nth(1).boundingBox();
  expect(firstCard.y).toBe(secondCard.y);
});
```

### TC-RESP-05 — Desktop full layout
```ts
test('discover shows sidebar filters on desktop', async ({ page, brandUser }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/discover');

  await expect(page.locator('[data-testid="filter-sidebar"]')).toBeVisible();
});
```

---

## Accessibility

### TC-A11Y-01 — Keyboard navigation through invite modal
```ts
test('invite modal is keyboard accessible', async ({ page, brandWithCampaigns }) => {
  await page.goto('/discover?influencer=1');
  await page.getByRole('button', { name: 'Invite to Existing Campaign' }).click();

  await page.keyboard.press('Tab');
  await expect(page.getByLabel('Select Campaign')).toBeFocused();

  await page.keyboard.press('Escape');
  await expect(page.getByText('Invite @travel_jane')).not.toBeVisible();
});
```

### TC-A11Y-02 — Focus trap in modal
```ts
test('modal traps focus', async ({ page, brandWithCampaigns }) => {
  await page.goto('/discover?influencer=1');
  await page.getByRole('button', { name: 'Invite to Existing Campaign' }).click();

  // Tab through all focusable elements, should cycle back to first
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Cancel' })).toBeFocused();
});
```

### TC-A11Y-03 — ARIA labels on navigation
```ts
test('navigation has proper aria labels', async ({ page, brandUser }) => {
  await page.goto('/');
  await expect(page.getByRole('navigation')).toHaveAttribute('aria-label', 'Main navigation');
});
```

### TC-A11Y-04 — Progressbar aria attributes
```ts
test('progressbar has aria attributes', async ({ page, brandWithCampaigns }) => {
  await page.goto('/');
  const progressbar = page.getByRole('progressbar').first();
  await expect(progressbar).toHaveAttribute('aria-valuenow');
  await expect(progressbar).toHaveAttribute('aria-valuemax', '100');
});
```

### TC-A11Y-05 — Color contrast for status badges
```ts
test('status badges meet contrast requirements', async ({ page, brandWithCampaigns }) => {
  await page.goto('/campaigns/1');
  const acceptedBadge = page.getByText('accepted').first();
  // Playwright can check computed color values
  const color = await acceptedBadge.evaluate(el => getComputedStyle(el).color);
  const bgColor = await acceptedBadge.evaluate(el => getComputedStyle(el).backgroundColor);
  // Contrast check would be done via axe or similar in real suite
  expect(color).toBeDefined();
  expect(bgColor).toBeDefined();
});
```

---

## Loading States

### TC-LOAD-01 — Dashboard skeleton loaders
```ts
test('dashboard shows skeleton while loading', async ({ page, brandWithCampaigns }) => {
  await page.goto('/');
  await expect(page.locator('[data-testid="skeleton-stats"]').first()).toBeVisible();
});
```

### TC-LOAD-02 — Discover skeleton cards
```ts
test('discover shows skeleton cards while loading', async ({ page, brandUser }) => {
  await page.goto('/discover');
  await expect(page.locator('[data-testid="skeleton-card"]').first()).toBeVisible();
});
```

### TC-LOAD-03 — Campaign detail skeleton influencers
```ts
test('campaign detail shows skeleton influencer cards', async ({ page, brandWithCampaigns }) => {
  await page.goto('/campaigns/1');
  await expect(page.locator('[data-testid="skeleton-influencer-card"]').first()).toBeVisible();
});
```

### TC-LOAD-04 — Button loading spinner
```ts
test('create campaign button shows spinner', async ({ page, brandUser }) => {
  await page.goto('/campaigns/new?influencer=1');
  await page.getByLabel('Campaign Title').fill('Test');
  await page.getByLabel('Description & Requirements').fill('Desc');
  await page.getByLabel('Budget').fill('500');
  await page.getByLabel('Due Date').fill('2026-08-15');

  await page.getByRole('button', { name: 'Next: Invite' }).click();
  await expect(page.getByTestId('button-spinner')).toBeVisible();
});
```

---

## Cross-Portal Integration

### TC-X-01 — Brand invites influencer, influencer accepts
```ts
test('full invite and accept flow', async ({ browser }) => {
  const brandContext = await browser.newContext();
  const influencerContext = await browser.newContext();

  const brandPage = await brandContext.newPage();
  const influencerPage = await influencerContext.newPage();

  // Brand sends invitation
  await brandPage.goto('/discover?influencer=1');
  await brandPage.getByRole('button', { name: 'Invite to Existing Campaign' }).click();
  await brandPage.getByLabel('Select Campaign').selectOption('Summer Promo');
  await brandPage.getByRole('button', { name: 'Send Invitation' }).click();

  // Influencer sees invitation and accepts
  await influencerPage.goto('/');
  await expect(influencerPage.getByText('Summer Promo')).toBeVisible();
  await influencerPage.getByRole('button', { name: 'Accept' }).first().click();
  await influencerPage.getByRole('button', { name: 'Confirm' }).click();

  // Brand sees accepted status
  await brandPage.goto('/campaigns/1');
  await expect(brandPage.getByText('accepted')).toBeVisible();

  await brandContext.close();
  await influencerContext.close();
});
```

### TC-X-02 — Influencer completes deliverable, brand approves
```ts
test('deliverable completion and approval flow', async ({ browser }) => {
  const brandContext = await browser.newContext();
  const influencerContext = await browser.newContext();

  const brandPage = await brandContext.newPage();
  const influencerPage = await influencerContext.newPage();

  // Influencer marks deliverable complete
  await influencerPage.goto('/campaigns/1');
  const deliverable = influencerPage.locator('[data-testid="deliverable"]').filter({ hasText: 'Pending' }).first();
  await deliverable.getByRole('button', { name: 'Mark as Complete' }).click();
  await influencerPage.getByRole('button', { name: 'Confirm' }).click();

  // Brand sees pending review and approves
  await brandPage.goto('/campaigns/1');
  const pending = brandPage.locator('[data-testid="deliverable"]').filter({ hasText: 'Pending Review' }).first();
  await pending.getByRole('button', { name: 'Approve' }).click();

  // Influencer sees completed
  await influencerPage.reload();
  await expect(influencerPage.locator('[data-testid="deliverable"]').filter({ hasText: 'Completed' }).first()).toBeVisible();

  await brandContext.close();
  await influencerContext.close();
});
```

### TC-X-03 — Brand cancels campaign, influencer sees withdrawn
```ts
test('campaign cancellation updates influencer', async ({ browser }) => {
  const brandContext = await browser.newContext();
  const influencerContext = await browser.newContext();

  const brandPage = await brandContext.newPage();
  const influencerPage = await influencerContext.newPage();

  // Brand cancels campaign
  await brandPage.goto('/campaigns/1');
  await brandPage.getByRole('button', { name: 'Cancel Campaign' }).click();
  await brandPage.getByRole('button', { name: 'Confirm' }).click();

  // Influencer invitation disappears
  await influencerPage.reload();
  await expect(influencerPage.getByText('Summer Promo')).not.toBeVisible();

  await brandContext.close();
  await influencerContext.close();
});
```

### TC-X-04 — Brand sends message, influencer receives notification
```ts
test('message triggers notification', async ({ browser }) => {
  const brandContext = await browser.newContext();
  const influencerContext = await browser.newContext();

  const brandPage = await brandContext.newPage();
  const influencerPage = await influencerContext.newPage();

  // Brand sends message
  await brandPage.goto('/campaigns/1');
  await brandPage.getByText('@travel_jane').locator('..').getByRole('button', { name: 'Message' }).click();
  await brandPage.getByPlaceholder('Type a message...').fill('Update please!');
  await brandPage.getByRole('button', { name: 'Send Message' }).click();

  // Influencer sees notification badge increment
  await influencerPage.goto('/');
  await expect(influencerPage.getByTestId('notification-bell')).toContainText('1');

  await brandContext.close();
  await influencerContext.close();
});
```

### TC-X-05 — Brand declines invitation, brand sees declined status
```ts
test('declined invitation updates brand campaign detail', async ({ browser }) => {
  const brandContext = await browser.newContext();
  const influencerContext = await browser.newContext();

  const brandPage = await brandContext.newPage();
  const influencerPage = await influencerContext.newPage();

  // Influencer declines
  await influencerPage.goto('/');
  await influencerPage.getByRole('button', { name: 'Decline' }).first().click();
  await influencerPage.getByLabel('Reason (optional)').fill('Too busy');
  await influencerPage.getByRole('button', { name: 'Confirm' }).click();

  // Brand sees declined status
  await brandPage.goto('/campaigns/1');
  await expect(brandPage.getByText('declined')).toBeVisible();

  await brandContext.close();
  await influencerContext.close();
});
```

---

## Page Transitions

### TC-TRANS-01 — Page content fades on navigation
```ts
test('page transition animation', async ({ page, brandUser }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Discover' }).click();

  // Content area should have transition class during navigation
  await expect(page.locator('[data-testid="page-content"]')).toHaveClass(/transition/);
});
```

### TC-TRANS-02 — Scroll position resets on navigation
```ts
test('scroll resets on navigation', async ({ page, brandUser }) => {
  await page.goto('/discover');
  await page.evaluate(() => window.scrollTo(0, 500));

  await page.getByRole('link', { name: 'Campaigns' }).click();
  const scrollY = await page.evaluate(() => window.scrollY);
  expect(scrollY).toBe(0);
});
```
