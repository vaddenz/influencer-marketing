# E2E Test Cases — Influencer Portal

Tests covering all influencer-facing features: invitations, campaign view, and profile management.

---

## Fixtures
- `influencerUser` — authenticated influencer account with completed onboarding
- `influencerWithInvites` — influencer with pending and accepted invitations
- `emptyInfluencer` — influencer with zero invitations

---

## Influencer — Invitations

### TC-II-01 — Invitations page loads with sections
```ts
test('invitations page shows new, accepted, declined sections', async ({ page, influencerWithInvites }) => {
  await page.goto('/');
  await expect(page.getByText('New Invitations')).toBeVisible();
  await expect(page.getByText('Accepted')).toBeVisible();
  await expect(page.getByText('Declined')).toBeVisible();
});
```

### TC-II-02 — View full brief opens modal
```ts
test('view full brief opens modal', async ({ page, influencerWithInvites }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'View Full Brief' }).first().click();

  await expect(page.getByText('Full Brief')).toBeVisible();
  await expect(page.getByText('Deliverables')).toBeVisible();
});
```

### TC-II-03 — Accept invitation with confirmation
```ts
test('accept invitation redirects to campaign view', async ({ page, influencerWithInvites }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Accept' }).first().click();

  await expect(page.getByText('Accept this campaign?')).toBeVisible();
  await page.getByRole('button', { name: 'Confirm' }).click();

  await expect(page).toHaveURL(/\/campaigns\/\d+/);
});
```

### TC-II-04 — Decline invitation with optional reason
```ts
test('decline invitation with reason', async ({ page, influencerWithInvites }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Decline' }).first().click();

  await expect(page.getByText('Why are you declining?')).toBeVisible();
  await page.getByLabel('Reason (optional)').fill('Too busy this month');
  await page.getByRole('button', { name: 'Confirm' }).click();

  await expect(page.getByText('Declined on')).toBeVisible();
});
```

### TC-II-05 — Empty state for new influencer
```ts
test('empty invitations shows profile CTA', async ({ page, emptyInfluencer }) => {
  await page.goto('/');
  await expect(page.getByText('No invitations yet')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Go to Profile' })).toBeVisible();
});
```

### TC-II-06 — View accepted campaign navigates to campaign view
```ts
test('view accepted campaign navigates to campaign', async ({ page, influencerWithInvites }) => {
  await page.goto('/');
  await page.getByText('Accepted').locator('..').getByRole('button', { name: 'View Campaign' }).click();
  await expect(page).toHaveURL(/\/campaigns\/\d+/);
});
```

### TC-II-07 — Invitation card shows all key info
```ts
test('invitation card displays campaign info', async ({ page, influencerWithInvites }) => {
  await page.goto('/');
  const card = page.locator('[data-testid="invitation-card"]').first();

  await expect(card).toContainText('Summer Promo');
  await expect(card).toContainText('From: BrandCo');
  await expect(card).toContainText('Budget: $500');
  await expect(card).toContainText('Deliverables:');
});
```

### TC-II-08 — Sections are collapsible accordions
```ts
test('invitation sections are collapsible', async ({ page, influencerWithInvites }) => {
  await page.goto('/');
  await page.getByText('Accepted').click();
  await expect(page.getByText('View Campaign').first()).not.toBeVisible();

  await page.getByText('Accepted').click();
  await expect(page.getByText('View Campaign').first()).toBeVisible();
});
```

### TC-II-09 — Expired invitation badge
```ts
test('expired invitation shows expired badge', async ({ page, influencerWithInvites }) => {
  await page.goto('/');
  const expiredCard = page.locator('[data-testid="invitation-card"]').filter({ hasText: 'Expired' });
  await expect(expiredCard).toBeVisible();
  await expect(expiredCard.getByRole('button', { name: 'Accept' })).toBeDisabled();
});
```

---

## Influencer — Campaign View

### TC-ICV-01 — Campaign view shows brief and deliverables
```ts
test('campaign view loads with deliverables', async ({ page, influencerWithInvites }) => {
  await page.goto('/campaigns/1');
  await expect(page.getByText('Summer Promo')).toBeVisible();
  await expect(page.getByText('Campaign Brief')).toBeVisible();
  await expect(page.getByText('Deliverables')).toBeVisible();
});
```

### TC-ICV-02 — Mark deliverable complete with confirmation
```ts
test('mark deliverable complete with confirmation', async ({ page, influencerWithInvites }) => {
  await page.goto('/campaigns/1');
  const deliverable = page.locator('[data-testid="deliverable"]').filter({ hasText: 'Pending' }).first();
  await deliverable.getByRole('button', { name: 'Mark as Complete' }).click();

  await expect(page.getByText('Mark this deliverable as complete?')).toBeVisible();
  await page.getByRole('button', { name: 'Confirm' }).click();

  await expect(deliverable).toContainText('Pending Review');
});
```

### TC-ICV-03 — Mark complete with notes
```ts
test('mark complete with notes', async ({ page, influencerWithInvites }) => {
  await page.goto('/campaigns/1');
  const deliverable = page.locator('[data-testid="deliverable"]').filter({ hasText: 'Pending' }).first();
  await deliverable.getByLabel('Notes').fill('Link to draft: https://example.com/draft');
  await deliverable.getByRole('button', { name: 'Mark as Complete' }).click();
  await page.getByRole('button', { name: 'Confirm' }).click();

  await expect(deliverable).toContainText('Link to draft');
});
```

### TC-ICV-04 — Progress bar updates
```ts
test('progress bar reflects deliverable completion', async ({ page, influencerWithInvites }) => {
  await page.goto('/campaigns/1');
  await expect(page.getByText('1 of 2 deliverables complete')).toBeVisible();
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '50');
});
```

### TC-ICV-05 — Message brand opens messaging modal
```ts
test('message brand opens modal', async ({ page, influencerWithInvites }) => {
  await page.goto('/campaigns/1');
  await page.getByRole('button', { name: 'Message BrandCo' }).click();

  await expect(page.getByText('Message BrandCo')).toBeVisible();
});
```

### TC-ICV-06 — View submitted content
```ts
test('view submitted content shows notes modal', async ({ page, influencerWithInvites }) => {
  await page.goto('/campaigns/1');
  const completed = page.locator('[data-testid="deliverable"]').filter({ hasText: 'Completed' }).first();
  await completed.getByRole('button', { name: 'View Submitted Content' }).click();

  await expect(page.getByText('Submitted Content')).toBeVisible();
});
```

### TC-ICV-07 — Rejected deliverable returns to pending with note
```ts
test('rejected deliverable shows rejection note', async ({ page, influencerWithInvites }) => {
  await page.goto('/campaigns/1');
  const rejected = page.locator('[data-testid="deliverable"]').filter({ hasText: 'Pending' }).first();
  await expect(rejected).toContainText('Rejection note:');
});
```

### TC-ICV-08 — Campaign header shows brand info and budget
```ts
test('campaign header shows brand and budget', async ({ page, influencerWithInvites }) => {
  await page.goto('/campaigns/1');
  await expect(page.getByText('From: BrandCo')).toBeVisible();
  await expect(page.getByText('Budget: $500')).toBeVisible();
  await expect(page.getByText('Due: Aug 15')).toBeVisible();
});
```

### TC-ICV-09 — Requirements list rendered
```ts
test('campaign requirements list displayed', async ({ page, influencerWithInvites }) => {
  await page.goto('/campaigns/1');
  await expect(page.getByText('Requirements:')).toBeVisible();
  await expect(page.getByText('Tag @brandco in all posts')).toBeVisible();
});
```

---

## Influencer — Profile

### TC-IP-01 — Profile view mode displays all fields
```ts
test('profile view mode shows public info', async ({ page, influencerUser }) => {
  await page.goto('/profile');
  await expect(page.getByText('@travel_jane')).toBeVisible();
  await expect(page.getByText('Travel & Lifestyle')).toBeVisible();
  await expect(page.getByText('Bio')).toBeVisible();
  await expect(page.getByText('Campaign History')).toBeVisible();
});
```

### TC-IP-02 — Edit profile and save
```ts
test('edit profile updates fields', async ({ page, influencerUser }) => {
  await page.goto('/profile');
  await page.getByRole('button', { name: 'Edit' }).click();

  await page.getByLabel('Display Name').fill('@travel_jane_updated');
  await page.getByLabel('Bio').fill('Updated bio text');
  await page.getByRole('button', { name: 'Save Changes' }).click();

  await expect(page.getByText('@travel_jane_updated')).toBeVisible();
  await expect(page.getByText('Updated bio text')).toBeVisible();
});
```

### TC-IP-03 — Cancel edit with discard confirmation
```ts
test('cancel edit with unsaved changes shows confirmation', async ({ page, influencerUser }) => {
  await page.goto('/profile');
  await page.getByRole('button', { name: 'Edit' }).click();
  await page.getByLabel('Display Name').fill('Changed');
  await page.getByRole('button', { name: 'Cancel' }).click();

  await expect(page.getByText('Discard unsaved changes?')).toBeVisible();
  await page.getByRole('button', { name: 'Discard' }).click();

  await expect(page.getByLabel('Display Name')).not.toBeVisible();
});
```

### TC-IP-04 — Add and remove niche category tags
```ts
test('add and remove niche category tags', async ({ page, influencerUser }) => {
  await page.goto('/profile');
  await page.getByRole('button', { name: 'Edit' }).click();

  await page.getByRole('button', { name: '+ Add' }).first().click();
  await page.getByPlaceholder('Add category').fill('Photography');
  await page.keyboard.press('Enter');
  await expect(page.getByText('Photography')).toBeVisible();

  await page.getByText('Photography').getByRole('button', { name: 'Remove' }).click();
  await expect(page.getByText('Photography')).not.toBeVisible();
});
```

### TC-IP-05 — Preview public profile
```ts
test('preview public profile toggle', async ({ page, influencerUser }) => {
  await page.goto('/profile');
  await page.getByRole('button', { name: 'Preview Public Profile' }).click();

  await expect(page.getByText('Email')).not.toBeVisible(); // private field hidden
  await expect(page.getByText('@travel_jane')).toBeVisible();
});
```

### TC-IP-06 — Scope auto-calculates from follower count
```ts
test('scope auto-calculates from followers', async ({ page, influencerUser }) => {
  await page.goto('/profile');
  await page.getByRole('button', { name: 'Edit' }).click();

  await page.getByLabel('Instagram Followers').fill('50000');
  await expect(page.getByText('Micro')).toBeVisible();

  await page.getByLabel('Instagram Followers').fill('150000');
  await expect(page.getByText('Macro')).toBeVisible();
});
```

### TC-IP-07 — Location cascading dropdowns in edit mode
```ts
test('location uses cascading dropdowns in edit', async ({ page, influencerUser }) => {
  await page.goto('/profile');
  await page.getByRole('button', { name: 'Edit' }).click();

  await page.getByLabel('Country').selectOption('United States');
  await expect(page.getByLabel('Region')).toBeVisible();
  await page.getByLabel('Region').selectOption('California');
});
```

### TC-IP-08 — Campaign history shows brand names
```ts
test('campaign history displays brand names', async ({ page, influencerUser }) => {
  await page.goto('/profile');
  const historyCard = page.locator('[data-testid="campaign-history-card"]').first();
  await expect(historyCard).toContainText('FashionBrand');
});
```

### TC-IP-09 — Empty bio placeholder
```ts
test('empty bio shows placeholder', async ({ page, emptyInfluencer }) => {
  await page.goto('/profile');
  await expect(page.getByText('Add a bio to help brands learn more about you')).toBeVisible();
});
```

### TC-IP-10 — Empty campaign history
```ts
test('empty campaign history shows message', async ({ page, emptyInfluencer }) => {
  await page.goto('/profile');
  await expect(page.getByText('No campaigns yet')).toBeVisible();
});
```

### TC-IP-11 — Photo upload in edit mode
```ts
test('change profile photo', async ({ page, influencerUser }) => {
  await page.goto('/profile');
  await page.getByRole('button', { name: 'Edit' }).click();

  const file = { name: 'avatar.png', mimeType: 'image/png', buffer: Buffer.alloc(50 * 1024) };
  await page.getByLabel('Change Photo').setInputFiles(file);

  await expect(page.getByAltText('Profile photo preview')).toBeVisible();
});
```

### TC-IP-12 — Required field validation in edit mode
```ts
test('edit profile validation', async ({ page, influencerUser }) => {
  await page.goto('/profile');
  await page.getByRole('button', { name: 'Edit' }).click();

  await page.getByLabel('Display Name').fill('');
  await page.getByLabel('Bio').fill('');
  await page.getByRole('button', { name: 'Save Changes' }).click();

  await expect(page.getByText('Display Name is required')).toBeVisible();
  await expect(page.getByText('Bio is required')).toBeVisible();
});
```
