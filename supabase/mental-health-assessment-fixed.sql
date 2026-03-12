-- Create mental_health_assessments table
CREATE TABLE IF NOT EXISTS mental_health_assessments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  student_id TEXT NOT NULL,
  full_name TEXT NOT NULL,
  
  -- Assessment responses (0-4 scale: Never=0, Rarely=1, Sometimes=2, Often=3, Always=4)
  feeling_alone INTEGER NOT NULL CHECK (feeling_alone >= 0 AND feeling_alone <= 4),
  feeling_blue INTEGER NOT NULL CHECK (feeling_blue >= 0 AND feeling_blue <= 4),
  feeling_easily_annoyed INTEGER NOT NULL CHECK (feeling_easily_annoyed >= 0 AND feeling_easily_annoyed <= 4),
  feeling_tense_anxious INTEGER NOT NULL CHECK (feeling_tense_anxious >= 0 AND feeling_tense_anxious <= 4),
  having_suicidal_thoughts INTEGER NOT NULL CHECK (having_suicidal_thoughts >= 0 AND having_suicidal_thoughts <= 4),
  
  -- Calculated total score (0-20)
  total_score INTEGER NOT NULL,
  
  -- Risk level: doing-well (0-10), need-support (11-13), immediate-support (14-20)
  risk_level TEXT NOT NULL CHECK (risk_level IN ('doing-well', 'need-support', 'immediate-support')),
  
  -- Requires counseling if score >= 10 or has suicidal thoughts
  requires_counseling BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- Counseling status
  counseling_status TEXT DEFAULT 'pending' CHECK (counseling_status IN ('pending', 'scheduled', 'completed')),
  counseling_notes TEXT,
  counseling_date TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for faster queries (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_mha_student_id ON mental_health_assessments(student_id);
CREATE INDEX IF NOT EXISTS idx_mha_user_id ON mental_health_assessments(user_id);
CREATE INDEX IF NOT EXISTS idx_mha_risk_level ON mental_health_assessments(risk_level);
CREATE INDEX IF NOT EXISTS idx_mha_requires_counseling ON mental_health_assessments(requires_counseling);
CREATE INDEX IF NOT EXISTS idx_mha_created_at ON mental_health_assessments(created_at DESC);

-- Enable Row Level Security
ALTER TABLE mental_health_assessments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own assessments" ON mental_health_assessments;
DROP POLICY IF EXISTS "Users can insert their own assessments" ON mental_health_assessments;
DROP POLICY IF EXISTS "Admin can view all assessments" ON mental_health_assessments;
DROP POLICY IF EXISTS "Admin can update assessments" ON mental_health_assessments;
DROP POLICY IF EXISTS "Allow all to view" ON mental_health_assessments;
DROP POLICY IF EXISTS "Allow all to insert" ON mental_health_assessments;

-- Policies for students
CREATE POLICY "Users can view their own assessments"
  ON mental_health_assessments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own assessments"
  ON mental_health_assessments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policies for admin - SIMPLIFIED VERSION
CREATE POLICY "Allow all to view"
  ON mental_health_assessments FOR SELECT
  USING (true);

CREATE POLICY "Allow all to insert"
  ON mental_health_assessments FOR INSERT
  WITH CHECK (true);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_mental_health_assessment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS update_mental_health_assessment_updated_at ON mental_health_assessments;

-- Create trigger
CREATE TRIGGER update_mental_health_assessment_updated_at
  BEFORE UPDATE ON mental_health_assessments
  FOR EACH ROW
  EXECUTE FUNCTION update_mental_health_assessment_updated_at();
