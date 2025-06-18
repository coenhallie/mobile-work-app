# Homeowner to Client Migration Guide

This document outlines the migration from the term "homeowner" to "client" throughout the application. This change reflects a broader understanding of our user base.

## Key Changes

- All instances of "homeowner" in user-facing text, documentation, and internal code comments have been updated to "client".
- User roles previously designated as "homeowner" will now be "client".

## Database Migration

For existing users, a database migration is required to update the `user_metadata.role` field.

**Supabase SQL Migration:**

The following SQL script can be used to update existing users in Supabase:

```sql
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || jsonb_build_object('role', 'client')
WHERE raw_user_meta_data->>'role' = 'homeowner';
```

**Important Considerations:**

- **Backup:** Always back up your database before running migration scripts.
- **Testing:** Test this script in a staging or development environment before applying it to production.
- **Impact on Application Logic:** Ensure that any application logic that relies on the `user_metadata.role` field is updated to expect "client" instead of "homeowner".

## Codebase Updates

The codebase has been updated to reflect this change. Key areas include:

- **UI Components:** Text and labels have been changed.
- **Routing:** Comments and internal logic referencing user types.
- **API Endpoints (if applicable):** Any internal references.
- **Documentation:** All guides and internal documents.
- **Test Suites:** Test descriptions and assertions.

## Communication to Existing Users

Consider notifying existing users who were previously identified as "homeowners" about this terminology change if it impacts their user experience or understanding of the platform. This can be done via in-app notification, email, or a blog post.

This migration aims to provide a more inclusive and accurate representation of our users.
