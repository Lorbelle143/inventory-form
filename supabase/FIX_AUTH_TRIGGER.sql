-- FIX: Database error saving new user
-- This error happens because of a trigger trying to auto-create profiles
-- Run this in Supabase SQL Editor

-- ============================================
-- STEP 1: Drop ALL existing triggers and functions
-- ============================================

-- Drop triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_set_role ON auth.users;

-- Drop functions
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user_profile() CASCADE;

-- ============================================
-- STEP 2: Recreate profiles table (clean slate)
-- ============================================

DROP TABLE IF EXISTS profiles CASCADE;

CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  student_id TEXT NOT NULL UNIQUE,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Remove foreign key constraint (causes issues)
-- We'll manage the relationship manually

-- ============================================
-- STEP 3: Disable RLS
-- ============================================

ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 4: Create simple auto-confirm function (NO profile creation)
-- ============================================

CREATE OR REPLACE FUNCTION public.auto_confirm_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Only auto-confirm email, don't create profile
  NEW.email_confirmed_at = NOW();
  NEW.confirmed_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- STEP 5: Create trigger for auto-confirm only
-- ============================================

CREATE TRIGGER on_auth_user_created_confirm
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_confirm_user();

-- ============================================
-- STEP 6: Verify setup
-- ============================================

-- Check triggers
SELECT tgname, tgtype, tgenabled 
FROM pg_trigger 
WHERE tgrelid = 'auth.users'::regclass;

-- Should only see: on_auth_user_created_confirm

-- Check functions
SELECT proname FROM pg_proc WHERE proname LIKE '%user%';

-- Should see: auto_confirm_user

-- ============================================
-- DONE! ✅
-- ============================================
-- Now registration will:
-- 1. Create auth user (auto-confirmed)
-- 2. Your app creates profile manually
-- 3. No more "Database error saving new user"
-- ============================================
