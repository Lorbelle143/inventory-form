-- Confirm All Existing Unconfirmed Users
-- This will allow them to login without waiting for email
-- Run this in Supabase SQL Editor

-- Confirm all users who haven't confirmed their email yet
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;

-- Verify it worked - check all users
SELECT 
  id, 
  email, 
  email_confirmed_at, 
  confirmed_at,
  created_at
FROM auth.users
ORDER BY created_at DESC;

-- Done! All existing users can now login without email confirmation.
-- New users will still need to confirm their email (rate limit still applies to new signups).
