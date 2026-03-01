-- Create Storage Bucket for Student Photos
-- Run this in Supabase SQL Editor

-- Step 1: Create the bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'student-photos',
  'student-photos',
  true,
  5242880, -- 5MB in bytes
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

-- Step 2: Drop existing policies if any
DROP POLICY IF EXISTS "Allow public uploads to student-photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow public access to student-photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow public updates to student-photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow public deletes from student-photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow all storage operations" ON storage.objects;

-- Step 3: Create permissive policies for all operations
CREATE POLICY "Allow all operations on student-photos"
  ON storage.objects
  FOR ALL
  USING (bucket_id = 'student-photos')
  WITH CHECK (bucket_id = 'student-photos');

-- Step 4: Verify bucket was created
SELECT id, name, public, file_size_limit, allowed_mime_types 
FROM storage.buckets 
WHERE id = 'student-photos';

-- Expected output:
-- id: student-photos
-- name: student-photos
-- public: true
-- file_size_limit: 5242880
-- allowed_mime_types: {image/jpeg,image/jpg,image/png,image/webp}

-- Done! Bucket is ready for photo uploads.
