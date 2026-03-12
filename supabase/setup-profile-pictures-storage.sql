-- Create storage bucket for profile pictures
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-pictures', 'profile-pictures', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can upload their own profile picture" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own profile picture" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own profile picture" ON storage.objects;
DROP POLICY IF EXISTS "Public can view profile pictures" ON storage.objects;

-- Allow authenticated users to upload to profile-pictures bucket
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'profile-pictures');

-- Allow authenticated users to update files in profile-pictures bucket
CREATE POLICY "Allow authenticated updates"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'profile-pictures');

-- Allow authenticated users to delete files in profile-pictures bucket
CREATE POLICY "Allow authenticated deletes"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'profile-pictures');

-- Allow public read access to all profile pictures
CREATE POLICY "Allow public reads"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'profile-pictures');

-- Add profile_picture column to profiles table if it doesn't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS profile_picture TEXT;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_profile_picture 
ON profiles(profile_picture);

-- Add comment
COMMENT ON COLUMN profiles.profile_picture IS 'URL to user profile picture stored in Supabase Storage';
