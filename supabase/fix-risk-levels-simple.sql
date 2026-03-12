-- SIMPLE FIX: Update risk levels in mental health assessments
-- Copy and paste this entire script into Supabase SQL Editor and click Run

-- Step 1: Remove the old constraint
ALTER TABLE mental_health_assessments 
DROP CONSTRAINT IF EXISTS mental_health_assessments_risk_level_check;

-- Step 2: Update ALL existing rows to use new values based on their score
UPDATE mental_health_assessments
SET risk_level = CASE
  WHEN total_score <= 10 THEN 'doing-well'
  WHEN total_score >= 14 THEN 'immediate-support'
  WHEN total_score >= 11 AND total_score <= 13 THEN 'need-support'
  ELSE 'doing-well'
END;

-- Step 3: Add the new constraint
ALTER TABLE mental_health_assessments 
ADD CONSTRAINT mental_health_assessments_risk_level_check 
CHECK (risk_level IN ('doing-well', 'need-support', 'immediate-support'));

-- Step 4: Show results
SELECT 
  risk_level,
  COUNT(*) as count,
  MIN(total_score) as min_score,
  MAX(total_score) as max_score
FROM mental_health_assessments
GROUP BY risk_level
ORDER BY min_score;
