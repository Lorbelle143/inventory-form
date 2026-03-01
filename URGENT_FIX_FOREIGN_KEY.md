# 🚨 URGENT FIX: Foreign Key Constraint Error

## Error Message
```
Error saving record: insert or update on table "inventory_submissions" 
violates foreign key constraint "inventory_submissions_user_id_fkey"
```

## THE FIX (Copy-paste this NOW!)

### Step 1: Open Supabase SQL Editor
1. Go to https://supabase.com/dashboard
2. Select your project
3. Click **"SQL Editor"** in left sidebar
4. Click **"New Query"**

### Step 2: Run This SQL (Copy ALL of it)

```sql
-- Remove the foreign key constraint
ALTER TABLE inventory_submissions 
DROP CONSTRAINT IF EXISTS inventory_submissions_user_id_fkey;

-- Allow NULL values
ALTER TABLE inventory_submissions 
ALTER COLUMN user_id DROP NOT NULL;

-- Set default UUID
ALTER TABLE inventory_submissions 
ALTER COLUMN user_id SET DEFAULT '00000000-0000-0000-0000-000000000000'::uuid;
```

### Step 3: Click "RUN" button

### Step 4: Verify it worked

Run this to check:
```sql
SELECT constraint_name 
FROM information_schema.table_constraints 
WHERE table_name = 'inventory_submissions' 
AND constraint_type = 'FOREIGN KEY';
```

**Expected result**: Empty (no rows) - meaning foreign key is removed ✅

---

## Why This Happens

The `inventory_submissions` table has a foreign key that requires `user_id` to exist in `auth.users` table. But admin-created records don't have a real user, so it fails.

## What We're Doing

We're **removing the foreign key constraint** so admin can create records with a dummy UUID (`00000000-0000-0000-0000-000000000000`) that doesn't need to exist in the users table.

---

## After Running the Fix

✅ Admin can create new student records
✅ Admin can edit existing records  
✅ Students can still submit their own forms
✅ No more foreign key errors

---

## Still Not Working?

If you still get the error after running the SQL:

1. **Refresh your browser** (Ctrl+F5 or Cmd+Shift+R)
2. **Check if constraint still exists**:
   ```sql
   \d inventory_submissions
   ```
3. **Manually drop it**:
   ```sql
   ALTER TABLE inventory_submissions DROP CONSTRAINT inventory_submissions_user_id_fkey CASCADE;
   ```

---

## Quick Test

After fixing, try creating a new student from admin dashboard:
1. Click "+ Add New Student"
2. Fill in the form
3. Click "Create"
4. Should see: ✅ "Record created successfully"

Done! 🎉
