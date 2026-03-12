# Fix: Risk Level Constraint Error

## Error Message:
```
Failed to run sql query: ERROR: 23514: check constraint 
"mental_health_assessments_risk_level_check" of relation 
"mental_health_assessments" is violated by some row
```

## Problem:
The table has existing data with old risk level values, so we need to update the data BEFORE changing the constraint.

## ✅ SIMPLE FIX (Copy & Paste):

### Go to Supabase Dashboard → SQL Editor → Paste this:

```sql
-- Remove old constraint
ALTER TABLE mental_health_assessments 
DROP CONSTRAINT IF EXISTS mental_health_assessments_risk_level_check;

-- Update all existing data based on score
UPDATE mental_health_assessments
SET risk_level = CASE
  WHEN total_score <= 10 THEN 'doing-well'
  WHEN total_score >= 14 THEN 'immediate-support'
  WHEN total_score >= 11 AND total_score <= 13 THEN 'need-support'
  ELSE 'doing-well'
END;

-- Add new constraint
ALTER TABLE mental_health_assessments 
ADD CONSTRAINT mental_health_assessments_risk_level_check 
CHECK (risk_level IN ('doing-well', 'need-support', 'immediate-support'));
```

Click **Run** and you're done! ✅

## Or Use the File:
Copy the contents of `supabase/fix-risk-levels-simple.sql` and run it.

## What This Does:
1. Removes the old constraint
2. Updates ALL existing data to use new risk levels based on their actual score
3. Adds the new constraint
4. Shows you the results

## After Running:
Test the mental health assessment - it should work perfectly now!

## Verify It Worked:
Run this to check:
```sql
SELECT risk_level, COUNT(*) 
FROM mental_health_assessments 
GROUP BY risk_level;
```

Should show only: `doing-well`, `need-support`, `immediate-support`

## New Risk Levels:

| Score Range | Risk Level | Database Value |
|-------------|------------|----------------|
| 0-10 | You are doing well | `doing-well` |
| 11-13 | You need support | `need-support` |
| 14-20 | Need immediate support | `immediate-support` |

## If Still Getting Error:

Check if the table exists and has the right constraint:

```sql
-- Check current constraint
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'mental_health_assessments'::regclass 
AND conname LIKE '%risk_level%';
```

Should show:
```
mental_health_assessments_risk_level_check | CHECK (risk_level IN ('doing-well', 'need-support', 'immediate-support'))
```

## Alternative: Recreate Table

If the above doesn't work, you can recreate the table:

1. Backup any existing data (if needed)
2. Drop the table:
   ```sql
   DROP TABLE IF EXISTS mental_health_assessments CASCADE;
   ```
3. Run the fixed SQL file:
   - Copy contents of `supabase/mental-health-assessment-fixed.sql`
   - Paste in SQL Editor
   - Click Run

This will create a fresh table with the correct constraints.
