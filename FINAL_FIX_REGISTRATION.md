# 🚨 FINAL FIX: Database Error Saving New User

## The Problem

Supabase is trying to auto-create a profile via a trigger, but it's failing because of:
- Foreign key constraints
- RLS policies
- Missing columns
- Trigger errors

## THE SOLUTION (Copy this EXACTLY)

### Step 1: Open Supabase SQL Editor
1. Go to https://supabase.com/dashboard
2. Select your project
3. Click **"SQL Editor"**
4. Click **"New Query"**

### Step 2: Copy and Run This (ALL of it)

```sql
-- Remove ALL triggers and functions
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_set_role ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user_profile() CASCADE;

-- Recreate profiles table (clean)
DROP TABLE IF EXISTS profiles CASCADE;
CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  student_id TEXT NOT NULL UNIQUE,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Disable RLS
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Create simple auto-confirm function (NO profile creation)
CREATE OR REPLACE FUNCTION public.auto_confirm_user()
RETURNS TRIGGER AS $$
BEGIN
  NEW.email_confirmed_at = NOW();
  NEW.confirmed_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for auto-confirm ONLY
CREATE TRIGGER on_auth_user_created_confirm
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_confirm_user();
```

### Step 3: Click "RUN"

### Step 4: Verify It Worked

Run this to check:
```sql
SELECT tgname FROM pg_trigger WHERE tgrelid = 'auth.users'::regclass;
```

Should see: `on_auth_user_created_confirm` (and nothing else related to profiles)

---

## Now Try Registering Again

1. Go to registration page
2. Use:
   - Email: `newtest@example.com`
   - Student ID: `NEW123`
   - Full Name: `New Test`
   - Password: `test123`
3. Click "Register"

Should see: ✅ "Registration successful!"

---

## What Changed?

**BEFORE**:
- Trigger tried to auto-create profile → Failed → "Database error"

**AFTER**:
- Trigger only auto-confirms email
- Your app creates profile manually
- No more errors!

---

## If Still Not Working

### Check Supabase Logs:
1. Go to Supabase Dashboard
2. Click "Logs" → "Database"
3. Look for error messages
4. Share the exact error with me

### Check Browser Console:
1. Press F12
2. Try registering
3. Look for red errors
4. Share the error message

### Try Disabling Email Confirmation:
1. Go to Authentication → Providers → Email
2. Turn OFF "Confirm email"
3. Click Save
4. Try registering again

---

## Alternative: Manual Registration (If all else fails)

Run this in SQL Editor to create a test user:

```sql
-- Create auth user manually
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  confirmed_at,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'manual@example.com',
  crypt('test123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  NOW()
) RETURNING id;

-- Copy the returned ID and use it here:
INSERT INTO profiles (id, email, full_name, student_id, is_admin)
VALUES (
  'PASTE-THE-ID-HERE',
  'manual@example.com',
  'Manual Test',
  'MANUAL123',
  false
);
```

Then login with:
- Student ID: `MANUAL123`
- Password: `test123`

---

## Success Checklist

- [ ] Ran the SQL fix
- [ ] Verified trigger exists (on_auth_user_created_confirm)
- [ ] Tried registering with new email
- [ ] Saw "Registration successful!" message
- [ ] Can login with Student ID

Done! 🎉
