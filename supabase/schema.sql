-- Create profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  student_id TEXT NOT NULL UNIQUE,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create inventory_submissions table
CREATE TABLE inventory_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID DEFAULT '00000000-0000-0000-0000-000000000000',
  student_id TEXT NOT NULL,
  full_name TEXT NOT NULL,
  course TEXT NOT NULL,
  year_level TEXT NOT NULL,
  contact_number TEXT NOT NULL,
  photo_url TEXT NOT NULL,
  form_data JSONB NOT NULL,
  google_form_response_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for faster queries
CREATE INDEX idx_inventory_student_id ON inventory_submissions(student_id);
CREATE INDEX idx_inventory_created_at ON inventory_submissions(created_at);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_submissions ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow public profile creation"
  ON profiles FOR INSERT
  WITH CHECK (true);

-- Inventory submissions policies
CREATE POLICY "Users can view their own submissions"
  ON inventory_submissions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own submissions"
  ON inventory_submissions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow admin to view all submissions"
  ON inventory_submissions FOR SELECT
  USING (true);

CREATE POLICY "Allow admin to insert submissions"
  ON inventory_submissions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow admin to update submissions"
  ON inventory_submissions FOR UPDATE
  USING (true);

CREATE POLICY "Allow admin to delete submissions"
  ON inventory_submissions FOR DELETE
  USING (true);

-- Create storage bucket for student photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('student-photos', 'student-photo', true);

-- Storage policies
CREATE POLICY "Users can upload their own photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'student-photo' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Anyone can view photo"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'student-photo');
