# Test Registration - Debug Guide

## Step 1: Open Browser Console

1. Press **F12** (or Cmd+Option+I on Mac)
2. Click **"Console"** tab
3. Keep it open while registering

## Step 2: Try Registering

Use these test credentials:
- **Email**: test123@example.com
- **Student ID**: TEST123
- **Full Name**: Test Student
- **Password**: test123
- **Confirm Password**: test123

## Step 3: Check Console Output

You should see:
```
=== REGISTRATION START ===
Email: test123@example.com
Student ID: TEST123
Step 1: Creating auth user...
✅ Auth user created: [some-uuid]
Step 2: Waiting...
Step 3: Creating profile...
Profile data: {...}
✅ Profile created: {...}
=== REGISTRATION SUCCESS ===
```

## If You See Errors:

### Error: "duplicate key value violates unique constraint"
**Meaning**: Student ID or email already exists

**Fix**: Use different email and student ID
```sql
-- Check existing profiles
SELECT * FROM profiles;

-- Delete if needed
DELETE FROM profiles WHERE student_id = 'TEST123';
```

### Error: "relation 'profiles' does not exist"
**Meaning**: Table not created

**Fix**: Run COMPLETE_SETUP.sql again

### Error: "new row violates row-level security policy"
**Meaning**: RLS is blocking insert

**Fix**: Disable RLS
```sql
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
```

### Error: "null value in column 'id' violates not-null constraint"
**Meaning**: User ID not being passed correctly

**Fix**: Check if auth.users was created
```sql
SELECT * FROM auth.users;
```

## Step 4: Verify Registration Worked

### Check in Supabase Dashboard:
1. Go to **Authentication** → **Users**
2. Should see your test user

### Check via SQL:
```sql
-- Check auth users
SELECT id, email, email_confirmed_at FROM auth.users;

-- Check profiles
SELECT * FROM profiles;
```

Both should have 1 row with your test data.

## Step 5: Try Logging In

After successful registration:
1. Go to Login page
2. Enter:
   - **Student ID**: TEST123
   - **Password**: test123
3. Should redirect to dashboard

## Common Issues & Fixes

### Issue: "Database error saving new user"
**Possible causes**:
1. RLS is enabled and blocking
2. Table doesn't exist
3. Duplicate student_id
4. Foreign key constraint

**Quick fix**:
```sql
-- Disable RLS on both tables
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_submissions DISABLE ROW LEVEL SECURITY;

-- Check if tables exist
SELECT tablename FROM pg_tables WHERE schemaname = 'public';
```

### Issue: Registration succeeds but can't login
**Cause**: Profile created but email not confirmed

**Fix**: Auto-confirm users
```sql
UPDATE auth.users SET email_confirmed_at = NOW(), confirmed_at = NOW();
```

### Issue: "Email rate limit exceeded"
**Fix**: Disable email confirmation in Supabase Dashboard
- Authentication → Providers → Email → Turn OFF "Confirm email"

## Debug Checklist

- [ ] Browser console is open (F12)
- [ ] Using unique email and student ID
- [ ] RLS is disabled on profiles table
- [ ] profiles table exists
- [ ] Email confirmation is disabled
- [ ] Supabase URL and key are correct in .env

## Still Not Working?

Share the **exact error message** from browser console, including:
- The red error text
- Any stack traces
- The "Profile error:" details

This will help identify the exact issue!
