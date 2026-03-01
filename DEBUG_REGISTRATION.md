# Debug: Database Error Saving New User

## Common Causes

1. **Profiles table doesn't exist**
2. **RLS policies blocking insert**
3. **Duplicate student_id**
4. **Foreign key constraint issues**

---

## QUICK FIX #1: Recreate Profiles Table

Run this in **Supabase SQL Editor**:

```sql
-- Drop and recreate profiles table
DROP TABLE IF EXISTS profiles CASCADE;

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  student_id TEXT NOT NULL UNIQUE,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Allow all operations
CREATE POLICY "Allow all operations on profiles"
  ON profiles FOR ALL
  USING (true) WITH CHECK (true);
```

---

## QUICK FIX #2: Disable RLS (Testing Only)

```sql
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
```

---

## QUICK FIX #3: Check for Duplicate Student ID

```sql
-- See if student ID already exists
SELECT * FROM profiles WHERE student_id = 'YOUR_STUDENT_ID';

-- Delete duplicate if found
DELETE FROM profiles WHERE student_id = 'YOUR_STUDENT_ID';
```

---

## Debug Steps

### 1. Check if profiles table exists
```sql
SELECT * FROM information_schema.tables WHERE table_name = 'profiles';
```

### 2. Check table structure
```sql
\d profiles
```

### 3. Check RLS policies
```sql
SELECT * FROM pg_policies WHERE tablename = 'profiles';
```

### 4. Check existing profiles
```sql
SELECT * FROM profiles;
```

### 5. Try manual insert
```sql
INSERT INTO profiles (id, email, full_name, student_id, is_admin)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'test@example.com',
  'Test User',
  'TEST123',
  false
);
```

If this fails, you'll see the exact error message.

---

## Check Browser Console

Open browser DevTools (F12) and check Console tab for detailed error messages.

Look for:
- `Sign up error:`
- `Profile creation error:`
- `Unexpected error:`

---

## Common Error Messages

### "duplicate key value violates unique constraint"
**Solution**: Student ID already exists. Use a different Student ID.

### "violates foreign key constraint"
**Solution**: Run QUICK FIX #1 above.

### "new row violates row-level security policy"
**Solution**: Run QUICK FIX #2 above (disable RLS).

### "relation 'profiles' does not exist"
**Solution**: Run QUICK FIX #1 above (recreate table).

---

## Still Not Working?

1. **Check Supabase logs**:
   - Go to Supabase Dashboard
   - Click "Logs" → "Database"
   - Look for error messages

2. **Try with different email**:
   - Use a completely new email address
   - Use a different student ID

3. **Clear browser cache**:
   - Press Ctrl+Shift+Delete
   - Clear all data
   - Try again

4. **Check .env file**:
   - Make sure VITE_SUPABASE_URL is correct
   - Make sure VITE_SUPABASE_ANON_KEY is correct

---

## Test Registration

After fixing, test with:
- **Email**: test@example.com
- **Student ID**: TEST12345
- **Full Name**: Test Student
- **Password**: test123

Should see: ✅ "Registration successful!"
