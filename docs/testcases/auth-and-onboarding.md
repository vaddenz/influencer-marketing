# E2E Test Cases — Auth & Onboarding

Tests covering authentication (login, signup) and onboarding flows for both brands and influencers.

---

## Fixtures
- `brandUser` — authenticated brand account with completed onboarding
- `influencerUser` — authenticated influencer account with completed onboarding
- `emptyBrand` — brand with zero campaigns
- `emptyInfluencer` — influencer with zero invitations

---

## Auth — Login

### TC-AUTH-01 — Brand login and redirect to dashboard
```ts
test('brand login redirects to dashboard', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('brand@example.com');
  await page.getByLabel('Password').fill('password123');
  await page.getByRole('button', { name: 'Sign In' }).click();

  await expect(page).toHaveURL('/');
  await expect(page.getByText('Active Campaigns')).toBeVisible();
});
```

### TC-AUTH-02 — Influencer login and redirect to invitations
```ts
test('influencer login redirects to invitations', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('influencer@example.com');
  await page.getByLabel('Password').fill('password123');
  await page.getByRole('button', { name: 'Sign In' }).click();

  await expect(page).toHaveURL('/');
  await expect(page.getByText('New Invitations')).toBeVisible();
});
```

### TC-AUTH-03 — Invalid credentials show error
```ts
test('invalid credentials show inline error', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('bad@example.com');
  await page.getByLabel('Password').fill('wrong');
  await page.getByRole('button', { name: 'Sign In' }).click();

  await expect(page.getByText('Invalid email or password')).toBeVisible();
  await expect(page).toHaveURL('/login');
});
```

### TC-AUTH-04 — Form submit enabled only when both fields are non-empty
```ts
test('sign in button disabled until fields filled', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('button', { name: 'Sign In' })).toBeDisabled();

  await page.getByLabel('Email').fill('brand@example.com');
  await expect(page.getByRole('button', { name: 'Sign In' })).toBeDisabled();

  await page.getByLabel('Password').fill('password123');
  await expect(page.getByRole('button', { name: 'Sign In' })).toBeEnabled();
});
```

### TC-AUTH-05 — Password show/hide toggle
```ts
test('password field has show hide toggle', async ({ page }) => {
  await page.goto('/login');
  const passwordInput = page.getByLabel('Password');
  await passwordInput.fill('secret123');

  await expect(passwordInput).toHaveAttribute('type', 'password');
  await page.getByRole('button', { name: 'Show password' }).click();
  await expect(passwordInput).toHaveAttribute('type', 'text');
});
```

---

## Auth — Sign Up

### TC-SIGNUP-01 — Sign up as brand redirects to brand onboarding
```ts
test('sign up as brand redirects to brand onboarding', async ({ page }) => {
  await page.goto('/signup');
  await page.getByText('Brand').click();
  await page.getByLabel('Email').fill('newbrand@example.com');
  await page.getByLabel('Password').fill('SecurePass123');
  await page.getByLabel('Confirm Password').fill('SecurePass123');
  await page.getByLabel('I agree to Terms of Service and Privacy Policy').check();
  await page.getByRole('button', { name: 'Create Account' }).click();

  await expect(page).toHaveURL('/onboarding/brand');
});
```

### TC-SIGNUP-02 — Sign up as influencer redirects to influencer onboarding
```ts
test('sign up as influencer redirects to influencer onboarding', async ({ page }) => {
  await page.goto('/signup');
  await page.getByText('Influencer').click();
  await page.getByLabel('Email').fill('newinfluencer@example.com');
  await page.getByLabel('Password').fill('SecurePass123');
  await page.getByLabel('Confirm Password').fill('SecurePass123');
  await page.getByLabel('I agree to Terms of Service and Privacy Policy').check();
  await page.getByRole('button', { name: 'Create Account' }).click();

  await expect(page).toHaveURL('/onboarding/influencer');
});
```

### TC-SIGNUP-03 — Duplicate email shows inline error
```ts
test('duplicate email shows inline error', async ({ page }) => {
  await page.goto('/signup');
  await page.getByText('Brand').click();
  await page.getByLabel('Email').fill('existing@example.com');
  await page.getByLabel('Password').fill('SecurePass123');
  await page.getByLabel('Confirm Password').fill('SecurePass123');
  await page.getByLabel('I agree to Terms of Service and Privacy Policy').check();
  await page.getByRole('button', { name: 'Create Account' }).click();

  await expect(page.getByText('Email already registered')).toBeVisible();
});
```

### TC-SIGNUP-04 — Role selection highlights selected card
```ts
test('role selection highlights selected card', async ({ page }) => {
  await page.goto('/signup');
  const brandCard = page.getByText('Brand').locator('..');
  const influencerCard = page.getByText('Influencer').locator('..');

  await page.getByText('Brand').click();
  await expect(brandCard).toHaveClass(/selected/);
  await expect(influencerCard).not.toHaveClass(/selected/);
});
```

### TC-SIGNUP-05 — Password strength indicator
```ts
test('password strength indicator updates', async ({ page }) => {
  await page.goto('/signup');
  await page.getByLabel('Password').fill('weak');
  await expect(page.getByText('Weak')).toHaveClass(/text-red/);

  await page.getByLabel('Password').fill('StrongPass123!');
  await expect(page.getByText('Strong')).toHaveClass(/text-green/);
});
```

### TC-SIGNUP-06 — Email uniqueness checked on blur
```ts
test('email uniqueness check on blur', async ({ page }) => {
  await page.goto('/signup');
  await page.getByLabel('Email').fill('existing@example.com');
  await page.getByLabel('Password').click(); // blur email

  await expect(page.getByText('Checking...')).toBeVisible();
  await expect(page.getByText('Email already registered')).toBeVisible();
});
```

### TC-SIGNUP-07 — Password and confirm password must match
```ts
test('password mismatch shows error', async ({ page }) => {
  await page.goto('/signup');
  await page.getByLabel('Password').fill('SecurePass123');
  await page.getByLabel('Confirm Password').fill('DifferentPass');
  await page.getByRole('button', { name: 'Create Account' }).click();

  await expect(page.getByText('Passwords do not match')).toBeVisible();
});
```

### TC-SIGNUP-08 — Terms checkbox required
```ts
test('terms checkbox is required', async ({ page }) => {
  await page.goto('/signup');
  await page.getByText('Brand').click();
  await page.getByLabel('Email').fill('new@example.com');
  await page.getByLabel('Password').fill('SecurePass123');
  await page.getByLabel('Confirm Password').fill('SecurePass123');
  // do not check terms
  await page.getByRole('button', { name: 'Create Account' }).click();

  await expect(page.getByText('You must agree to the Terms of Service')).toBeVisible();
});
```

---

## Onboarding — Brand

### TC-ONB-BRAND-01 — Brand onboarding completes and redirects to dashboard
```ts
test('brand onboarding completion', async ({ page }) => {
  await page.goto('/onboarding/brand');
  await page.getByLabel('Company Name').fill('BrandCo');
  await page.getByLabel('Industry').selectOption('Fashion & Apparel');
  await page.getByRole('button', { name: 'Complete Setup' }).click();

  await expect(page).toHaveURL('/');
  await expect(page.getByText('Welcome to InfluencerHub, BrandCo!')).toBeVisible();
});
```

### TC-ONB-BRAND-02 — Logo upload validates file type and size
```ts
test('logo upload validates file', async ({ page }) => {
  await page.goto('/onboarding/brand');

  // Oversized file
  const largeFile = { name: 'logo.png', mimeType: 'image/png', buffer: Buffer.alloc(3 * 1024 * 1024) };
  await page.getByLabel('Upload Logo').setInputFiles(largeFile);
  await expect(page.getByText('Please upload a JPG or PNG under 2MB')).toBeVisible();

  // Valid file
  const validFile = { name: 'logo.png', mimeType: 'image/png', buffer: Buffer.alloc(100 * 1024) };
  await page.getByLabel('Upload Logo').setInputFiles(validFile);
  await expect(page.getByAltText('Logo preview')).toBeVisible();
});
```

### TC-ONB-BRAND-03 — Required fields validation
```ts
test('brand onboarding validation', async ({ page }) => {
  await page.goto('/onboarding/brand');
  await page.getByRole('button', { name: 'Complete Setup' }).click();

  await expect(page.getByText('Company Name is required')).toBeVisible();
  await expect(page.getByText('Industry is required')).toBeVisible();
});
```

### TC-ONB-BRAND-04 — Website URL validation
```ts
test('website url validation', async ({ page }) => {
  await page.goto('/onboarding/brand');
  await page.getByLabel('Website').fill('not-a-url');
  await page.getByRole('button', { name: 'Complete Setup' }).click();

  await expect(page.getByText('Please enter a valid URL')).toBeVisible();
});
```

---

## Onboarding — Influencer

### TC-ONB-INF-01 — Influencer two-step onboarding
```ts
test('influencer onboarding two-step flow', async ({ page }) => {
  await page.goto('/onboarding/influencer');

  // Step 1
  await page.getByLabel('Display Name / Handle').fill('@travel_jane');
  await page.getByLabel('Niche').selectOption('Travel & Lifestyle');
  await page.getByLabel('Bio').fill('Exploring the world one destination at a time.');
  await page.getByLabel('Location').selectOption('California, United States');
  await page.getByRole('button', { name: 'Next: Platforms' }).click();

  // Step 2
  await page.getByLabel('Instagram').check();
  await page.getByLabel('TikTok').check();
  await page.getByLabel('Follower Count').fill('125000');
  await page.getByLabel('Engagement Rate').fill('4.2');
  await page.getByRole('button', { name: 'Complete Setup' }).click();

  await expect(page).toHaveURL('/');
  await expect(page.getByText('Welcome to InfluencerHub, @travel_jane!')).toBeVisible();
});
```

### TC-ONB-INF-02 — Step 1 validation
```ts
test('influencer step 1 validation', async ({ page }) => {
  await page.goto('/onboarding/influencer');
  await page.getByRole('button', { name: 'Next: Platforms' }).click();

  await expect(page.getByText('Display Name is required')).toBeVisible();
  await expect(page.getByText('Niche is required')).toBeVisible();
  await expect(page.getByText('Bio is required')).toBeVisible();
  await expect(page.getByText('Location is required')).toBeVisible();
});
```

### TC-ONB-INF-03 — Handle format validation
```ts
test('handle format validation', async ({ page }) => {
  await page.goto('/onboarding/influencer');
  await page.getByLabel('Display Name / Handle').fill('invalid handle with spaces');
  await page.getByRole('button', { name: 'Next: Platforms' }).click();

  await expect(page.getByText('Handle can only contain letters, numbers, and underscores')).toBeVisible();
});
```

### TC-ONB-INF-04 — Bio character counter
```ts
test('bio character counter updates', async ({ page }) => {
  await page.goto('/onboarding/influencer');
  await page.getByLabel('Bio').fill('Short bio');

  await expect(page.getByText('9 / 300 characters')).toBeVisible();
});
```

### TC-ONB-INF-05 — Scope auto-calculates from follower count
```ts
test('scope auto-calculates in onboarding', async ({ page }) => {
  await page.goto('/onboarding/influencer');
  await page.getByLabel('Display Name / Handle').fill('@test');
  await page.getByLabel('Niche').selectOption('Travel');
  await page.getByLabel('Bio').fill('Bio text');
  await page.getByLabel('Location').selectOption('California');
  await page.getByRole('button', { name: 'Next: Platforms' }).click();

  await page.getByLabel('Instagram').check();
  await page.getByLabel('Follower Count').fill('50000');
  await expect(page.getByText('Micro')).toBeVisible();

  await page.getByLabel('Follower Count').fill('150000');
  await expect(page.getByText('Macro')).toBeVisible();
});
```

### TC-ONB-INF-06 — Back from Step 2 preserves Step 1 data
```ts
test('back from step 2 preserves data', async ({ page }) => {
  await page.goto('/onboarding/influencer');
  await page.getByLabel('Display Name / Handle').fill('@travel_jane');
  await page.getByRole('button', { name: 'Next: Platforms' }).click();
  await page.getByRole('button', { name: '< Back' }).click();

  await expect(page.getByLabel('Display Name / Handle')).toHaveValue('@travel_jane');
});
```

### TC-ONB-INF-07 — Handle uniqueness on blur
```ts
test('handle uniqueness check on blur', async ({ page }) => {
  await page.goto('/onboarding/influencer');
  await page.getByLabel('Display Name / Handle').fill('@existing_handle');
  await page.getByLabel('Niche').click(); // blur handle

  await expect(page.getByText('Checking...')).toBeVisible();
  await expect(page.getByText('Handle already taken')).toBeVisible();
});
```

### TC-ONB-INF-08 — Engagement rate percent suffix
```ts
test('engagement rate has percent suffix', async ({ page }) => {
  await page.goto('/onboarding/influencer');
  await page.getByLabel('Display Name / Handle').fill('@test');
  await page.getByLabel('Niche').selectOption('Travel');
  await page.getByLabel('Bio').fill('Bio text');
  await page.getByLabel('Location').selectOption('California');
  await page.getByRole('button', { name: 'Next: Platforms' }).click();

  await page.getByLabel('Instagram').check();
  await page.getByLabel('Engagement Rate').fill('4.5');
  await expect(page.getByText('%')).toBeVisible();
});
```
