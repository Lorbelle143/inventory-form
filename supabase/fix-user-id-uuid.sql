-- Fix UUID Error for Admin-Created Records
-- Run this in Supabase SQL Editor NOW!

-- Step 1: Drop the foreign key constraint (THIS IS THE FIX!)
ALTER TABLE inventory_submissions 
DROP CONSTRAINT IF EXISTS inventory_submissions_user_id_fkey;

-- Step 2: Allow NULL values for user_id
ALTER TABLE inventory_submissions 
ALTER COLUMN user_id DROP NOT NULL;

-- Step 3: Set default value to a dummy UUID
ALTER TABLE inventory_submissions 
ALTER COLUMN user_id SET DEFAULT '00000000-0000-0000-0000-000000000000'::uuid;

-- Step 4: Update any existing NULL user_ids
UPDATE inventory_submissions 
SET user_id = '00000000-0000-0000-0000-000000000000'::uuid
WHERE user_id IS NULL;

-- Verify the fix worked:
SELECT constraint_name, constraint_type 
FROM information_schema.table_constraints 
WHERE table_name = 'inventory_submissions';

-- You should NOT see 'inventory_submissions_user_id_fkey' in the results
-- If you still see it, run Step 1 again

-- Done! Now you can create records without foreign key errors.
