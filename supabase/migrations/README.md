# Database Migrations

This directory contains SQL migration files for the Supabase database.

## How to Apply Migrations

### Using Supabase CLI (Recommended)

1. Make sure you have the Supabase CLI installed and configured
2. Apply all pending migrations:

   ```bash
   supabase db push
   ```

3. Or apply a specific migration file:
   ```bash
   supabase db push --file supabase/migrations/20241106_fix_chat_rooms_rls_policy_for_contractors.sql
   ```

### Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of the migration file
4. Execute the SQL commands

## Migration Files

### 20241106_fix_chat_rooms_rls_policy_for_contractors.sql

**Purpose**: Fixes the RLS policy for the `chat_rooms` table to allow contractors to access chat rooms.

**Problem**: The original policy only checked the `client_profiles` table, preventing contractors (who exist in `contractor_profiles`) from accessing chat rooms and seeing messages.

**Solution**: Updates the policy to check both `client_profiles` and `contractor_profiles` tables using an OR condition.

**Impact**: After applying this migration, contractors will be able to see chat rooms where they are participants and access their messages.

## Important Notes

- Always backup your database before applying migrations
- Test migrations in a development environment first
- The SQL syntax is PostgreSQL-compatible (Supabase uses PostgreSQL)
- Editor syntax warnings can be ignored as they may use different SQL dialects
