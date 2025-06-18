# Database Schema Fixes Summary

## Issues Identified from Logs

### 1. Multiple Supabase Client Instances

**Problem**: Multiple GoTrueClient instances detected warning
**Root Cause**: Several files were creating their own Supabase clients instead of using the centralized client manager
**Files Fixed**:

- `src/composables/useSupabaseAuth.js` - Now uses `supabaseClientManager`
- `src/views/AuthCallbackView.vue` - Now uses `supabaseClientManager`
- `src/views/PasswordResetView.vue` - Now uses `supabaseClientManager`
- `src/views/SupabaseSignInView.vue` - Now uses `supabaseClientManager`
- `src/composables/useBiometricAuth.js` - Now uses `supabaseClientManager`

### 2. Missing client_profiles Table

**Problem**: Code references `client_profiles` table but no migration exists
**Solution**: Created migration `20250108000003_fix_database_schema_issues.sql` to create the table with:

- Proper RLS policies
- Indexes for performance
- Triggers for updated_at timestamps
- Realtime publication

### 3. Incorrect Table Relationship in Payment History

**Problem**: `useCulqi.js` was trying to join `payments` with `jobs` table, but payments references `job_postings`
**Solution**: Fixed the query in `src/composables/useCulqi.js` line 269 to use `job_postings` instead of `jobs`

### 4. Missing Database View for Payment History

**Problem**: Complex joins needed for payment history queries
**Solution**: Created `payment_history_view` to simplify payment history queries with proper job details

## Database Schema Changes

### New Tables Created

1. **client_profiles**
   - `id` (uuid, primary key, references auth.users)
   - `email` (text)
   - `full_name` (text)
   - `display_name` (text)
   - `bio` (text)
   - `phone` (text)
   - `location` (text)
   - `profile_picture_url` (text)
   - `created_at` (timestamp with time zone)
   - `updated_at` (timestamp with time zone)

### New Views Created

1. **payment_history_view**
   - Joins payments with job_postings
   - Provides easy access to payment details with job information

### RLS Policies Added

- Users can view/insert/update their own client profile
- Proper security for all new tables and views

## Files Modified

### Frontend Code Changes

1. **src/composables/useCulqi.js**

   - Fixed table relationship from `jobs` to `job_postings`

2. **Multiple Auth-related Files**
   - Centralized Supabase client usage to prevent multiple instances

### Database Migrations

1. **supabase/migrations/20250108000002_create_client_profiles_table.sql**

   - Creates client_profiles table (backup migration)

2. **supabase/migrations/20250108000003_fix_database_schema_issues.sql**
   - Comprehensive fix for all schema issues
   - Creates client_profiles table with proper setup
   - Creates payment_history_view
   - Adds all necessary indexes and policies

## Expected Results After Applying Fixes

1. **No more "Multiple GoTrueClient instances" warnings**
2. **No more "Could not find the 'location' column of 'client_profiles'" errors**
3. **No more "Could not find a relationship between 'payments' and 'jobs'" errors**
4. **PaymentForm.vue module import issues resolved**
5. **Proper client profile management for job posters**

## Next Steps

1. Apply the database migrations to your Supabase instance
2. Test the payment flow to ensure it works correctly
3. Test user profile creation and updates
4. Verify that the multiple client instances warning is gone

## Migration Commands

To apply these fixes to your Supabase instance:

```bash
# If using Supabase CLI
supabase db push

# Or apply the migrations manually through the Supabase dashboard
# by running the SQL in the migration files
```
