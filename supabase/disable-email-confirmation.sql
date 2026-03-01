-- Auto-Confirm Users (COMPLETE FIX for Email Rate Limit)
-- Run this in Supabase SQL Editor

-- Step 1: Create function to auto-confirm users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Immediately confirm the user's email
  UPDATE auth.users
  SET 
    email_confirmed_at = NOW(),
    confirmed_at = NOW()
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Step 3: Create trigger to auto-confirm on user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Step 4: Confirm any existing unconfirmed users
UPDATE auth.users
SET 
  email_confirmed_at = NOW(),
  confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;

-- Done! Now all users will be auto-confirmed without email verification.
-- This bypasses the email rate limit completely.

-- To verify it worked, run:
-- SELECT id, email, email_confirmed_at, confirmed_at FROM auth.users;
