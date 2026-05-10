# Auth — Login

## Purpose
Unified entry point for both brands and influencers to sign in with email and password.

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
|                        |  Sign In                           |    |
|                        |  --------------------------------  |    |
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
|                        |                                    |    |
|                        |  [x] Remember me                   |    |
|                        |                                    |    |
|                        |  [        Sign In            ]     |    |
|                        |                                    |    |
|                        |  --------------------------------  |    |
|                        |  Forgot password?                  |    |
|                        |                                    |    |
|                        |  Don't have an account?            |    |
|                        |  [        Create Account     ]     |    |
|                        +------------------------------------+    |
|                                                                  |
|                        (c) 2026 InfluencerHub                    |
|                                                                  |
+------------------------------------------------------------------+
```

## Key Elements
- **Logo Header**: Centered brand logo and name
- **Email Input**: Text field with email validation
- **Password Input**: Password field with show/hide toggle
- **Remember Me**: Checkbox to persist session
- **Sign In Button**: Primary CTA, full width
- **Forgot Password**: Link to password reset flow
- **Create Account**: Link to sign up page

## Action Flows

### Flow: Sign In
1. User enters email address in the Email field
2. User enters password in the Password field
3. User optionally checks "Remember me"
4. User clicks "Sign In" button
5. Client validates email format and password length (min 8 chars)
6. If validation fails, inline error appears below invalid field
7. Client sends `POST /api/v1/auth/login` with `{ email, password }`
8. Server validates credentials against `users` table
9. If invalid credentials, server returns 401; client shows "Invalid email or password"
10. If valid, server returns JWT access token and refresh token
11. Client stores token in localStorage (or memory if "Remember me" unchecked)
12. Client sends `GET /api/v1/users/me` to fetch user profile and role
13. Based on role (`brand` or `influencer`), client redirects to appropriate portal:
    - `brand` → Brand Dashboard (`/`)
    - `influencer` → Influencer Invitations (`/`)

### Flow: Forgot Password
1. User clicks "Forgot password?" link
2. Page navigates to `/forgot-password`
3. User enters email and submits
4. System sends password reset email (future feature)

### Flow: Navigate to Sign Up
1. User clicks "Create Account" button
2. Page navigates to `/signup`
3. Sign Up page loads

## Notes
- Only email/password authentication supported (no OAuth, no social login)
- Password field has show/hide eye icon toggle
- Form submit enabled only when both fields are non-empty
- Loading spinner appears on Sign In button during API call
- Account lockout after 5 failed attempts (handled by backend)
