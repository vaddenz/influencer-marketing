# Auth — Sign Up

## Purpose
Account creation for new brands and influencers. Role selection determines which onboarding flow follows.

## ASCII UI

```
+------------------------------------------------------------------+
|                                                                  |
|                                                                  |
|                        +--------------------+                    |
|                        |     [LOGO]         |                    |
|                        |  InfluencerHub     |                    |
|                        +--------------------+                    |
|                                                                  |
|                        +------------------------------------+    |
|                        |  Create Account                    |    |
|                        |  --------------------------------  |    |
|                        |                                    |    |
|                        |  I am a...                         |    |
|                        |                                    |    |
|                        |  +----------+    +----------+      |    |
|                        |  |   🏢     |    |   ⭐     |      |    |
|                        |  |  Brand   |    |Influencer|      |    |
|                        |  |          |    |          |      |    |
|                        |  +----------+    +----------+      |    |
|                        |                                    |    |
|                        |  Email *                           |    |
|                        |  +------------------------------+  |    |
|                        |  | jane@example.com             |  |    |
|                        |  +------------------------------+  |    |
|                        |                                    |    |
|                        |  Password *                        |    |
|                        |  +------------------------------+  |    |
|                        |  | [****************          ] |  |    |
|                        |  +------------------------------+  |    |
|                        |  Min 8 characters                |    |
|                        |                                    |    |
|                        |  Confirm Password *                |    |
|                        |  +------------------------------+  |    |
|                        |  | [****************          ] |  |    |
|                        |  +------------------------------+  |    |
|                        |                                    |    |
|                        |  [x] I agree to Terms of Service   |    |
|                        |      and Privacy Policy            |    |
|                        |                                    |    |
|                        |  [      Create Account       ]     |    |
|                        |                                    |    |
|                        |  --------------------------------  |    |
|                        |  Already have an account?          |    |
|                        |  [         Sign In           ]     |    |
|                        +------------------------------------+    |
|                                                                  |
+------------------------------------------------------------------+
```

## Key Elements
- **Logo Header**: Centered brand logo and name
- **Role Selection**: Two visually distinct cards — Brand (🏢) or Influencer (⭐)
- **Email Input**: Text field with real-time availability check
- **Password Input**: Password field with strength indicator
- **Confirm Password**: Must match password field
- **Terms Checkbox**: Required to proceed
- **Create Account Button**: Primary CTA, always enabled; validates on click with inline errors (Moderate #19)
- **Sign In Link**: For existing users

## Action Flows

### Flow: Select Role
1. User views Sign Up page with both role cards unselected
2. User clicks either "Brand" or "Influencer" card
3. Selected card highlights with border/color change
4. Unselected card fades to indicate non-selection
5. Role value is stored for form submission

### Flow: Create Account
1. User selects role (Brand or Influencer)
2. User enters email address
3. User enters password (min 8 chars, strength meter updates)
4. User enters confirm password (must match password)
5. User checks "I agree to Terms of Service and Privacy Policy"
6. Client validates all fields in real-time:
   - Email format valid
   - Password ≥ 8 characters
   - Password and confirm password match
   - Terms checkbox checked
   - Role selected
7. "Create Account" button is always enabled (Moderate #19)
8. If any validation fails, inline errors appear on the invalid fields
9. User clicks "Create Account" button
10. Client re-validates all fields on submit; if any fail, inline errors appear and submission is blocked
11. If all validations pass, client proceeds with registration
12. Client sends `POST /api/v1/auth/register` with `{ email, password, role }`
13. Server checks email uniqueness in `users` table
14. If email exists, server returns 409; client shows "Email already registered"
15. If email is unique, server hashes password and creates user record with `status: pending_onboarding`
16. Server returns JWT access token and refresh token
17. Client stores token
18. Client redirects to onboarding flow based on role:
    - `brand` → `/onboarding/brand`
    - `influencer` → `/onboarding/influencer`

### Flow: Handle Uniqueness Race Condition
1. Email uniqueness is checked on blur (debounced 500ms)
2. While the async uniqueness check is in-flight, a small spinner appears next to the email field
3. If the user clicks "Create Account" before the check completes, the client waits for the check to finish before submitting
4. If the check returns "already registered", the client blocks submission and shows the inline error (Moderate #18)

### Flow: Navigate to Sign In
1. User clicks "Sign In" button at bottom
2. Page navigates to `/login`
3. Login page loads

## Notes
- Only email/password registration supported
- Password strength indicator: Weak (red) → Medium (yellow) → Strong (green)
- Email uniqueness checked on blur (debounced 500ms)
- **Submit button always enabled**: Users can click "Create Account" at any time; validation runs on click and shows inline errors. This avoids the frustrating "why is this disabled?" UX antipattern (Moderate #19)
- **Handle uniqueness race condition**: Submission is blocked while async validation is in-flight; re-validated on submit to prevent race conditions (Moderate #18)
- Terms and Privacy Policy links open in new tab
- Account created with `status: pending_onboarding` until onboarding completed
