-- Fix Profiles Table Issues
-- Run this in Supabase SQL Editor if getting "Database error saving new user"

-- Step 1: Check if profiles table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'profiles'
);

-- Step 2: Drop and recreate profiles table with correct structure
DROP TABLE IF EXISTS profiles CASCADE;

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  student_id TEXT NOT NULL UNIQUE,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Step 4: Create permissive policies
DROP POLICY IF EXISTS "Allow all operations on profiles" ON profiles;

CREATE POLICY "Allow all operations on profiles"
  ON profiles
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Step 5: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_student_id ON profiles(student_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Step 6: Verify the table structure
\d profiles

-- Done! Now try registering again.
