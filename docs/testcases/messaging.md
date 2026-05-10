# E2E Test Cases — Messaging

Tests covering the messaging modal used across Brand Campaign Detail, Influencer Invitations, and Influencer Campaign View.

---

## Fixtures
- `brandWithCampaigns` — brand with active campaigns and invited influencers
- `influencerWithInvites` — influencer with accepted campaigns

---

## Brand — Messaging

### TC-MSG-B-01 — Send message from campaign detail
```ts
test('brand sends message to influencer', async ({ page, brandWithCampaigns }) => {
  await page.goto('/campaigns/1');
  await page.getByText('@travel_jane').locator('..').getByRole('button', { name: 'Message' }).click();

  await page.getByPlaceholder('Type a message...').fill('Great work so far!');
  await page.getByRole('button', { name: 'Send Message' }).click();

  await expect(page.getByText('Great work so far!')).toBeVisible();
});
```

### TC-MSG-B-02 — Message thread shows timestamps and sender names
```ts
test('message thread shows sender and timestamp', async ({ page, brandWithCampaigns }) => {
  await page.goto('/campaigns/1');
  await page.getByText('@travel_jane').locator('..').getByRole('button', { name: 'Message' }).click();

  await expect(page.getByText('@travel_jane')).toBeVisible();
  await expect(page.getByText(/Aug \d+, \d+:\d+/)).toBeVisible();
});
```

### TC-MSG-B-03 — Messages are right-aligned for self, left-aligned for other
```ts
test('message alignment by sender', async ({ page, brandWithCampaigns }) => {
  await page.goto('/campaigns/1');
  await page.getByText('@travel_jane').locator('..').getByRole('button', { name: 'Message' }).click();

  await page.getByPlaceholder('Type a message...').fill('Hello from brand');
  await page.getByRole('button', { name: 'Send Message' }).click();

  const myMessage = page.locator('[data-testid="message-self"]').filter({ hasText: 'Hello from brand' });
  await expect(myMessage).toHaveClass(/text-right/);
});
```

### TC-MSG-B-04 — Empty thread placeholder
```ts
test('empty messaging thread shows placeholder', async ({ page, brandWithCampaigns }) => {
  await page.goto('/campaigns/1');
  await page.getByText('@new_influencer').locator('..').getByRole('button', { name: 'Message' }).click();

  await expect(page.getByText('Start the conversation...')).toBeVisible();
});
```

### TC-MSG-B-05 — Close modal without sending
```ts
test('close messaging modal without sending', async ({ page, brandWithCampaigns }) => {
  await page.goto('/campaigns/1');
  await page.getByText('@travel_jane').locator('..').getByRole('button', { name: 'Message' }).click();
  await page.getByRole('button', { name: 'Cancel' }).click();

  await expect(page.getByText('Message @travel_jane')).not.toBeVisible();
});
```

### TC-MSG-B-06 — Close modal via X button
```ts
test('close messaging modal via X button', async ({ page, brandWithCampaigns }) => {
  await page.goto('/campaigns/1');
  await page.getByText('@travel_jane').locator('..').getByRole('button', { name: 'Message' }).click();
  await page.getByRole('button', { name: 'Close' }).click();

  await expect(page.getByText('Message @travel_jane')).not.toBeVisible();
});
```

### TC-MSG-B-07 — Message character limit
```ts
test('message enforces character limit', async ({ page, brandWithCampaigns }) => {
  await page.goto('/campaigns/1');
  await page.getByText('@travel_jane').locator('..').getByRole('button', { name: 'Message' }).click();

  const longMessage = 'a'.repeat(1001);
  await page.getByPlaceholder('Type a message...').fill(longMessage);
  await expect(page.getByText('1000 / 1000 characters')).toBeVisible();
});
```

### TC-MSG-B-08 — Send button disabled when input empty
```ts
test('send button disabled when no message typed', async ({ page, brandWithCampaigns }) => {
  await page.goto('/campaigns/1');
  await page.getByText('@travel_jane').locator('..').getByRole('button', { name: 'Message' }).click();

  await expect(page.getByRole('button', { name: 'Send Message' })).toBeDisabled();
});
```

---

## Influencer — Messaging

### TC-MSG-I-01 — Send message from influencer campaign view
```ts
test('influencer sends message to brand', async ({ page, influencerWithInvites }) => {
  await page.goto('/campaigns/1');
  await page.getByRole('button', { name: 'Message BrandCo' }).click();

  await page.getByPlaceholder('Type a message...').fill('Thanks for the opportunity!');
  await page.getByRole('button', { name: 'Send Message' }).click();

  await expect(page.getByText('Thanks for the opportunity!')).toBeVisible();
});
```

### TC-MSG-I-02 — Message thread loads existing conversation
```ts
test('influencer sees existing conversation thread', async ({ page, influencerWithInvites }) => {
  await page.goto('/campaigns/1');
  await page.getByRole('button', { name: 'Message BrandCo' }).click();

  await expect(page.getByText('Great work, thanks for the update!')).toBeVisible();
  await expect(page.getByText('Approved! They look perfect.')).toBeVisible();
});
```

### TC-MSG-I-03 — Message input clears after send
```ts
test('message input clears after sending', async ({ page, influencerWithInvites }) => {
  await page.goto('/campaigns/1');
  await page.getByRole('button', { name: 'Message BrandCo' }).click();

  await page.getByPlaceholder('Type a message...').fill('New message');
  await page.getByRole('button', { name: 'Send Message' }).click();

  await expect(page.getByPlaceholder('Type a message...')).toHaveValue('');
});
```

---

## Cross-Portal Messaging

### TC-MSG-X-01 — Brand and influencer exchange messages
```ts
test('brand and influencer exchange messages', async ({ browser }) => {
  const brandContext = await browser.newContext();
  const influencerContext = await browser.newContext();

  const brandPage = await brandContext.newPage();
  const influencerPage = await influencerContext.newPage();

  // Brand sends message
  await brandPage.goto('/campaigns/1');
  await brandPage.getByText('@travel_jane').locator('..').getByRole('button', { name: 'Message' }).click();
  await brandPage.getByPlaceholder('Type a message...').fill('Please submit by Friday');
  await brandPage.getByRole('button', { name: 'Send Message' }).click();

  // Influencer sees message and replies
  await influencerPage.goto('/campaigns/1');
  await influencerPage.getByRole('button', { name: 'Message BrandCo' }).click();
  await expect(influencerPage.getByText('Please submit by Friday')).toBeVisible();

  await influencerPage.getByPlaceholder('Type a message...').fill('Will do!');
  await influencerPage.getByRole('button', { name: 'Send Message' }).click();

  // Brand sees reply
  await brandPage.reload();
  await brandPage.getByText('@travel_jane').locator('..').getByRole('button', { name: 'Message' }).click();
  await expect(brandPage.getByText('Will do!')).toBeVisible();

  await brandContext.close();
  await influencerContext.close();
});
```

### TC-MSG-X-02 — Messages are campaign-scoped
```ts
test('messages are scoped to campaign', async ({ page, brandWithCampaigns }) => {
  // Campaign 1 has messages
  await page.goto('/campaigns/1');
  await page.getByText('@travel_jane').locator('..').getByRole('button', { name: 'Message' }).click();
  await expect(page.getByText('Great work, thanks for the update!')).toBeVisible();
  await page.getByRole('button', { name: 'Close' }).click();

  // Campaign 2 has different/no messages
  await page.goto('/campaigns/2');
  await page.getByText('@fitness_mike').locator('..').getByRole('button', { name: 'Message' }).click();
  await expect(page.getByText('Start the conversation...')).toBeVisible();
});
```
