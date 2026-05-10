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
- **Create Account Button**: Primary CTA, disabled until all validations pass
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
7. If any validation fails, inline errors appear; "Create Account" button remains disabled
8. User clicks "Create Account" button
9. Client sends `POST /api/v1/auth/register` with `{ email, password, role }`
10. Server checks email uniqueness in `users` table
11. If email exists, server returns 409; client shows "Email already registered"
12. If email is unique, server hashes password and creates user record with `status: pending_onboarding`
13. Server returns JWT access token and refresh token
14. Client stores token
15. Client redirects to onboarding flow based on role:
    - `brand` → `/onboarding/brand`
    - `influencer` → `/onboarding/influencer`

### Flow: Navigate to Sign In
1. User clicks "Sign In" button at bottom
2. Page navigates to `/login`
3. Login page loads

## Notes
- Only email/password registration supported
- Password strength indicator: Weak (red) → Medium (yellow) → Strong (green)
- Email uniqueness checked on blur (debounced 500ms)
- Terms and Privacy Policy links open in new tab
- Account created with `status: pending_onboarding` until onboarding completed
