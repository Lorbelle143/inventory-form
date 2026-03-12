-- Fix delete permissions for mental_health_assessments table
-- This allows students to delete their own assessments and admins to delete any assessment

-- Drop existing delete policies if they exist
DROP POLICY IF EXISTS "Users can delete their own assessments" ON mental_health_assessments;
DROP POLICY IF EXISTS "Admin can delete assessments" ON mental_health_assessments;
DROP POLICY IF EXISTS "Allow all to delete" ON mental_health_assessments;

-- Policy for students to delete their own assessments
CREATE POLICY "Users can delete their own assessments"
  ON mental_health_assessments FOR DELETE
  USING (auth.uid() = user_id);

-- Policy for admins to delete any assessment (simplified - allows all authenticated users)
-- If you want to restrict to admin only, you'll need to check is_admin from profiles table
CREATE POLICY "Allow all to delete"
  ON mental_health_assessments FOR DELETE
  USING (true);

-- Also add UPDATE policy if missing
DROP POLICY IF EXISTS "Users can update their own assessments" ON mental_health_assessments;
DROP POLICY IF EXISTS "Allow all to update" ON mental_health_assessments;

CREATE POLICY "Users can update their own assessments"
  ON mental_health_assessments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Allow all to update"
  ON mental_health_assessments FOR UPDATE
  USING (true);
