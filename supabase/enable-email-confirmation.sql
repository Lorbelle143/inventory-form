-- Enable Email Confirmation for Security
-- This SQL script enables email confirmation and removes auto-confirm trigger

-- Step 1: Drop the auto-confirm trigger (if it exists)
DROP TRIGGER IF EXISTS on_auth_user_created_confirm ON auth.users;
DROP FUNCTION IF EXISTS public.auto_confirm_user();

-- Step 2: Verify email confirmation is enabled in Supabase Dashboard
-- Go to: Authentication → Providers → Email
-- Make sure "Enable email confirmations" is checked

-- Step 3: Optional - Set email confirmation expiry (default is 24 hours)
-- This is configured in Supabase Dashboard under Authentication → Settings

-- Step 4: Create a function to handle post-confirmation profile creation
CREATE OR REPLACE FUNCTION public.handle_email_confirmed()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if email is being confirmed (not already confirmed)
  IF NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL THEN
    -- Check if profile already exists
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
      -- Profile will be created by the application after confirmation
      -- This trigger just logs the confirmation
      RAISE NOTICE 'Email confirmed for user: %', NEW.id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Create trigger for email confirmation
DROP TRIGGER IF EXISTS on_email_confirmed ON auth.users;
CREATE TRIGGER on_email_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL)
  EXECUTE FUNCTION public.handle_email_confirmed();

-- Step 6: Update existing unconfirmed users (optional - only if needed)
-- Uncomment the line below to require all existing users to confirm their email
-- UPDATE auth.users SET email_confirmed_at = NULL WHERE email_confirmed_at IS NOT NULL;

-- Verification Query
-- Run this to check if email confirmation is working:
-- SELECT id, email, email_confirmed_at, created_at FROM auth.users ORDER BY created_at DESC LIMIT 10;

COMMENT ON FUNCTION public.handle_email_confirmed() IS 'Handles actions after email confirmation';
