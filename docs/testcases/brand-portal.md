# E2E Test Cases — Brand Portal

Tests covering all brand-facing features: dashboard, discover, influencer profile, invite modal, campaign creation, and campaign detail.

---

## Fixtures
- `brandUser` — authenticated brand account with completed onboarding
- `brandWithCampaigns` — brand with 1+ active campaigns and invited influencers
- `emptyBrand` — brand with zero campaigns

---

## Brand — Dashboard

### TC-BD-01 — Dashboard loads with stats and campaign list
```ts
test('dashboard shows stats and active campaigns', async ({ page, brandWithCampaigns }) => {
  await page.goto('/');
  await expect(page.getByText('Active Campaigns')).toBeVisible();
  await expect(page.getByText('Total Influencers')).toBeVisible();
  await expect(page.getByText('Avg Engagement')).toBeVisible();
  await expect(page.getByText('Summer Promo')).toBeVisible();
});
```

### TC-BD-02 — Empty state for brand with no campaigns
```ts
test('empty dashboard shows CTA for new brand', async ({ page, emptyBrand }) => {
  await page.goto('/');
  await expect(page.getByText('No active campaigns yet')).toBeVisible();
  await expect(page.getByRole('button', { name: '+ Create Campaign' })).toBeVisible();
});
```

### TC-BD-03 — Click campaign card navigates to detail
```ts
test('clicking campaign card navigates to detail', async ({ page, brandWithCampaigns }) => {
  await page.goto('/');
  await page.getByText('Summer Promo').click();
  await expect(page).toHaveURL(/\/campaigns\/\d+/);
  await expect(page.getByText('Campaign Brief')).toBeVisible();
});
```

### TC-BD-04 — "+ New Campaign" navigates to create flow
```ts
test('new campaign button navigates to create flow', async ({ page, brandUser }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '+ New Campaign' }).click();
  await expect(page).toHaveURL('/campaigns/new');
});
```

### TC-BD-05 — Discover nav link works
```ts
test('discover navigation from dashboard', async ({ page, brandUser }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Discover' }).click();
  await expect(page).toHaveURL('/discover');
});
```

### TC-BD-06 — Avg Engagement tooltip on hover
```ts
test('avg engagement tooltip on hover', async ({ page, brandWithCampaigns }) => {
  await page.goto('/');
  await page.getByText('Avg Engagement').hover();
  await expect(page.getByText('Across all active campaigns, last 30 days')).toBeVisible();
});
```

### TC-BD-07 — Skeleton loaders on initial load
```ts
test('dashboard shows skeleton while loading', async ({ page, brandWithCampaigns }) => {
  await page.goto('/');
  await expect(page.locator('[data-testid="skeleton-stats"]').first()).toBeVisible();
});
```

---

## Brand — Discover Influencers

### TC-DIS-01 — Search influencers by keyword
```ts
test('search influencers by handle', async ({ page, brandUser }) => {
  await page.goto('/discover');
  await page.getByPlaceholder('Search by handle, name, or keywords').fill('travel_jane');
  await page.keyboard.press('Enter');

  await expect(page.getByText('@travel_jane')).toBeVisible();
  await expect(page.getByText('12 found')).not.toHaveText('0 found');
});
```

### TC-DIS-02 — Filter by platform updates results
```ts
test('filter by platform shows matching influencers', async ({ page, brandUser }) => {
  await page.goto('/discover');
  await page.getByLabel('Instagram').check();

  await expect(page.getByText('Loading')).not.toBeVisible({ timeout: 5000 });
  const cards = page.locator('[data-testid="influencer-card"]');
  await expect(cards.first()).toContainText('Instagram');
});
```

### TC-DIS-03 — Filter by niche
```ts
test('filter by niche shows matching influencers', async ({ page, brandUser }) => {
  await page.goto('/discover');
  await page.getByLabel('Niche').selectOption('Travel');

  await expect(page.getByText('Loading')).not.toBeVisible({ timeout: 5000 });
  const cards = page.locator('[data-testid="influencer-card"]');
  await expect(cards.first()).toContainText('Travel');
});
```

### TC-DIS-04 — Filter by location cascading dropdowns
```ts
test('filter by location country and region', async ({ page, brandUser }) => {
  await page.goto('/discover');
  await page.getByLabel('Country').selectOption('United States');
  await expect(page.getByLabel('Region')).toBeVisible();
  await page.getByLabel('Region').selectOption('California');

  const cards = page.locator('[data-testid="influencer-card"]');
  await expect(cards.first()).toContainText('California');
});
```

### TC-DIS-05 — Follower range slider filter
```ts
test('follower range slider filters influencers', async ({ page, brandUser }) => {
  await page.goto('/discover');
  await page.locator('[data-testid="follower-slider-min"]').fill('10000');
  await page.locator('[data-testid="follower-slider-max"]').fill('100000');

  const cards = page.locator('[data-testid="influencer-card"]');
  await expect(cards.first()).toContainText('K'); // follower count in range
});
```

### TC-DIS-06 — Scope tier checkboxes
```ts
test('filter by scope tier', async ({ page, brandUser }) => {
  await page.goto('/discover');
  await page.getByLabel('Micro (10-100K)').check();

  const cards = page.locator('[data-testid="influencer-card"]');
  await expect(cards.first()).toContainText('Micro');
});
```

### TC-DIS-07 — Sort options
```ts
test('sort influencers by followers high to low', async ({ page, brandUser }) => {
  await page.goto('/discover');
  await page.getByLabel('Sort').selectOption('Followers: High to Low');

  const cards = page.locator('[data-testid="influencer-card"]');
  const firstFollowers = await cards.first().locator('[data-testid="follower-count"]').textContent();
  const secondFollowers = await cards.nth(1).locator('[data-testid="follower-count"]').textContent();
  expect(parseInt(firstFollowers)).toBeGreaterThanOrEqual(parseInt(secondFollowers));
});
```

### TC-DIS-08 — Clear All filters
```ts
test('clear all filters resets results', async ({ page, brandUser }) => {
  await page.goto('/discover');
  await page.getByLabel('Instagram').check();
  await page.getByPlaceholder('Search by handle, name, or keywords').fill('travel');
  await page.getByRole('button', { name: 'Clear All' }).click();

  await expect(page.getByLabel('Instagram')).not.toBeChecked();
  await expect(page.getByPlaceholder('Search by handle, name, or keywords')).toHaveValue('');
});
```

### TC-DIS-09 — Empty results state
```ts
test('no results shows empty state with clear filters CTA', async ({ page, brandUser }) => {
  await page.goto('/discover');
  await page.getByPlaceholder('Search by handle, name, or keywords').fill('xyznonexistent');
  await page.keyboard.press('Enter');

  await expect(page.getByText('No influencers found')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Clear All Filters' })).toBeVisible();
});
```

### TC-DIS-10 — View Profile navigates to influencer profile
```ts
test('view profile from discover', async ({ page, brandUser }) => {
  await page.goto('/discover');
  await page.getByText('@travel_jane').locator('..').getByRole('button', { name: 'View Profile' }).click();

  await expect(page).toHaveURL(/\/discover\?influencer=/);
  await expect(page.getByText('@travel_jane')).toBeVisible();
});
```

### TC-DIS-11 — Already invited badge disables invite button
```ts
test('already invited influencer shows badge and disabled button', async ({ page, brandWithCampaigns }) => {
  await page.goto('/discover');
  const invitedCard = page.locator('[data-testid="influencer-card"]').filter({ hasText: 'Invited' });
  await expect(invitedCard).toBeVisible();
  await expect(invitedCard.getByRole('button', { name: 'Invite' })).toBeDisabled();
});
```

### TC-DIS-12 — Pagination
```ts
test('pagination navigates through results', async ({ page, brandUser }) => {
  await page.goto('/discover');
  await expect(page.getByRole('button', { name: 'Next' })).toBeVisible();
  await page.getByRole('button', { name: 'Next' }).click();

  await expect(page).toHaveURL(/page=2/);
});
```

---

## Brand — Influencer Profile (Brand View)

### TC-BIP-01 — Profile displays full stats and bio
```ts
test('influencer profile shows stats and bio', async ({ page, brandUser }) => {
  await page.goto('/discover?influencer=1');
  await expect(page.getByText('@travel_jane')).toBeVisible();
  await expect(page.getByText('Travel & Lifestyle')).toBeVisible();
  await expect(page.getByText('IG: 80K / 4.5%')).toBeVisible();
  await expect(page.getByText('Bio')).toBeVisible();
});
```

### TC-BIP-02 — Invite to existing campaign opens modal
```ts
test('invite to existing campaign opens modal', async ({ page, brandWithCampaigns }) => {
  await page.goto('/discover?influencer=1');
  await page.getByRole('button', { name: 'Invite to Existing Campaign' }).click();

  await expect(page.getByText('Invite @travel_jane')).toBeVisible();
  await expect(page.getByLabel('Select Campaign')).toBeVisible();
});
```

### TC-BIP-03 — Create campaign + invite navigates to create flow
```ts
test('create campaign and invite navigates to new campaign', async ({ page, brandUser }) => {
  await page.goto('/discover?influencer=1');
  await page.getByRole('button', { name: 'Create Campaign + Invite' }).click();

  await expect(page).toHaveURL(/\/campaigns\/new\?influencer=/);
  await expect(page.getByText('Create Campaign + Invite @travel_jane')).toBeVisible();
});
```

### TC-BIP-04 — Already invited state shows banner instead of CTAs
```ts
test('already invited profile shows status banner', async ({ page, brandWithCampaigns }) => {
  await page.goto('/discover?influencer=1');
  await expect(page.getByText(/Invitation Pending/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'View Invitation' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Invite to Existing Campaign' })).not.toBeVisible();
});
```

### TC-BIP-05 — Back button returns to discover
```ts
test('back button returns to discover', async ({ page, brandUser }) => {
  await page.goto('/discover?influencer=1');
  await page.getByRole('button', { name: '< Back' }).click();
  await expect(page).toHaveURL('/discover');
});
```

### TC-BIP-06 — Audience insights section
```ts
test('audience insights displayed', async ({ page, brandUser }) => {
  await page.goto('/discover?influencer=1');
  await expect(page.getByText('Audience Insights')).toBeVisible();
  await expect(page.getByText('Gender:')).toBeVisible();
  await expect(page.getByText('Age:')).toBeVisible();
});
```

### TC-BIP-07 — Recent work grid
```ts
test('recent work grid displayed', async ({ page, brandUser }) => {
  await page.goto('/discover?influencer=1');
  await expect(page.getByText('Recent Work')).toBeVisible();
  await expect(page.locator('[data-testid="recent-work-item"]').first()).toBeVisible();
});
```

---

## Brand — Invite Modal

### TC-INV-01 — Send invitation to existing campaign
```ts
test('send invitation to existing campaign', async ({ page, brandWithCampaigns }) => {
  await page.goto('/discover?influencer=1');
  await page.getByRole('button', { name: 'Invite to Existing Campaign' }).click();

  await page.getByLabel('Select Campaign').selectOption('Summer Promo');
  await expect(page.getByText('Budget: $500')).toBeVisible();

  await page.getByLabel('Personalized Message').fill('Love your travel content!');
  await page.getByRole('button', { name: 'Send Invitation' }).click();

  await expect(page.getByText('Invitation sent successfully')).toBeVisible();
  await expect(page).toHaveURL(/\/campaigns\/\d+/);
});
```

### TC-INV-02 — Empty campaigns state shows create CTA
```ts
test('invite modal with no campaigns shows empty state', async ({ page, emptyBrand }) => {
  await page.goto('/discover?influencer=1');
  await page.getByRole('button', { name: 'Invite to Existing Campaign' }).click();

  await expect(page.getByText("You don't have any campaigns yet")).toBeVisible();
  await expect(page.getByRole('button', { name: '+ Create New Campaign' })).toBeVisible();
});
```

### TC-INV-03 — Duplicate invitation guardrail
```ts
test('duplicate invitation disables send button', async ({ page, brandWithCampaigns }) => {
  await page.goto('/discover?influencer=1');
  await page.getByRole('button', { name: 'Invite to Existing Campaign' }).click();

  await page.getByLabel('Select Campaign').selectOption('Summer Promo');
  await expect(page.getByText('Invitation already pending to this campaign')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Send Invitation' })).toBeDisabled();
});
```

### TC-INV-04 — Cancel closes modal without sending
```ts
test('cancel invite closes modal', async ({ page, brandWithCampaigns }) => {
  await page.goto('/discover?influencer=1');
  await page.getByRole('button', { name: 'Invite to Existing Campaign' }).click();
  await page.getByRole('button', { name: 'Cancel' }).click();

  await expect(page.getByText('Invite @travel_jane')).not.toBeVisible();
  await expect(page).toHaveURL('/discover?influencer=1');
});
```

### TC-INV-05 — Create new campaign from modal navigates to create flow
```ts
test('create new campaign from invite modal', async ({ page, brandWithCampaigns }) => {
  await page.goto('/discover?influencer=1');
  await page.getByRole('button', { name: 'Invite to Existing Campaign' }).click();

  await page.getByLabel('Select Campaign').selectOption('+ Create New Campaign');
  await expect(page).toHaveURL(/\/campaigns\/new\?influencer=/);
});
```

### TC-INV-06 — Brief preview updates on campaign selection change
```ts
test('brief preview updates on selection change', async ({ page, brandWithCampaigns }) => {
  await page.goto('/discover?influencer=1');
  await page.getByRole('button', { name: 'Invite to Existing Campaign' }).click();

  await page.getByLabel('Select Campaign').selectOption('Summer Promo');
  await expect(page.getByText('Budget: $500')).toBeVisible();

  await page.getByLabel('Select Campaign').selectOption('Product Launch');
  await expect(page.getByText('Budget: $1,200')).toBeVisible();
});
```

### TC-INV-07 — Message character limit
```ts
test('personalized message enforces character limit', async ({ page, brandWithCampaigns }) => {
  await page.goto('/discover?influencer=1');
  await page.getByRole('button', { name: 'Invite to Existing Campaign' }).click();

  const longMessage = 'a'.repeat(501);
  await page.getByLabel('Personalized Message').fill(longMessage);
  await expect(page.getByText('500 / 500 characters')).toBeVisible();
});
```

---

## Brand — Create Campaign + Invite

### TC-CC-01 — Full create campaign and invite flow
```ts
test('create campaign and invite influencer', async ({ page, brandUser }) => {
  await page.goto('/campaigns/new?influencer=1');

  // Step 1
  await page.getByLabel('Campaign Title').fill('Summer Promo');
  await page.getByLabel('Description & Requirements').fill('Create a Reel and 3 Stories');
  await page.getByLabel('Budget').fill('500');
  await page.getByLabel('Due Date').fill('2026-08-15');

  await page.getByRole('button', { name: '+ Add Deliverable' }).click();
  await page.getByLabel('Platform').selectOption('Instagram');
  await page.getByLabel('Type').selectOption('Reel');
  await page.getByLabel('Quantity').fill('1');
  await page.getByLabel('Due Date').fill('2026-08-15');

  await page.getByRole('button', { name: 'Next: Invite' }).click();

  // Step 2
  await expect(page.getByText('Summer Promo')).toBeVisible();
  await expect(page.getByText('@travel_jane')).toBeVisible();
  await page.getByRole('button', { name: 'Send Invitation' }).click();

  await expect(page).toHaveURL(/\/campaigns\/\d+/);
});
```

### TC-CC-02 — Validation errors on Step 1
```ts
test('step 1 validation shows inline errors', async ({ page, brandUser }) => {
  await page.goto('/campaigns/new?influencer=1');
  await page.getByRole('button', { name: 'Next: Invite' }).click();

  await expect(page.getByText('Campaign Title is required')).toBeVisible();
  await expect(page.getByText('Description is required')).toBeVisible();
  await expect(page.getByText('Budget is required')).toBeVisible();
  await expect(page.getByText('Due Date is required')).toBeVisible();
});
```

### TC-CC-03 — Save as draft
```ts
test('save campaign as draft', async ({ page, brandUser }) => {
  await page.goto('/campaigns/new?influencer=1');
  await page.getByLabel('Campaign Title').fill('Draft Campaign');
  await page.getByLabel('Description & Requirements').fill('Draft description');
  await page.getByLabel('Budget').fill('1000');
  await page.getByLabel('Due Date').fill('2026-09-01');

  await page.getByRole('button', { name: 'Save as Draft' }).click();

  await expect(page.getByText('Campaign saved as draft')).toBeVisible();
  await expect(page.getByText('Draft')).toBeVisible();
});
```

### TC-CC-04 — Back from Step 2 preserves Step 1 data
```ts
test('back from step 2 preserves data', async ({ page, brandUser }) => {
  await page.goto('/campaigns/new?influencer=1');
  await page.getByLabel('Campaign Title').fill('Summer Promo');
  await page.getByRole('button', { name: 'Next: Invite' }).click();
  await page.getByRole('button', { name: '< Back' }).click();

  await expect(page.getByLabel('Campaign Title')).toHaveValue('Summer Promo');
});
```

### TC-CC-05 — Empty deliverables placeholder
```ts
test('empty deliverables shows placeholder', async ({ page, brandUser }) => {
  await page.goto('/campaigns/new?influencer=1');
  await expect(page.getByText('No deliverables yet')).toBeVisible();
  await expect(page.getByText('Add at least one deliverable to proceed')).toBeVisible();
});
```

### TC-CC-06 — Add multiple deliverables and remove one
```ts
test('add and remove deliverables', async ({ page, brandUser }) => {
  await page.goto('/campaigns/new?influencer=1');

  await page.getByRole('button', { name: '+ Add Deliverable' }).click();
  await page.getByLabel('Platform').selectOption('Instagram');
  await page.getByLabel('Type').selectOption('Reel');
  await page.getByLabel('Quantity').fill('1');

  await page.getByRole('button', { name: '+ Add Deliverable' }).click();
  await page.locator('[data-testid="deliverable-row"]').nth(1).getByLabel('Platform').selectOption('TikTok');
  await page.locator('[data-testid="deliverable-row"]').nth(1).getByLabel('Type').selectOption('Video');

  await expect(page.locator('[data-testid="deliverable-row"]').nth(1)).toBeVisible();

  await page.locator('[data-testid="deliverable-row"]').first().getByRole('button', { name: 'remove' }).click();
  await expect(page.locator('[data-testid="deliverable-row"]').nth(1)).not.toBeVisible();
});
```

### TC-CC-07 — Campaign title max length
```ts
test('campaign title enforces max length', async ({ page, brandUser }) => {
  await page.goto('/campaigns/new?influencer=1');
  const longTitle = 'a'.repeat(101);
  await page.getByLabel('Campaign Title').fill(longTitle);
  await expect(page.getByText('Max 100 characters')).toBeVisible();
});
```

---

## Brand — Campaign Detail

### TC-CD-01 — Campaign detail loads with header and influencer list
```ts
test('campaign detail loads with influencers', async ({ page, brandWithCampaigns }) => {
  await page.goto('/campaigns/1');
  await expect(page.getByText('Summer Promo')).toBeVisible();
  await expect(page.getByText('Campaign Brief')).toBeVisible();
  await expect(page.getByText('@travel_jane')).toBeVisible();
});
```

### TC-CD-02 — Empty state with no influencers
```ts
test('empty campaign detail shows invite CTA', async ({ page, brandUser }) => {
  await page.goto('/campaigns/2'); // campaign with 0 influencers
  await expect(page.getByText('No influencers invited yet')).toBeVisible();
  await expect(page.getByRole('button', { name: '+ Invite Influencers' })).toBeVisible();
});
```

### TC-CD-03 — Withdraw invite with confirmation
```ts
test('withdraw pending invite shows confirmation', async ({ page, brandWithCampaigns }) => {
  await page.goto('/campaigns/1');
  await page.getByText('@fitness_mike').locator('..').getByRole('button', { name: 'Withdraw Invite' }).click();

  await expect(page.getByText('Are you sure you want to withdraw this invitation?')).toBeVisible();
  await page.getByRole('button', { name: 'Confirm' }).click();

  await expect(page.getByText('Invitation withdrawn')).toBeVisible();
});
```

### TC-CD-04 — Mark complete with warning dialog
```ts
test('mark complete shows warning if deliverables pending', async ({ page, brandWithCampaigns }) => {
  await page.goto('/campaigns/1');
  await page.getByRole('button', { name: 'Mark Complete' }).click();

  await expect(page.getByText('Some deliverables are still pending')).toBeVisible();
  await page.getByRole('button', { name: 'Confirm' }).click();

  await expect(page.getByText('Completed')).toBeVisible();
});
```

### TC-CD-05 — Cancel campaign with confirmation
```ts
test('cancel campaign withdraws pending invites', async ({ page, brandWithCampaigns }) => {
  await page.goto('/campaigns/1');
  await page.getByRole('button', { name: 'Cancel Campaign' }).click();

  await expect(page.getByText('This will withdraw all pending invites')).toBeVisible();
  await page.getByRole('button', { name: 'Confirm' }).click();

  await expect(page.getByText('Cancelled')).toBeVisible();
});
```

### TC-CD-06 — Approve deliverable
```ts
test('approve pending review deliverable', async ({ page, brandWithCampaigns }) => {
  await page.goto('/campaigns/1');
  const deliverable = page.locator('[data-testid="deliverable"]').filter({ hasText: 'Pending Review' }).first();
  await deliverable.getByRole('button', { name: 'Approve' }).click();

  await expect(deliverable).toContainText('Completed');
});
```

### TC-CD-07 — Reject deliverable
```ts
test('reject pending review deliverable', async ({ page, brandWithCampaigns }) => {
  await page.goto('/campaigns/1');
  const deliverable = page.locator('[data-testid="deliverable"]').filter({ hasText: 'Pending Review' }).first();
  await deliverable.getByRole('button', { name: 'Reject' }).click();

  await expect(deliverable).toContainText('Pending');
});
```

### TC-CD-08 — Bulk select and remove influencers
```ts
test('bulk remove influencers', async ({ page, brandWithCampaigns }) => {
  await page.goto('/campaigns/1');
  await page.getByTestId('bulk-checkbox').first().check();
  await page.getByTestId('bulk-checkbox').nth(1).check();

  await expect(page.getByText('2 selected')).toBeVisible();
  await page.getByRole('button', { name: 'Remove Selected' }).click();
  await page.getByRole('button', { name: 'Confirm' }).click();

  await expect(page.getByText('Influencers removed')).toBeVisible();
});
```

### TC-CD-09 — Message influencer opens messaging modal
```ts
test('message influencer opens modal', async ({ page, brandWithCampaigns }) => {
  await page.goto('/campaigns/1');
  await page.getByText('@travel_jane').locator('..').getByRole('button', { name: 'Message' }).click();

  await expect(page.getByText('Message @travel_jane')).toBeVisible();
});
```

### TC-CD-10 — Remove influencer with confirmation
```ts
test('remove influencer from campaign', async ({ page, brandWithCampaigns }) => {
  await page.goto('/campaigns/1');
  await page.getByText('@travel_jane').locator('..').getByRole('button', { name: 'Remove Influencer' }).click();

  await expect(page.getByText('This will remove the influencer and all their deliverables')).toBeVisible();
  await page.getByRole('button', { name: 'Confirm' }).click();

  await expect(page.getByText('@travel_jane')).not.toBeVisible();
});
```

### TC-CD-11 — Status badges render correctly
```ts
test('status badges show correct colors', async ({ page, brandWithCampaigns }) => {
  await page.goto('/campaigns/1');
  await expect(page.getByText('accepted').first()).toHaveClass(/text-green/);
  await expect(page.getByText('pending').first()).toHaveClass(/text-orange/);
  await expect(page.getByText('declined').first()).toHaveClass(/text-red/);
});
```

### TC-CD-12 — Edit campaign navigates to edit form
```ts
test('edit campaign button navigates to edit', async ({ page, brandWithCampaigns }) => {
  await page.goto('/campaigns/1');
  await page.getByRole('button', { name: 'Edit Campaign' }).click();

  await expect(page).toHaveURL(/\/campaigns\/\d+\/edit/);
  await expect(page.getByLabel('Campaign Title')).toBeVisible();
});
```

### TC-CD-13 — Campaign progress calculation
```ts
test('campaign progress shows correct percentage', async ({ page, brandWithCampaigns }) => {
  await page.goto('/campaigns/1');
  await expect(page.getByText('2/5 influencers onboarded')).toBeVisible();
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '40');
});
```

### TC-CD-14 — Deliverable status pills not checkboxes
```ts
test('deliverables show status pills not checkboxes', async ({ page, brandWithCampaigns }) => {
  await page.goto('/campaigns/1');
  const deliverable = page.locator('[data-testid="deliverable"]').first();
  await expect(deliverable.locator('input[type="checkbox"]')).not.toBeVisible();
  await expect(deliverable.getByText(/Pending|Completed|Pending Review/)).toBeVisible();
});
```
