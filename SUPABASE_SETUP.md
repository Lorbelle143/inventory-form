# Supabase Setup Instructions

## Step 1: Run the Database Schema

1. Go to your Supabase project dashboard
2. Click on "SQL Editor" in the left sidebar
3. Click "New Query"
4. Copy and paste the contents of `supabase/schema.sql`
5. Click "Run" to execute

## Step 2: Disable RLS for Admin Operations (Option 1 - Simple)

If you want to allow admin full access without authentication:

```sql
-- Disable RLS temporarily for testing
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_submissions DISABLE ROW LEVEL SECURITY;
```

## Step 3: Or Configure Proper RLS Policies (Option 2 - Secure)

Run these commands in Supabase SQL Editor:

```sql
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Allow public profile creation" ON profiles;
DROP POLICY IF EXISTS "Users can view their own submissions" ON inventory_submissions;
DROP POLICY IF EXISTS "Users can insert their own submissions" ON inventory_submissions;
DROP POLICY IF EXISTS "Allow admin to view all submissions" ON inventory_submissions;
DROP POLICY IF EXISTS "Allow admin to insert submissions" ON inventory_submissions;
DROP POLICY IF EXISTS "Allow admin to update submissions" ON inventory_submissions;
DROP POLICY IF EXISTS "Allow admin to delete submissions" ON inventory_submissions;

-- Create new permissive policies
CREATE POLICY "Allow all operations on profiles"
  ON profiles
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on inventory_submissions"
  ON inventory_submissions
  FOR ALL
  USING (true)
  WITH CHECK (true);
```

## Step 4: Create Storage Bucket

1. Go to "Storage" in Supabase dashboard
2. Click "Create a new bucket"
3. Name: `student-photos`
4. Make it public: Toggle "Public bucket" to ON
5. Click "Create bucket"

## Step 5: Set Storage Policies

Run in SQL Editor:

```sql
-- Allow anyone to upload to student-photos
CREATE POLICY "Allow public uploads"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'student-photos');

-- Allow anyone to view photos
CREATE POLICY "Allow public access"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'student-photos');

-- Allow anyone to delete photos
CREATE POLICY "Allow public deletes"
  ON storage.objects
  FOR DELETE
  USING (bucket_id = 'student-photos');
```

## Step 6: Get Your Credentials

1. Go to "Settings" > "API" in Supabase dashboard
2. Copy:
   - Project URL
   - anon/public key
3. Paste in your `.env` file:

```env
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_ADMIN_MASTER_KEY=your_chosen_master_key
```

## Step 7: Test the Application

1. Run `npm install`
2. Run `npm run dev`
3. Try registering a student
4. Try logging in as admin with master key
5. Test CRUD operations

## Troubleshooting

### "new row violates row-level security policy"
- Run Option 1 (Disable RLS) or Option 2 (Permissive policies)
- Make sure you're using the correct Supabase URL and key

### "Failed to upload photo"
- Check if storage bucket exists
- Verify storage policies are set
- Make sure bucket is public

### "No admin account found"
- This is normal - admin uses master key only
- No database account needed for admin

## Security Notes

For production:
- Use proper RLS policies based on user roles
- Don't disable RLS completely
- Use service role key for admin operations
- Implement proper authentication checks
