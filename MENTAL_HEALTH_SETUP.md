# Mental Health Assessment - Setup & Troubleshooting

## Quick Setup

### Step 1: Run the Database Migration

Go to your Supabase Dashboard:
1. Open **SQL Editor**
2. Copy and paste the contents of `supabase/mental-health-assessment-fixed.sql`
3. Click **Run**

This will create:
- `mental_health_assessments` table
- Proper indexes
- Security policies (RLS)
- Triggers for timestamps

### Step 2: Verify Table Creation

In Supabase Dashboard:
1. Go to **Table Editor**
2. Look for `mental_health_assessments` table
3. Check that it has these columns:
   - id, user_id, student_id, full_name
   - feeling_alone, feeling_blue, feeling_easily_annoyed, feeling_tense_anxious, having_suicidal_thoughts
   - total_score, risk_level, requires_counseling
   - counseling_status, counseling_notes, counseling_date
   - created_at, updated_at

### Step 3: Test the Feature

**As Student:**
1. Login to student account
2. Go to Dashboard
3. Click "Mental Health Test" (green button)
4. Answer all 5 questions
5. Click "Submit Assessment"
6. Should see success message
7. Check browser console (F12) for any errors

**As Admin:**
1. Login to admin account
2. Click "Mental Health" tab
3. Should see submitted assessments
4. Check browser console (F12) for any errors

## Troubleshooting

### Issue 1: Black Screen on Cancel

**Cause:** Navigation issue or React error

**Fix:**
- Check browser console (F12) for errors
- Make sure you're logged in
- Try refreshing the page
- Clear browser cache

### Issue 2: Submissions Not Showing in Admin

**Possible Causes & Fixes:**

#### A. Database Policies Issue
```sql
-- Run this in Supabase SQL Editor to check policies
SELECT * FROM pg_policies WHERE tablename = 'mental_health_assessments';
```

If no policies exist, run the fixed SQL file again.

#### B. Table Doesn't Exist
```sql
-- Check if table exists
SELECT * FROM information_schema.tables 
WHERE table_name = 'mental_health_assessments';
```

If empty, run the SQL migration again.

#### C. Data Not Being Inserted
1. Open browser console (F12)
2. Submit an assessment
3. Look for console.log messages:
   - "Submitting assessment:" - shows data being sent
   - "Assessment submitted successfully:" - shows response
   - Any error messages

#### D. Admin Not Loading Data
1. Login as admin
2. Open browser console (F12)
3. Go to Mental Health tab
4. Look for console.log messages:
   - "Loading mental health assessments..."
   - "Loaded assessments:" - shows data received
   - Any error messages

### Issue 3: Permission Denied Error

**Error:** "permission denied for table mental_health_assessments"

**Fix:**
```sql
-- Run this to allow all access (temporary for testing)
DROP POLICY IF EXISTS "Allow all to view" ON mental_health_assessments;
DROP POLICY IF EXISTS "Allow all to insert" ON mental_health_assessments;

CREATE POLICY "Allow all to view"
  ON mental_health_assessments FOR SELECT
  USING (true);

CREATE POLICY "Allow all to insert"
  ON mental_health_assessments FOR INSERT
  WITH CHECK (true);
```

### Issue 4: "relation does not exist" Error

**Error:** "relation "mental_health_assessments" does not exist"

**Fix:**
1. Table wasn't created
2. Run `supabase/mental-health-assessment-fixed.sql` in SQL Editor
3. Refresh the page

## Debugging Steps

### 1. Check Browser Console
Press F12 and look for:
- Red error messages
- console.log outputs
- Network tab for failed requests

### 2. Check Supabase Logs
In Supabase Dashboard:
1. Go to **Logs** > **API**
2. Look for recent requests
3. Check for errors

### 3. Test Database Directly
In Supabase SQL Editor:
```sql
-- Check if data exists
SELECT * FROM mental_health_assessments;

-- Check policies
SELECT * FROM pg_policies WHERE tablename = 'mental_health_assessments';

-- Test insert (replace with real values)
INSERT INTO mental_health_assessments (
  user_id, student_id, full_name,
  feeling_alone, feeling_blue, feeling_easily_annoyed,
  feeling_tense_anxious, having_suicidal_thoughts,
  total_score, risk_level, requires_counseling
) VALUES (
  'your-user-id', '12345', 'Test Student',
  2, 2, 1, 3, 0,
  8, 'moderate', false
);
```

### 4. Check Network Requests
1. Open browser DevTools (F12)
2. Go to **Network** tab
3. Submit assessment
4. Look for POST request to Supabase
5. Check request payload and response

## Common Errors & Solutions

| Error | Solution |
|-------|----------|
| "Please answer all questions" | Make sure all 5 questions are answered |
| "Failed to submit assessment" | Check console for specific error |
| "Permission denied" | Run the fixed SQL policies |
| "Table does not exist" | Run the SQL migration |
| Black screen | Check console, refresh page, clear cache |
| No data in admin | Check console logs, verify data was inserted |

## Manual Data Check

To manually verify data was inserted:

1. Go to Supabase Dashboard
2. Click **Table Editor**
3. Select `mental_health_assessments`
4. You should see rows of data
5. Check the columns match what was submitted

## Need More Help?

If issues persist:
1. Share the browser console errors
2. Share the Supabase logs
3. Check if the table exists in Table Editor
4. Verify you're using the correct Supabase project
