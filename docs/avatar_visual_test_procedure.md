# Supabase Avatar Visual Test Procedure

This document outlines the steps to visually verify that Supabase avatar images are displaying correctly in the application.

## Prerequisites

- You must be logged into the application with a Supabase account.
- The account should have a profile image URL stored (e.g., in `user_metadata.avatar_url` or a dedicated `profiles` table).
- The development server should be running.

## Test Locations

Supabase avatar images (or fallbacks) should appear in several places:

1.  **Home Page** - User thumbnail in the welcome header.
2.  **Contractor List** - Thumbnails for each contractor.
3.  **User Profile Page** - User's profile image.
4.  **(Optional) Debug Page** - If a specific page exists for testing Supabase image loading.

## Test Procedure

### 1. (Optional) Debug Page Test

If a debug page for Supabase images exists (e.g., `/debug/supabase-images`):

1.  Navigate to the debug page.
2.  Verify that test images (original, optimized if applicable) load correctly.
    If this page doesn't exist, skip this step.

### 2. Home Page Test

1.  Navigate to the home page (`/`).
2.  Check the welcome header.
3.  If logged in, verify that your profile thumbnail (or initials/fallback) appears next to your name.
4.  The image/fallback should be circular and properly sized.
5.  Hovering over the image (if it's a link) might show a subtle animation.

### 3. Contractor List Test

1.  Navigate to the contractor list page (e.g., `/find-contractor` or similar).
2.  Verify that contractor thumbnails (or fallbacks) appear next to their names.
3.  Images/fallbacks should be circular and properly sized.
4.  If a contractor doesn't have an image, a fallback (e.g., emoji 🧑‍🔧 or initials) should appear.

### 4. User Profile Page Test

1.  Navigate to your user profile page (e.g., `/user-profile`).
2.  Verify that your profile image (or fallback) appears.
3.  The image should generally be larger here than thumbnails elsewhere.

## Troubleshooting

If images aren't displaying correctly, check the following:

1.  **Browser Console** - Look for any errors related to image loading (404s, 403s) or CORS issues.
2.  **Network Tab** - Check if image requests are being made to Supabase storage and their response status.
3.  **Application Tab / Supabase Dashboard** - Verify that you're properly authenticated with Supabase and that the user record has the correct `avatar_url` or profile image URL in `user_metadata` or the relevant `profiles` table.
4.  **Run Test Script** - Execute the Supabase avatar test script in the browser console:
    ```javascript
    const script = document.createElement('script');
    script.src = '/test_supabase_avatar_implementation.js'; // Updated script name
    document.body.appendChild(script);
    ```

## Reporting Issues

If you encounter issues with avatar images, please provide:

1.  Which test locations are affected.
2.  Browser and version.
3.  Any error messages from the console or network tab.
4.  Screenshots showing the issue.
5.  Results from the `test_supabase_avatar_implementation.js` script.

## Fix Verification

After applying fixes, re-run the visual tests to verify that:

1.  Images load correctly from Supabase storage in all locations.
2.  Fallbacks (initials, emojis) appear when appropriate.
3.  No console errors related to image loading.
4.  Images are properly sized and styled.
5.  Hover effects (if any) work as expected.

## Additional Notes

- Image loading may be affected by network conditions.
- Some browsers may cache images, so perform a hard refresh (Ctrl+F5 or Cmd+Shift+R) if needed.
- Ensure Supabase Storage bucket policies (RLS for images) are correctly configured if images are not public.
