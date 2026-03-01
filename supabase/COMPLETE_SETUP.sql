-- COMPLETE SETUP FOR STUDENT INVENTORY SYSTEM
-- Copy and paste ALL of this into Supabase SQL Editor and click RUN

-- ============================================
-- STEP 1: DROP EXISTING TABLES (Clean slate)
-- ============================================
DROP TABLE IF EXISTS inventory_submissions CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- ============================================
-- STEP 2: CREATE TABLES
-- ============================================

-- Create profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  student_id TEXT NOT NULL UNIQUE,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create inventory_submissions table
CREATE TABLE inventory_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID DEFAULT '00000000-0000-0000-0000-000000000000',
  student_id TEXT NOT NULL,
  full_name TEXT NOT NULL,
  course TEXT NOT NULL,
  year_level TEXT NOT NULL,
  contact_number TEXT NOT NULL,
  photo_url TEXT NOT NULL,
  form_data JSONB NOT NULL,
  google_form_response_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX idx_profiles_student_id ON profiles(student_id);
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_inventory_student_id ON inventory_submissions(student_id);
CREATE INDEX idx_inventory_created_at ON inventory_submissions(created_at);

-- ============================================
-- STEP 3: DISABLE RLS (For easier development)
-- ============================================
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_submissions DISABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 4: CREATE STORAGE BUCKET
-- ============================================

-- Create bucket (ignore error if already exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('student-photos', 'student-photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop existing storage policies
DROP POLICY IF EXISTS "Allow all storage operations" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view photos" ON storage.objects;

-- Create permissive storage policy
CREATE POLICY "Allow all storage operations"
  ON storage.objects
  FOR ALL
  USING (bucket_id = 'student-photos')
  WITH CHECK (bucket_id = 'student-photos');

-- ============================================
-- STEP 5: AUTO-CONFIRM NEW USERS (Bypass email)
-- ============================================

-- Create function to auto-confirm users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE auth.users
  SET email_confirmed_at = NOW(), confirmed_at = NOW()
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- STEP 6: VERIFY SETUP
-- ============================================

-- Check tables exist
SELECT 'profiles' as table_name, COUNT(*) as row_count FROM profiles
UNION ALL
SELECT 'inventory_submissions', COUNT(*) FROM inventory_submissions;

-- Check storage bucket
SELECT id, name, public FROM storage.buckets WHERE id = 'student-photos';

-- Check RLS status (should be disabled)
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('profiles', 'inventory_submissions');

-- ============================================
-- DONE! ✅
-- ============================================
-- You should see:
-- - 2 tables with 0 rows each
-- - 1 storage bucket (student-photos, public=true)
-- - RLS disabled (rowsecurity=false)
--
-- Now you can:
-- 1. Register students
-- 2. Login with Student ID + password
-- 3. Upload photos
-- 4. Admin can CRUD all records
-- ============================================
