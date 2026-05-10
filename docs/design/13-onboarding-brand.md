# Onboarding — Brand

## Purpose
Collect essential brand profile information after account creation. Required before accessing the Brand Dashboard.

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
|                        |  Set Up Your Brand Profile         |    |
|                        |  Step 1 of 1                       |    |
|                        |  ================================  |    |
|                        |                                    |    |
|                        |  Company Logo                      |    |
|                        |  +------+                          |    |
|                        |  |  🏢  |  [Upload Logo]           |    |
|                        |  +------+                          |    |
|                        |                                    |    |
|                        |  Company Name *                    |    |
|                        |  +------------------------------+  |    |
|                        |  | BrandCo                      |  |    |
|                        |  +------------------------------+  |    |
|                        |                                    |    |
|                        |  Industry *                        |    |
|                        |  +------------------------------+  |    |
|                        |  | Fashion & Apparel          [v]|  |    |
|                        |  +------------------------------+  |    |
|                        |                                    |    |
|                        |  Website                           |    |
|                        |  +------------------------------+  |    |
|                        |  | https://brandco.com          |  |    |
|                        |  +------------------------------+  |    |
|                        |                                    |    |
|                        |  Company Description               |    |
|                        |  +------------------------------+  |    |
|                        |  | We are a sustainable fashion |  |    |
|                        |  | brand looking for creators...|  |    |
|                        |  +------------------------------+  |    |
|                        |                                    |    |
|                        |  [        Complete Setup     ]     |    |
|                        |                                    |    |
|                        |  You can update these later in     |    |
|                        |  your profile settings.            |    |
|                        +------------------------------------+    |
|                                                                  |
+------------------------------------------------------------------+
```

## Key Elements
- **Progress Indicator**: "Step 1 of 1" shows this is a single-step onboarding
- **Company Logo**: Upload area with placeholder icon
- **Company Name**: Required text input
- **Industry**: Required dropdown (Fashion, Beauty, Tech, Food, Travel, Fitness, Other)
- **Website**: Optional URL input with validation
- **Company Description**: Optional textarea
- **Complete Setup Button**: Primary CTA, full width

## Action Flows

### Flow: Upload Logo
1. Brand clicks "Upload Logo" button
2. File picker dialog opens (accepts JPG, PNG, max 2MB)
3. Brand selects an image file
4. Client validates file type and size
5. If invalid, error message appears: "Please upload a JPG or PNG under 2MB"
6. If valid, image previews in the upload area
7. Image is uploaded to storage on form submission

### Flow: Complete Brand Onboarding
1. Brand enters Company Name (required, max 100 chars)
2. Brand selects Industry from dropdown (required)
3. Brand optionally enters Website URL
4. Brand optionally enters Company Description (max 500 chars)
5. Client validates required fields in real-time
6. Brand clicks "Complete Setup" button
7. Client validates all required fields before submission
8. If validation fails, inline errors appear on invalid fields
9. Client sends `POST /api/v1/brand-profiles` with onboarding data
10. Server creates `brand_profiles` record linked to user
11. Server updates user `status` to `active`
12. Server returns created profile data
13. Client stores profile in global state
14. Client redirects to Brand Dashboard (`/`)
15. Success toast: "Welcome to InfluencerHub, BrandCo!"

### Flow: Skip / Update Later
- Not applicable — all fields marked with * are required to proceed
- Optional fields (Website, Description) can be left blank
- Brand can update all fields later in Profile Settings

## Notes
- Onboarding is gated — brand cannot access dashboard until completed
- Logo upload is optional; placeholder shown if skipped
- Industry dropdown values seeded from backend enum
- Website field validates URL format if provided
- This is the only onboarding step for brands (single-step)
