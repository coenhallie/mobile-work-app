# Contractor Profile RLS Policy Fix Summary

## Issue Description

After fixing the database constraint issue, a new error appeared:

```
Error: Database error: new row violates row-level security policy for table "contractor_profiles"
Code: 42501 (Forbidden)
```

## Root Cause Analysis

The RLS (Row Level Security) policy on `contractor_profiles` table requires:

- **INSERT policy**: `auth.uid() = id`
- **UPDATE policy**: `auth.uid() = id`

However, the code was only setting the `user_id` field and not the `id` field to match the authenticated user's ID.

## RLS Policies on contractor_profiles Table

```sql
-- INSERT Policy
"Users can create their own contractor profile"
WITH CHECK: auth.uid() = id

-- UPDATE Policy
"Contractors can update their own profile"
USING: auth.uid() = id
WITH CHECK: auth.uid() = id
```

## Applied Fix

### 1. Updated Data Structure

**File:** `src/views/CompleteProfileView.vue`
**Lines:** 1715-1727

**Before:**

```javascript
const dataToSave = {
  user_id: userId, // Only user_id was set
  full_name: profileData.value.fullName.trim(),
  // ... other fields
};
```

**After:**

```javascript
const dataToSave = {
  id: userId, // ✅ Now set to match auth.uid() for RLS policy
  user_id: userId, // Keep for backward compatibility
  full_name: profileData.value.fullName.trim(),
  // ... other fields
};
```

### 2. Updated ON CONFLICT Clause

**Before:**

```javascript
.upsert(dataToSave, {
  onConflict: 'user_id', // Used user_id
  returning: 'minimal',
});
```

**After:**

```javascript
.upsert(dataToSave, {
  onConflict: 'id', // ✅ Now uses primary key
  returning: 'minimal',
});
```

## Why This Fix Works

1. **RLS Policy Compliance**: Setting `id: userId` ensures `auth.uid() = id` condition is met
2. **Primary Key Usage**: Using `onConflict: 'id'` leverages the primary key constraint
3. **Backward Compatibility**: Keeping `user_id` field maintains existing functionality
4. **Proper Upsert**: Both INSERT and UPDATE operations now work correctly

## Database Schema Context

- **Primary Key**: `id` (UUID)
- **Unique Constraint**: `user_id` (UUID) - added in previous fix
- **RLS Enabled**: Yes, with policies checking the `id` field

## Testing Considerations

The fix ensures:

- ✅ New profile creation works (INSERT with RLS)
- ✅ Profile updates work (UPDATE with RLS)
- ✅ Upsert operations use correct conflict resolution
- ✅ Data integrity maintained with both `id` and `user_id` fields

## Files Modified

1. **src/views/CompleteProfileView.vue**
   - Line 1716: Added `id: userId` to dataToSave
   - Line 1750: Changed `onConflict: 'user_id'` to `onConflict: 'id'`

## Impact

✅ **Fixed**: RLS policy violations resolved  
✅ **Maintained**: Unique constraint functionality from previous fix  
✅ **Improved**: Proper primary key usage for upsert operations  
✅ **Ensured**: Both new profile creation and updates work correctly

The contractor profile creation system now properly handles both database constraints and Row Level Security policies, allowing users to successfully complete their profile creation without errors.
