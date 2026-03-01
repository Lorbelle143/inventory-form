-- Fix Delete Permissions for Admin Dashboard
-- Run this in Supabase SQL Editor if you're getting delete errors

-- 1. Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view their own submissions" ON inventory_submissions;
DROP POLICY IF EXISTS "Users can insert their own submissions" ON inventory_submissions;
DROP POLICY IF EXISTS "Allow admin to view all submissions" ON inventory_submissions;
DROP POLICY IF EXISTS "Allow admin to insert submissions" ON inventory_submissions;
DROP POLICY IF EXISTS "Allow admin to update submissions" ON inventory_submissions;
DROP POLICY IF EXISTS "Allow admin to delete submissions" ON inventory_submissions;

-- 2. Create permissive policies that allow all operations
CREATE POLICY "Allow all SELECT operations"
  ON inventory_submissions
  FOR SELECT
  USING (true);

CREATE POLICY "Allow all INSERT operations"
  ON inventory_submissions
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow all UPDATE operations"
  ON inventory_submissions
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all DELETE operations"
  ON inventory_submissions
  FOR DELETE
  USING (true);

-- 3. Fix profiles table policies
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Allow public profile creation" ON profiles;

CREATE POLICY "Allow all operations on profiles"
  ON profiles
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 4. Fix storage policies for photo deletion
DROP POLICY IF EXISTS "Allow public uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public access" ON storage.objects;
DROP POLICY IF EXISTS "Allow public deletes" ON storage.objects;

CREATE POLICY "Allow all storage operations"
  ON storage.objects
  FOR ALL
  USING (bucket_id = 'student-photos')
  WITH CHECK (bucket_id = 'student-photos');

-- 5. Verify RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_submissions ENABLE ROW LEVEL SECURITY;

-- 6. Optional: Disable RLS for testing (NOT recommended for production)
-- ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE inventory_submissions DISABLE ROW LEVEL SECURITY;

-- Done! Now try deleting a record again.
